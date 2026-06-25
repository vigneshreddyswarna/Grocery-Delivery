import { HomeIcon, SearchIcon } from "lucide-react"
import { Link } from "react-router-dom"

export default function NotFound(){
    return <main className="min-h-dvh bg-app-cream flex-center px-4">
        <section className="text-center max-w-md">
            <p className="text-7xl font-bold text-app-green/15">404</p>
            <h1 className="text-2xl font-semibold text-app-green mt-2">This aisle doesn’t exist</h1>
            <p className="text-sm text-app-text-light mt-3">The page may have moved, or the link may be incorrect.</p>
            <div className="flex justify-center gap-3 mt-7">
                <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-green text-white"><HomeIcon className="size-4"/>Home</Link>
                <Link to="/products" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app-green text-app-green"><SearchIcon className="size-4"/>Browse products</Link>
            </div>
        </section>
    </main>
}
