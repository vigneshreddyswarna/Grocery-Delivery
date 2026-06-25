import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"

const getJwtSecret = () => {
    if(!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured")
    return process.env.JWT_SECRET
}

const auth=(req: Request, res: Response, next: NextFunction)=>{
    try{
        const authHeader=req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer')){
            return res.status(401).json({message:"No token provided,authorization denied"})
        }
        const token=authHeader.split(" ")[1]
        const decoded=jwt.verify(token,getJwtSecret()) as {id: string, role?: string}

        if(decoded.role !== "customer"){
            return res.status(403).json({message:"Access denied. Customer account required"})
        }

        req.user={id:decoded.id}
        next()
    } catch(error){
        if(process.env.NODE_ENV !== "test") console.warn("Authentication failed:", error instanceof Error ? error.message : error)
        return res.status(401).json({message:"Token is not valid"})

    }

}
export default auth;
