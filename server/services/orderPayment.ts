import { prisma } from "../config/prisma.js"
import { inngest } from "../inngest/index.js"

type PaidOrderItem = {
    product: string
    quantity: number
}

export const fulfillPaidOrder = async (orderId: string) => {
    const claimed = await prisma.order.updateMany({
            where: {id: orderId, isPaid: false},
            data: {isPaid: true},
    })
    if (claimed.count === 0) return false

    const order = await prisma.order.findUnique({where:{id:orderId}})
    if (!order) throw new Error("Order not found")
    const items = (Array.isArray(order.items) ? order.items : []) as PaidOrderItem[]

    await inngest.send({name: "order/placed", data: {orderId}})
    for (const item of items) {
        await inngest.send({name: "inventory/stock.updated", data: {productId: item.product}})
    }

    return true
}

export const releaseUnpaidOrder = async (orderId: string) => {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({where:{id:orderId,isPaid:false}})
        if(!order) return false

        const deleted = await tx.order.deleteMany({where:{id:orderId,isPaid:false}})
        if(deleted.count === 0) return false

        const items=(Array.isArray(order.items) ? order.items : []) as PaidOrderItem[]
        for(const item of items){
            await tx.product.update({where:{id:item.product},data:{stock:{increment:item.quantity}}})
        }
        return true
    })
}
