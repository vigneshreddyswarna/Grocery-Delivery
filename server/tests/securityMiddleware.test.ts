import { describe, expect, it, vi } from "vitest"
import { securityHeaders } from "../middleware/security.js"

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
