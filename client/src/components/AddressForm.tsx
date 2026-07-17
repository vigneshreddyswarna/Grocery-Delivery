import { LocateFixedIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { reverseGeocodeIndianPoint } from "../utils/indiaGeocoding"

export interface AddressFormState {
    label:string
    address:string
    city:string
    state:string
    zip:string
    isDefault:boolean
    lat:string
    lng:string
    mapLocationSource:string
}

interface AddressFormProps {
    resetForm:()=>void
    handleSubmit:(event:React.FormEvent<HTMLFormElement>)=>void
    form:AddressFormState
    setForm:React.Dispatch<React.SetStateAction<AddressFormState>>
    editingId:string | null
}

export default function AddressForm({resetForm,handleSubmit,form,setForm,editingId}:AddressFormProps){
    const [locating,setLocating]=useState(false)
    const update=(values:Partial<AddressFormState>)=>setForm(current=>({...current,...values}))
    const useCurrentLocation=()=>{
        if(!navigator.geolocation){toast.error("Location is not supported by this browser");return}
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            async position=>{
                try{
                    const resolved=await reverseGeocodeIndianPoint(position.coords.latitude,position.coords.longitude)
                    update({...resolved,lat:String(resolved.lat),lng:String(resolved.lng),mapLocationSource:"current"})
                    toast.success(`Exact location detected (±${Math.round(position.coords.accuracy)} m)`)
                }catch(error){
                    update({lat:String(position.coords.latitude),lng:String(position.coords.longitude),mapLocationSource:"current"})
                    toast.error(error instanceof Error ? error.message : "Unable to autofill the address")
                }finally{setLocating(false)}
            },
            error=>{setLocating(false);toast.error(error.code===error.PERMISSION_DENIED ? "Allow precise location access in your browser settings" : error.message || "Unable to get your location")},
            {enableHighAccuracy:true,maximumAge:0,timeout:15000},
        )
    }

    return <>
        <div className="fixed inset-0 bg-black/40 z-50" />
        <div onClick={resetForm} className="fixed inset-0 z-50 flex-center p-4">
            <form onClick={event=>event.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold text-app-green">{editingId ? "Edit Address" : "Add New Address"}</h2><button type="button" onClick={resetForm} className="hover:bg-app-cream p-2 rounded-lg" aria-label="Close address form"><XIcon className="size-5" /></button></div>
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-app-green">Label<input type="text" required value={form.label} onChange={event=>update({label:event.target.value})} placeholder="Home, Work, etc." className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                    <label className="block text-sm font-medium text-app-green">Street Address<input type="text" required value={form.address} onChange={event=>update({address:event.target.value,mapLocationSource:"address"})} className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-app-green">City<input type="text" required value={form.city} onChange={event=>update({city:event.target.value,mapLocationSource:"address"})} className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border" /></label>
                        <label className="block text-sm font-medium text-app-green">State<input type="text" required value={form.state} onChange={event=>update({state:event.target.value,mapLocationSource:"address"})} className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border" /></label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-app-green">PIN Code<input type="text" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={form.zip} onChange={event=>update({zip:event.target.value.replace(/\D/g,"").slice(0,6),mapLocationSource:"address"})} className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border" /></label>
                        <label className="flex items-center gap-2 pt-7"><input type="checkbox" checked={form.isDefault} onChange={event=>update({isDefault:event.target.checked})}/><span className="text-sm">Set as default</span></label>
                    </div>
                    <div><div className="flex items-center justify-between mb-1.5"><span className="text-sm font-medium text-app-green">Precise map location</span><button type="button" disabled={locating} onClick={useCurrentLocation} className="text-xs font-semibold text-app-orange disabled:opacity-60 flex items-center gap-1">{locating?<LoaderCircleIcon className="size-3.5 animate-spin"/>:<LocateFixedIcon className="size-3.5"/>}{locating?"Detecting...":"Use current location"}</button></div><div className="grid grid-cols-2 gap-3"><input aria-label="Latitude" type="number" step="any" value={form.lat} onChange={event=>update({lat:event.target.value,mapLocationSource:"manual"})} className="px-4 py-2.5 text-sm rounded-xl border border-app-border"/><input aria-label="Longitude" type="number" step="any" value={form.lng} onChange={event=>update({lng:event.target.value,mapLocationSource:"manual"})} className="px-4 py-2.5 text-sm rounded-xl border border-app-border"/></div><p className="mt-1 text-xs text-app-text-light">Current location uses high-accuracy GPS and fills your Indian address automatically.</p></div>
                </div>
                <button type="submit" className="mt-6 w-full py-3 bg-app-green text-white font-semibold rounded-xl">{editingId ? "Update Address" : "Save Address"}</button>
            </form>
        </div>
    </>
}
