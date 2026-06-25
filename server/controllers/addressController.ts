import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { cleanString, isValidCoordinate } from "../utils/validation.js";

const parseAddressCoordinates = (lat: unknown, lng: unknown) => {
    if(lat == null || lng == null) return null
    const nextLat = Number(lat)
    const nextLng = Number(lng)
    return isValidCoordinate(nextLat,"lat") && isValidCoordinate(nextLng,"lng")
        ? {lat: nextLat, lng: nextLng}
        : null
}

const parseAddressFields = (body: Record<string, unknown>, requireAllFields: boolean) => {
    const parsed = {
        label: cleanString(body.label,40),
        address: cleanString(body.address,300),
        city: cleanString(body.city,100),
        state: cleanString(body.state,100),
        zip: cleanString(body.zip,20),
    }

    if (requireAllFields && (!parsed.label || !parsed.address || !parsed.city || !parsed.state || !parsed.zip)) {
        return null
    }

    return parsed
}

// Get user addresses
// GET /api/addresses


export const getAddresses=async(req: Request, res: Response)=>{
    const addresses=await prisma.address.findMany({
        where:{userId:req.user!.id},
        orderBy:{createdAt:"asc"}
    })
    res.json({addresses})
}

// Add address
// POST /api/addresses
export const addAddress=async(req: Request, res: Response)=>{
    const {isDefault,lat,lng}=req.body

    //Require coordinates
    const coordinates = parseAddressCoordinates(lat,lng)
    if(!coordinates){
        return res.status(400).json({message:"Valid location coordinates are required. Please allow location access."})
    }
    const addressFields = parseAddressFields(req.body, true)
    if(!addressFields){
        return res.status(400).json({message:"Label, address, city, state and ZIP are required"})
    }
    const currentAddresses=await prisma.address.findMany({
        where:{userId:req.user!.id},
        orderBy:{createdAt:"asc"}
    })
    let makeDefault=isDefault
    if(currentAddresses.length===0) makeDefault=true

    if(makeDefault){
        await prisma.address.updateMany({
            where:{userId:req.user!.id},
            data:{isDefault:false}
        })
    }
    await prisma.address.create({
        data:{
            userId: req.user!.id,
            ...addressFields,
            isDefault: makeDefault,
            lat: coordinates.lat,
            lng: coordinates.lng
        }
    })

    const addresses=await prisma.address.findMany({
        where:{userId:req.user!.id},
        orderBy:{createdAt:"asc"}
    })
    res.status(201).json({addresses})
}

// Update address
// PUT /api/addresses/:id
export const updateAddress=async(req:Request, res: Response)=>{
    const {isDefault,lat,lng}=req.body

    //Require coordinates
    const coordinates = parseAddressCoordinates(lat,lng)
    if(!coordinates){
        return res.status(400).json({message:"Valid location coordinates are required. Please allow location access."})
    }

    const existingAddress = await prisma.address.findFirst({
        where:{id:req.params.id as string, userId:req.user!.id}
    })
    if(!existingAddress){
        return res.status(404).json({message:"Address not found"})
    }

    if(isDefault){
        await prisma.address.updateMany({
            where:{userId:req.user!.id},
            data:{isDefault:false}
        })
    }

    const data:any={}
    const addressFields = parseAddressFields(req.body, false)
    if(addressFields?.label) data.label=addressFields.label
    if(addressFields?.address) data.address=addressFields.address
    if(addressFields?.city) data.city=addressFields.city
    if(addressFields?.state) data.state=addressFields.state
    if(addressFields?.zip) data.zip=addressFields.zip
    if(isDefault!==undefined) data.isDefault=isDefault
    data.lat=coordinates.lat
    data.lng=coordinates.lng

    await prisma.address.update({
        where:{id:existingAddress.id},
        data
    })

    const addresses=await prisma.address.findMany({
        where:{userId:req.user!.id},
        orderBy:{createdAt:"asc"}

    })
    res.json({addresses})
}

// Delete address
// DELETE /api/addresses/:id

export const deleteAddress=async(req:Request,res:Response)=>{
    const result = await prisma.address.deleteMany({
        where:{id:req.params.id as string, userId:req.user!.id}
    })
    if(result.count === 0){
        return res.status(404).json({message:"Address not found"})
    }

    const addresses=await prisma.address.findMany({
        where:{userId:req.user!.id},
        orderBy:{createdAt:"asc"}

    })
    res.json({addresses})

}
