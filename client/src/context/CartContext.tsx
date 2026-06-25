import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartItem, Product } from "../types";

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {

    const [items, setItems] = useState<CartItem>(() => {
        const saved = localStorage.getItem("app_cart")
        return saved ? JSON.parse(saved) : []
    })

    const [isCartOpen, setIsCartOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem("app_cart", JSON.stringify(items))
    }, [items])

    const addToCart = (product: Product, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((item)=> item.product._id === product._id)
            if (existing) {
                return prev.map((item)=>(item.product._id === product._id ? { ...item, quantity: item.quantity + quantity } : item))
            }
            return [...prev, { product, quantity }]
        })
        setIsCartOpen(true)
    }

    const removeFromCart = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.product._id !== productId));
    }
    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setItems((prev) => prev.map((item) => (item.product._id === productId ? { ...item, quantity } : item)))
    }

    const clearCart = () => {
        setItems([])
        setIsCartOpen(false)
    }

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    return <CartContext.Provider value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount, cartTotal, isCartOpen, setIsCartOpen

    }}>
        {children}
    </CartContext.Provider>
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used within CartProvider")
    return context
}

// import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// import type { CartItem, Product } from "../types";

// interface CartContextType {
//     items: CartItem[];
//     addToCart: (product: Product, quantity?: number) => void;
//     removeFromCart: (productId: string) => void;
//     updateQuantity: (productId: string, quantity: number) => void;
//     clearCart: () => void;
//     cartCount: number;
//     cartTotal: number;
//     isCartOpen: boolean;
//     setISCartOpen: (open: boolean) => void; // Keeps alignment with your interface definition
// }

// const CartContext = createContext<CartContextType | undefined>(undefined);

// export function CartProvider({ children }: { children: ReactNode }) {
//     // Fixed: Changed state type from CartItem to CartItem[]
//     const [items, setItems] = useState<CartItem[]>(() => {
//         const saved = localStorage.getItem("app_cart");
//         return saved ? JSON.parse(saved) : [];
//     });

//     const [isCartOpen, setIsCartOpen] = useState(false); // Defaulting to false is usually better UX so it doesn't pop open on refresh

//     useEffect(() => {
//         localStorage.setItem("app_cart", JSON.stringify(items));
//     }, [items]);

//     const addToCart = (product: Product, quantity = 1) => {
//         setItems((prev) => {
//             const existing = prev.find((item) => item.product._id === product._id);
//             if (existing) {
//                 // Fixed: Changed 'items.product' and 'items.quantity' to 'item.product' and 'item.quantity'
//                 return prev.map((item) =>
//                     item.product._id === product._id
//                         ? { ...item, quantity: item.quantity + quantity }
//                         : item
//                 );
//             }
//             return [...prev, { product, quantity }];
//         });
//         setIsCartOpen(true);
//     };

//     const removeFromCart = (productId: string) => {
//         setItems((prev) => prev.filter((item) => item.product._id !== productId));
//     };

//     const updateQuantity = (productId: string, quantity: number) => {
//         if (quantity <= 0) {
//             removeFromCart(productId);
//             return;
//         }
//         setItems((prev) =>
//             prev.map((item) => (item.product._id === productId ? { ...item, quantity } : item))
//         );
//     };

//     const clearCart = () => {
//         setItems([]);
//         setIsCartOpen(false);
//     };

//     const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
//     const cartTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

//     return (
//         <CartContext.Provider
//             value={{
//                 items,
//                 addToCart,
//                 removeFromCart,
//                 updateQuantity,
//                 clearCart,
//                 cartCount,
//                 cartTotal,
//                 isCartOpen,
//                 setISCartOpen: setIsCartOpen, // Fixed: Matched the hook state updater to your uppercase interface property
//             }}
//         >
//             {children}
//         </CartContext.Provider>
//     );
// }

// export function useCart() {
//     const context = useContext(CartContext);
//     if (!context) throw new Error("useCart must be used within a CartProvider");
//     return context;
// }
