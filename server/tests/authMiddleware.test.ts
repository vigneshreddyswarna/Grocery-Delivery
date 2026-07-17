import { beforeEach, describe, expect, it, vi } from "vitest"
import jwt from "jsonwebtoken"
import auth from "../middleware/auth.js"
import { createReq, createRes, getJson } from "./testUtils.js"

describe("customer auth middleware", () => {
    beforeEach(() => {
        process.env.JWT_SECRET = "test-secret-with-more-than-32-characters"
    })

    it("rejects malformed bearer authorization", () => {
        const req = createReq() as never
        Object.assign(req, { headers: { authorization: "Bearerish token" } })
        const res = createRes()
        const next = vi.fn()

        auth(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it("accepts a valid customer token", () => {
        const token = jwt.sign({ id: "user-1", role: "customer" }, process.env.JWT_SECRET!)
        const req = createReq() as never
        Object.assign(req, { headers: { authorization: `Bearer ${token}` } })
        const res = createRes()
        const next = vi.fn()

        auth(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect((req as { user?: { id: string } }).user).toEqual({ id: "user-1" })
    })

    it("rejects a token issued for another role", () => {
        const token = jwt.sign({ id: "partner-1", role: "delivery" }, process.env.JWT_SECRET!)
        const req = createReq() as never
        Object.assign(req, { headers: { authorization: `Bearer ${token}` } })
        const res = createRes()

        auth(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(getJson(res)).toMatchObject({ message: expect.stringContaining("Customer") })
    })
})
