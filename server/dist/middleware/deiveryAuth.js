import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
const getJwtSecret = () => {
    if (!process.env.JWT_SECRET)
        throw new Error("JWT_SECRET is not configured");
    return process.env.JWT_SECRET;
};
const deliveryAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded.role !== "delivery") {
            return res.status(403).json({ message: "Access denied. Delivery partner only" });
        }
        const partner = await prisma.deliveryPartner.findUnique({
            where: { id: decoded.id }
        });
        if (!partner || !partner.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }
        req.partner = partner;
        next();
    }
    catch (error) {
        if (process.env.NODE_ENV !== "test")
            console.warn("Delivery authentication failed:", error instanceof Error ? error.message : error);
        return res.status(401).json({ message: "Token is not valid" });
    }
};
export default deliveryAuth;
