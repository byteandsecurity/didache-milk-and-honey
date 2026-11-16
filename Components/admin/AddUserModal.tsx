'use client';

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ConfirmationModal from '@/Components/admin/ConfirmationModal';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
    const supabase = createClient();
    const [addType, setAddType] = useState<'member' | 'guest'>('member');

    // Feedback States
    const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [savingUser, setSavingUser] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    const [dob, setDob] = useState('');
    const [maritalStatus, setMaritalStatus] = useState('Single');
    const [occupationType, setOccupationType] = useState('');
    const [occupationDetail, setOccupationDetail] = useState('');
    const [address, setAddress] = useState('');

    if (!isOpen) return null;

    const handleFormSubmitRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormMsg(null);
        setShowConfirmModal(true);
    };

    const executeSaveToSupabase = async () => {
        setSavingUser(true);
        setShowConfirmModal(false);
        setFormMsg(null);

        if (addType === 'member') {
            const { error } = await supabase.from('profiles').insert([{
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim() || null,
                phone_number: phone.trim(),
                gender,
                dob: dob || null,
                marital_status: maritalStatus,
                occupation_type: occupationType.trim() || null,
                occupation_detail: occupationDetail.trim() || null,
                home_address: address.trim() || null,
                role: 'member',
            }]);

            if (error) {
                setFormMsg({ type: 'error', text: `Error: ${error.message}` });
                setSavingUser(false);
                return;
            }
        } else {
            const { error } = await supabase.from('guest_profiles').insert([{
                full_name: `${firstName} ${lastName}`.trim(),
                phone_number: phone.trim(),
                gender,
                home_address: address.trim() || null,
                attendance_count: 0, // Starts clean without false visit history
            }]);

            if (error) {
                setFormMsg({ type: 'error', text: `Error: ${error.message}` });
                setSavingUser(false);
                return;
            }
        }

        // Success state triggered
        setSavingUser(false);
        setFormMsg({ type: 'success', text: `Successfully created ${addType} record for ${firstName} ${lastName}!` });

        // Wait 1.5 seconds so the user can see the success message, then close & refresh
        setTimeout(() => {
            onSuccess();
            onClose();
            // Reset form states
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setDob('');
            setMaritalStatus('Single');
            setOccupationType('');
            setOccupationDetail('');
            setAddress('');
            setFormMsg(null);
        }, 1500);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h2 className="text-sm font-bold text-white">Manual Enrolment Portal</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setAddType('member')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${addType === 'member' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                            Member
                        </button>
                        <button
                            type="button"
                            onClick={() => setAddType('guest')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${addType === 'guest' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                            Guest
                        </button>
                    </div>

                    {/* Success or Error Banner */}
                    {formMsg && (
                        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                            formMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                        }`}>
                            {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                            <span>{formMsg.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleFormSubmitRequest} className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">First Name *</label>
                                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Last Name *</label>
                                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Phone Number *</label>
                                <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                            </div>
                            {addType === 'member' ? (
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Email Address</label>
                                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Home Address</label>
                                    <input type="text" placeholder="Residential Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Gender *</label>
                                <select value={gender} onChange={(e) => setGender(e.target.value as 'Male' | 'Female')} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-emerald-400 font-semibold focus:outline-none cursor-pointer">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            {addType === 'member' && (
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Marital Status</label>
                                    <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-semibold focus:outline-none cursor-pointer">
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {addType === 'member' && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Date of Birth (DOB)</label>
                                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Occupation Type</label>
                                        <input type="text" placeholder="e.g. Banking, Tech" value={occupationType} onChange={(e) => setOccupationType(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Occupation Detail</label>
                                        <input type="text" placeholder="e.g. Accountant" value={occupationDetail} onChange={(e) => setOccupationDetail(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Residential Address</label>
                                        <input type="text" placeholder="Residential Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none" />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={savingUser}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white shadow transition cursor-pointer mt-2"
                        >
                            {savingUser ? 'Processing...' : `Save ${addType === 'member' ? 'Member' : 'Guest'} Record`}
                        </button>
                    </form>
                </div>
            </div>

            {/* Shared Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                title="Confirm Record Save"
                message={`Are you sure you want to save this new ${addType} record? Please review the details before proceeding.`}
                confirmText="Yes, Save Record"
                cancelText="Review Details"
                isLoading={savingUser}
                onConfirm={() => void executeSaveToSupabase()}
                onClose={() => setShowConfirmModal(false)}
            />
        </>
    );
}