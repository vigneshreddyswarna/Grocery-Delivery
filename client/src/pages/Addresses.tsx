import { MapPinIcon, PlusIcon } from "lucide-react"
import type { Address } from "../types"
import React, { useEffect, useState } from "react"
import Loading from "../components/Loading"
import AddressCard from "../components/AddressCard"
import AddressForm from "../components/AddressForm"
import { useAuth } from "../context/AuthContext"
import api from "../config/api"
import toast from "react-hot-toast"
import { ADDRESS_API } from "../config/routes"
import { geocodeIndianAddress, isIndianPincode, isPointInIndia, reverseGeocodeIndianPoint } from "../utils/indiaGeocoding"

const Addresses = () => {
  const { updateUser } = useAuth()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    label: "",
    address: "",
    addressLine2: "",
    city: "",
    district: "",
    state: "",
    zip: "",
    isDefault: false,
    lat: "",
    lng: "",
    mapLocationSource: "address",
    mapLocationAccuracy: ""
  })

  const resetForm = () => {
    setForm({
      label: "",
      address: "",
      addressLine2: "",
      city: "",
      district: "",
      state: "",
      zip: "",
      isDefault: false,
      lat: "",
      lng: "",
      mapLocationSource: "address",
      mapLocationAccuracy: ""
    })
    setShowForm(false)
    setEditingId(null)
  }

  const normalizeAddresses = (items: Array<Address & { _id?: string }>): Address[] =>
    items
      .map((item) => ({
        ...item,
        id: item.id || item._id || "",
      }))
      .filter((item) => item.id)

  // Fixed: Corrected React event type signature to handle HTML form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (!isIndianPincode(form.zip)) throw new Error("Enter a valid 6-digit Indian PIN code")
      let coords = { lat: Number(form.lat), lng: Number(form.lng) }
      let resolvedState=form.state
      let resolvedDistrict=form.district
      if (form.mapLocationSource !== "current") {
        coords=await geocodeIndianAddress(form)
        const resolved=await reverseGeocodeIndianPoint(coords.lat,coords.lng)
        if (resolved.zip!==form.zip) throw new Error("That village/city does not match the entered PIN code. Check both and try again")
        resolvedState=resolved.state
        resolvedDistrict=resolved.district || ""
      }
      if (!isPointInIndia(coords.lat, coords.lng)) throw new Error("The selected map point must be within India")
      const payload = {
        label: form.label,
        address: [form.address,form.addressLine2,resolvedDistrict].filter(Boolean).join(", "),
        city: form.city,
        state: resolvedState,
        zip: form.zip,
        isDefault: form.isDefault,
        ...coords
      }
      
      if (editingId) {
        const { data } = await api.put(`${ADDRESS_API}/${editingId}`, payload)
        const updatedAddresses = normalizeAddresses(data.addresses || data)
        setAddresses(updatedAddresses)
        if (updateUser) updateUser({ addresses: updatedAddresses })
        toast.success("Address updated!")
      } else {
        const { data } = await api.post(ADDRESS_API, payload)
        const updatedAddresses = normalizeAddresses(data.addresses || data)
        setAddresses(updatedAddresses)
        if (updateUser) updateUser({ addresses: updatedAddresses })
        toast.success("Address added!")
      }
      resetForm()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save address"
      toast.error(message)
    }
  }

  const onEditHandler = (add: Address) => {
    setForm({
      label: add.label,
      address: add.address,
      addressLine2: "",
      city: add.city,
      district: "",
      state: add.state,
      zip: add.zip,
      isDefault: add.isDefault,
      lat: String(add.lat ?? ""),
      lng: String(add.lng ?? ""),
      mapLocationSource: "address",
      mapLocationAccuracy: ""
    })
    // Fixed: Accounted for fallback Mongo identity schema structures safely
    setEditingId(add.id)
    setShowForm(true)
  }

  useEffect(() => {
    // Fixed: Correctly destructured res.data context from Axios HTTP payload stream
    api.get(ADDRESS_API)
      .then(({ data }) => {
        setAddresses(normalizeAddresses(data.addresses || data || []))
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed loading addresses"
        toast.error(message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-app-green">My Addresses</h1>
          <button 
            onClick={() => { resetForm(); setShowForm(true) }} 
            className="px-4 py-2 bg-app-green text-white text-sm font-semibold rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <PlusIcon className="size-4" /> Add Address
          </button>
        </div>

        {/* Form Modal Component Mount */}
        {showForm && (
          <AddressForm 
            resetForm={resetForm} 
            handleSubmit={handleSubmit} 
            form={form} 
            setForm={setForm} 
            editingId={editingId} 
          />
        )}

        {/* Addresses Dynamic Grid List Workspace Rendering */}
        {loading ? (
          <Loading />
        ) : addresses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-black/5 rounded-2xl max-w-xl mx-auto p-8 shadow-xs mt-10">
            <MapPinIcon className="size-16 text-app-border mx-auto mb-4 stroke-[1.5]" />
            <h2 className="text-lg font-semibold text-app-green mb-2">No addresses saved</h2>
            <p className="text-sm text-app-text-light">Add a target delivery destination layout address for faster checkout processing metrics</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((addr) => {
              const activeId = addr.id;
              return (
                <AddressCard 
                  key={activeId} 
                  addr={addr} 
                  onEditHandler={onEditHandler}
                  setAddresses={setAddresses} // Handed down matching context properties mapped in our prior sub-components
                />
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default Addresses
