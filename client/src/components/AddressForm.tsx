import { XIcon } from "lucide-react"


const AddressForm = ({ resetForm, handleSubmit, form, setForm, editingId }: any) => {
    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 z-50" />

            {/* Form Container */}
            <div onClick={resetForm} className="fixed inset-0 z-50 flex-center p-4">
                <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in">

                    {/* Form Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-app-green">{editingId ? "Edit Address" : "Add New Address"}</h2>
                        <button type="button" onClick={resetForm} className="hover:bg-app-cream p-2 rounded-lg">
                            <XIcon className="size-5" />
                        </button>
                    </div>

                    {/* Form Input Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-app-green mb-1.5">Label</label>
                            <input type="text" placeholder="Home, Work, etc." required className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-green mb-1.5">Street Address</label>
                            <input type="text" required className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div >
                                <label className="block text-sm font-medium text-app-green mb-1.5">City</label>
                                <input type="text" required className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-app-green mb-1.5">State</label>
                                <input type="text" required className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-app-green mb-1.5">ZIP Code</label>
                                <input type="text" required className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />

                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.isDefault} onChange={(e)=>setForm({...form, isDefault:e.target.checked})}/>
                                    <span className="text-sm text-app-text">Set as Default</span>
                                </label>
                                

                            </div>


                        </div>
                    </div>

                    {/* submit button */}
                    <button type="submit" className="mt-6 w-full py-3 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors">
                        {editingId?"Update Address":"Save Address"}

                    </button>
                </form>

            </div>


        </>
    )
}

export default AddressForm

// import { XIcon } from "lucide-react"

// // Replacing 'any' with explicit, clean TypeScript interfaces
// interface AddressFormProps {
//     resetForm: () => void
//     handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
//     form: {
//         label?: string
//         address?: string
//         city?: string
//         state?: string
//         zip?: string
//         isDefault?: boolean
//     } | null
//     setForm: React.Dispatch<React.SetStateAction<any>>
//     editingId: string | null
// }

// const AddressForm = ({ resetForm, handleSubmit, form, setForm, editingId }: AddressFormProps) => {
//     return (
//         <>
//             {/* Black Translucent Backdrop Overlay */}
//             <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

//                 {/* Modal Dismissal Click Layer */}
//                 <div onClick={resetForm} className="fixed inset-0 z-10" />

//                 <form
//                     onSubmit={handleSubmit}
//                     onClick={(e) => e.stopPropagation()}
//                     className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl z-20 animate-fade-in"
//                 >
//                     {/* Form Header */}
//                     <div className="flex items-center justify-between mb-5">
//                         <h2 className="text-lg font-semibold text-app-green">
//                             {editingId ? "Edit Address" : "Add New Address"}
//                         </h2>
//                         <button
//                             type="button"
//                             onClick={resetForm}
//                             className="hover:bg-app-cream p-2 rounded-lg transition-colors"
//                         >
//                             <XIcon className="size-5" />
//                         </button>
//                     </div>

//                     {/* Form Input Fields */}
//                     <div className="space-y-4 mb-6">
//                         <div>
//                             <label className="block text-sm font-medium text-app-green mb-1.5">Label</label>
//                             <input
//                                 type="text"
//                                 placeholder="Home, Work, etc."
//                                 required
//                                 className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none text-gray-700 transition-colors"
//                                 value={form?.label || ""}
//                                 onChange={(e) => setForm((prev: any) => ({ ...(prev || {}), label: e.target.value }))}
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-app-green mb-1.5">Street Address</label>
//                             <input
//                                 type="text"
//                                 required
//                                 className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none text-gray-700 transition-colors"
//                                 value={form?.address || ""}
//                                 onChange={(e) => setForm((prev: any) => ({ ...(prev || {}), address: e.target.value }))}
//                             />
//                         </div>

//                         <div className="grid grid-cols-2 gap-3">
//                             <div>
//                                 <label className="block text-sm font-medium text-app-green mb-1.5">City</label>
//                                 <input
//                                     type="text"
//                                     required
//                                     className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none text-gray-700 transition-colors"
//                                     value={form?.city || ""}
//                                     onChange={(e) => setForm((prev: any) => ({ ...(prev || {}), city: e.target.value }))}
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-app-green mb-1.5">State</label>
//                                 <input
//                                     type="text"
//                                     required
//                                     className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none text-gray-700 transition-colors"
//                                     value={form?.state || ""}
//                                     onChange={(e) => setForm((prev: any) => ({ ...(prev || {}), state: e.target.value }))}
//                                 />
//                             </div>
//                         </div>

//                         <div className="grid grid-cols-2 gap-3">
//                             <div>
//                                 <label className="block text-sm font-medium text-app-green mb-1.5">ZIP Code</label>
//                                 <input
//                                     type="text"
//                                     required
//                                     className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none text-gray-700 transition-colors"
//                                     value={form?.zip || ""}
//                                     onChange={(e) => setForm((prev: any) => ({ ...(prev || {}), zip: e.target.value }))}
//                                 />
//                             </div>

//                             <div className="flex items-end pb-1">
//                                 <label className="flex items-center gap-2 cursor-pointer">
//                                     <input type="checkbox" checked={form?.isDefault} onChange={(e)=>setForm({...form, isDefault:e.target.checked})} />
//                                     <span className="text-sm text-app-text">Set as Default</span>
//                                 </label>

//                             </div>
//                         </div>
//                     </div>

//                     {/* Submit Action Button */}
//                     <button
//                         type="submit"
//                         className="w-full py-3 bg-app-green text-white font-semibold rounded-xl hover:bg-opacity-95 transition-all active:scale-[0.99] shadow-sm text-sm"
//                     >
//                         {editingId ? "Update Address" : "Save Address"}
//                     </button>
//                 </form>
//             </div>
//         </>
//     )
// }

// export default AddressForm