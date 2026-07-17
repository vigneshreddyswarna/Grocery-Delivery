import { describe, expect, it } from "vitest"
import { isIndianPincode, isPointInIndia } from "./indiaGeocoding"

describe("Indian location validation", () => {
    it("accepts valid six-digit Indian PIN codes", () => {
        expect(isIndianPincode("524314")).toBe(true)
        expect(isIndianPincode(" 560001 ")).toBe(true)
    })

    it("rejects incomplete, zero-prefixed, and non-numeric PIN codes", () => {
        expect(isIndianPincode("52431")).toBe(false)
        expect(isIndianPincode("012345")).toBe(false)
        expect(isIndianPincode("52431A")).toBe(false)
    })

    it("accepts finite coordinates inside India", () => {
        expect(isPointInIndia(14.4426, 79.9865)).toBe(true)
        expect(isPointInIndia(28.6139, 77.209)).toBe(true)
    })

    it("rejects coordinates outside India and non-finite values", () => {
        expect(isPointInIndia(51.5072, -0.1276)).toBe(false)
        expect(isPointInIndia(Number.NaN, 79.9865)).toBe(false)
    })
})
