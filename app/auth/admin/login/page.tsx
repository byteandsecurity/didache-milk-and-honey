'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Footer from '@/Components/Footer';

export default function AdminPortalPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        // 1. Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message || 'Authentication failed.');
            setLoading(false);
            return;
        }

        // 2. Fetch user profile role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            setErrorMsg('Could not verify staff credentials.');
            setLoading(false);
            return;
        }

        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
            await supabase.auth.signOut();
            setErrorMsg('Access restricted to Sunday School Admins.');
            setLoading(false);
            return;
        }

        // 3. Success redirect
        router.push('/admin/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto">

            {/* Top Navigation */}
            <div>
                <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 mb-6 transition">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                </Link>
            </div>

            {/* Main Split-Screen Container */}
            <main className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">

                {/* Left Column: Admin Context & Protocol Info */}
                <div className="lg:col-span-7 space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-md">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        <span>Leader & Protocol Console</span>
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

                        <form onSubmit={handleAdminLogin} className="space-y-4">
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
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none transition"
                                    />
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
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}