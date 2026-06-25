import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from 'stripe'
import { fulfillPaidOrder } from "../services/orderPayment.js";

type LiveLocationPayload = {
    lat?: number | string
    lng?: number | string
    updatedAt?: string | Date
    isSharing?: boolean
}

const getSharedLiveLocation = (liveLocation: unknown) => {
    const location = liveLocation as LiveLocationPayload | null

    if (
        !location?.isSharing ||
        !Number.isFinite(Number(location.lat)) ||
        !Number.isFinite(Number(location.lng))
    ) {
        return null
    }

    return {
        lat: Number(location.lat),
        lng: Number(location.lng),
        updatedAt: location.updatedAt,
        isSharing: true,
    }
}


// Create order
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
    const { items, shippingAddress, paymentMethod } = req.body

    if (!["card", "upi", "cash"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" })
    }

    // Check if order items are empty
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "No order items" })
    }

    //Look up actual prices from the database

    const productIds = items.map((i: any) => i.product)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap: Record<string, (typeof products)[0]> = {}

    products.forEach((p: any) => (productMap[p.id] = p))

    // Check if product is in stock
    for (const item of items) {
        const product = productMap[item.product]
        if (!product || (product.stock ?? 0) < item.quantity) {
            return res.status(404).json({ message: "Product out of stock" })
        }
    }
    const orderItems = items.map((item: any) => {
        const dbProduct = productMap[item.product]
        if (!dbProduct) throw new Error(`Product ${item.product} not found`);
        return {
            product: dbProduct.id,
            name: dbProduct.name,
            image: dbProduct.image,
            price: dbProduct.price,
            quantity: item.quantity,
            unit: dbProduct.unit
        }
    })
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const deliveryFee = subtotal >= 499 ? 0 : 35
    const tax = Math.round(subtotal * 0.05 * 100) / 100
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100
    const order = await prisma.order.create({
        data: {
            userId: req.user!.id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            deliveryFee,
            tax,
            total,
            statusHistory: [{ status: "Placed", note: "Order placed successfully", timestamp: new Date() }]
        }
    })
    if (paymentMethod === "card" || paymentMethod === "upi") {
        const stripe=new Stripe(process.env.STRIPE_SECRET_KEY as string)
        const clientOrigin = process.env.CLIENT_URL?.split(",")[0]?.trim() || req.headers.origin
        if (!clientOrigin) {
            return res.status(500).json({message:"Client URL is not configured"})
        }
        // create session
        const session = await stripe.checkout.sessions.create({
            success_url: `${clientOrigin}/orders?session_id={CHECKOUT_SESSION_ID}&clearCart=true`,
            cancel_url: `${clientOrigin}/checkout`,
            payment_method_types: [paymentMethod === "upi" ? "upi" : "card"],
            line_items: [
                {
                    price_data: {
                        currency:"inr",
                        product_data:{
                            name:"Payment Groceries"
                        },
                        unit_amount:Math.round(total * 100)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata:{orderId:order.id}
        });
        return res.json({url:session.url})
    }
    res.json({ order })

    //Decrease stock
    for (const item of orderItems) {
        await prisma.product.update({
            where: { id: item.product },
            data: { stock: { decrement: item.quantity } }
        })
    }

    // Send stock update events for each product in the order
    for (const item of orderItems) {
        await inngest.send({ name: "inventory/stock.updated", data: { productId: item.product } })
    }

    await inngest.send({ name: "order/placed", data: { orderId: order.id } })
}

// Get user's orders
// GET /api/orders
export const getUserOrders = async (req: Request, res: Response) => {
    const { status } = req.query
    const where: any = {
        userId: req.user!.id,
        NOT: [{ paymentMethod: { in: ["card", "upi"] }, isPaid: false }]
    }
    if (status && status !== "all") {
        where.status = status
    }
    const orders = await prisma.order.findMany({
        where,
        include: { deliveryPartner: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" }
    })
    res.json({ orders })

}

//Get single order
// GET /api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, userId: req.user!.id },
        include: { deliveryPartner: { select: { name: true, phone: true, avatar: true, vehicleType: true } } }
    })

    if (!order) {
        return res.status(404).json({ message: "Order not found" })
    }
    res.json({ order: { ...order, liveLocation: getSharedLiveLocation(order.liveLocation) } })
}

// Confirm a successful Stripe Checkout return for the current customer.
export const confirmOrderPayment = async (req: Request, res: Response) => {
    const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : ""
    if (!sessionId) return res.status(400).json({message:"Missing checkout session"})

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const orderId = session.metadata?.orderId
    if (!orderId) return res.status(400).json({message:"Checkout session has no order"})

    const order = await prisma.order.findFirst({where:{id:orderId, userId:req.user!.id}})
    if (!order) return res.status(404).json({message:"Order not found"})

    if (session.payment_status !== "paid") {
        return res.status(202).json({paid:false})
    }

    await fulfillPaidOrder(orderId)
    return res.json({paid:true, orderId})
}

// Update order status(admin)
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { status, note } = req.body
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } })

    if (!order) {
        return res.status(404).json({ message: "Order not found" })
    }
    const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[]
    history.push({ status, note: note || `Order ${status.toLowerCase()}`, timestamp: new Date() })

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id as string },
        data: { status, statusHistory: history }
    })
    res.json({ order: updatedOrder })
}

// Get all orders (admin)
// GET /api/orders/all
export const getAllOrders = async (req: Request, res: Response) => {

    const orders = await prisma.order.findMany({
        where: { NOT: [{ paymentMethod: { in: ["card", "upi"] }, isPaid: false }] },
        include: {
            user: { select: { name: true, email: true } },
            deliveryPartner: { select: { name: true, phone: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
    })
    res.json({ orders })

}

// Get Order Location
// GET /api/orders/:id/location

export const getOrderLocation = async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
        where: { id: req.params.id as string, userId: req.user!.id },
        select: { liveLocation: true, status: true }

    }
    )
    if (!order) return res.status(404).json({ message: "Order not found" })
    res.json({ liveLocation: getSharedLiveLocation(order.liveLocation), status: order.status })

}
