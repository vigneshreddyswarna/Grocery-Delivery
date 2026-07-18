import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { cleanString } from "../utils/validation.js";
import { paiseToDecimal, parseMoneyToPaise } from "../utils/money.js";
 
const optionalNumber = (value: unknown) => {
    if (value === undefined || value === null || value === "") return undefined
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

const optionalInteger = (value: unknown) => {
    const number = optionalNumber(value)
    if (number === undefined || number === null) return number
    return Number.isInteger(number) ? number : null
}

const buildProductData = (body: Record<string, unknown>, requireRequiredFields: boolean) => {
    const data: Record<string, unknown> = {}

    const name = cleanString(body.name, 160)
    const image = cleanString(body.image, 500)
    const category = cleanString(body.category, 80)
    const description = cleanString(body.description, 1000)
    const unit = cleanString(body.unit, 40)
    const pricePaise = body.price === undefined ? undefined : parseMoneyToPaise(body.price)
    const originalPricePaise = body.originalPrice === undefined ? undefined : parseMoneyToPaise(body.originalPrice)
    const stock = optionalInteger(body.stock)
    const rating = optionalNumber(body.rating)
    const reviewCount = optionalInteger(body.reviewCount)

    if (requireRequiredFields && (!name || !image || !category || pricePaise === undefined)) {
        return {error:"Name, image, category and price are required"}
    }

    if (body.price !== undefined && pricePaise === null) return {error:"Price must be a non-negative amount with at most two decimal places"}
    if (body.originalPrice !== undefined && originalPricePaise === null) return {error:"Original price must be a non-negative amount with at most two decimal places"}
    if (body.stock !== undefined && (typeof stock !== "number" || stock < 0)) return {error:"Stock must be a non-negative whole number"}
    if (body.rating !== undefined && (typeof rating !== "number" || rating < 0 || rating > 5)) return {error:"Rating must be between 0 and 5"}
    if (body.reviewCount !== undefined && (typeof reviewCount !== "number" || reviewCount < 0)) return {error:"Review count must be a non-negative whole number"}

    if (name) data.name = name
    if (description || body.description !== undefined) data.description = description
    if (pricePaise !== undefined && pricePaise !== null) data.price = paiseToDecimal(pricePaise)
    if (originalPricePaise !== undefined && originalPricePaise !== null) data.originalPrice = paiseToDecimal(originalPricePaise)
    if (image) data.image = image
    if (category) data.category = category
    if (unit || body.unit !== undefined) data.unit = unit || "piece"
    if (stock !== undefined) data.stock = stock
    if (typeof body.isOrganic === "boolean") data.isOrganic = body.isOrganic
    if (rating !== undefined) data.rating = rating
    if (reviewCount !== undefined) data.reviewCount = reviewCount

    if (!requireRequiredFields && Object.keys(data).length === 0) {
        return {error:"Provide at least one valid product field to update"}
    }

    return {data}
}

// Get /api/products/flash-deals


export const getFlashDeals = async(req:Request, res: Response)=>{
    const products = await prisma.product.findMany({
        where: {stock: {gt: 0}},
        orderBy: {originalPrice:"desc"}
    })

    const productsWithDiscount=products.map((p:any)=>{
        const originalPrice=Number(p.originalPrice),price=Number(p.price)
        const discount = originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        return {...p, discount}
    })
    
    res.json({products:productsWithDiscount.slice(0,8)})

}

//GET /api/products
export const getProducts = async(req:Request, res: Response) => {
    const {category, search, minPrice, maxPrice, sort, organic}=req.query;
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.max(Number(req.query.limit) || 0, 0)

    const where:any={};
    if(category && category !== "all") where.category=category as string
    if(search) where.name ={contains: search as string,mode:"insensitive"};
    if(organic) where.isOrganic = organic === "true"
    if(minPrice || maxPrice){
        where.price={}
        if(minPrice) where.price.gte=Number(minPrice)
        if(maxPrice) where.price.lte=Number(maxPrice)
    }
    let orderBy: any
    if (sort==="price_asc" || sort==="price-low") orderBy=[{price:'asc'},{id:'asc'}]
    else if(sort==="price_desc" || sort==="price-high") orderBy=[{price:'desc'},{id:'asc'}]
    else if(sort==="rating") orderBy=[{rating:"desc"},{reviewCount:"desc"},{id:'asc'}]
    else if(sort==="name") orderBy=[{name:'asc'},{id:'asc'}]
    else orderBy=[{createdAt:'desc'},{id:'asc'}]

    const [products, total]=await Promise.all([
        prisma.product.findMany({
            where,
            orderBy,
            ...(limit ? {skip: (page - 1) * limit, take: limit} : {})
        }),
        prisma.product.count({where})
    ])

    const productsWithDiscount=products.map((p:any)=>{
        const originalPrice=Number(p.originalPrice),price=Number(p.price)
        const discount = originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
        return {...p, discount}
    })
    res.json({products: productsWithDiscount, total, page, pages: limit ? Math.ceil(total / limit) : 1})
}

// GET /api/products/:id

export const getProduct = async(req:Request, res: Response) => {
    const product =await prisma.product.findUnique({where:{id:req.params.id as string}})

    if(!product){
        res.status(404).json({message:"Product not found"})
        return
    }

    const originalPrice=Number(product.originalPrice),price=Number(product.price)
    const discount = originalPrice && price ? Math.round(((originalPrice - price) / originalPrice) * 100):0

    res.json({product: {...product, discount}})

}

// POST /api/products
export const createProduct = async(req:Request,res:Response)=>{
    const parsed = buildProductData(req.body, true)
    if (parsed.error) return res.status(400).json({message:parsed.error})
    const product = await prisma.product.create({data:parsed.data as any})
    res.status(201).json({product})
}

// PUT /api/products:id
export const updateProduct = async(req:Request,res:Response)=>{
    const parsed = buildProductData(req.body, false)
    if (parsed.error) return res.status(400).json({message:parsed.error})
    try{
        const product = await prisma.product.update({where:{id:req.params.id as string}, data:parsed.data as any})
        res.json({product})
    }catch(error){
        res.status(404).json({message:"Product not found"})
    }
}

// DELETE /api/products/:id
export const deleteProduct = async(req:Request,res:Response)=>{
    const id = req.params.id as string
    const existingProduct = await prisma.product.findUnique({where: {id}})

    if (!existingProduct) {
        return res.status(404).json({message: "Product not found"})
    }

    await prisma.product.delete({where: {id}})
    res.json({message: "Product deleted permanently"})
}
