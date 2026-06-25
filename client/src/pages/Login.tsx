
// import { useState } from "react"
// import { heroSectionData } from "../assets/assets"
// import { Link } from "react-router-dom"
// import { BikeIcon, Loader2Icon, LockIcon, MailIcon, UserIcon } from "lucide-react"
// import { useAuth } from "../context/AuthContext"
// import toast from "react-hot-toast"

// const Login = () => {
//     const [isLoginState, setIsLoginState] = useState(true)
//     const [name, setName] = useState("")
//     const [email, setEmail] = useState("")
//     const [password, setPassword] = useState("")
//     const [loading, setLoading] = useState(false)
//     const {login,register}=useAuth()

//     const handleSubmit = async (e: React.SubmitEvent) => {
//         e.preventDefault()
//         setLoading(true)
//         try{
//             if(isLoginState){
//                 await login(email,password)
//             }else{
//                 await register(name,email,password)
//             }
//         }catch(error:any){
//             toast.error(error.response?.data?.message || error?.message)
//         }finally{
//             setLoading(false)
//         }
//     }

//     return (
//         <div className="min-h-screen flex">
//             {/* Left side */}
//             <div className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
//                 <img src={heroSectionData.hero_image} alt="" className="absolute inset-0 object-cover h-full bg-center opacity-10" />
//                 <div className="relative text-center px-12">
//                     <h2 className="text-4xl font-semibold text-white mb-4">Welcome back to Instacart</h2>
//                     <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">Fresh groceries and organic produce, delivered to your doorstep.</p>
//                 </div>
//             </div>

//             {/* Right Side */}
//             <div className="flex-1 flex items-center justify-center px-4 py-12 bg-app-cream">
//                 <div className="w-full max-w-md">
//                     {/* Form header message */}
//                     <div className="text-center mb-8">
//                         <Link to="/" className="inline-flex items-center gap-2 mb-6">
//                             <BikeIcon className="size-8 text-app-green" />
//                             <span className="text-2xl font-semibold text-app-green">Instacart</span>
//                         </Link>
//                         <h1 className="text-2xl font-bold mb-2">
//                             {isLoginState ? "Sign in to your account" : "Sign up for an account"}
//                         </h1>
//                         <p className="text-sm text-app-text-light">
//                             {isLoginState ? "Don't have an account?" : "Already have an account?"}
//                             <button type="button" onClick={() => setIsLoginState(!isLoginState)} className="text-orange-500 ml-1 font-semibold hover:text-orange-600 transition-colors">
//                                 {isLoginState ? "Create one" : "Sign in"}
//                             </button>
//                         </p>
//                     </div>

//                     {/* Login / Register Form */}
//                     <form onSubmit={handleSubmit} className="space-y-5">
//                         {!isLoginState && (
//                             <label className="block text-sm font-medium text-gray-700">
//                                 Name
//                                 <div className="relative mt-1">
//                                     {/* Fixed: Separated top-1/2 and -translate-y-1/2 */}
//                                     <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-app-text-light" />
//                                     {/* Fixed: rouned-xl -> rounded-xl | fixed border classes */}
//                                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-300 focus:border-app-green outline-none transition-all" />
//                                 </div>
//                             </label>
//                         )}
//                         <label className="block text-sm font-medium text-gray-700">
//                             Email Address
//                             <div className="relative mt-1">
//                                 {/* Fixed: Separated top-1/2 and -translate-y-1/2 */}
//                                 <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-app-text-light" />
//                                 {/* Fixed: rouned-xl -> rounded-xl */}
//                                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="You@example.com" className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-300 focus:border-app-green outline-none transition-all" />
//                             </div>
//                         </label>
//                         <label className="block text-sm font-medium text-gray-700">
//                             Password
//                             <div className="relative mt-1">
//                                 {/* Fixed: Separated top-1/2 and -translate-y-1/2 */}
//                                 <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-app-text-light" />
//                                 {/* Fixed: rouned-xl -> rounded-xl */}
//                                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="........" className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-300 focus:border-app-green outline-none transition-all" />
//                             </div>
//                         </label>
//                         <button type="submit" disabled={loading} className="flex items-center justify-center w-full py-3 bg-green-950 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50">
//                             {loading ? <Loader2Icon className="animate-spin" /> : isLoginState ? "Sign In" : "Sign Up"}
//                         </button>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default Login

