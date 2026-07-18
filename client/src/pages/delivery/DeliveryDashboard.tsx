import { useCallback, useEffect, useRef, useState } from "react";
import { PackageIcon, NavigationIcon } from "lucide-react";
import OtpModal from "../../components/Delivery/OtpModal";
import CancelModal from "../../components/Delivery/CancelModal";
import DeliveryOrderCard from "../../components/Delivery/DeliveryOrderCard";
import Loading from "../../components/Loading";
import type { Order } from "../../types";
import axios from "axios";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";
import { getStoredValue } from "../../utils/storage";

const API_URL=API_BASE_URL

const getAuthHeaders=()=>({
    headers:{Authorization:`Bearer ${getStoredValue("delivery_token") || ""}`}
})

const activeDeliveryStatuses = ["Assigned","Packed","Out for Delivery"]

const getErrorMessage = (error: unknown, fallback: string) => {
    const axiosError = error as AxiosError<{message?: string}>
    return axiosError.response?.data?.message || axiosError.message || fallback
}

export default function DeliveryDashboard() {

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"active" | "completed">("active");
    const [tracking, setTracking] = useState(false);

    // OTP modal
    const [otpModal, setOtpModal] = useState<string | null>(null);
    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Cancel modal
    const [cancelModal, setCancelModal] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const watchIdRef=useRef<number | null>(null)
    const locationShareStartedRef=useRef(false)

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const {data}=await axios.get(`${API_URL}/delivery/my-deliveries?status=${tab}`,getAuthHeaders())
            setOrders(data.orders)
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to load deliveries"))
            
        }finally{
            setLoading(false)
        }
    }, [tab]);

    // send location every 10s for active deliveries
    useEffect(()=>{
        const activeOrders=orders.filter((o)=>activeDeliveryStatuses.includes(o.status))

        if(activeOrders.length===0 || !tracking){
            if(watchIdRef.current!==null){
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current=null
            }
            locationShareStartedRef.current=false
            if(tracking && !loading){
                toast.error("No active assigned delivery found to share location")
            }
            return
        }

        if(!navigator.geolocation){
            toast.error("Location sharing is not supported by this browser")
            queueMicrotask(() => setTracking(false))
            return
        }

        const sendLocation=async(pos:GeolocationPosition)=>{
            const {latitude:lat,longitude:lng}=pos.coords
            try {
                await Promise.all(activeOrders.map((order)=>
                    axios.put(`${API_URL}/delivery/my-deliveries/${order.id}/location`,{lat,lng},getAuthHeaders())
                ))
                if(!locationShareStartedRef.current){
                    toast.success("Location shared successfully")
                    locationShareStartedRef.current=true
                }
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to share location"))
            }
        }

        const handleLocationError=(error:GeolocationPositionError)=>{
            const message = error.code === error.PERMISSION_DENIED
                ? "Please allow location permission to share your delivery location"
                : error.message || "Unable to get your current location"
            toast.error(message)
            setTracking(false)
        }
        watchIdRef.current=navigator.geolocation.watchPosition(sendLocation, handleLocationError,{
            enableHighAccuracy: true,
            maximumAge:10000
        })

        navigator.geolocation.getCurrentPosition(sendLocation,handleLocationError, {enableHighAccuracy:true})

        //Also send on interval for more consistent updates
        const interval=setInterval(()=>{
            navigator.geolocation.getCurrentPosition(sendLocation,handleLocationError, {enableHighAccuracy:true})
        },10000)
        return()=>{
            if(watchIdRef.current !=null){
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current=null
            }
            clearInterval(interval)
        }

    },[loading, orders, tracking])

    useEffect(() => {
        queueMicrotask(fetchOrders);
    }, [fetchOrders]);

    const stopSharingForActiveOrders = async () => {
        const activeOrders = orders.filter((order) => activeDeliveryStatuses.includes(order.status))

        await Promise.all(activeOrders.map((order)=>
            axios.put(`${API_URL}/delivery/my-deliveries/${order.id}/location`,{isSharing:false},getAuthHeaders())
        ))
    }

    const handleToggleTracking = async () => {
        if (tracking) {
            try {
                await stopSharingForActiveOrders()
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to stop location sharing"))
            }
            setTracking(false)
            toast("Location sharing stopped")
            return
        }

        toast("Starting location sharing...")
        setTracking(true)
    }

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            await axios.put(`${API_URL}/delivery/my-deliveries/${orderId}/status`,{status},getAuthHeaders())
            toast.success(`Status updated to ${status}`)
            fetchOrders()
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed"))
            
        }
    };

    const handleComplete = async () => {
        if (!otpModal || !otp) return;
        setSubmitting(true);
        try {
             await axios.put(`${API_URL}/delivery/my-deliveries/${otpModal}/complete`,{otp},getAuthHeaders())
             toast.success("Delivery completed")
             setOtpModal(null)
             setOtp("")
             fetchOrders()
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed"))
        }finally{
            setSubmitting(false)
        }
    };

    const handleCancel = async () => {
        if (!cancelModal) return;
        setSubmitting(true);
        try {
             await axios.put(`${API_URL}/delivery/my-deliveries/${cancelModal}/cancel`,{reason:cancelReason},getAuthHeaders())
             toast.success("Delivery cancelled")
             setCancelModal(null)
             setCancelReason("")
             fetchOrders()
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed"))
        }finally{
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="sr-only">Delivery Dashboard</h1>
            {/* Tabs + Tracking toggle */}
            <div className="flex items-center gap-2 flex-wrap">
                {(["active", "completed"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab === t ? "bg-app-green text-white" : "bg-white text-zinc-600 hover:bg-app-cream border border-app-border"}`}>
                        {t === "active" ? "Active" : "Completed"}
                    </button>
                ))}
                <div className="ml-auto">
                    <button onClick={handleToggleTracking} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 ${tracking ? "bg-green-600 text-white" : "bg-white text-zinc-600 border border-app-border hover:bg-app-cream"}`}>
                        <NavigationIcon className={`w-3.5 h-3.5 ${tracking ? "animate-pulse" : ""}`} />
                        {tracking ? "Sharing Location" : "Share Location"}
                    </button>
                </div>
            </div>

            {/* Orders */}
            {loading ? (
                <Loading />
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-app-border">
                    <PackageIcon className="size-12 text-app-border mx-auto mb-3" />
                    <p className="text-lg font-semibold text-zinc-900 mb-1">No {tab} deliveries</p>
                    <p className="text-sm text-zinc-500">{tab === "active" ? "You'll see new assignments here" : "Completed deliveries will appear here"}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => <DeliveryOrderCard key={order.id} order={order} tab={tab} handleUpdateStatus={handleUpdateStatus} setOtpModal={setOtpModal} setCancelModal={setCancelModal} />)}
                </div>
            )}

            {/* OTP Modal */}
            {otpModal && <OtpModal setOtpModal={setOtpModal} otp={otp} setOtp={setOtp} handleComplete={handleComplete} submitting={submitting} />}
            {/* Cancel Modal */}
            {cancelModal && <CancelModal setCancelModal={setCancelModal} cancelReason={cancelReason} setCancelReason={setCancelReason} handleCancel={handleCancel} submitting={submitting} />}
        </div>
    );
}
