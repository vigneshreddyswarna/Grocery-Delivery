import type { Product } from "../types"

type ProductLike = Partial<Product> & { _id?: string }

const asNumber = (value: unknown, fallback = 0) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : fallback
}

const asString = (value: unknown, fallback = "") => {
    return typeof value === "string" && value.trim() ? value : fallback
}

export const getProductId = (product: ProductLike | null | undefined) => {
    return asString(product?.id, asString(product?._id))
}

export const normalizeProduct = (product: ProductLike): Product => {
    const price = asNumber(product.price)
    const id = getProductId(product) || asString(product.name, "product").toLowerCase().replace(/\s+/g, "-")

    return {
        id,
        name: asString(product.name, "Product"),
        description: asString(product.description, ""),
        price,
        originalPrice: asNumber(product.originalPrice, price),
        image: asString(product.image, "/favicon.svg"),
        category: asString(product.category, "general"),
        unit: asString(product.unit, "item"),
        stock: asNumber(product.stock),
        isOrganic: Boolean(product.isOrganic),
        rating: asNumber(product.rating),
        reviewCount: asNumber(product.reviewCount),
        discount: asNumber(product.discount),
        createdAt: asString(product.createdAt, new Date(0).toISOString()),
    }
}

export const normalizeProducts = (products: unknown): Product[] => {
    if (!Array.isArray(products)) return []
    return products.map((product) => normalizeProduct(product as ProductLike)).filter((product) => product.id)
}
