import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../config/prisma.js"

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured")
    return process.env.JWT_SECRET
}

const deliveryAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [scheme, token] = req.headers.authorization?.split(" ") ?? []
        if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "No token provided" })

        const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role?: string }
        if (decoded.role !== "delivery") return res.status(403).json({ message: "Access denied. Delivery partner only" })

        const partner = await prisma.deliveryPartner.findUnique({ where: { id: decoded.id } })
        if (!partner?.isActive) return res.status(403).json({ message: "Account is deactivated" })

        req.partner = partner
        next()
    } catch (error) {
        if (process.env.NODE_ENV !== "test") console.warn("Delivery authentication failed:", error instanceof Error ? error.message : error)
        return res.status(401).json({ message: "Token is not valid" })
    }
}

export default deliveryAuth
