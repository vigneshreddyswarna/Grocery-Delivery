import { useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import api from "../config/api"
import PasswordInput from "../components/PasswordInput"

export default function ResetPassword(){
    const isDelivery=useLocation().pathname.startsWith("/delivery/")
    const [params]=useSearchParams(); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [done,setDone]=useState(false)
    const submit=async(e:React.FormEvent)=>{e.preventDefault();try{const {data}=await api.post(isDelivery ? '/delivery/reset-password' : '/auth/reset-password',{token:params.get("token"),password});setMessage(data.message);setDone(true)}catch(error:unknown){const response=(error as {response?:{data?:{message?:string}}}).response;setMessage(response?.data?.message || "Reset failed")}}
    return <main className="min-h-dvh bg-app-cream flex-center px-4"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-app-green mb-2">Create a new password</h1><p className="text-sm text-app-text-light mb-6">Use at least 8 characters with a letter and number.</p>
        {!done && <><PasswordInput name="newPassword" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-app-border mb-4" placeholder="New password" /><button className="w-full py-3 rounded-xl bg-app-green text-white">Reset password</button></>}
        {message && <p className="text-sm mt-4 text-app-text-light">{message}</p>}<Link to={isDelivery ? "/delivery/login" : "/login"} className="inline-block mt-5 text-sm text-orange-600">Sign in</Link>
    </form></main>
}
