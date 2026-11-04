'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner'
import Footer from '@/Components/Footer';

function MemberLoginForm() {
    const router = useRouter();
    const supabase = createClient();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handlePhoneLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const cleanPhone = phoneNumber.trim();

            // Check both phone_number and whatsapp_number simultaneously
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .or(`phone_number.eq.${cleanPhone},whatsapp_number.eq.${cleanPhone}`)
                .maybeSingle();

            if (error || !profile) {
                setErrorMsg('No profile found with this phone or WhatsApp number. Please click "Register" below to create a profile.');
                setLoading(false);
                return;
            }

            localStorage.setItem('didache_member_id', profile.id);
            localStorage.setItem('didache_member_name', `${profile.first_name} ${profile.last_name}`);

            router.push('/member/dashboard');
        } catch (err: any) {
            setErrorMsg(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Phone or WhatsApp Number
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="tel"
                            required
                            autoComplete="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="08012345678"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none transition"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                    {loading ? (
                        <span>Locating Account...</span>
                    ) : (
                        <>
                            <span>Access Profile</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>

                <div className="pt-2 text-center">
                    <Link href="/auth/member/register" className="text-xs text-emerald-400 hover:underline">
                        Don't have a profile yet? Register here
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function MemberLoginPage() {
    const router = useRouter();

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-md mx-auto">
            <div>
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-6 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Go Back</span>
                </button>

                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xl mb-1 backdrop-blur-md">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                            Member Check-In
                        </h1>
                        <p className="text-xs font-medium text-slate-400">
                            Milk & Honey • Sunday School Portal
                        </p>
                    </div>

                    <Suspense fallback={<LoadingSpinner text="Preparing member login..." icon={BookOpen} />}>
                        <MemberLoginForm />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </div>
    );
}