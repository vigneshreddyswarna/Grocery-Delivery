import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";
import { canTransitionOrder, type OrderStatus } from "../utils/orderStatus.js";
import { cleanString, isValidCoordinate, isValidEmail } from "../utils/validation.js";
import { AUTH_TOKEN_TYPES, consumePartnerAuthToken, createPartnerAuthToken } from "../services/authToken.js";
import { sendPartnerPasswordResetEmail, sendPartnerVerificationEmail } from "../services/authEmail.js";


const generateToken=(id:string)=>{
    return jwt.sign({id,role:"delivery"},process.env.JWT_SECRET as string,{expiresIn:"30d"})
}

// Login Delivery Partner


// POST /api/delivery/login
export const loginPartner=async(req:Request, res:Response)=>{
    const email=cleanString(req.body.email,254).toLowerCase()
    const password=typeof req.body.password === "string" ? req.body.password : ""
    if(!isValidEmail(email) || !password){
        return res.status(400).json({message:"Please provide email and password"})
    }

    const partner=await prisma.deliveryPartner.findUnique({where:{email}})

    if(!partner){
        return res.status(401).json({message:"Invalid email or password"})
    }

    if (!partner.isActive){
        return res.status(403).json({message:"Your account has been deactivated"})
    }
    if(!partner.emailVerifiedAt)
        return res.status(403).json({message:"Verify your email before signing in",code:"EMAIL_NOT_VERIFIED"})

    const isMatch=await bcrypt.compare(password, partner.password)
    if(!isMatch){
        return res.status(401).json({message:"Invalid email or password"})
    }

    const token=generateToken(partner.id)
    const {password:_,...partnerData}=partner

    res.json({partner:partnerData,token})
}

// GET /api/delivery/me
export const getCurrentPartner=async(req:Request, res:Response)=>{
    const {password:_, ...partner}=req.partner!
    res.json({partner})
}

// Get assigned deliveries
// GET /api/delivery/my-deliveries

export const getMyDeliveries=async(req:Request, res:Response)=>{
    const {status}=req.query

    const where:any={deliveryPartnerId: req.partner!.id}

    if(status=="active"){
        where.status={in:["Assigned", "Packed","Out for Delivery"]}
    }else if(status==="completed"){
        where.status={in:["Delivered","Cancelled"]}
    }

    const orders=await prisma.order.findMany({
        where,
        include:{user:{select:{name:true,email:true,phone:true}}},
        orderBy:{createdAt:"desc"}
    })
    res.json({orders})
}

// Get single delivery detail
// GET /api/delivery/my-deliveries/:id
export const getDeliveryDetail=async(req:Request, res:Response)=>{
    const order=await prisma.order.findFirst({
        where:{id:req.params.id as string,deliveryPartnerId:req.partner!.id},
        include:{user:{select:{name:true,email:true,phone:true}}}
    })

    if(!order){
        return res.status(404).json({message:"Delivery not found"})
    }

    res.json({order})

}

// Complete delivery with OTP
// PUT /api/delivery/my-deliveries/:id/complete

export const completeDelivery=async(req:Request, res:Response)=>{
    const {otp}=req.body
    const order=await prisma.order.findFirst({
        where:{id:req.params.id as string,deliveryPartnerId:req.partner!.id}
    })

    if(!order || order.status === "Cancelled" || order.status==="Delivered"){
        return res.status(400).json({message:"Invalid Request"})
    }
    if(typeof otp !== "string" || order.deliveryOtp !== otp.trim()){
        return res.status(400).json({message:"Invalid OTP"})
    }
    if(!canTransitionOrder(order.status,"Delivered")){
        return res.status(409).json({message:`Order cannot be delivered from ${order.status}`})
    }

    const history = order.statusHistory as any[]
    history.push({status:"Delivered", note:"Delivered by partner",timestamp:new Date()})

    const updatedOrder =await prisma.order.update({
        where:{id:order.id},
        data:{status:"Delivered", statusHistory:history, deliveryOtp:"", liveLocation:{isSharing:false}}
    })
    res.json({order:updatedOrder,message:"Delivery completed succesfully"})
}

// Cancel delivery
// PUT /api/delivery/my-deliveries/:id/cancel

export const cancelDelivery=async(req:Request,res:Response)=>{
    const {reason}=req.body
    const order=await prisma.order.findFirst({
        where:{id:req.params.id as string,deliveryPartnerId:req.partner!.id}
    })

    if(!order) return res.status(404).json({message:"Delivery not found"})
    if(!canTransitionOrder(order.status,"Cancelled"))
        return res.status(409).json({message:`A ${order.status.toLowerCase()} order cannot be cancelled`})

    const history=Array.isArray(order.statusHistory) ? [...order.statusHistory] as any[] : []

    history.push({status:"Cancelled", note:reason || "",timestamp:new Date()})

    const updatedOrder =await prisma.order.update({
        where:{id:order.id},
        data:{status:"Cancelled", statusHistory:history, liveLocation:{isSharing:false}}
    })

    res.json({order:updatedOrder,message:"Delivery cancelled"})
}

