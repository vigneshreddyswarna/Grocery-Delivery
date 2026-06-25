import axios from "axios"
import { getStoredValue, removeStoredValue } from "../utils/storage"

const configuredBaseURL = import.meta.env.VITE_BASE_URL?.trim()
const isAbsoluteURL = configuredBaseURL ? /^https?:\/\//i.test(configuredBaseURL) : false
const browserHost = typeof window !== "undefined" ? window.location.hostname : ""
const isLocalBrowserHost = browserHost === "localhost" || browserHost === "127.0.0.1"
const isLocalApiURL = (url: string) => {
    try {
        const hostname = new URL(url).hostname
        return hostname === "localhost" || hostname === "127.0.0.1"
    } catch {
        return false
    }
}

export const API_BASE_URL = isAbsoluteURL && !(import.meta.env.DEV && browserHost && !isLocalBrowserHost && isLocalApiURL(configuredBaseURL))
    ? configuredBaseURL
    : import.meta.env.DEV && browserHost && !isLocalBrowserHost
        ? `${window.location.protocol}//${browserHost}:5000/api`
        : configuredBaseURL || "/api"

const api=axios.create({
    baseURL: API_BASE_URL
})

// Inject JWT token from localStorage into evry request

api.interceptors.request.use((config)=>{
    const isDeliveryRequest=config.url?.startsWith("/delivery")
    const token=isDeliveryRequest
        ? getStoredValue("delivery_token")
        : getStoredValue("auth_token")
    if(token){
        config.headers.Authorization=`Bearer ${token}`
    }
    return config
})

// Handle auth errors globally
api.interceptors.response.use(
    (response)=>{
        const contentType = String(response.headers?.["content-type"] || "")
        if(contentType.includes("text/html") || (typeof response.data === "string" && response.data.trimStart().startsWith("<!doctype html"))){
            return Promise.reject(new Error("The API URL is misconfigured and returned the website instead of API data. Set VITE_BASE_URL to the deployed server /api URL."))
        }
        return response
    },
    (error)=>{
        if (!error.response && error.request) {
            const requestBaseURL = error.config?.baseURL || API_BASE_URL
            const requestPath = error.config?.url || ""
            error.message = `Cannot reach API at ${requestBaseURL}${requestPath}. Restart the client dev server and open the Vite Network URL on mobile.`
        }

        const isDeliveryRequest = error.config?.url?.startsWith("/delivery")

        if(isDeliveryRequest && (error.response?.status===401 || error.response?.status===403)){
            removeStoredValue("delivery_token", "delivery_partner")
            if(window.location.pathname.startsWith("/delivery") && window.location.pathname !== "/delivery/login"){
                window.location.replace("/delivery/login")
            }
        }else if(error.response?.status===401 && !error.config?.url?.includes("/auth/me")){
            removeStoredValue("auth_token", "auth_user")
            // Only redirect if not already on auth pages
            if(!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")){
                window.location.href="/login"
            }
        }
        return Promise.reject(error)
    }
)

export default api
