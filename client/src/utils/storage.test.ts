import { beforeEach, describe, expect, it, vi } from "vitest"
import { getStoredValue, removeStoredValue, setStoredValue } from "./storage"

describe("safe browser storage", () => {
    beforeEach(() => localStorage.clear())

    it("stores, reads, and removes session data", () => {
        expect(setStoredValue("token", "abc")).toBe(true)
        expect(getStoredValue("token")).toBe("abc")
        removeStoredValue("token")
        expect(getStoredValue("token")).toBeNull()
    })

    it("fails safely when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("blocked") })
        expect(setStoredValue("token", "abc")).toBe(false)
    })
})
