import { useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

declare global {
    interface Window {
        google?: {accounts:{id:{initialize:(options:{client_id:string,callback:(response:{credential:string})=>void})=>void,renderButton:(element:HTMLElement,options:Record<string,unknown>)=>void}}}
    }
}

export default function GoogleSignIn(){
    const container=useRef<HTMLDivElement>(null)
    const {googleLogin}=useAuth()
    const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID

    useEffect(()=>{
        if(!clientId || !container.current) return
        const render=()=>{
            if(!window.google || !container.current) return
            window.google.accounts.id.initialize({
                client_id:clientId,
                callback:({credential})=>googleLogin(credential).catch(()=>toast.error("Google sign-in failed")),
            })
            window.google.accounts.id.renderButton(container.current,{theme:"outline",size:"large",width:400,text:"continue_with"})
        }
        const existing=document.querySelector<HTMLScriptElement>('script[data-google-identity]')
        if(existing){ existing.addEventListener("load",render); render(); return ()=>existing.removeEventListener("load",render) }
        const script=document.createElement("script")
        script.src="https://accounts.google.com/gsi/client"; script.async=true; script.defer=true
        script.dataset.googleIdentity="true"; script.addEventListener("load",render); document.head.appendChild(script)
        return ()=>script.removeEventListener("load",render)
    },[clientId,googleLogin])

    if(!clientId) return null
    return <div ref={container} className="flex justify-center" aria-label="Google sign in" />
}
