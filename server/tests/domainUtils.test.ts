import { describe, expect, it } from "vitest"
import { canTransitionOrder, isOrderStatus } from "../utils/orderStatus.js"
import { cleanString, isPositiveInteger, isValidCoordinate, isValidEmail } from "../utils/validation.js"

describe("request validation", () => {
    it("normalizes bounded strings", () => expect(cleanString("  grocery  ", 4)).toBe("groc"))
    it("validates email shape", () => {
        expect(isValidEmail("buyer@example.com")).toBe(true)
        expect(isValidEmail("buyer@localhost")).toBe(false)
    })
    it("rejects invalid coordinates and quantities", () => {
        expect(isValidCoordinate(91, "lat")).toBe(false)
        expect(isValidCoordinate(-180, "lng")).toBe(true)
        expect(isPositiveInteger(2)).toBe(true)
        expect(isPositiveInteger(0)).toBe(false)
    })
})

describe("order state machine", () => {
    it("allows valid forward transitions", () => expect(canTransitionOrder("Packed", "Out for Delivery")).toBe(true))
    it("prevents terminal and backward transitions", () => {
        expect(canTransitionOrder("Delivered", "Packed")).toBe(false)
        expect(canTransitionOrder("Packed", "Confirmed")).toBe(false)
    })
    it("rejects unknown statuses", () => expect(isOrderStatus("Refunded")).toBe(false))
})
