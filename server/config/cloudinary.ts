import {v2 as cloudinary} from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
}

cloudinary.config({
    cloud_name:cloudName,
    api_key :apiKey,
    api_secret:apiSecret
})

export default cloudinary
