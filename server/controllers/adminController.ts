
//get admin dashboard data

import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt'
import { createHash, randomInt } from "node:crypto"
import { canTransitionOrder } from "../utils/orderStatus.js"
import { cleanString, isValidEmail } from "../utils/validation.js"
import { AUTH_TOKEN_TYPES, createPartnerAuthToken, createVerificationOtp } from "../services/authToken.js"
import { sendPartnerVerificationEmail } from "../services/authEmail.js"

const publicPartnerSelect = {
    id:true,name:true,email:true,phone:true,avatar:true,vehicleType:true,
    isActive:true,emailVerifiedAt:true,createdAt:true,updatedAt:true
} as const

const isPrismaUniqueError = (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && (error as {code?:string}).code === "P2002"

const hashOtp=(otp:string)=>createHash("sha256").update(otp).digest("hex")

export const getAdminStats=async(req:Request,res: Response)=>{
    const [totalOrders,totalUsers,totalProducts,outOfStock,totalPartners,recentOrders]=await Promise.all([
        prisma.order.count({where:{NOT:[{paymentMethod:{in:["card","upi"]},isPaid:false}]}}),
        prisma.user.count(),
        prisma.product.count(),
        prisma.product.count({where:{stock:0}}),
        prisma.deliveryPartner.count(),
        prisma.order.findMany({
            where:{NOT:[{paymentMethod:{in:["card","upi"]},isPaid:false}]},
            orderBy:{createdAt:"desc"},
            take:8,
            include:{user:{select:{name:true,email:true}},
            deliveryPartner:{select:{name:true,phone:true}}
        
        }
        })
    ])
    res.json({totalOrders,totalUsers,totalProducts,outOfStock,totalPartners,recentOrders})
}

// get delivery partners list for admin
export const getDeliveryPartners=async(req:Request,res: Response)=>{
    const partners=await prisma.deliveryPartner.findMany({
        orderBy:{createdAt:"desc"}, select:publicPartnerSelect
    })
    res.json({partners})
}

// create delivery partner profile
export const createDeliveryPartner=async(req:Request,res:Response)=>{
    const name=cleanString(req.body.name,100)
    const email=cleanString(req.body.email,254).toLowerCase()
    const password=typeof req.body.password === "string" ? req.body.password : ""
    const phone=cleanString(req.body.phone,30)
    const vehicleType="bike"

    if(!name || !isValidEmail(email) || password.length < 8 || !phone){
        res.status(400).json({message:"Provide a valid name, email, phone and password of at least 8 characters"})
        return
    }
    if(!/[a-z]/i.test(password) || !/\d/.test(password)){
        res.status(400).json({message:"Password must contain a letter and number"})
        return
    }
    const existingPartner=await prisma.deliveryPartner.findUnique({where:{email}})
    if(existingPartner) return res.status(409).json({message:"A delivery partner already exists with this email"})

    const hashedPassword=await bcrypt.hash(password,10)
    const verificationToken=createVerificationOtp()

    try{
        const pending=await prisma.$transaction(async(tx)=>{
            await tx.pendingDeliveryPartner.deleteMany({where:{email}})
            return tx.pendingDeliveryPartner.create({
                data:{
                    name,email,password:hashedPassword,phone,vehicleType,
                    otpHash:hashOtp(verificationToken),
                    expiresAt:new Date(Date.now()+15*60_000),
                },
                select:{id:true,email:true}
            })
        })
        await sendPartnerVerificationEmail(email,name,verificationToken)
        res.status(201).json({pendingPartner:pending,message:"Verification code sent to the delivery partner email. Enter the OTP to create the account."})
    }catch(error){
        if(isPrismaUniqueError(error)) return res.status(409).json({message:"A delivery partner already exists with this email"})
        throw error
    }
}

export const confirmDeliveryPartner=async(req:Request,res:Response)=>{
    const pendingPartnerId=cleanString(req.body.pendingPartnerId,100)
    const otp=cleanString(req.body.otp,16)
    if(!pendingPartnerId || !/^\d{6}$/.test(otp)){
        return res.status(400).json({message:"Enter the 6-digit verification code"})
    }

    const pending=await prisma.pendingDeliveryPartner.findUnique({where:{id:pendingPartnerId}})
    if(!pending) return res.status(404).json({message:"Pending delivery partner not found. Send a new OTP."})
    if(pending.expiresAt <= new Date()){
        await prisma.pendingDeliveryPartner.delete({where:{id:pending.id}})
        return res.status(400).json({message:"Verification code expired. Send a new OTP."})
    }
    if(pending.otpHash !== hashOtp(otp)){
        return res.status(400).json({message:"Verification code is invalid"})
    }

    try{
        const partner=await prisma.$transaction(async(tx)=>{
            const created=await tx.deliveryPartner.create({
                data:{
                    name:pending.name,
                    email:pending.email,
                    password:pending.password,
                    phone:pending.phone,
                    vehicleType:pending.vehicleType,
                    emailVerifiedAt:new Date(),
                },
                select:publicPartnerSelect,
            })
            await tx.pendingDeliveryPartner.delete({where:{id:pending.id}})
            return created
        })
        res.status(201).json({partner,message:"Delivery partner verified and created."})
    }catch(error){
        if(isPrismaUniqueError(error)) return res.status(409).json({message:"A delivery partner already exists with this email"})
        throw error
    }
}

// update delivery partner profile

export const updateDeliveryPartner=async(req:Request,res:Response)=>{
    const {name,email,password,phone,isActive}=req.body
    const existing=await prisma.deliveryPartner.findUnique({where:{id:req.params.id as string}})
    if(!existing) return res.status(404).json({message:"Partner not found"})

    const data:any={}
    const nextName=cleanString(name,100)
    const nextEmail=cleanString(email,254).toLowerCase()
    const nextPhone=cleanString(phone,30)
    if(nextName) data.name=nextName
    if(nextEmail){
        if(!isValidEmail(nextEmail)) return res.status(400).json({message:"Provide a valid email"})
        data.email=nextEmail
        if(nextEmail !== existing.email.toLowerCase()){
            data.emailVerifiedAt=null
        }
    }
    if(nextPhone) data.phone=nextPhone
    if(existing.vehicleType !== "bike") data.vehicleType="bike"
    if(typeof isActive === "boolean") data.isActive=isActive
    if(typeof password === "string" && password.trim()){
        if(password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)){
            return res.status(400).json({message:"Password must be at least 8 characters and contain a letter and number"})
        }
        data.password=await bcrypt.hash(password,12)
    }
    if(Object.keys(data).length === 0) return res.status(400).json({message:"Provide at least one valid partner field to update"})

    try{
        const partner=await prisma.deliveryPartner.update({
            where:{id:req.params.id as string},
            data,
            select:publicPartnerSelect
        })
        if(data.emailVerifiedAt === null){
            const verificationToken=createVerificationOtp()
            await createPartnerAuthToken(partner.id,AUTH_TOKEN_TYPES.VERIFY_EMAIL,15,verificationToken)
            await sendPartnerVerificationEmail(partner.email,partner.name,verificationToken)
        }
        res.json({partner,message:data.emailVerifiedAt === null ? "Partner updated. A new verification code was sent." : "Partner updated."})
    }catch(error){
        if(isPrismaUniqueError(error)) return res.status(409).json({message:"A delivery partner already exists with this email"})
        res.status(404).json({message:"Partner not found"})
    }
}

