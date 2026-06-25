import { describe,expect,it } from "vitest"
import { cleanString,isPositiveInteger,isValidCoordinate,isValidEmail } from "../utils/validation.js"

describe("request validation",()=>{
    it("normalizes and limits user-controlled strings",()=>{
        expect(cleanString("  groceries  ")).toBe("groceries")
        expect(cleanString("abcdef",3)).toBe("abc")
        expect(cleanString(42)).toBe("")
    })

    it("validates emails and quantities",()=>{
        expect(isValidEmail("buyer@example.com")).toBe(true)
        expect(isValidEmail("not-an-email")).toBe(false)
        expect(isPositiveInteger(2)).toBe(true)
        expect(isPositiveInteger(0)).toBe(false)
        expect(isPositiveInteger(1.5)).toBe(false)
    })

    it("enforces geographic coordinate bounds",()=>{
        expect(isValidCoordinate(12.97,"lat")).toBe(true)
        expect(isValidCoordinate(181,"lng")).toBe(false)
        expect(isValidCoordinate(-91,"lat")).toBe(false)
    })
})
