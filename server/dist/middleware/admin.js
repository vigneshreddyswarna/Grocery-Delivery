import { prisma } from "../config/prisma.js";
import { isAdminEmail } from "../config/admin.js";
const admin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (isAdminEmail(user.email)) {
            if (req.user)
                req.user.isAdmin = true;
            next();
        }
        else {
            res.status(403).json({ message: "Admin access required" });
        }
    }
    catch (error) {
        if (process.env.NODE_ENV !== "test")
            console.error("Admin verification failed:", error);
        res.status(500).json({ message: "Admin verification failed" });
    }
};
export default admin;
