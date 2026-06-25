import { createHash, randomBytes } from "node:crypto"
import { prisma } from "../config/prisma.js"

export const AUTH_TOKEN_TYPES = {
    VERIFY_EMAIL:"VERIFY_EMAIL",
    RESET_PASSWORD:"RESET_PASSWORD",
} as const

type TokenType=(typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES]

const hashToken=(token:string)=>createHash("sha256").update(token).digest("hex")

export const createUserAuthToken=async(userId:string,type:TokenType,minutes:number)=>{
    const token=randomBytes(32).toString("hex")
    await prisma.$transaction([
        prisma.authToken.deleteMany({where:{userId,type,usedAt:null}}),
        prisma.authToken.create({data:{
            userId,type,tokenHash:hashToken(token),
            expiresAt:new Date(Date.now()+minutes*60_000),
        }}),
    ])
    return token
}

export const consumeUserAuthToken=async(token:string,type:TokenType)=>{
    if(!/^[a-f0-9]{64}$/i.test(token)) return null
    return prisma.$transaction(async(tx)=>{
        const record=await tx.authToken.findFirst({where:{
            tokenHash:hashToken(token),type,usedAt:null,expiresAt:{gt:new Date()},userId:{not:null},
        }})
        if(!record?.userId) return null
        const claimed=await tx.authToken.updateMany({
            where:{id:record.id,usedAt:null},data:{usedAt:new Date()},
        })
        return claimed.count === 1 ? record.userId : null
    })
}

export const createPartnerAuthToken=async(deliveryPartnerId:string,type:TokenType,minutes:number)=>{
    const token=randomBytes(32).toString("hex")
    await prisma.$transaction([
        prisma.authToken.deleteMany({where:{deliveryPartnerId,type,usedAt:null}}),
        prisma.authToken.create({data:{deliveryPartnerId,type,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+minutes*60_000)}}),
    ])
    return token
}

export const consumePartnerAuthToken=async(token:string,type:TokenType)=>{
    if(!/^[a-f0-9]{64}$/i.test(token)) return null
    return prisma.$transaction(async(tx)=>{
        const record=await tx.authToken.findFirst({where:{
            tokenHash:hashToken(token),type,usedAt:null,expiresAt:{gt:new Date()},deliveryPartnerId:{not:null},
        }})
        if(!record?.deliveryPartnerId) return null
        const claimed=await tx.authToken.updateMany({where:{id:record.id,usedAt:null},data:{usedAt:new Date()}})
        return claimed.count === 1 ? record.deliveryPartnerId : null
    })
}
