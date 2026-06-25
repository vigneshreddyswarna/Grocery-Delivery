import { prisma } from "../config/prisma.js";
import { cleanString } from "../utils/validation.js";
const optionalNumber = (value) => {
    if (value === undefined || value === null || value === "")
        return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};
const optionalInteger = (value) => {
    const number = optionalNumber(value);
    if (number === undefined || number === null)
        return number;
    return Number.isInteger(number) ? number : null;
};
const buildProductData = (body, requireRequiredFields) => {
    const data = {};
    const name = cleanString(body.name, 160);
    const image = cleanString(body.image, 500);
    const category = cleanString(body.category, 80);
    const description = cleanString(body.description, 1000);
    const unit = cleanString(body.unit, 40);
    const price = optionalNumber(body.price);
    const originalPrice = optionalNumber(body.originalPrice);
    const stock = optionalInteger(body.stock);
    const rating = optionalNumber(body.rating);
    const reviewCount = optionalInteger(body.reviewCount);
    if (requireRequiredFields && (!name || !image || !category || price === undefined)) {
        return { error: "Name, image, category and price are required" };
    }
    if (body.price !== undefined && (typeof price !== "number" || price < 0))
        return { error: "Price must be a non-negative number" };
    if (body.originalPrice !== undefined && (typeof originalPrice !== "number" || originalPrice < 0))
        return { error: "Original price must be a non-negative number" };
    if (body.stock !== undefined && (typeof stock !== "number" || stock < 0))
        return { error: "Stock must be a non-negative whole number" };
    if (body.rating !== undefined && (typeof rating !== "number" || rating < 0 || rating > 5))
        return { error: "Rating must be between 0 and 5" };
    if (body.reviewCount !== undefined && (typeof reviewCount !== "number" || reviewCount < 0))
        return { error: "Review count must be a non-negative whole number" };
    if (name)
        data.name = name;
    if (description || body.description !== undefined)
        data.description = description;
    if (price !== undefined)
        data.price = price;
    if (originalPrice !== undefined)
        data.originalPrice = originalPrice;
    if (image)
        data.image = image;
    if (category)
        data.category = category;
    if (unit || body.unit !== undefined)
        data.unit = unit || "piece";
    if (stock !== undefined)
        data.stock = stock;
    if (typeof body.isOrganic === "boolean")
        data.isOrganic = body.isOrganic;
    if (rating !== undefined)
        data.rating = rating;
    if (reviewCount !== undefined)
        data.reviewCount = reviewCount;
    if (!requireRequiredFields && Object.keys(data).length === 0) {
        return { error: "Provide at least one valid product field to update" };
    }
    return { data };
};
// Get /api/products/flash-deals
export const getFlashDeals = async (req, res) => {
    const products = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        orderBy: { originalPrice: "desc" }
    });
    const productsWithDiscount = products.map((p) => {
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        return { ...p, discount };
    });
    res.json({ products: productsWithDiscount.slice(0, 8) });
};
//GET /api/products
export const getProducts = async (req, res) => {
    const { category, search, minPrice, maxPrice, sort, organic } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 0, 0);
    const where = {};
    if (category && category !== "all")
        where.category = category;
    if (search)
        where.name = { contains: search, mode: "insensitive" };
    if (organic)
        where.isOrganic = organic === "true";
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice)
            where.price.gte = Number(minPrice);
        if (maxPrice)
            where.price.lte = Number(maxPrice);
    }
    let orderBy;
    if (sort === "price_asc" || sort === "price-low")
        orderBy = [{ price: 'asc' }, { id: 'asc' }];
    else if (sort === "price_desc" || sort === "price-high")
        orderBy = [{ price: 'desc' }, { id: 'asc' }];
    else if (sort === "rating")
        orderBy = [{ rating: "desc" }, { reviewCount: "desc" }, { id: 'asc' }];
    else if (sort === "name")
        orderBy = [{ name: 'asc' }, { id: 'asc' }];
    else
        orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy,
            ...(limit ? { skip: (page - 1) * limit, take: limit } : {})
        }),
        prisma.product.count({ where })
    ]);
    const productsWithDiscount = products.map((p) => {
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        return { ...p, discount };
    });
    res.json({ products: productsWithDiscount, total, page, pages: limit ? Math.ceil(total / limit) : 1 });
};
// GET /api/products/:id
export const getProduct = async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
    }
    const discount = product.originalPrice && product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    res.json({ product: { ...product, discount } });
};
// POST /api/products
export const createProduct = async (req, res) => {
    const parsed = buildProductData(req.body, true);
    if (parsed.error)
        return res.status(400).json({ message: parsed.error });
    const product = await prisma.product.create({ data: parsed.data });
    res.status(201).json({ product });
};
// PUT /api/products:id
export const updateProduct = async (req, res) => {
    const parsed = buildProductData(req.body, false);
    if (parsed.error)
        return res.status(400).json({ message: parsed.error });
    try {
        const product = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data });
        res.json({ product });
    }
    catch (error) {
        res.status(404).json({ message: "Product not found" });
    }
};
// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
    const id = req.params.id;
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
    }
    await prisma.product.delete({ where: { id } });
    res.json({ message: "Product deleted permanently" });
};
