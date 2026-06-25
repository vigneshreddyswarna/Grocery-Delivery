import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
 

// Get /api/products/flash-deals


export const getFlashDeals = async(req:Request, res: Response)=>{
    const products = await prisma.product.findMany({
        where: {stock: {gt: 0}},
        orderBy: {originalPrice:"desc"}
    })

    const productsWithDiscount=products.map((p:any)=>{
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
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
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
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

    const discount = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100):0

    res.json({product: {...product, discount}})

}

// POST /api/products
export const createProduct = async(req:Request,res:Response)=>{
    const product = await prisma.product.create({data:req.body})
    res.status(201).json({product})
}

// PUT /api/products:id
export const updateProduct = async(req:Request,res:Response)=>{
    const product = await prisma.product.update({where:{id:req.params.id as string}, data:req.body})
    res.json({product})
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