import { useState } from "react"
import { heroSectionData } from "../assets/assets"
import { Link } from "react-router-dom"
import { BikeIcon, Loader2Icon, LockIcon, MailIcon, UserIcon } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import GoogleSignIn from "../components/GoogleSignIn"
import PasswordInput from "../components/PasswordInput"
import AutofillSafeInput from "../components/AutofillSafeInput"

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response
        return response?.data?.message || "Something went wrong"
    }
    return "Something went wrong"
}

const Login = () => {
    const [isLoginState, setIsLoginState] = useState(true)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const { login, register } = useAuth()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isLoginState) {
                await login(email, password)
            } else {
                await register(name, email, password)
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    const handleStateToggle = () => {
        setIsLoginState(!isLoginState)
        setName("")
        setEmail("")
        setPassword("")
    }

    return (
        <div className="min-h-dvh flex">
            {/* Left side */}
            <div className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
                <img src={heroSectionData.hero_image} alt="" className="absolute inset-0 object-cover h-full w-full bg-center opacity-10" />
                <div className="relative text-center px-12">
                    <h2 className="text-4xl font-semibold text-white mb-4">Welcome back to FreshCart</h2>
                    <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">Fresh groceries and organic produce, delivered to your doorstep.</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 bg-app-cream">
                <div className="w-full max-w-md">
                    {/* Form header message */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 mb-6">
                            <BikeIcon className="size-8 text-app-green" />
                            <span className="text-2xl font-semibold text-app-green">FreshCart</span>
                        </Link>
                        <h1 className="text-2xl font-bold mb-2">
                            {isLoginState ? "Sign in to your account" : "Sign up for an account"}
                        </h1>
                        <p className="text-sm text-app-text-light">
                            {isLoginState ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                type="button" 
                                onClick={handleStateToggle} 
                                className="text-orange-500 ml-1 font-semibold hover:text-orange-600 transition-colors"
                            >
                                {isLoginState ? "Create one" : "Sign in"}
                            </button>
                        </p>
                    </div>

                    {/* Login / Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                        {!isLoginState && (
                            <label className="block text-sm font-medium text-gray-700">
                                Name
                                <div className="relative mt-1">
                                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-app-text-light" />
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        required 
                                        autoComplete="name"
                                        placeholder="Your name" 
                                        className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-300 focus:border-app-green outline-none transition-all" 
                                    />
                                </div>
                            </label>
                        )}
                        
                        <label className="block text-sm font-medium text-gray-700">
                            Email Address
                            <div className="relative mt-1">
                                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-app-text-light" />
                                <AutofillSafeInput
                                    type="email"
                                    name={isLoginState ? "freshcartCustomerLoginEmail" : "freshcartCustomerSignupEmail"}
                                    inputMode="email"
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    placeholder="You@example.com" 
                                    className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-xl border border-gray-300 focus:border-app-green outline-none transition-all" 
                                />
                            </div>
                        </label>
                        {isLoginState && <div className="text-right -mt-3"><Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700">Forgot password?</Link></div>}
                        
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                            <div className="relative mt-1">
                                <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-app-text-light" />
                                <PasswordInput
                                    name={isLoginState ? "freshcartCustomerLoginSecret" : "freshcartCustomerSignupSecret"}
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                    minLength={8}
                                    pattern={isLoginState ? undefined : "(?=.*[A-Za-z])(?=.*\\d).{8,}"}
                                    title={isLoginState ? undefined : "Use at least 8 characters with a letter and number"}
                                    autoComplete={isLoginState ? "current-password" : "new-password"}
                                    placeholder="........" 
                                    className="w-full pl-11 py-3 text-sm bg-white rounded-xl border border-gray-300 focus:border-app-green outline-none transition-all" 
                                />
                            </div>
                            {!isLoginState && <span className="mt-1 block text-xs font-normal text-app-text-light">At least 8 characters with a letter and number</span>}
                        </label>
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="flex items-center justify-center w-full py-3 bg-green-950 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 h-11"
                        >
                            {loading ? <Loader2Icon className="animate-spin size-5" /> : isLoginState ? "Sign In" : "Sign Up"}
                        </button>
                    </form>
                    <div className="flex items-center gap-3 my-5"><span className="h-px bg-app-border flex-1"/><span className="text-xs text-app-text-light">OR</span><span className="h-px bg-app-border flex-1"/></div>
                    <GoogleSignIn />
                </div>
            </div>
        </div>
    )
}

export default Login
