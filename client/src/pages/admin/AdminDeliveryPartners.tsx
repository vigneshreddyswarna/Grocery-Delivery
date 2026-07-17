import { useEffect, useState } from "react";
import { CheckCircleIcon, EditIcon, MailIcon, PhoneIcon, PlusIcon, Trash2Icon, TruckIcon, XIcon } from "lucide-react";
import type { DeliveryPartner } from "../../types";
import Loading from "../../components/Loading";
import api from "../../config/api";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/errors";
import PasswordInput from "../../components/PasswordInput";
import AutofillSafeInput from "../../components/AutofillSafeInput";

type PartnerForm = {
    name: string;
    email: string;
    password: string;
    phone: string;
};

const emptyForm: PartnerForm = { name: "", email: "", password: "", phone: "" };
type PendingPartner = { id: string; email: string };

export default function AdminDeliveryPartners() {
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
    const [pendingPartner, setPendingPartner] = useState<PendingPartner | null>(null);
    const [otp, setOtp] = useState("");
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<PartnerForm>(emptyForm);

    const fetchPartners = async () => {
        try {
            const { data } = await api.get("/admin/delivery-partners");
            setPartners(Array.isArray(data.partners) ? data.partners : []);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load delivery partners"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const openCreateForm = () => {
        setEditingPartner(null);
        setPendingPartner(null);
        setOtp("");
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEditForm = (partner: DeliveryPartner) => {
        setEditingPartner(partner);
        setPendingPartner(null);
        setOtp("");
        setForm({
            name: partner.name,
            email: partner.email,
            password: "",
            phone: partner.phone,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingPartner(null);
        setPendingPartner(null);
        setOtp("");
        setForm(emptyForm);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingPartner) {
                const payload = { ...form, password: form.password.trim() || undefined };
                const { data } = await api.put(`/admin/delivery-partners/${editingPartner.id}`, payload);
                toast.success(data.message || "Partner updated");
                closeForm();
                fetchPartners();
            } else if (pendingPartner) {
                const { data } = await api.post("/admin/delivery-partners/confirm", {
                    pendingPartnerId: pendingPartner.id,
                    otp,
                });
                toast.success(data.message || "Partner verified and created");
                closeForm();
                fetchPartners();
            } else {
                const { data } = await api.post("/admin/delivery-partners", form);
                const pending = data.pendingPartner;
                if (!pending?.id) throw new Error("OTP was sent, but pending partner id was not returned");
                setPendingPartner({ id: pending.id, email: pending.email || form.email });
                setOtp("");
                toast.success(data.message || "Verification OTP sent");
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, editingPartner ? "Failed to update delivery partner" : pendingPartner ? "Failed to verify OTP" : "Failed to send OTP"));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (partner: DeliveryPartner) => {
        try {
            await api.put(`/admin/delivery-partners/${partner.id}`, { isActive: !partner.isActive });
            toast.success(partner.isActive ? "Partner deactivated" : "Partner activated");
            fetchPartners();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to update delivery partner"));
        }
    };

    const deletePartner = async (partner: DeliveryPartner) => {
        if (!window.confirm(`Delete ${partner.name}? Existing assigned orders will keep their order history but this partner account will be removed.`)) return;
        try {
            await api.delete(`/admin/delivery-partners/${partner.id}`);
            toast.success("Partner deleted");
            fetchPartners();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to delete delivery partner"));
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-zinc-900">Delivery Partners</h1>
                <button onClick={openCreateForm} className="px-4 py-2 bg-app-green text-white text-sm font-semibold rounded-xl hover:bg-app-green-light transition-colors flex items-center gap-2">
                    <PlusIcon className="size-4" /> Add Partner
                </button>
            </div>

            {partners.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-app-border">
                    <TruckIcon className="size-12 text-app-border mx-auto mb-3" />
                    <p className="text-lg font-semibold text-zinc-900 mb-1">No delivery partners</p>
                    <p className="text-sm text-zinc-500">Onboard your first partner to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {partners.map((p) => {
                        const verified = Boolean(p.emailVerifiedAt);
                        return (
                            <div key={p.id} className="bg-white rounded-2xl border border-app-border p-5 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 rounded-full bg-app-green flex-center shrink-0">
                                            <span className="text-white font-semibold text-sm">{p.name?.charAt(0) || "D"}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-zinc-900 text-sm truncate">{p.name}</p>
                                            <p className="text-xs text-zinc-500">Delivery partner</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button type="button" onClick={() => openEditForm(p)} className="p-2 text-zinc-500 hover:text-app-green hover:bg-app-cream rounded-lg" title="Edit partner">
                                            <EditIcon className="size-4" />
                                        </button>
                                        <button type="button" onClick={() => deletePartner(p)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete partner">
                                            <Trash2Icon className="size-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {p.isActive ? "Active" : "Inactive"}
                                    </span>
                                    <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${verified ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                        {verified ? "Email verified" : "OTP pending"}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-sm text-zinc-600">
                                    <p className="flex items-center gap-2 break-all"><MailIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> {p.email}</p>
                                    <p className="flex items-center gap-2"><PhoneIcon className="w-3.5 h-3.5 text-zinc-400" /> {p.phone}</p>
                                </div>
                                <button onClick={() => toggleActive(p)} className={`w-full py-2 text-xs font-medium rounded-lg transition-colors ${p.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                                    {p.isActive ? "Deactivate" : "Activate"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <>
                    <div className="fixed inset-0 bg-app-cream/80 backdrop-blur z-50" onClick={closeForm} />
                    <div className="fixed inset-0 z-50 flex-center p-4">
                        <form onSubmit={handleSubmit} autoComplete="off" className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-app-green">{editingPartner ? "Edit Delivery Partner" : "Onboard Delivery Partner"}</h2>
                                <button type="button" onClick={closeForm} className="p-2 hover:bg-app-cream rounded-lg"><XIcon className="size-5" /></button>
                            </div>
                            <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                <CheckCircleIcon className="size-4 mt-0.5 shrink-0" />
                                <span>{editingPartner ? "Changing email sends a fresh OTP and blocks login until verified." : pendingPartner ? `Enter the OTP sent to ${pendingPartner.email} to create this partner.` : "Submit these details to send an OTP. The partner account is created only after the admin enters that OTP here."}</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-app-green mb-1.5">Full Name</label>
                                    <input type="text" name="deliveryPartnerName" autoComplete="off" required disabled={Boolean(pendingPartner)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none disabled:bg-zinc-50 disabled:text-zinc-500" />
                                </div>
                                <div>
                                    <div>
                                        <label className="block text-sm font-medium text-app-green mb-1.5">Email</label>
                                        <AutofillSafeInput type="email" name="freshcartNewDeliveryEmail" required disabled={Boolean(pendingPartner)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none disabled:bg-zinc-50 disabled:text-zinc-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-app-green mb-1.5">{editingPartner ? "New Password" : "Password"}</label>
                                        <PasswordInput name="newDeliveryPartnerPassword" autoComplete="new-password" required={!editingPartner && !pendingPartner} disabled={Boolean(pendingPartner)} minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none disabled:bg-zinc-50 disabled:text-zinc-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-app-green mb-1.5">Phone</label>
                                        <input type="text" name="deliveryPartnerPhone" autoComplete="off" required disabled={Boolean(pendingPartner)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border focus:border-app-green outline-none disabled:bg-zinc-50 disabled:text-zinc-500" />
                                    </div>
                                </div>
                                {pendingPartner && (
                                    <div>
                                        <label className="block text-sm font-medium text-app-green mb-1.5">Email OTP</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] rounded-xl border border-app-border focus:border-app-green outline-none"
                                            placeholder="000000"
                                        />
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={saving || (Boolean(pendingPartner) && otp.length !== 6)} className="mt-6 w-full py-3 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors disabled:opacity-60">
                                {saving ? "Saving..." : editingPartner ? "Save Changes" : pendingPartner ? "Verify OTP and Create Partner" : "Send OTP"}
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
