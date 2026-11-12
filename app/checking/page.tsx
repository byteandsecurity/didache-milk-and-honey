'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, User, KeyRound, Heart, QrCode, Clock, ShieldAlert } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { verifyUserLocation } from '@/lib/geofence';

import LoadingSpinner from '@/Components/LoadingSpinner';
import { DidacheGeometricIcon } from "@/Components/DidacheIcon";
import QrScanner from '@/Components/member/QrScanner';
import Footer from '@/Components/Footer';

interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role?: string;
}

function CheckInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawDateParam = searchParams.get('date');
    const rawExpiresParam = searchParams.get('expires');
    const dateParam = rawDateParam || new Date().toISOString().split('T')[0];
    const supabase = createClient();

    const [checking, setChecking] = useState<boolean>(true);
    const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
    const [memberChoice, setMemberChoice] = useState<'selection' | 'member_branch'>('selection');
    const [alreadyCheckedIn, setAlreadyCheckedIn] = useState<boolean>(false);
    const [qrExpiredNotice, setQrExpiredNotice] = useState<boolean>(false);
    const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

    // Unified Security Lock State
    const [blockReason, setBlockReason] = useState<'expired' | 'geofence' | null>(null);
    const [locationMessage, setLocationMessage] = useState<string>('');
    const [hasMemberSession, setHasMemberSession] = useState<boolean>(false);

    useEffect(() => {
        const processCheckIn = async () => {
            const expiryTime = rawExpiresParam ? parseInt(rawExpiresParam, 10) : null;
            const isUrlExpired = Boolean(expiryTime && !isNaN(expiryTime) && Date.now() > expiryTime);

            // Fetch session status early so we can check existing attendance even if QR/session is expired
            const { data: sessionMatch } = await supabase
                .from('sessions')
                .select('id, is_active')
                .eq('session_date', dateParam)
                .maybeSingle();

            const isSessionClosed = Boolean(sessionMatch && sessionMatch.is_active === false);
            const isExpiredOrClosed = isUrlExpired || isSessionClosed;

            const memberId = localStorage.getItem('didache_member_id');
            setHasMemberSession(Boolean(memberId));

            // 1. IF EXPIRED/CLOSED: Check if returning member is ALREADY checked in before locking them out
            if (isExpiredOrClosed) {
                if (memberId) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', memberId)
                        .maybeSingle();

                    if (profile) {
                        let existingAtt = null;

                        if (sessionMatch?.id) {
                            const { data: bySessionId } = await supabase
                                .from('attendance')
                                .select('id')
                                .eq('user_id', profile.id)
                                .eq('session_id', sessionMatch.id)
                                .maybeSingle();
                            existingAtt = bySessionId;
                        }

                        if (!existingAtt) {
                            const { data: byDate } = await supabase
                                .from('attendance')
                                .select('id')
                                .eq('user_id', profile.id)
                                .eq('session_date', dateParam)
                                .maybeSingle();
                            existingAtt = byDate;
                        }

                        if (existingAtt) {
                            setMemberProfile(profile as MemberProfile);
                            setAlreadyCheckedIn(true);
                            setQrExpiredNotice(true);
                            setChecking(false);
                            return;
                        }
                    }
                }

                // Not checked in yet (or guest/new user) -> Lock screen
                setBlockReason('expired');
                setChecking(false);
                return;
            }

            // 2. GEOFENCE CHECK (Applies to ALL users attempting a new check-in)
            const geoCheck = await verifyUserLocation();
            if (!geoCheck.allowed) {
                setLocationMessage(geoCheck.message || "You must be within 100m of the venue to check in.");
                setBlockReason('geofence');
                setChecking(false);
                return;
            }

            // Save valid scan context
            if (rawDateParam) {
                localStorage.setItem('didache_qr_date', rawDateParam);
            }

            // 3. RETURNING MEMBER AUTO CHECK-IN
            if (memberId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', memberId)
                    .maybeSingle();

                if (profile) {
                    setMemberProfile(profile as MemberProfile);

                    const { data: activeSession } = await supabase
                        .from('sessions')
                        .upsert([
                            {
                                session_date: dateParam,
                                title: `Service Session (${dateParam})`,
                                is_active: true
                            }
                        ], { onConflict: 'session_date' })
                        .select('id, is_active')
                        .single();

                    if (activeSession) {
                        if (activeSession.is_active === false) {
                            setBlockReason('expired');
                            setChecking(false);
                            return;
                        }

                        const { data: existingAtt } = await supabase
                            .from('attendance')
                            .select('id')
                            .eq('user_id', profile.id)
                            .eq('session_id', activeSession.id)
                            .maybeSingle();

                        if (existingAtt) {
                            setAlreadyCheckedIn(true);
                        } else {
                            await supabase.from('attendance').insert([
                                {
                                    user_id: profile.id,
                                    session_id: activeSession.id,
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
    }, [supabase, dateParam, rawDateParam, rawExpiresParam]);

    const navigateWithDate = (path: string) => {
        const params = new URLSearchParams();
        if (rawDateParam) params.set('date', rawDateParam);
        if (rawExpiresParam) params.set('expires', rawExpiresParam);
        const query = params.toString() ? `?${params.toString()}` : '';
        router.push(`${path}${query}`);
    };

    if (checking) {
        return <LoadingSpinner text="Verifying session and location..." icon={DidacheGeometricIcon} />;
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-xl mx-auto">
            <header className="pb-6 border-b border-slate-800/80 text-center">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
                    Service Check-In Portal
                </span>
                <p className="text-xs text-slate-400">Didache Universal Platform</p>
            </header>

            <main className="my-8">
                {/* UNIFIED LOCKED SCREEN STATE (EXPIRED OR OUT OF BOUNDS) */}
                {blockReason ? (
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${
                            blockReason === 'expired'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                            {blockReason === 'expired' ? <Clock className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">
                                {blockReason === 'expired' ? 'Check-In Code Expired' : 'Location Verification Failed'}
                            </h2>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                                {blockReason === 'expired'
                                    ? 'This QR code has expired. Please ask the coordinator for a new active QR code, or continue below to scan it.'
                                    : locationMessage}
                            </p>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            {hasMemberSession ? (
                                <>
                                    <button
                                        onClick={() => setShowScannerModal(true)}
                                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                                    >
                                        <QrCode className="w-4 h-4" />
                                        <span>Scan Active Session QR</span>
                                    </button>

                                    <button
                                        onClick={() => router.push('/member/dashboard')}
                                        className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-300 transition cursor-pointer"
                                    >
                                        Go to Member Dashboard
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => router.push('/auth/guest')}
                                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                                    >
                                        <Heart className="w-4 h-4" />
                                        <span>Visitor / Guest Check-In</span>
                                    </button>

                                    <button
                                        onClick={() => router.push('/auth/member/login')}
                                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        <span>Member Sign In</span>
                                    </button>

                                    <button
                                        onClick={() => router.push('/auth/member/register')}
                                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-300 transition cursor-pointer"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Create New Member Account</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : memberProfile ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <Sparkles className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                {alreadyCheckedIn ? 'ℹ️ Already Checked In' : '✓ Attendance Recorded'}
                            </span>
                            <h2 className="text-2xl font-bold text-white">Welcome back, {memberProfile.first_name}!</h2>
                            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                {qrExpiredNotice
                                    ? `This QR code has expired—but good news, you are already checked in for service on ${dateParam}!`
                                    : alreadyCheckedIn
                                        ? `You are already recorded for service on ${dateParam}.`
                                        : `You are successfully checked in for ${dateParam}. Have a wonderful service!`}
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/member/dashboard')}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                        >
                            Go to Member Dashboard
                        </button>
                    </div>
                ) : memberChoice === 'member_branch' ? (
                    <div className="space-y-6">
                        <button
                            onClick={() => setMemberChoice('selection')}
                            className="w-full text-left text-xs text-slate-500 hover:text-slate-300 pt-2"
                        >
                            ← Back to main options
                        </button>

                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-extrabold text-white">Member Check-In</h1>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Do you already have an existing profile registered?
                            </p>
                        </div>

                        {!rawDateParam && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-2">
                                <p className="text-xs text-amber-300">
                                    No active scan context detected. Scan the hall QR code to log attendance automatically.
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
                                className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 text-left hover:border-emerald-500/60 transition group space-y-2 shadow-xl cursor-pointer"
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
                                    <p className="text-xs text-slate-400">Sign in with your phone number.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigateWithDate('/auth/member/register')}
                                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-left hover:border-slate-700 transition group space-y-2 shadow-xl cursor-pointer"
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
                                    <p className="text-xs text-slate-400">Quickly register your details.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-extrabold text-white">Welcome!</h1>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Please choose how you would like to check in for today&#39;s service.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setMemberChoice('member_branch')}
                                className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 text-left hover:border-emerald-500/60 transition group space-y-2 shadow-xl cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <DidacheGeometricIcon className="w-9 h-9" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                                        I am a Member / Regular Attendee
                                    </h2>
                                    <p className="text-xs text-slate-400">Sign in or register your member profile.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigateWithDate('/auth/guest')}
                                className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-6 text-left hover:border-amber-500/60 transition group space-y-2 shadow-xl cursor-pointer"
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
                                    <p className="text-xs text-slate-400">Quick 10-second check-in for guests.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
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

export default function CheckInPage() {
    return (
        <Suspense fallback={<LoadingSpinner text="Loading Check-In Gateway..." icon={DidacheGeometricIcon} />}>
            <CheckInContent />
        </Suspense>
    );
}