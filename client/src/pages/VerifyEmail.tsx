import { useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import api from "../config/api"
import { setStoredValue } from "../utils/storage"
import { getErrorMessage } from "../utils/errors"

export default function VerifyEmail(){
    const [params]=useSearchParams(); const navigate=useNavigate()
    const isDelivery=useLocation().pathname.startsWith("/delivery/")
    const [message,setMessage]=useState("Enter the 6-digit verification code sent to your email.")
    const [busy,setBusy]=useState(false)
    const [otp,setOtp]=useState("")
    const email=params.get("email") || ""

    const verify=async(event:React.FormEvent)=>{
        event.preventDefault()
        setBusy(true)
        try{
            const {data}=await api.post(isDelivery ? '/delivery/verify-email' : '/auth/verify-email',{otp})
            if(!isDelivery){ setStoredValue("auth_token",data.token); setStoredValue("auth_user",JSON.stringify(data.user)) }
            setMessage(isDelivery ? "Email verified. You can now sign in." : "Email verified. Taking you to your account...")
            window.setTimeout(()=>{
                if(isDelivery) navigate('/delivery/login',{replace:true})
                else window.location.replace('/')
            },800)
        }catch(error:unknown){
            setMessage(getErrorMessage(error,"Verification failed"))
        }finally{
            setBusy(false)
        }
    }

    const resend=async()=>{
        setBusy(true); try{const {data}=await api.post(isDelivery ? '/delivery/resend-verification' : '/auth/resend-verification',{email});setMessage(data.message)}
        catch{setMessage("Could not send verification code") } finally{setBusy(false)}
    }
    return <main className="min-h-dvh bg-app-cream flex-center px-4"><form onSubmit={verify} className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-app-green mb-3">Verify your email</h1><p className="text-sm text-app-text-light mb-6">{message}</p>
        <input
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={event=>setOtp(event.target.value.replace(/\D/g,"").slice(0,6))}
            className="mb-4 w-full rounded-xl border border-app-border px-4 py-3 text-center text-2xl font-semibold tracking-[0.35em] outline-none focus:border-app-green"
            placeholder="000000"
            aria-label="Verification code"
        />
        <button disabled={busy || otp.length !== 6} className="w-full py-3 rounded-xl bg-app-green text-white disabled:opacity-50">Verify email</button>
        <p className="my-4 text-xs text-app-text-light">Delivery may take a minute. Check Spam and Promotions, and confirm that the email address is correct.</p>
        {email && <button type="button" disabled={busy} onClick={resend} className="w-full py-3 rounded-xl border border-app-border text-app-green disabled:opacity-50">Resend verification code</button>}
        <Link to={isDelivery ? "/delivery/login" : "/login"} className="inline-block mt-5 text-sm text-orange-600">Back to sign in</Link>
    </form></main>
}
