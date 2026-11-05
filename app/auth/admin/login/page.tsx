'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, EyeOff, Eye } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Footer from '@/Components/Footer';

export default function AdminPortalPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    const handleAdminLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        // 1. Authenticate against Supabase Auth (auth.users)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message || 'Authentication failed.');
            setLoading(false);
            return;
        }

        // 2. Fetch admin profile details from admin_profiles
        const { data: adminProfile, error: profileError } = await supabase
            .from('admin_profiles')
            .select('role, first_name, last_name')
            .eq('id', data.user.id)
            .single();

        if (profileError || !adminProfile) {
            await supabase.auth.signOut();
            setErrorMsg('Access denied. Account is not registered in admin directory.');
            setLoading(false);
            return;
        }

        if (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin') {
            await supabase.auth.signOut();
            setErrorMsg('Access restricted to authorized Sunday School leaders.');
            setLoading(false);
            return;
        }

        // 3. Store name for UI session display and redirect to Admin Portal
        localStorage.setItem('didache_admin_name', `${adminProfile.first_name} ${adminProfile.last_name}`);
        router.push('/admin/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto">

            {/* Top Navigation */}
            <div>
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 mb-6 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Go Back</span>
                </button>
            </div>

            {/* Main Split-Screen Container */}
            <main className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">

                {/* Left Column: Admin Context & Protocol Info */}
                <div className="lg:col-span-7 space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/10 bg-amber-500/20 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
                        <ShieldCheck className="h-5 w-5 text-amber-400" />
                        <div className="flex flex-col p-1">
                            <span className="font-bold text-white">Admin Portal Sign In</span>
                            <span className="text-slate-400">Byte & Security Secure Access</span>
                        </div>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                        Manage Sunday school <br />
                        <span className="bg-linear-to-r from-amber-400 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                            sessions & attendance.
                        </span>
                    </h2>

                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
                        Welcome to the Didache administrative portal for RCCG Milk & Honey. Generate weekly dynamic QR codes, review attendance logs, and manage youth records securely.
                    </p>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Generate fresh QR codes for each Sunday service</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Real-time tracking and manual protocol overrides</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Secure Login Card */}
                <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
                    {loading ? (
                        <LoadingSpinner
                            text="Verifying admin authorization..."
                            icon={ShieldCheck}
                        />
                    ) : (
                        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">

                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-white">Staff Sign In</h3>
                                <p className="text-xs text-slate-400">Enter your authorized admin credentials</p>
                            </div>

                            {errorMsg && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={(e) => void handleAdminLogin(e)} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Admin Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@milkandhoney.org"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none transition"
                                        />

                                        {/* Toggle Button on the Right */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] disabled:opacity-50 transition-all"
                                >
                                    {loading ? (
                                        <span>Verifying Credentials...</span>
                                    ) : (
                                        <>
                                            <span>Access Admin Portal</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}