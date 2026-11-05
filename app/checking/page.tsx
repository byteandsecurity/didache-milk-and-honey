'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, BookOpen, ArrowRight, User, KeyRound, Heart, QrCode } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Footer from '@/Components/Footer';
import QrScanner from '@/Components/member/QrScanner';

function CheckInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawDateParam = searchParams.get('date');
    const dateParam = rawDateParam || new Date().toISOString().split('T')[0];
    const supabase = createClient();

    const [checking, setChecking] = useState(true);
    const [memberProfile, setMemberProfile] = useState<any>(null);
    const [memberChoice, setMemberChoice] = useState<'selection' | 'member_branch'>('selection');
    const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);

    useEffect(() => {
        const processCheckIn = async () => {
            if (rawDateParam) {
                localStorage.setItem('didache_qr_date', rawDateParam);
            }

            const memberId = localStorage.getItem('didache_member_id');

            if (memberId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', memberId)
                    .maybeSingle();

                if (profile) {
                    setMemberProfile(profile);

                    // 1. Auto-Upsert Session for target date
                    const { data: sessionMatch } = await supabase
                        .from('sessions')
                        .upsert([
                            {
                                session_date: dateParam,
                                title: `Service Session (${dateParam})`,
                                is_active: true
                            }
                        ], { onConflict: 'session_date' })
                        .select('id')
                        .single();

                    if (sessionMatch) {
                        // 2. Check for duplicate attendance
                        const { data: existingAtt } = await supabase
                            .from('attendance')
                            .select('id')
                            .eq('user_id', profile.id)
                            .eq('session_id', sessionMatch.id)
                            .maybeSingle();

                        if (existingAtt) {
                            setAlreadyCheckedIn(true);
                        } else {
                            await supabase.from('attendance').insert([
                                {
                                    user_id: profile.id,
                                    session_id: sessionMatch.id,
                                    checked_in_at: new Date().toISOString(),
                                },
                            ]);
                        }
                    }

                    setChecking(false);
                    return;
                }
            }

            setChecking(false);
        };

        void processCheckIn();
    }, [supabase, dateParam, rawDateParam]);

    const navigateWithDate = (path: string) => {
        const query = rawDateParam ? `?date=${rawDateParam}` : '';
        router.push(`${path}${query}`);
    };

    if (checking) {
        return <LoadingSpinner text="Verifying Sunday check-in session..." icon={BookOpen} />;
    }

    if (memberProfile) {
        return (
            <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-xl mx-auto">
                <header className="pb-6 border-b border-slate-800/80 text-center">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
                        Sunday Service Check-In
                    </span>
                    <p className="text-xs text-slate-400">RCCG Milk & Honey</p>
                </header>

                <main className="my-8">
                    <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <Sparkles className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                {alreadyCheckedIn ? 'ℹ️ Already Checked In' : '✓ Attendance Recorded'}
                            </span>
                            <h2 className="text-2xl font-bold text-white">Welcome back, {memberProfile.first_name}!</h2>
                            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                {alreadyCheckedIn
                                    ? `You are already recorded for Sunday School on ${dateParam}.`
                                    : `You are checked into Sunday School for ${dateParam}. God bless you as you worship with us today!`}
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/member/dashboard')}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition"
                        >
                            Go to Member Dashboard
                        </button>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    if (memberChoice === 'member_branch') {
        return (
            <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-xl mx-auto">
                <header className="pb-6 border-b border-slate-800/80 text-center">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
                        Member Portal Gateway
                    </span>
                    <p className="text-xs text-slate-400">RCCG Milk & Honey</p>
                </header>

                <main className="my-8 space-y-6">
                    <button
                        onClick={() => setMemberChoice('selection')}
                        className="w-full text-left text-xs text-slate-500 hover:text-slate-300 pt-2"
                    >
                        ← Back to main options
                    </button>

                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-extrabold text-white">Member Check-In</h1>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Do you already have an existing profile with Milk & Honey Sunday School?
                        </p>
                    </div>

                    {!rawDateParam && (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-2">
                            <p className="text-xs text-amber-300">
                                No active Sunday QR scan context detected. Scan the hall QR code to log attendance automatically.
                            </p>
                            <button
                                onClick={() => setShowScannerModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Scan Hall QR Code</span>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => navigateWithDate('/auth/member/login')}
                            className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 text-left hover:border-emerald-500/60 transition group space-y-2 backdrop-blur-xl shadow-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                                    Yes, I already have a profile
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Enter your phone number to sign in and record today&#39;s attendance.
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigateWithDate('/auth/member/register')}
                            className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-left hover:border-slate-700 transition group space-y-2 backdrop-blur-xl shadow-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                                    <User className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white group-hover:text-slate-200 transition">
                                    No, create a new profile for me
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Fill in your details once so your phone remembers you for future services.
                                </p>
                            </div>
                        </button>
                    </div>
                </main>

                <QrScanner
                    isOpen={showScannerModal}
                    onClose={() => setShowScannerModal(false)}
                    onSuccess={() => window.location.reload()}
                />

                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-xl mx-auto">
            <header className="pb-6 border-b border-slate-800/80 text-center">
                <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                    Sunday School Check-In Portal
                </span>
                <p className="text-xs text-slate-400">RCCG Milk & Honey</p>
            </header>

            <main className="my-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-extrabold text-white">Welcome to Milk & Honey!</h1>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Please choose how you would like to check in for today&#39;s Sunday service.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => setMemberChoice('member_branch')}
                        className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 text-left hover:border-emerald-500/60 transition group space-y-2 backdrop-blur-xl shadow-xl"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                                I am a Member / Regular Attendee
                            </h2>
                            <p className="text-xs text-slate-400">
                                Sign in or register your profile to track your Sunday School attendance metrics.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigateWithDate('/auth/guest')}
                        className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-6 text-left hover:border-amber-500/60 transition group space-y-2 backdrop-blur-xl shadow-xl"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Heart className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                                I am a Visitor / Guest
                            </h2>
                            <p className="text-xs text-slate-400">
                                Quick 10-second check-in for guests. No password needed!
                            </p>
                        </div>
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function CheckInPage() {
    return (
        <Suspense fallback={<LoadingSpinner text="Loading Check-In Gateway..." icon={BookOpen} />}>
            <CheckInContent />
        </Suspense>
    );
}