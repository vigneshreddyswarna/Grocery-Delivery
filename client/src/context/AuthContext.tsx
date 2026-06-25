import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import toast from "react-hot-toast";
import { getStoredValue, removeStoredValue, setStoredValue } from "../utils/storage";

interface AuthContextType{
    user:User | null
    token:string | null
    loading:boolean
    login:(email:string,password:string)=>Promise<void>
    register:(name:string,email:string,password:string)=>Promise<void>
    logout:()=>void
    updateUser:(userData:Partial<User>)=>void
}

const AuthContext=createContext<AuthContextType | undefined>(undefined)

const normalizeUser = (user: User): User => ({
    ...user,
    isAdmin: user.isAdmin === true,
})

const readInitialSession = () => {
    const savedToken = getStoredValue("auth_token")
    const savedUser = getStoredValue("auth_user")
    if (!savedToken || !savedUser) return {user: null, token: null}

    try {
        return {user: normalizeUser(JSON.parse(savedUser) as User), token: savedToken}
    } catch {
        removeStoredValue("auth_token", "auth_user")
        return {user: null, token: null}
    }
}

export function AuthProvider({children}:{children:ReactNode}){

    const navigate=useNavigate()
    const [initialSession] = useState(readInitialSession)
    const [user, setUser]=useState<User | null>(initialSession.user)
    const [token, setToken]=useState<string | null>(initialSession.token)
    const [loading, setLoading]=useState(Boolean(initialSession.token))

    useEffect(()=>{
        if(initialSession.token){
            api.get("/auth/me")
                .then(({data})=>{
                    const nextUser = normalizeUser(data.user)
                    setUser(nextUser)
                    setStoredValue("auth_user",JSON.stringify(nextUser))
                })
                .catch((error)=>{
                    if(error.response?.status === 401 || error.response?.status === 403){
                        setToken(null)
                        setUser(null)
                        removeStoredValue("auth_token", "auth_user")
                    }
                })
                .finally(()=>setLoading(false))
            return
        }
    },[initialSession.token])

    const login=async(email:string, password:string)=>{
        const {data}=await api.post('/auth/login',{email,password})
        const nextUser = normalizeUser(data.user)
        setUser(nextUser)
        setToken(data.token)
        setStoredValue("auth_token",data.token)
        setStoredValue("auth_user",JSON.stringify(nextUser))

        toast.success("Login successful")
        navigate('/')
    }

    const register=async(name:string,email:string, password:string)=>{
        const {data}=await api.post('/auth/register',{name,email,password})
        toast.success(data.message || "Check your email to verify your account")
        navigate(`/verify-email?email=${encodeURIComponent(data.email || email)}`)
    }

    const logout=()=>{
        setUser(null)
        setToken(null)
        removeStoredValue("auth_token", "auth_user")
    }

    const updateUser=(userData:Partial<User>)=>{
        if(user){
            const updated=normalizeUser({...user,...userData})
            setUser(updated)

            setStoredValue('auth_user',JSON.stringify(updated))
        }
    }

    return <AuthContext.Provider value={{
        user,token,loading,login,register,logout,updateUser
    }}>
        {children}

    </AuthContext.Provider>
}

export function useAuth(){
    const context=useContext(AuthContext)
    if(!context) throw new Error("useAuth must be used within AuthProvider")
    
    return context
}
