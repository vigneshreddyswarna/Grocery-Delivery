import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from 'stripe'
import { fulfillPaidOrder, releaseUnpaidOrder } from "../services/orderPayment.js";
import { canTransitionOrder, isOrderStatus } from "../utils/orderStatus.js";
import { cleanString, isPositiveInteger, isValidCoordinate } from "../utils/validation.js";

type RequestedItem = {product:string,quantity:number}

const parseShippingAddress = (value: unknown) => {
    if(!value || typeof value !== "object") return null
    const body=value as Record<string,unknown>
    const address={
        id:cleanString(body.id,100), label:cleanString(body.label,40),
        address:cleanString(body.address,300), city:cleanString(body.city,100),
        state:cleanString(body.state,100), zip:cleanString(body.zip,20),
        lat:Number(body.lat), lng:Number(body.lng),
    }
    return address.address && address.city && address.state && address.zip
        && isValidCoordinate(address.lat,"lat") && isValidCoordinate(address.lng,"lng")
        ? address : null
}

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
    const { items, paymentMethod } = req.body
    const shippingAddress=parseShippingAddress(req.body.shippingAddress)

    if (!["card", "upi", "cash"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" })
    }

    // Check if order items are empty
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
        return res.status(400).json({ message: "No order items" })
    }
    if(!shippingAddress) return res.status(400).json({message:"A valid shipping address is required"})

    const quantities=new Map<string,number>()
    for(const raw of items as Array<Record<string,unknown>>){
        const product=cleanString(raw.product,100)
        if(!product || !isPositiveInteger(raw.quantity))
            return res.status(400).json({message:"Every item needs a valid product and quantity"})
        quantities.set(product,(quantities.get(product) || 0)+Number(raw.quantity))
    }
    const requestedItems:RequestedItem[]=[...quantities].map(([product,quantity])=>({product,quantity}))

    //Look up actual prices from the database

    const productIds = requestedItems.map((i) => i.product)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap: Record<string, (typeof products)[0]> = {}

    products.forEach((p: any) => (productMap[p.id] = p))

    // Check if product is in stock
    for (const item of requestedItems) {
        const product = productMap[item.product]
        if (!product || (product.stock ?? 0) < item.quantity) {
            return res.status(404).json({ message: "Product out of stock" })
        }
    }
    const orderItems = requestedItems.map((item) => {
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
    const order = await prisma.$transaction(async(tx)=>{
        for(const item of orderItems){
            const reserved=await tx.product.updateMany({
                where:{id:item.product,stock:{gte:item.quantity}},
                data:{stock:{decrement:item.quantity}}
            })
            if(reserved.count !== 1) throw new Error(`OUT_OF_STOCK:${item.name}`)
        }
        return tx.order.create({data:{
            userId:req.user!.id,items:orderItems,shippingAddress,paymentMethod,
            subtotal,deliveryFee,tax,total,
            statusHistory:[{status:"Placed",note:"Order placed successfully",timestamp:new Date()}]
        }})
    }).catch((error:unknown)=>{
        if(error instanceof Error && error.message.startsWith("OUT_OF_STOCK:")) return null
        throw error
    })
    if(!order) return res.status(409).json({message:"An item became unavailable. Please review your cart."})
    if (paymentMethod === "card" || paymentMethod === "upi") {
        if(!process.env.STRIPE_SECRET_KEY){
            await releaseUnpaidOrder(order.id)
            return res.status(503).json({message:"Online payments are unavailable"})
        }
        const stripe=new Stripe(process.env.STRIPE_SECRET_KEY)
        const clientOrigin = process.env.CLIENT_URL?.split(",")[0]?.trim() || req.headers.origin
        if (!clientOrigin) {
            await releaseUnpaidOrder(order.id)
            return res.status(500).json({message:"Client URL is not configured"})
        }
        try{
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
            metadata:{orderId:order.id,userId:req.user!.id},
            expires_at:Math.floor(Date.now()/1000)+(30*60),
          });
          return res.json({url:session.url})
        }catch(error){
          await releaseUnpaidOrder(order.id)
          throw error
        }
    }

    // Send stock update events for each product in the order
    for (const item of orderItems) {
        await inngest.send({ name: "inventory/stock.updated", data: { productId: item.product } })
    }

    await inngest.send({ name: "order/placed", data: { orderId: order.id } })
    res.status(201).json({ order })
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
    if(!isOrderStatus(status)) return res.status(400).json({message:"Invalid order status"})
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } })

    if (!order) {
        return res.status(404).json({ message: "Order not found" })
    }
    if(!canTransitionOrder(order.status,status))
        return res.status(409).json({message:`Order cannot move from ${order.status} to ${status}`})
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
