'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Phone, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Footer from '@/Components/Footer';

interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    whatsapp_number?: string;
}

function MemberLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const rawDateParam = searchParams.get('date');

    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [navigating, setNavigating] = useState(false); // Smooth transition loading spinner state
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isDirectLoginSuccess, setIsDirectLoginSuccess] = useState(false);
    const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState(false);
    const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
    const [totalVisits, setTotalVisits] = useState(1);

    // CRITICAL FIX: Always reset success states and input on initial mount to prevent stuck banners
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
        setNavigating(false);
        setIsCheckedIn(false);
        setIsDirectLoginSuccess(false);
        setPhoneNumber('');
        setErrorMsg(null);
    }, []);

    useEffect(() => {
        if (rawDateParam) {
            localStorage.setItem('didache_qr_date', rawDateParam);
        }
    }, [rawDateParam]);

    const handlePhoneLogin = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const cleanPhone = phoneNumber.trim();
            if (!cleanPhone) {
                setErrorMsg('Please enter your phone or WhatsApp number.');
                setLoading(false);
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, phone_number, whatsapp_number')
                .or(`phone_number.eq.${cleanPhone},whatsapp_number.eq.${cleanPhone}`)
                .maybeSingle();

            if (error || !profile) {
                setErrorMsg('No profile found with this phone or WhatsApp number. Click "Register" below to create your account.');
                setLoading(false);
                return;
            }

            localStorage.setItem('didache_member_id', profile.id);
            localStorage.setItem('didache_member_name', `${profile.first_name} ${profile.last_name}`);
            setPhoneNumber('');

            const activeScanDate = rawDateParam || (typeof window !== 'undefined' ? localStorage.getItem('didache_qr_date') : null);

            if (activeScanDate) {
                const { data: existingAttendance } = await supabase
                    .from('attendance')
                    .select('id')
                    .eq('user_id', profile.id)
                    .eq('session_date', activeScanDate)
                    .maybeSingle();

                const { count } = await supabase
                    .from('attendance')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', profile.id);

                const countVal = count || 1;

                if (existingAttendance) {
                    setMemberProfile(profile as MemberProfile);
                    setTotalVisits(countVal);
                    setAlreadyCheckedInToday(true);
                    setIsCheckedIn(true);
                    setLoading(false);
                    return;
                }

                await supabase.from('attendance').insert([
                    {
                        user_id: profile.id,
                        session_date: activeScanDate,
                        checked_in_at: new Date().toISOString(),
                    }
                ]);

                setMemberProfile(profile as MemberProfile);
                setTotalVisits(countVal + 1);
                setAlreadyCheckedInToday(false);
                setIsCheckedIn(true);
                setLoading(false);
                return;
            }

            // Direct Login Success -> Show Compact Welcome Card
            setMemberProfile(profile as MemberProfile);
            setIsDirectLoginSuccess(true);
            setLoading(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed.';
            setErrorMsg(message);
            setLoading(false);
        }
    };

    if (navigating) {
        return <LoadingSpinner text="Opening your dashboard..." icon={BookOpen} />;
    }

    // 1. QR Check-In Confirmation View
    if (isCheckedIn && memberProfile) {
        return (
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        {alreadyCheckedInToday ? 'Already Checked In Today' : 'Attendance Logged'}
                    </span>
                    <h2 className="text-xl font-bold text-white">Welcome back, {memberProfile.first_name}!</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        {alreadyCheckedInToday
                            ? 'You have already checked into Sunday School for today’s session. God bless you!'
                            : 'You are successfully checked in for today’s Sunday School service. God bless you!'}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 flex items-center justify-between">
                    <span>Total Sunday Visits:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{totalVisits} Sunday(s)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        onClick={() => {
                            setNavigating(true);
                            setIsCheckedIn(false);
                            setTimeout(() => router.push('/member/dashboard'), 400);
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => {
                            setIsCheckedIn(false);
                            router.push('/');
                        }}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition"
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    // 2. Direct Login Success Welcome Card (Compact and clean)
    if (isDirectLoginSuccess && memberProfile) {
        return (
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        Login Successful
                    </span>
                    <h2 className="text-xl font-bold text-white">Welcome back, {memberProfile.first_name}!</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        You have accessed your member profile. To log your attendance, visit your dashboard and scan the hall QR code.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        onClick={() => {
                            setNavigating(true);
                            setIsDirectLoginSuccess(false);
                            setTimeout(() => router.push('/member/dashboard'), 400);
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => {
                            setIsDirectLoginSuccess(false);
                            router.push('/');
                        }}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition"
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white">✕</button>
                </div>
            )}

            <form onSubmit={(e) => void handlePhoneLogin(e)} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Phone or WhatsApp Number
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="tel"
                            required
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
                        <span>Verifying Account...</span>
                    ) : (
                        <>
                            <span>Access Profile</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>

                <div className="pt-2 text-center">
                    <Link
                        href={rawDateParam ? `/auth/member/register?date=${rawDateParam}` : '/auth/member/register'}
                        className="text-xs text-emerald-400 hover:underline"
                    >
                        Don&apos;t have a profile yet? Register here
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function MemberLoginPage() {
    const router = useRouter();

    const handleBack = () => {
        localStorage.removeItem('didache_qr_date');
        router.push('/');
    };

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-md mx-auto">
            <div>
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-6 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Go Back to Home</span>
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