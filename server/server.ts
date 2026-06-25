import "./config/env.js";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import productRouter from "./routes/productRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import addressRouter from "./routes/addressRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import deliveryPartnerRouter from "./routes/deliveryPartnerRoutes.js";
import { stripeWebhook } from "./controllers/webhooks.js";

const app = express();

app.post("/api/stripe",express.raw({type:'application/json'}),stripeWebhook)

// Middleware
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : []
const isProduction = process.env.NODE_ENV === "production"
const isPrivateNetworkOrigin = (origin: string) => {
    try {
        const { hostname } = new URL(origin)
        return hostname === "localhost"
            || hostname === "127.0.0.1"
            || /^10\./.test(hostname)
            || /^192\.168\./.test(hostname)
            || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    } catch {
        return false
    }
}

app.use(cors({
    origin: (origin, callback) => {
        if (
            !origin
            || allowedOrigins.includes(origin)
            || (!isProduction && allowedOrigins.length === 0)
            || (!isProduction && isPrivateNetworkOrigin(origin))
        ) {
            return callback(null, true)
        }

        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
}))
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/auth',authRouter)
app.use('/api/products',productRouter)
app.use('/api/upload',uploadRouter)
app.use('/api/orders',orderRouter)
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/addresses', addressRouter)
app.use('/api/admin', adminRouter)
app.use('/api/delivery',deliveryPartnerRouter)

// Error handling

app.use((error: any, req: Request, res: Response, next: NextFunction)=>{
    console.error(error)
    const message = process.env.NODE_ENV === "production" ? "Internal server error" : error.message
    res.status(500).json({message})

})

if (process.env.VERCEL !== "1") {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

export default app;
