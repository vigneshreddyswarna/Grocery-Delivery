import type { NextFunction, Request, Response } from "express"
import { createHash } from "node:crypto"
import { prisma } from "../config/prisma.js"

const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 300)
const requests = new Map<string, { count: number; resetAt: number }>()

export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("X-Frame-Options", "DENY")
    res.setHeader("Referrer-Policy", "no-referrer")
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")
    res.setHeader("Cross-Origin-Resource-Policy", "same-site")
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
    next()
}

export const buildRateLimitKey = (clientId: string, now = Date.now()) => {
    const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS
    return createHash("sha256").update(`${clientId}:${windowStart}`).digest("hex")
}

const consumeLocalLimit = (key: string, now: number) => {
    for (const [storedKey, value] of requests) if (value.resetAt <= now) requests.delete(storedKey)
    const current = requests.get(key)
    const entry = !current || current.resetAt <= now
        ? { count: 1, resetAt: now + WINDOW_MS }
        : { count: current.count + 1, resetAt: current.resetAt }
    requests.set(key, entry)
    return entry
}

const consumeDistributedLimit = async (key: string, resetAt: Date) => {
    const rows = await prisma.$queryRaw<Array<{count:number}>>`
        INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt")
        VALUES (${key}, 1, ${resetAt})
        ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
        RETURNING "count"
    `
    if (Math.random() < 0.01) await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "expiresAt" < NOW()`
    return rows[0]?.count ?? 1
}

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const clientId = req.ip || req.socket.remoteAddress || "unknown"
    const key = buildRateLimitKey(clientId, now)
    const resetAt = new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS + WINDOW_MS)
    let count: number
    try {
        count = await consumeDistributedLimit(key, resetAt)
    } catch (error) {
        if (process.env.NODE_ENV !== "test") console.warn("Distributed rate limit unavailable; using local fallback", error instanceof Error ? error.message : error)
        count = consumeLocalLimit(key, now).count
    }
    res.setHeader("RateLimit-Limit", MAX_REQUESTS)
    res.setHeader("RateLimit-Remaining", Math.max(0, MAX_REQUESTS - count))
    res.setHeader("RateLimit-Reset", Math.ceil(resetAt.getTime() / 1000))

    if (count > MAX_REQUESTS) {
        return res.status(429).json({ message: "Too many requests. Please try again later." })
    }
    next()
}

export const resetRateLimitStore = () => requests.clear()
