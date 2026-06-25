import { Request, Response } from "express"
import { prisma } from "../config/prisma.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { isAdminEmail } from "../config/admin.js"
import { AUTH_TOKEN_TYPES, consumeUserAuthToken, createUserAuthToken } from "../services/authToken.js"
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/authEmail.js"
import { cleanString, isValidEmail } from "../utils/validation.js"

const generateToken=(id:string)=>{
    if(!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured")
    return jwt.sign({id,role:"customer"},process.env.JWT_SECRET,{expiresIn:"7d"})
}

const publicUser=<T extends {password?:string|null,email:string,role:string}>(user:T)=>{
    const {password:_,...safe}=user
    return {...safe,isAdmin:user.role === "ADMIN" || isAdminEmail(user.email)}
}

export const register=async(req:Request,res:Response)=>{
    const name=cleanString(req.body.name,100)
    const email=cleanString(req.body.email,254).toLowerCase()
    const password=typeof req.body.password === "string" ? req.body.password : ""
    if(!name || !isValidEmail(email)) return res.status(400).json({message:"Provide a valid name and email"})
    if(password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password))
        return res.status(400).json({message:"Password must be at least 8 characters and contain a letter and number"})
    if(isAdminEmail(email)) return res.status(403).json({message:"Admin accounts cannot use public registration"})

    const existing=await prisma.user.findUnique({where:{email}})
    if(existing){
        if(!existing.emailVerifiedAt){
            const verificationToken=await createUserAuthToken(existing.id,AUTH_TOKEN_TYPES.VERIFY_EMAIL,24*60)
            try{await sendVerificationEmail(existing.email,existing.name,verificationToken)}catch{
                return res.status(200).json({verificationRequired:true,email:existing.email,message:"Account exists, but the verification email could not be sent. Check SMTP configuration."})
            }
            return res.status(200).json({verificationRequired:true,email:existing.email,message:"Account already created. We sent a new verification email."})
        }
        return res.status(409).json({message:"An account already exists with this email"})
    }

    const user=await prisma.user.create({data:{name,email,password:await bcrypt.hash(password,12)}})
    const verificationToken=await createUserAuthToken(user.id,AUTH_TOKEN_TYPES.VERIFY_EMAIL,24*60)
    try{ await sendVerificationEmail(user.email,user.name,verificationToken) }
    catch{ return res.status(201).json({verificationRequired:true,email:user.email,message:"Account created, but the verification email could not be sent. Request a new one."}) }

    return res.status(201).json({verificationRequired:true,email:user.email,message:"Check your email to verify your account"})
}

export const verifyEmail=async(req:Request,res:Response)=>{
    const token=cleanString(req.body.token,128)
    const userId=await consumeUserAuthToken(token,AUTH_TOKEN_TYPES.VERIFY_EMAIL)
    if(!userId) return res.status(400).json({message:"Verification link is invalid or expired"})
    const user=await prisma.user.update({where:{id:userId},data:{emailVerifiedAt:new Date()},include:{addresses:true}})
    return res.json({user:publicUser(user),token:generateToken(user.id),message:"Email verified"})
}

export const resendVerification=async(req:Request,res:Response)=>{
    const email=cleanString(req.body.email,254).toLowerCase()
    const user=isValidEmail(email) ? await prisma.user.findUnique({where:{email}}) : null
    if(user && !user.emailVerifiedAt){
        const token=await createUserAuthToken(user.id,AUTH_TOKEN_TYPES.VERIFY_EMAIL,24*60)
        await sendVerificationEmail(user.email,user.name,token)
    }
    return res.json({message:"If the account needs verification, a new email has been sent"})
}

export const login=async(req:Request,res:Response)=>{
    const email=cleanString(req.body.email,254).toLowerCase()
    const password=typeof req.body.password === "string" ? req.body.password : ""
    if(!isValidEmail(email) || !password) return res.status(400).json({message:"Provide email and password"})

    const user=await prisma.user.findUnique({where:{email},include:{addresses:true}})
    if(!user?.password || !(await bcrypt.compare(password,user.password)))
        return res.status(401).json({message:"Invalid email or password"})
    if(!user.emailVerifiedAt)
        return res.status(403).json({message:"Verify your email before signing in",code:"EMAIL_NOT_VERIFIED"})

    return res.json({user:publicUser(user),token:generateToken(user.id)})
}

export const forgotPassword=async(req:Request,res:Response)=>{
    const email=cleanString(req.body.email,254).toLowerCase()
    const user=isValidEmail(email) ? await prisma.user.findUnique({where:{email}}) : null
    if(user){
        const token=await createUserAuthToken(user.id,AUTH_TOKEN_TYPES.RESET_PASSWORD,30)
        await sendPasswordResetEmail(user.email,user.name,token)
    }
    return res.json({message:"If an account exists, a password reset email has been sent"})
}

export const resetPassword=async(req:Request,res:Response)=>{
    const token=cleanString(req.body.token,128)
    const password=typeof req.body.password === "string" ? req.body.password : ""
    if(password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password))
        return res.status(400).json({message:"Password must be at least 8 characters and contain a letter and number"})
    const userId=await consumeUserAuthToken(token,AUTH_TOKEN_TYPES.RESET_PASSWORD)
    if(!userId) return res.status(400).json({message:"Reset link is invalid or expired"})
    await prisma.user.update({where:{id:userId},data:{password:await bcrypt.hash(password,12)}})
    return res.json({message:"Password reset successfully"})
}

export const googleLogin=async(req:Request,res:Response)=>{
    const credential=cleanString(req.body.credential,5000)
    const clientId=process.env.GOOGLE_CLIENT_ID
    if(!credential || !clientId) return res.status(503).json({message:"Google sign-in is unavailable"})

    const googleResponse=await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
    if(!googleResponse.ok) return res.status(401).json({message:"Invalid Google credential"})
    const profile=await googleResponse.json() as {aud?:string,sub?:string,email?:string,email_verified?:string,name?:string}
    if(profile.aud !== clientId || profile.email_verified !== "true" || !profile.sub || !profile.email)
        return res.status(401).json({message:"Google account could not be verified"})

    const email=profile.email.toLowerCase()
    if(isAdminEmail(email)) return res.status(403).json({message:"Use the admin sign-in method"})
    let user=await prisma.user.findUnique({where:{email},include:{addresses:true}})
    if(user && user.googleId && user.googleId !== profile.sub)
        return res.status(409).json({message:"This email is linked to another Google account"})
    if(user){
        user=await prisma.user.update({where:{id:user.id},data:{googleId:profile.sub,emailVerifiedAt:user.emailVerifiedAt || new Date()},include:{addresses:true}})
    }else{
        user=await prisma.user.create({data:{name:cleanString(profile.name,100) || "Google user",email,googleId:profile.sub,emailVerifiedAt:new Date()},include:{addresses:true}})
    }
    return res.json({user:publicUser(user),token:generateToken(user.id)})
}

export const getMe=async(req:Request,res:Response)=>{
    if(!req.user?.id) return res.status(401).json({message:"Unauthorized"})
    const user=await prisma.user.findUnique({where:{id:req.user.id},include:{addresses:true}})
    if(!user) return res.status(404).json({message:"User not found"})
    return res.json({user:publicUser(user)})
}
