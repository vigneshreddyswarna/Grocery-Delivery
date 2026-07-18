import { Outlet } from "react-router-dom"
import Banner from "../components/Banner"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import CartSidebar from "../components/CartSidebar"


const AppLayout = () => {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-app-green focus:shadow-lg">Skip to main content</a>
      <Banner />
      <Navbar/>
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <Outlet/>
      </main>
      <Footer/>
      <CartSidebar/>
    </>
  )
}

export default AppLayout
