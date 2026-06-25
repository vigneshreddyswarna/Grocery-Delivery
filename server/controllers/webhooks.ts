import { Request, Response } from "express";
import Stripe from "stripe";
import { fulfillPaidOrder, releaseUnpaidOrder } from "../services/orderPayment.js";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }

    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export const stripeWebhook = async (request: Request, response: Response) => {
    if (!endpointSecret) {
        return response.status(503).json({ message: "Stripe webhook is not configured" });
    }

    const stripe = getStripe();
    const signature = request.headers["stripe-signature"];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            signature as string,
            endpointSecret
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn("Webhook signature verification failed.", message);
        return response.sendStatus(400);
    }

    switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.orderId;
            if (orderId && session.payment_status === "paid") {
                await fulfillPaidOrder(orderId);
            }
            break;
        }

        case "checkout.session.async_payment_failed":
        case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            const failureOrderId = session.metadata?.orderId;
            if (failureOrderId) {
                await releaseUnpaidOrder(failureOrderId);
            }
            break;
        }

        default:
            if (process.env.NODE_ENV !== "production") {
                console.info(`Unhandled event type ${event.type}`);
            }
    }

    return response.json({ received: true });
};
