import { describe, expect, it } from "vitest"
import { getProductId, normalizeProduct, normalizeProducts } from "./product"

describe("product normalization", () => {
    it("supports legacy Mongo-style identifiers", () => {
        expect(getProductId({ _id: "legacy-id" })).toBe("legacy-id")
    })

    it("normalizes incomplete API records to safe UI values", () => {
        const product = normalizeProduct({ name: "Green Apple", price: "25" as never })

        expect(product).toMatchObject({
            id: "green-apple",
            name: "Green Apple",
            price: 25,
            originalPrice: 25,
            image: "/favicon.svg",
        })
    })

    it("returns an empty collection for malformed API payloads", () => {
        expect(normalizeProducts({ products: [] })).toEqual([])
        expect(normalizeProducts(null)).toEqual([])
    })
})
