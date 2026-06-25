import { prisma } from "../config/prisma.js"
import { inngest } from "../inngest/index.js"

type PaidOrderItem = {
    product: string
    quantity: number
}

export const fulfillPaidOrder = async (orderId: string) => {
    const paidOrder = await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
            where: {id: orderId, isPaid: false},
            data: {isPaid: true},
        })

        if (claimed.count === 0) return null

        const order = await tx.order.findUnique({where: {id: orderId}})
        if (!order) throw new Error("Order not found")

        const items = (Array.isArray(order.items) ? order.items : []) as PaidOrderItem[]
        for (const item of items) {
            await tx.product.update({
                where: {id: item.product},
                data: {stock: {decrement: item.quantity}},
            })
        }

        return {order, items}
    })

    if (!paidOrder) return false

    await inngest.send({name: "order/placed", data: {orderId}})
    for (const item of paidOrder.items) {
        await inngest.send({name: "inventory/stock.updated", data: {productId: item.product}})
    }

    return true
}