// Update order status
// PUT /api/delivery/my-deliveries/:id/status

export const updateDeliveryStatus=async(req:Request,res:Response)=>{
    const {status}=req.body as {status:OrderStatus}
    const allowedStatuses=["Packed","Out for Delivery"]

    if(!allowedStatuses.includes(status)){
        return res.status(400).json({message:"Invalid status update"})
    }

    const order=await prisma.order.findFirst({
        where:{id:req.params.id as string,deliveryPartnerId:req.partner!.id}
    })
    if(!order) return res.status(404).json({message:"Delivery not found"})
    if(!canTransitionOrder(order.status,status))
        return res.status(409).json({message:`Order cannot move from ${order.status} to ${status}`})

    const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] as any[] : []

    history.push({status,note:`Status updated to ${status}`, timestamp:new Date()})

    const updatedOrder=await prisma.order.update({
        where:{id:order.id},
        data:{status, statusHistory:history}
    })

    res.json({order:updatedOrder})

}

// Update live location
// PUT /api/delivery/my-deliveries/:id/location

export const updateLocation=async(req:Request,res:Response)=>{
    const {lat,lng,isSharing}=req.body

    const order=await prisma.order.findFirst({
        where:{
            id:req.params.id as string,
            deliveryPartnerId:req.partner!.id,
            status:{in:['Assigned',"Packed","Out for Delivery"]}
        }
    })
    if(!order){
        return res.status(404).json({message:"Active delivery not found"})
    }

    if(isSharing === false){
        await prisma.order.update({
            where:{id:order.id},
            data:{liveLocation:{isSharing:false,updatedAt:new Date()}}
        })
        return res.json({success:true, isSharing:false})
    }

    if(!isValidCoordinate(lat,"lat") || !isValidCoordinate(lng,"lng")){
        return res.status(400).json({message:"Valid location coordinates are required"})
    }

    await prisma.order.update({
        where:{id:order.id},
        data:{liveLocation:{lat:Number(lat),lng:Number(lng),updatedAt:new Date(),isSharing:true}}
    })

    res.json({success:true, isSharing:true})

}

export const verifyPartnerEmail=async(req:Request,res:Response)=>{
    const token=cleanString(req.body.token,128)
    const partnerId=await consumePartnerAuthToken(token,AUTH_TOKEN_TYPES.VERIFY_EMAIL)
    if(!partnerId) return res.status(400).json({message:"Verification link is invalid or expired"})
    await prisma.deliveryPartner.update({where:{id:partnerId},data:{emailVerifiedAt:new Date()}})
    return res.json({message:"Email verified. You can now sign in."})
}

export const resendPartnerVerification=async(req:Request,res:Response)=>{
    const email=cleanString(req.body.email,254).toLowerCase()
    const partner=isValidEmail(email) ? await prisma.deliveryPartner.findUnique({where:{email}}) : null
    if(partner && !partner.emailVerifiedAt){
        const token=await createPartnerAuthToken(partner.id,AUTH_TOKEN_TYPES.VERIFY_EMAIL,24*60)
        await sendPartnerVerificationEmail(partner.email,partner.name,token)
    }
    return res.json({message:"If the account needs verification, a new email has been sent"})
}

export const forgotPartnerPassword=async(req:Request,res:Response)=>{
    const email=cleanString(req.body.email,254).toLowerCase()
    const partner=isValidEmail(email) ? await prisma.deliveryPartner.findUnique({where:{email}}) : null
    if(partner){
        const token=await createPartnerAuthToken(partner.id,AUTH_TOKEN_TYPES.RESET_PASSWORD,30)
        await sendPartnerPasswordResetEmail(partner.email,partner.name,token)
    }
    return res.json({message:"If an account exists, a password reset email has been sent"})
}

export const resetPartnerPassword=async(req:Request,res:Response)=>{
    const token=cleanString(req.body.token,128)
    const password=typeof req.body.password === "string" ? req.body.password : ""
    if(password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password))
        return res.status(400).json({message:"Password must be at least 8 characters and contain a letter and number"})
    const partnerId=await consumePartnerAuthToken(token,AUTH_TOKEN_TYPES.RESET_PASSWORD)
    if(!partnerId) return res.status(400).json({message:"Reset link is invalid or expired"})
    await prisma.deliveryPartner.update({where:{id:partnerId},data:{password:await bcrypt.hash(password,12)}})
    return res.json({message:"Password reset successfully"})
}
