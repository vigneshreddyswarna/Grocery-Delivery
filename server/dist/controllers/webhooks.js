import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};
export const stripeWebhook = async (request, response) => {
    if (!endpointSecret) {
        return response.status(503).json({ message: "Stripe webhook is not configured" });
    }
    const stripe = getStripe();
    const signature = request.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.log("Webhook signature verification failed.", message);
        return response.sendStatus(400);
    }
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
            });
            const { orderId } = session.data[0].metadata;
            const paidOrder = await prisma.order.update({
                where: { id: orderId },
                data: { isPaid: true },
            });
            const orderItems = Array.isArray(paidOrder.items) ? paidOrder.items : [];
            for (const item of orderItems) {
                await prisma.product.update({
                    where: { id: item.product },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            await inngest.send({ name: "order/placed", data: { orderId } });
            for (const item of orderItems) {
                await inngest.send({ name: "inventory/stock.updated", data: { productId: item.product } });
            }
            break;
        }
        case "payment_intent.canceled":
        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent.id,
            });
            const failureOrderId = session.data[0].metadata.orderId;
            await prisma.order.delete({ where: { id: failureOrderId } });
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    return response.json({ received: true });
};
