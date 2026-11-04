'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserCheck, Heart, Sparkles, BookOpen, ArrowRight, User, KeyRound } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Footer from '@/Components/Footer';

function CheckInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const supabase = createClient();

    const [checking, setChecking] = useState(true);
    const [memberProfile, setMemberProfile] = useState<any>(null);
    const [memberChoice, setMemberChoice] = useState<'selection' | 'member_branch'>('selection');

    useEffect(() => {
        const processCheckIn = async () => {
            // 1. Automatic Recognition: Check if user has an existing session on this phone
            const memberId = localStorage.getItem('didache_member_id');

            if (memberId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', memberId)
                    .maybeSingle();

                if (profile) {
                    setMemberProfile(profile);

                    // Log attendance automatically
                    await supabase.from('attendance').insert([
                        {
                            user_id: profile.id,
                            checked_in_at: new Date().toISOString(),
                        },
                    ]);

                    setChecking(false);
                    return;
                }
            }

            setChecking(false);
        };

        void processCheckIn();
    }, [supabase]);

    if (checking) {
        return <LoadingSpinner text="Verifying Sunday check-in session..." icon={BookOpen} />;
    }

    // A. RECOGNIZED DEVICE: Instant Check-In Success
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
                                ✓ Attendance Recorded
                            </span>
                            <h2 className="text-2xl font-bold text-white">Welcome back, {memberProfile.first_name}!</h2>
                            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                You are checked into Sunday School for <strong>{dateParam}</strong>. God bless you as you worship with us today!
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard')}
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

    // B. MEMBER BRANCH: "Do you already have a profile?"
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

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => router.push('/auth/member/login')}
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
                                    Enter your phone number to sign in and record today's attendance.
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/auth/member/register')}
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

                <Footer />
            </div>
        );
    }

    // C. INITIAL UNRECOGNIZED SCREEN: Select Member vs Guest
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
                        Please choose how you would like to check in for today's Sunday service.
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
                        onClick={() => router.push('/auth/guest')}
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