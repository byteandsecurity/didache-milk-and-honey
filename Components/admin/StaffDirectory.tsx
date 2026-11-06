'use client';

import React, { useState } from 'react';
import { Shield, UserPlus, X, AlertCircle, CheckCircle2, Edit2, Trash2, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAX_ADMINS = 5;

interface AdminProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'super_admin' | string;
}

interface StaffDirectoryProps {
    adminList: AdminProfile[];
    adminProfile: AdminProfile | null;
    onRefresh: () => void;
}

export default function StaffDirectory({ adminList, adminProfile, onRefresh }: StaffDirectoryProps) {
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // Custom Delete Confirmation Modal State
    const [adminToDelete, setAdminToDelete] = useState<AdminProfile | null>(null);

    // Form States for Adding / Editing
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false); // Eye toggle state
    const [role, setRole] = useState<'admin' | 'super_admin'>('admin');

    const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const supabase = createClient();

    const isSuperAdmin = adminProfile?.role?.toLowerCase() === 'super_admin' || adminProfile?.role?.toLowerCase() === 'superadmin';

    // Handle Registering a New Admin with Direct Password Creation
    const handleAddAdmin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormMsg(null);

        // Check administrative limit of 5
        if (adminList.length >= MAX_ADMINS) {
            setFormMsg({
                type: 'error',
                text: `Maximum administrator limit (${MAX_ADMINS}) has been reached!`
            });
            setLoading(false);
            return;
        }

        const existingAdmin = adminList.find((a: AdminProfile) => a.email?.toLowerCase() === email.toLowerCase());
        if (existingAdmin) {
            setFormMsg({
                type: 'error',
                text: `An administrator with the email "${email}" is already registered!`
            });
            setLoading(false);
            return;
        }

        if (!password || password.length < 6) {
            setFormMsg({
                type: 'error',
                text: 'Password must be at least 6 characters long.'
            });
            setLoading(false);
            return;
        }

        // 1. Create Supabase Auth User & Profile entry securely
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    role: role,
                }
            }
        });

        if (authError) {
            setFormMsg({ type: 'error', text: authError.message });
            setLoading(false);
            return;
        }

        const newAdminId = authData.user?.id || crypto.randomUUID();

        // 2. Ensure admin_profiles table entry is properly synchronized
        const { error: profileError } = await supabase.from('admin_profiles').upsert([
            {
                id: newAdminId,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                role: role,
            },
        ], { onConflict: 'email' });

        if (profileError) {
            setFormMsg({ type: 'error', text: `Profile record creation failed: ${profileError.message}` });
            setLoading(false);
            return;
        }

        setLoading(false);
        setFormMsg({
            type: 'success',
            text: `Successfully created admin account for ${firstName} ${lastName}!`
        });

        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setRole('admin');

        setTimeout(() => {
            setShowAddModal(false);
            setFormMsg(null);
            if (onRefresh) onRefresh();
        }, 1500);
    };

    // Handle Saving Admin Edits
    const handleSaveEdit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!selectedAdmin) return;
        setLoading(true);
        setFormMsg(null);

        const updatePayload: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            email: email,
        };

        if (isSuperAdmin) {
            updatePayload.role = role;
        }

        const { error } = await supabase
            .from('admin_profiles')
            .update(updatePayload)
            .eq('id', selectedAdmin.id);

        if (error) {
            setFormMsg({ type: 'error', text: `Failed to update: ${error.message}` });
            setLoading(false);
            return;
        }

        setLoading(false);
        setFormMsg({
            type: 'success',
            text: `Administrative profile updated successfully!`
        });

        setTimeout(() => {
            setSelectedAdmin(null);
            setIsEditing(false);
            setFormMsg(null);
            if (onRefresh) onRefresh();
        }, 1500);
    };

    // Handle Deleting an Admin (Custom Modal Action)
    const confirmDeleteAdmin = async () => {
        if (!adminToDelete) return;

        if (adminProfile?.email === adminToDelete.email) {
            setFormMsg({ type: 'error', text: "You cannot delete your own active super admin account!" });
            setAdminToDelete(null);
            return;
        }

        const { error } = await supabase.from('admin_profiles').delete().eq('id', adminToDelete.id);
        if (!error) {
            setAdminToDelete(null);
            if (onRefresh) onRefresh();
        } else {
            window.alert(`Failed to delete admin: ${error.message}`);
            setAdminToDelete(null);
        }
    };

    const isLimitReached = adminList.length >= MAX_ADMINS;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" /> Administrative Staff Directory ({adminList.length}/{MAX_ADMINS})
                    </h3>
                    <p className="text-xs text-slate-400">Manage portal access and administrative roles.</p>
                </div>

                {isSuperAdmin && (
                    <button
                        onClick={() => {
                            setFirstName('');
                            setLastName('');
                            setEmail('');
                            setPassword('');
                            setShowPassword(false);
                            setRole('admin');
                            setShowAddModal(true);
                            setFormMsg(null);
                        }}
                        disabled={isLimitReached}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow transition ${
                            isLimitReached ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                        title={isLimitReached ? 'Maximum limit of 5 admins reached' : 'Add New Admin'}
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{isLimitReached ? 'Limit Reached (5/5)' : 'Add New Admin'}</span>
                    </button>
                )}
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {adminList.map((st: AdminProfile) => {
                    const canEditThisAdmin = isSuperAdmin || adminProfile?.email?.toLowerCase() === st.email?.toLowerCase();
                    const canDeleteThisAdmin = isSuperAdmin && adminProfile?.email?.toLowerCase() !== st.email?.toLowerCase();

                    return (
                        <div key={st.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3 flex flex-col justify-between">
                            <div className="space-y-1">
                                <div className="font-bold text-white text-sm">{st.first_name} {st.last_name}</div>
                                <div className="text-xs text-slate-400">{st.email}</div>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400">
                                    {st.role}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                                {canEditThisAdmin && (
                                    <button
                                        onClick={() => {
                                            setSelectedAdmin(st);
                                            setFirstName(st.first_name);
                                            setLastName(st.last_name);
                                            setEmail(st.email);
                                            setRole(st.role === 'super_admin' ? 'super_admin' : 'admin');
                                            setIsEditing(true);
                                            setFormMsg(null);
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                )}
                                {canDeleteThisAdmin && (
                                    <button
                                        onClick={() => setAdminToDelete(st)}
                                        className="inline-flex items-center justify-center p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                        title="Delete Admin"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {adminToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white">Remove Administrator</h3>
                            <p className="text-xs text-slate-400">
                                Are you sure you want to remove <strong className="text-white">{adminToDelete.first_name} {adminToDelete.last_name}</strong> from the portal?
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setAdminToDelete(null)}
                                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void confirmDeleteAdmin()}
                                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white shadow transition"
                            >
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Admin Modal (Super Admin Only with Direct Password Creation & Eye Toggle) */}
            {showAddModal && isSuperAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Add New Administrator ({adminList.length}/{MAX_ADMINS})</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {formMsg && (
                            <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
                                formMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}>
                                {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                                <span className="font-medium">{formMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={(e) => void handleAddAdmin(e)} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading || formMsg?.type === 'success'} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white" />
                                <input type="text" placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading || formMsg?.type === 'success'} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address *</label>
                                <input type="email" placeholder="admin@rccg.org" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading || formMsg?.type === 'success'} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-emerald-400" /> Initial Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading || formMsg?.type === 'success'}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 pr-10 text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Administrative Role *</label>
                                <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')} disabled={loading || formMsg?.type === 'success'} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white">
                                    <option value="admin">Standard Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading || formMsg?.type === 'success'} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white transition">
                                {loading ? 'Creating Admin...' : formMsg?.type === 'success' ? 'Success!' : 'Create Admin Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal */}
            {isEditing && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Edit Administrator Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {formMsg && (
                            <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
                                formMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}>
                                {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                                <span className="font-medium">{formMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={(e) => void handleSaveEdit(e)} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading || formMsg?.type === 'success'} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white" />
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading || formMsg?.type === 'success'} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address *</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading || formMsg?.type === 'success'} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white" />
                            </div>
                            {isSuperAdmin && (
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Administrative Role *</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')} disabled={loading || formMsg?.type === 'success'} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white">
                                        <option value="admin">Standard Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                            )}
                            <button type="submit" disabled={loading || formMsg?.type === 'success'} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white transition">
                                {loading ? 'Saving...' : formMsg?.type === 'success' ? 'Updated!' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}