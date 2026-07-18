import { describe, expect, it, vi } from "vitest"
import { buildRateLimitKey, securityHeaders } from "../middleware/security.js"

describe("security headers", () => {
    it("adds defensive API response headers", () => {
        const setHeader = vi.fn()
        const next = vi.fn()

        securityHeaders({} as never, { setHeader } as never, next)

        expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff")
        expect(setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY")
        expect(setHeader).toHaveBeenCalledWith("Content-Security-Policy", expect.stringContaining("frame-ancestors 'none'"))
        expect(next).toHaveBeenCalledOnce()
    })
})

describe("rate limiting", () => {
    it("hashes client identity into a stable per-window key", () => {
        const first=buildRateLimitKey("203.0.113.8", 1_000)
        expect(first).toMatch(/^[a-f0-9]{64}$/)
        expect(buildRateLimitKey("203.0.113.8", 1_000)).toBe(first)
        expect(buildRateLimitKey("203.0.113.9", 1_000)).not.toBe(first)
    })
})
