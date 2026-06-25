import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import api from "../config/api"
import { setStoredValue } from "../utils/storage"

export default function VerifyEmail(){
    const [params]=useSearchParams(); const navigate=useNavigate()
    const isDelivery=useLocation().pathname.startsWith("/delivery/")
    const [message,setMessage]=useState(params.get("token") ? "Verifying your email…" : "Open the verification link sent to your email.")
    const [busy,setBusy]=useState(Boolean(params.get("token")))
    const email=params.get("email") || ""

    useEffect(()=>{
        const token=params.get("token"); if(!token) return
        api.post(isDelivery ? '/delivery/verify-email' : '/auth/verify-email',{token}).then(({data})=>{
            if(!isDelivery){ setStoredValue("auth_token",data.token); setStoredValue("auth_user",JSON.stringify(data.user)) }
            setMessage(isDelivery ? "Email verified. You can now sign in." : "Email verified. Taking you to your account…")
            window.setTimeout(()=>{
                if(isDelivery) navigate('/delivery/login',{replace:true})
                else window.location.replace('/')
            },800)
        }).catch((error)=>setMessage(error.response?.data?.message || "Verification failed")).finally(()=>setBusy(false))
    },[isDelivery,navigate,params])

    const resend=async()=>{
        setBusy(true); try{const {data}=await api.post(isDelivery ? '/delivery/resend-verification' : '/auth/resend-verification',{email});setMessage(data.message)}
        catch{setMessage("Could not send verification email") } finally{setBusy(false)}
    }
    return <main className="min-h-dvh bg-app-cream flex-center px-4"><section className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-app-green mb-3">Verify your email</h1><p className="text-sm text-app-text-light mb-6">{message}</p>
        {!params.get("token") && <p className="mb-4 text-xs text-app-text-light">Delivery may take a minute. Check Spam and Promotions, and confirm that the email address is correct.</p>}
        {!params.get("token") && email && <button disabled={busy} onClick={resend} className="w-full py-3 rounded-xl bg-app-green text-white disabled:opacity-50">Resend verification email</button>}
        <Link to={isDelivery ? "/delivery/login" : "/login"} className="inline-block mt-5 text-sm text-orange-600">Back to sign in</Link>
    </section></main>
}
