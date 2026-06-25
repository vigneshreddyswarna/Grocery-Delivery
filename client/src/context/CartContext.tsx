import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { CartItem, Product } from "../types"
import { getProductId, normalizeProduct } from "../utils/product"
import { getStoredValue, removeStoredValue, setStoredValue } from "../utils/storage"

interface CartContextType {
    items: CartItem[]
    addToCart: (product: Product, quantity?: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    cartCount: number
    cartTotal: number
    isCartOpen: boolean
    setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = getStoredValue("app_cart")
        if (!saved) return []

        try {
            const parsed = JSON.parse(saved)
            if (!Array.isArray(parsed)) return []

            return parsed
                .map((item) => ({
                    product: normalizeProduct(item?.product || {}),
                    quantity: Math.max(1, Number(item?.quantity) || 1),
                }))
                .filter((item) => getProductId(item.product))
        } catch {
            removeStoredValue("app_cart")
            return []
        }
    })

    const [isCartOpen, setIsCartOpen] = useState(false)

    useEffect(() => {
        setStoredValue("app_cart", JSON.stringify(items))
    }, [items])

    const addToCart = (product: Product, quantity = 1) => {
        const nextProduct = normalizeProduct(product)
        const nextProductId = getProductId(nextProduct)

        setItems((prev) => {
            const existing = prev.find((item) => getProductId(item.product) === nextProductId)
            if (existing) {
                return prev.map((item) =>
                    getProductId(item.product) === nextProductId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            }
            return [...prev, { product: nextProduct, quantity }]
        })
        setIsCartOpen(true)
    }

    const removeFromCart = (productId: string) => {
        setItems((prev) => prev.filter((item) => getProductId(item.product) !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setItems((prev) =>
            prev.map((item) => (getProductId(item.product) === productId ? { ...item, quantity } : item))
        )
    }

    const clearCart = () => {
        setItems([])
        setIsCartOpen(false)
    }

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = items.reduce((sum, item) => sum + normalizeProduct(item.product).price * item.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used within CartProvider")
    return context
}
