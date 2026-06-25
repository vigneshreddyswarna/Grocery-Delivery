import toast from 'react-hot-toast'
import api from '../config/api'
import { ADDRESS_API } from '../config/routes'
import { useAuth } from '../context/AuthContext'
import type { Address } from '../types'
import { CheckIcon, MapPinIcon, PencilIcon, Trash2Icon } from 'lucide-react'

interface AddressCardProps {
    addr: Address
    onEditHandler: (addr: Address) => void
    setAddresses: React.Dispatch<React.SetStateAction<Address[]>> | ((addresses: Address[]) => void)
}

// Fixed: Destructured setAddresses from incoming component props layout sequence
const AddressCard = ({ addr, onEditHandler, setAddresses }: AddressCardProps) => {

    const { updateUser } = useAuth()
    
    // Safely capture the correct unique identifier key string from database document
    const activeAddressId = addr.id || (addr as any)._id;

    const handleDelete = async (id: string) => {
        try {
            const confirm = window.confirm("Are you sure you want to delete this address?")
            if (!confirm) return
            
            const { data } = await api.delete(`${ADDRESS_API}/${id}`)
            
            // Clean dynamic check supporting standard response object or direct array configurations
            const updatedAddresses = data.addresses || data;
            
            setAddresses(updatedAddresses)
            if (updateUser) updateUser({ addresses: updatedAddresses })
            toast.success('Address removed')
        } catch (error: any) {
            toast.error(error.response?.data?.message || error?.message || "Failed to remove address")
        }
    }

    return (
        <div className='w-full max-w-3xl bg-white rounded-2xl p-6 flex items-start justify-between gap-4 border border-black/5 shadow-xs'>
            {/* Left Column - Meta Content */}
            <div className='flex gap-4'>
                <div className='size-10 rounded-xl bg-app-cream flex items-center justify-center shrink-0'>
                    <MapPinIcon className='size-5 text-app-green'/>
                </div>
                <div>
                    <div className='flex items-center gap-2 mb-1'>
                        <p className='text-sm font-semibold text-app-green'>{addr.label}</p>
                        {addr.isDefault && (
                            <span className='inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium bg-app-green text-white rounded-full'>
                                <CheckIcon className='size-2.5'/>
                                Default
                            </span>
                        )}
                    </div>
                    <p className='text-sm text-app-text-light leading-relaxed'>
                        {addr.address}, {addr.city}, <br /> {addr.state}, {addr.zip}
                    </p>
                </div>
            </div>

            {/* Right Column - Action Buttons */}
            <div className='flex items-center gap-1 shrink-0'>
                <button 
                    onClick={() => onEditHandler(addr)} 
                    className='p-2 text-app-text-light hover:text-app-green hover:bg-app-cream rounded-lg transition-colors'
                    title="Edit Address"
                >
                    <PencilIcon className='size-4'/>
                </button>
                <button 
                    onClick={() => handleDelete(activeAddressId)} 
                    className='p-2 text-app-text-light hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    title="Delete Address"
                >
                    <Trash2Icon className='size-4'/>
                </button>
            </div>
        </div>
    )
}

export default AddressCard
