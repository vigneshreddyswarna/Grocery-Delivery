import { randomUUID } from "node:crypto"
import type { NextFunction, Request, Response } from "express"

export const requestObservability = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id")?.slice(0, 100) || randomUUID()
    const startedAt = performance.now()
    res.setHeader("x-request-id", requestId)
    res.on("finish", () => {
        const event = {
            level: res.statusCode >= 500 ? "error" : "info",
            event: "http_request",
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Math.round(performance.now() - startedAt),
        }
        console.log(JSON.stringify(event))
    })
    next()
}
