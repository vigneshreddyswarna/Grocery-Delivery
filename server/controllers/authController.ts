import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import { isAdminEmail } from "../config/admin.js";

// Generate JWT token
const generateToken =(id: string)=>{
    return jwt.sign({id, role:"customer"},process.env.JWT_SECRET as string,{expiresIn:"30d"})
}

// Register 
// POST /api/auth/register


export const register = async (req:Request,res: Response)=>{
    const {name, email,password} = req.body;

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string"){
        return res.status(400).json({message:"Please provide all fields"})
    }

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedName || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({message:"Please provide a valid name and email"})
    }
    if (password.length < 8) {
        return res.status(400).json({message:"Password must be at least 8 characters"})
    }

    if (isAdminEmail(normalizedEmail)) {
        return res.status(403).json({message:"Admin accounts cannot be created through public registration"})
    }

    const existingUser = await prisma.user.findUnique({where:{email:normalizedEmail}})
    if(existingUser){
        return res.status(400).json({message:"User already exists with this email"})
    }
    const hashedPassword = await bcrypt.hash(password,10)
    const user = await prisma.user.create({
        data: {name:normalizedName, email:normalizedEmail, password: hashedPassword}
    })

    const token = generateToken(user.id)

    const userData: any= {...user}
    delete userData.password
    userData.isAdmin=isAdminEmail(userData.email)

    res.status(201).json({user: userData, token})

}

// Login
// POST /api/auth/login


export const login = async (req:Request,res: Response)=>{
    const {email,password} = req.body;

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password){
        return res.status(400).json({message:"Please provide email and password"})
    }

    const user = await prisma.user.findUnique({where:{email:email.trim().toLowerCase()},include:{addresses:true}})

    if(!user){
        return res.status(401).json({message:"Invalid email or password"})
    }

    const isMatch=await bcrypt.compare(password,user.password)

    if(!isMatch){
        return res.status(401).json({message: "Invalid email or password"})
    }
    

    const token = generateToken(user.id)

    const userData: any= {...user}
    delete userData.password
    userData.isAdmin=isAdminEmail(userData.email)

    res.json({user: userData, token})

}

// Get current authenticated user
// GET /api/auth/me
export const getMe = async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { addresses: true }
    })

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    const userData: any = { ...user }
    delete userData.password
    userData.isAdmin = isAdminEmail(userData.email)

    res.json({ user: userData })
}
