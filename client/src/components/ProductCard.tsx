import { useNavigate } from "react-router-dom"
import type { Product } from "../types"
import { Plus, Star } from "lucide-react"
import { useCart } from "../context/CartContext"
import { getProductId, normalizeProduct } from "../utils/product"

interface Props {
    product: Product
}

const ProductCard = ({ product }: Props) => {
    const safeProduct = normalizeProduct(product)
    const productId = getProductId(safeProduct)
    const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs."
    const isOutOfStock = safeProduct.stock <= 0

    const { addToCart } = useCart()
    const navigate = useNavigate()

    return (
        <div
            className={`min-w-0 bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-300 group animate-fade-in cursor-pointer ${isOutOfStock ? "opacity-90" : ""}`}
            onClick={() => navigate(`/products/${productId}`)}
        >
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={safeProduct.image}
                    alt={safeProduct.name}
                    className={`w-full h-full object-cover p-4 group-hover:p-2 transition-all duration-300 ${isOutOfStock ? "grayscale" : ""}`}
                />

                {safeProduct.discount > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase bg-app-orange text-white rounded-full">
                        {safeProduct.discount}% OFF
                    </span>
                )}
                {isOutOfStock && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold uppercase bg-app-error text-white rounded-full">
                        Out of Stock
                    </span>
                )}
            </div>

            <div className="p-3.5 text-zinc-700">
                <h3 className="text-sm leading-snug mb-1.5 line-clamp-2">{safeProduct.name}</h3>

                {safeProduct.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="size-3 text-app-warning fill-app-warning" />
                        <span className="text-xs font-medium text-app-text">{safeProduct.rating}</span>
                        <span className="text-xs text-app-text-light">({safeProduct.reviewCount})</span>
                    </div>
                )}

                <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-base font-medium shrink-0">{currency}{safeProduct.price.toFixed(1)}</span>
                        <span className="text-xs text-app-text-light truncate">/{safeProduct.unit}</span>
                        </div>
                        {safeProduct.originalPrice > safeProduct.price && (
                            <span className="block text-xs text-app-text-light line-through">
                                {currency}{safeProduct.originalPrice.toFixed(1)}
                            </span>
                        )}
                    </div>
                    {isOutOfStock ? (
                        <span className="px-2 py-1 text-[10px] font-semibold uppercase text-app-error bg-red-50 rounded-full shrink-0">
                            Sold Out
                        </span>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                addToCart(safeProduct)
                            }}
                            className="size-7 rounded-full bg-app-orange text-white flex-center shrink-0 hover:bg-app-orange-dark transition-colors active:scale-95"
                            aria-label={`Add ${safeProduct.name} to cart`}
                        >
                            <Plus className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductCard
