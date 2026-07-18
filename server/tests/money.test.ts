import { describe, expect, it } from "vitest"
import { calculateOrderMoney, paiseToDecimal, parseMoneyToPaise } from "../utils/money.js"

describe("money calculations", () => {
    it("parses at most two decimal places into integer paise", () => {
        expect(parseMoneyToPaise("123.45")).toBe(12_345)
        expect(parseMoneyToPaise("0.1")).toBe(10)
        expect(parseMoneyToPaise("1.999")).toBeNull()
    })

    it("calculates totals without floating-point drift", () => {
        expect(calculateOrderMoney([{unitPricePaise: 10, quantity: 3}])).toEqual({
            subtotalPaise: 30,
            deliveryFeePaise: 3_500,
            taxPaise: 2,
            totalPaise: 3_532,
        })
        expect(paiseToDecimal(3_532)).toBe("35.32")
    })

    it("rejects totals outside JavaScript's safe integer range", () => {
        expect(() => calculateOrderMoney([{unitPricePaise: Number.MAX_SAFE_INTEGER, quantity: 2}])).toThrow(/supported range/)
    })
})
