import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { LogOutIcon, TruckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { clearDeliverySession, getSavedDeliveryPartner } from "../../utils/deliverySession";
import type { DeliveryPartner } from "../../types";
import api from "../../config/api";
import Loading from "../../components/Loading";
import { setStoredValue } from "../../utils/storage";

export default function DeliveryLayout() {
    const navigate = useNavigate();
    const [partner, setPartner] = useState(getSavedDeliveryPartner);
    const [checkingAuth, setCheckingAuth] = useState(Boolean(partner));

    useEffect(() => {
        if (!getSavedDeliveryPartner()) return

        let active = true
        api.get<{partner: DeliveryPartner}>("/delivery/me")
            .then(({data}) => {
                if (!active) return
                setStoredValue("delivery_partner", JSON.stringify(data.partner))
                setPartner(data.partner)
            })
            .catch(() => {
                if (!active) return
                clearDeliverySession()
                setPartner(null)
            })
            .finally(() => {
                if (active) setCheckingAuth(false)
            })

        return () => {
            active = false
        }
    }, [])

    const handleLogout = () => {
        clearDeliverySession()
        setPartner(null)
        navigate("/delivery/login");
    };

    if (checkingAuth) return <Loading />;
    if (!partner) return <Navigate to="/delivery/login" replace />;

    return (
        <div className="min-h-screen bg-app-cream">
            {/* Top Bar */}
            <header className="bg-white border-b border-app-border sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TruckIcon className="size-6 text-app-green" />
                        <span className="text-lg font-semibold text-app-green">FreshCart Delivery</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-600">{partner.name}</span>
                        <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <LogOutIcon className="size-4" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
