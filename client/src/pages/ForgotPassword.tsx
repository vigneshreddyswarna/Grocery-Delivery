import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import api from "../config/api"

export default function ForgotPassword(){
    const isDelivery=useLocation().pathname.startsWith("/delivery/")
    const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false)
    const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{const {data}=await api.post(isDelivery ? '/delivery/forgot-password' : '/auth/forgot-password',{email});setMessage(data.message)}finally{setBusy(false)}}
    return <main className="min-h-dvh bg-app-cream flex-center px-4"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-green mb-2">Forgot password?</h1><p className="text-sm text-app-text-light mb-6">We’ll email you a secure reset link.</p>
        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-app-border mb-4" placeholder="you@example.com" />
        <button disabled={busy} className="w-full py-3 rounded-xl bg-app-green text-white disabled:opacity-50">Send reset link</button>
        {message && <p className="text-sm mt-4 text-app-text-light">{message}</p>}<Link to={isDelivery ? "/delivery/login" : "/login"} className="inline-block mt-5 text-sm text-orange-600">Back to sign in</Link>
    </form></main>
}
