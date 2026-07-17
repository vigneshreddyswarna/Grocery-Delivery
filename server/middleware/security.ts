import type { NextFunction, Request, Response } from "express"

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

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = req.ip || req.socket.remoteAddress || "unknown"
    const current = requests.get(key)
    const entry = !current || current.resetAt <= now
        ? { count: 1, resetAt: now + WINDOW_MS }
        : { count: current.count + 1, resetAt: current.resetAt }

    requests.set(key, entry)
    res.setHeader("RateLimit-Limit", MAX_REQUESTS)
    res.setHeader("RateLimit-Remaining", Math.max(0, MAX_REQUESTS - entry.count))
    res.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1000))

    if (entry.count > MAX_REQUESTS) {
        return res.status(429).json({ message: "Too many requests. Please try again later." })
    }
    next()
}

export const resetRateLimitStore = () => requests.clear()
