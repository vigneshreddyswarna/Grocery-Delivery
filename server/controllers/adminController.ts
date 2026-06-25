
//get admin dashboard data

import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt'
import { randomInt } from "node:crypto"
import { canTransitionOrder } from "../utils/orderStatus.js"
import { cleanString, isValidEmail } from "../utils/validation.js"
import { AUTH_TOKEN_TYPES, createPartnerAuthToken } from "../services/authToken.js"
import { sendPartnerVerificationEmail } from "../services/authEmail.js"

const publicPartnerSelect = {
    id:true,name:true,email:true,phone:true,avatar:true,vehicleType:true,
    isActive:true,createdAt:true,updatedAt:true
} as const

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
    const vehicleType=cleanString(req.body.vehicleType,30) || "bike"

    if(!name || !isValidEmail(email) || password.length < 8 || !phone){
        res.status(400).json({message:"Provide a valid name, email, phone and password of at least 8 characters"})
        return
    }
    const hashedPassword=await bcrypt.hash(password,10)

    const partner=await prisma.deliveryPartner.create({
        data:{name,email,password:hashedPassword,phone,vehicleType},
        select:publicPartnerSelect
    })
    const verificationToken=await createPartnerAuthToken(partner.id,AUTH_TOKEN_TYPES.VERIFY_EMAIL,24*60)
    await sendPartnerVerificationEmail(partner.email,partner.name,verificationToken)
    res.status(201).json({partner})
}

// update delivery partner profile

export const updateDeliveryPartner=async(req:Request,res:Response)=>{
    const {name,phone,vehicleType,isActive}=req.body

    const data:any={}
    if(name) data.name=name
    if(phone) data.phone=phone
    if(vehicleType) data.vehicleType=vehicleType
    data.isActive=isActive

    try{
        const partner=await prisma.deliveryPartner.update({
            where:{id:req.params.id as string},
            data,
            select:publicPartnerSelect
        })
        res.json({partner})
    }catch(error){
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
