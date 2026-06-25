import {Toaster} from 'react-hot-toast'
import {Route,Routes} from 'react-router-dom'
import {lazy,Suspense} from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import Loading from './components/Loading'

const Login=lazy(()=>import('./pages/Login'))
const AppLayout=lazy(()=>import('./pages/AppLayout'))
const Home=lazy(()=>import('./pages/Home'))
const Products=lazy(()=>import('./pages/Products'))
const ProductPage=lazy(()=>import('./pages/ProductPage'))
const SearchResults=lazy(()=>import('./pages/SearchResults'))
const FlashDeals=lazy(()=>import('./pages/FlashDeals'))
const Checkout=lazy(()=>import('./pages/Checkout'))
const MyOrders=lazy(()=>import('./pages/MyOrders'))
const OrderTracking=lazy(()=>import('./pages/OrderTracking'))
const Addresses=lazy(()=>import('./pages/Addresses'))
const AdminLayout=lazy(()=>import('./pages/admin/AdminLayout'))
const AdminDashboard=lazy(()=>import('./pages/admin/AdminDashboard'))
const AdminProducts=lazy(()=>import('./pages/admin/AdminProducts'))
const AdminProductForm=lazy(()=>import('./pages/admin/AdminProductForm'))
const AdminOrders=lazy(()=>import('./pages/admin/AdminOrders'))
const AdminDeliveryPartners=lazy(()=>import('./pages/admin/AdminDeliveryPartners'))
const DeliveryLogin=lazy(()=>import('./pages/delivery/DeliveryLogin'))
const DeliveryLayout=lazy(()=>import('./pages/delivery/DeliveryLayout'))
const DeliveryDashboard=lazy(()=>import('./pages/delivery/DeliveryDashboard'))
const VerifyEmail=lazy(()=>import('./pages/VerifyEmail'))
const ForgotPassword=lazy(()=>import('./pages/ForgotPassword'))
const ResetPassword=lazy(()=>import('./pages/ResetPassword'))
const NotFound=lazy(()=>import('./pages/NotFound'))


const App=()=>{
  return(
    <>
    <Toaster position="top-right" toastOptions={{duration:3000,style:{background:"#1B3022",color: "#fff",borderRadius:"12px",fontSize:"14px"}}}/>

    <Suspense fallback={<Loading/>}><Routes>
      {/* Auth Pages - No Navbar/Footer */}
      <Route path='/login' element={<Login/>}/>
      <Route path='/verify-email' element={<VerifyEmail/>}/>
      <Route path='/forgot-password' element={<ForgotPassword/>}/>
      <Route path='/reset-password' element={<ResetPassword/>}/>

      {/* Main pages - With navbar/Footer */}

      <Route path='/' element={<AppLayout/>}>
          <Route index element={<Home/>}/>
          <Route path="products" element={<Products/>}/>
          <Route path="products/:id" element={<ProductPage/>}/>
          <Route path="search" element={<SearchResults/>}/>
          <Route path="deals" element={<FlashDeals/>}/>
          <Route element={<ProtectedRoute/>}>
            <Route path="checkout" element={<Checkout/>}/>
            <Route path="orders" element={<MyOrders/>}/>
            <Route path="orders/:id" element={<OrderTracking/>}/>
            <Route path="addresses" element={<Addresses/>}/>
          </Route>
      </Route>
      {/* Admin pages */}
      <Route path='/admin' element={<AdminLayout/>}>
         <Route index element={<AdminDashboard/>}/>
         <Route path='products' element={<AdminProducts/>}/>
         <Route path='products/new' element={<AdminProductForm/>}/>
         <Route path='products/:id/edit' element={<AdminProductForm/>}/>
         <Route path='orders' element={<AdminOrders/>}/>
         <Route path='delivery-partners' element={<AdminDeliveryPartners/>}/>
      
      </Route>

      {/* Delivery Partner Pages */}
      <Route path='/delivery/login' element={<DeliveryLogin/>}/>
      <Route path='/delivery/verify-email' element={<VerifyEmail/>}/>
      <Route path='/delivery/forgot-password' element={<ForgotPassword/>}/>
      <Route path='/delivery/reset-password' element={<ResetPassword/>}/>
      <Route path='/delivery' element={<DeliveryLayout/>}>
        <Route index element={<DeliveryDashboard/>}/>
      </Route>

      <Route path='*' element={<NotFound/>}/>
        

    </Routes></Suspense>
    </>
  )
}

export default App