export const deleteDeliveryPartner=async(req:Request,res:Response)=>{
    try{
        await prisma.deliveryPartner.delete({where:{id:req.params.id as string}})
        res.json({message:"Delivery partner deleted"})
    }catch{
        res.status(404).json({message:"Partner not found"})
    }
}

// assign delivery partner for order
export const assignDeliveryPartner=async(req:Request,res:Response)=>{
    const {partnerId}=req.body
    const order=await prisma.order.findUnique({
        where:{id:req.params.id as string}
    })
    if(!order) return res.status(404).json({message:"Order not found"})
    if(["Delivered","Cancelled"].includes(order.status)){
        return res.status(409).json({message:`A ${order.status.toLowerCase()} order cannot be assigned`})
    }

    const partner = await prisma.deliveryPartner.findUnique({
        where:{id:partnerId}
    })
    if(!partner || !partner.isActive){
        return res.status(400).json({message:"Select an active delivery partner"})
    }

    const otp=String(randomInt(100000,1000000))

    let status=order.status
    const history:any[]=Array.isArray(order.statusHistory) ? [...order.statusHistory] : []

    if(canTransitionOrder(order.status,"Assigned")){
        status="Assigned";
        history.push({
            status:"Assigned",
            note:`Assigned to ${partner!.name}`, timestamp: new Date()
        })
    }
    await prisma.order.update({
        where:{id:order.id},
        data:{deliveryPartnerId:partner.id,deliveryOtp:otp,status,statusHistory:history}
    })

    res.json({message:"Delivery partner assigned"})
}
