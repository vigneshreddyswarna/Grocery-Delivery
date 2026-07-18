import { LocateFixedIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { reverseGeocodeIndianPoint } from "../utils/indiaGeocoding"
import { getPreciseCurrentPosition } from "../utils/preciseGeolocation"

export interface AddressFormState {
    label:string
    address:string
    addressLine2:string
    city:string
    district:string
    state:string
    zip:string
    isDefault:boolean
    lat:string
    lng:string
    mapLocationSource:string
    mapLocationAccuracy:string
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
    const firstInputRef=useRef<HTMLInputElement>(null)
    const update=(values:Partial<AddressFormState>)=>setForm(current=>({...current,...values}))
    useEffect(()=>{firstInputRef.current?.focus()},[])
    const useCurrentLocation=async()=>{
        setLocating(true)
        try{
            const position=await getPreciseCurrentPosition()
            const resolved=await reverseGeocodeIndianPoint(position.coords.latitude,position.coords.longitude)
            update({...resolved,lat:String(resolved.lat),lng:String(resolved.lng),mapLocationSource:"current",mapLocationAccuracy:String(Math.round(position.coords.accuracy))})
            const missing=[!resolved.address&&"house/street",!resolved.city&&"village/city",!resolved.zip&&"PIN code"].filter(Boolean)
            toast.success(missing.length ? `Location detected. Please enter the missing ${missing.join(", ")}.` : `Location detected (±${Math.round(position.coords.accuracy)} m)`)
        }catch(error){
            const denied=typeof error==="object"&&error!==null&&"code" in error&&(error as GeolocationPositionError).code===1
            toast.error(denied ? "Allow precise location access in your browser settings" : error instanceof Error ? error.message : "Unable to autofill the address")
        }finally{setLocating(false)}
    }

    const hasDetectedLocation=Number.isFinite(Number(form.lat))&&Number.isFinite(Number(form.lng))&&Number(form.lat)!==0&&Number(form.lng)!==0&&form.mapLocationSource==="current"

    return <>
        <div className="fixed inset-0 bg-black/40 z-50" />
        <div onClick={resetForm} className="fixed inset-0 z-50 flex-center p-4">
            <form role="dialog" aria-modal="true" aria-labelledby="address-form-title" onKeyDown={event=>{if(event.key==="Escape") resetForm()}} onClick={event=>event.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in">
                <div className="flex items-center justify-between mb-5"><h2 id="address-form-title" className="text-lg font-semibold text-app-green">{editingId ? "Edit Address" : "Add New Address"}</h2><button type="button" onClick={resetForm} className="hover:bg-app-cream p-2 rounded-lg" aria-label="Close address form"><XIcon className="size-5" /></button></div>
                <div className="space-y-4">
                    <button type="button" disabled={locating} onClick={useCurrentLocation} className="w-full rounded-xl bg-app-orange px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2">{locating?<LoaderCircleIcon className="size-4 animate-spin"/>:<LocateFixedIcon className="size-4"/>}{locating?"Detecting your location...":"Use current location"}</button>
                    <p className="text-center text-xs text-app-text-light">or enter your delivery address below</p>
                    <label className="block text-sm font-medium text-app-green">Save as<input ref={firstInputRef} type="text" required value={form.label} onChange={event=>update({label:event.target.value})} placeholder="Home or Work" className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                    <label className="block text-sm font-medium text-app-green">House / Building / Street<input type="text" required value={form.address} onChange={event=>update({address:event.target.value,mapLocationSource:"address",lat:"",lng:""})} placeholder="House number, building and road" className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                    <label className="block text-sm font-medium text-app-green">Landmark <span className="font-normal text-app-text-light">(optional)</span><input type="text" value={form.addressLine2} onChange={event=>update({addressLine2:event.target.value,mapLocationSource:"address",lat:"",lng:""})} placeholder="Nearby landmark or area" className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-app-green">Village / Town / City<input type="text" required value={form.city} onChange={event=>update({city:event.target.value,mapLocationSource:"address",lat:"",lng:""})} placeholder="e.g. Indukurpet" className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                        <label className="block text-sm font-medium text-app-green">PIN Code<input type="text" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={form.zip} onChange={event=>update({zip:event.target.value.replace(/\D/g,"").slice(0,6),mapLocationSource:"address",lat:"",lng:""})} placeholder="6-digit PIN" className="mt-1.5 w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" /></label>
                    </div>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.isDefault} onChange={event=>update({isDefault:event.target.checked})}/><span className="text-sm">Set as default address</span></label>
                    <div className="rounded-xl bg-app-cream/70 px-3 py-2 text-xs text-app-text-light" aria-live="polite">{hasDetectedLocation?<span className="font-semibold text-green-700">Location detected within ±{form.mapLocationAccuracy} m. Check any address fields that could not be filled automatically.</span>:"We will automatically locate the pin using your village/city and PIN code when you save."}</div>
                </div>
                <button type="submit" disabled={locating} className="mt-6 w-full py-3 bg-app-green text-white font-semibold rounded-xl disabled:opacity-50">{editingId ? "Update Address" : "Save Address"}</button>
            </form>
        </div>
    </>
}
