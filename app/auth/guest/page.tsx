'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, Sparkles, Phone, MapPin, User, ArrowLeft, CheckCircle2, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Footer from '@/Components/Footer';
import GuestQrScanner from '@/Components/guest/GuestQrScanner';

function GuestContent() {
    const [mode, setMode] = useState<'returning' | 'new'>('returning');

    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('Male');
    const [homeAddress, setHomeAddress] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [guestNameConfirmed, setGuestNameConfirmed] = useState('');
    const [visitCount, setVisitCount] = useState(1);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showScannerModal, setShowScannerModal] = useState(false);

    // Keep active inputs synced in refs so callbacks always read fresh values regardless of unmounts
    const currentModeRef = useRef<'returning' | 'new'>('returning');
    const phoneRef = useRef('');
    const nameRef = useRef('');
    const genderRef = useRef('Male');
    const addressRef = useRef('');

    useEffect(() => { currentModeRef.current = mode; }, [mode]);
    useEffect(() => { phoneRef.current = phoneNumber; }, [phoneNumber]);
    useEffect(() => { nameRef.current = fullName; }, [fullName]);
    useEffect(() => { genderRef.current = gender; }, [gender]);
    useEffect(() => { addressRef.current = homeAddress; }, [homeAddress]);

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawDateParam = searchParams.get('date');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPhone = localStorage.getItem('didache_guest_draft_phone');
            const savedName = localStorage.getItem('didache_guest_draft_name');
            const savedGender = localStorage.getItem('didache_guest_draft_gender');
            const savedAddress = localStorage.getItem('didache_guest_draft_address');

            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (savedPhone) setPhoneNumber(savedPhone);
            if (savedName) setFullName(savedName);
            if (savedGender) setGender(savedGender);
            if (savedAddress) setHomeAddress(savedAddress);
        }
    }, []);

    useEffect(() => {
        if (rawDateParam) {
            localStorage.setItem('didache_qr_date', rawDateParam);
        }
    }, [rawDateParam]);

    const handlePhoneChange = (val: string) => {
        setPhoneNumber(val);
        localStorage.setItem('didache_guest_draft_phone', val);
    };

    const handleNameChange = (val: string) => {
        setFullName(val);
        localStorage.setItem('didache_guest_draft_name', val);
    };

    const handleGenderChange = (val: string) => {
        setGender(val);
        localStorage.setItem('didache_guest_draft_gender', val);
    };

    const handleAddressChange = (val: string) => {
        setHomeAddress(val);
        localStorage.setItem('didache_guest_draft_address', val);
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    const handleFinishCheckIn = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('didache_guest_session');
            localStorage.removeItem('didache_guest_checked_date');
            localStorage.removeItem('didache_qr_date');
            localStorage.removeItem('didache_guest_draft_phone');
            localStorage.removeItem('didache_guest_draft_name');
            localStorage.removeItem('didache_guest_draft_gender');
            localStorage.removeItem('didache_guest_draft_address');
        }
        setIsCheckedIn(false);
        setPhoneNumber('');
        setFullName('');
        setHomeAddress('');
        setErrorMsg(null);
        router.push('/');
    };

    // Database check-in executor reading straight from fresh refs
    const executeCheckIn = async () => {
        setSubmitting(true);
        setErrorMsg(null);

        const targetMode = currentModeRef.current;
        const cleanPhone = phoneRef.current.trim();
        const activeDate = rawDateParam || (typeof window !== 'undefined' ? localStorage.getItem('didache_qr_date') : null);
        const todayDateStr = activeDate || new Date().toISOString().split('T')[0];

        if (targetMode === 'returning') {
            if (!cleanPhone) {
                setErrorMsg('Please enter your phone number.');
                setSubmitting(false);
                return;
            }

            const { data: existingGuest, error } = await supabase
                .from('guest_profiles')
                .select('*')
                .eq('phone_number', cleanPhone)
                .maybeSingle();

            if (error) {
                setErrorMsg('Could not verify visitor record. Please try again.');
                setSubmitting(false);
                return;
            }

            if (existingGuest) {
                const newCount = (existingGuest.attendance_count || 0) + 1;

                const { error: updateError } = await supabase
                    .from('guest_profiles')
                    .update({
                        attendance_count: newCount,
                        last_attended_at: new Date().toISOString(),
                    })
                    .eq('id', existingGuest.id);

                if (updateError) {
                    setErrorMsg('Error recording attendance. Please try again.');
                    setSubmitting(false);
                    return;
                }

                // Record permanent log in guest_attendance table
                await supabase.from('guest_attendance').insert([
                    {
                        guest_id: existingGuest.id,
                        guest_name: existingGuest.full_name,
                        session_date: todayDateStr,
                    }
                ]);

                setGuestNameConfirmed(existingGuest.full_name);
                setVisitCount(newCount);
                setIsCheckedIn(true);
            } else {
                setErrorMsg('No visitor record found with this phone number. Please click "First-Time Visitor" above to register.');
            }
        } else {
            // New Visitor Mode
            const cleanName = nameRef.current.trim();
            if (!cleanPhone || !cleanName) {
                setErrorMsg('Please fill in your phone number and full name.');
                setSubmitting(false);
                return;
            }

            const { data: existingGuest } = await supabase
                .from('guest_profiles')
                .select('id, full_name, attendance_count')
                .eq('phone_number', cleanPhone)
                .maybeSingle();

            if (existingGuest) {
                const newCount = (existingGuest.attendance_count || 0) + 1;
                await supabase
                    .from('guest_profiles')
                    .update({
                        attendance_count: newCount,
                        last_attended_at: new Date().toISOString()
                    })
                    .eq('id', existingGuest.id);

                // Record permanent log for existing phone match
                await supabase.from('guest_attendance').insert([
                    {
                        guest_id: existingGuest.id,
                        guest_name: existingGuest.full_name,
                        session_date: todayDateStr,
                    }
                ]);

                setGuestNameConfirmed(existingGuest.full_name);
                setVisitCount(newCount);
                setIsCheckedIn(true);
                setSubmitting(false);
                return;
            }

            // Insert completely new guest profile
            const { data: newGuest, error: insertError } = await supabase
                .from('guest_profiles')
                .insert([
                    {
                        full_name: cleanName,
                        phone_number: cleanPhone,
                        gender: genderRef.current,
                        home_address: addressRef.current.trim() || null,
                        attendance_count: 1,
                        last_attended_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (insertError || !newGuest) {
                setErrorMsg(`Could not register visitor: ${insertError?.message || 'Server error'}`);
                setSubmitting(false);
                return;
            }

            // Record permanent log for brand-new guest
            await supabase.from('guest_attendance').insert([
                {
                    guest_id: newGuest.id,
                    guest_name: newGuest.full_name,
                    session_date: todayDateStr,
                }
            ]);

            setGuestNameConfirmed(newGuest.full_name);
            setVisitCount(1);
            setIsCheckedIn(true);
        }

        setSubmitting(false);
    };

    const handleReturningCheckIn = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const activeDate = rawDateParam || (typeof window !== 'undefined' ? localStorage.getItem('didache_qr_date') : null);

        if (!activeDate) {
            setShowScannerModal(true);
            return;
        }

        await executeCheckIn();
    };

    const handleNewVisitorSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        const activeDate = rawDateParam || (typeof window !== 'undefined' ? localStorage.getItem('didache_qr_date') : null);

        if (!activeDate) {
            setShowScannerModal(true);
            return;
        }

        await executeCheckIn();
    };

    // Executed the split second a valid QR code is scanned in the modal
    const handleScanSuccess = async (scannedDate: string) => {
        setShowScannerModal(false);
        localStorage.setItem('didache_qr_date', scannedDate);
        await executeCheckIn();
    };

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-xl mx-auto">
            <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </button>
                <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                        Visitor Portal
                    </span>
                    <p className="text-xs text-slate-400">RCCG Milk & Honey</p>
                </div>
            </header>

            <main className="my-8">
                {submitting ? (
                    <LoadingSpinner
                        text={mode === 'returning' ? 'Verifying visitor record...' : 'Registering first-time visitor...'}
                        icon={Heart}
                    />
                ) : isCheckedIn ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" /> Check-In Confirmed
                            </span>
                            <h2 className="text-2xl font-bold text-white">Welcome, {guestNameConfirmed}!</h2>
                            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                Thank you for worshipping with us today at RCCG Milk & Honey Sunday School. We are blessed to have you!
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 flex items-center justify-between">
                            <span>Total Sunday Visits:</span>
                            <span className="font-extrabold text-amber-400 text-sm">{visitCount} {visitCount === 1 ? 'Sunday' : 'Sundays'}</span>
                        </div>

                        <button
                            onClick={handleFinishCheckIn}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-200 transition"
                        >
                            Done / Return Home
                        </button>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
                        <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
                            <button
                                onClick={() => { setMode('returning'); setErrorMsg(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition ${
                                    mode === 'returning' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Returning Visitor</span>
                            </button>
                            <button
                                onClick={() => { setMode('new'); setErrorMsg(null); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition ${
                                    mode === 'new' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>First-Time Visitor</span>
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {mode === 'returning' ? (
                            <form onSubmit={(e) => void handleReturningCheckIn(e)} className="space-y-4">
                                <div className="space-y-1">
                                    <h1 className="text-lg font-bold text-white">Returning Visitor Check-In</h1>
                                    <p className="text-xs text-slate-400">
                                        Have you visited us before? Enter your phone number to check in instantly.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                            <Phone className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            placeholder="08012345678"
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition"
                                >
                                    {submitting ? 'Checking in...' : 'Quick Visitor Check-In'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={(e) => void handleNewVisitorSubmit(e)} className="space-y-4">
                                <div className="space-y-1">
                                    <h1 className="text-lg font-bold text-white">First-Time Visitor Registration</h1>
                                    <p className="text-xs text-slate-400">
                                        Welcome! Please fill in your details once so we can record your attendance.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                            <Phone className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            placeholder="08012345678"
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name *</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                            <User className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="e.g. Samuel Adebayo"
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender *</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => handleGenderChange(e.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Residential Address (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                            <MapPin className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={homeAddress}
                                            onChange={(e) => handleAddressChange(e.target.value)}
                                            placeholder="e.g. 12 Ikeja Way, Lagos"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition"
                                >
                                    {submitting ? 'Registering...' : 'Complete First-Time Check-In'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </main>

            <GuestQrScanner
                isOpen={showScannerModal}
                onClose={() => setShowScannerModal(false)}
                onSuccess={(dateStr) => void handleScanSuccess(dateStr)}
            />

            <Footer />
        </div>
    );
}

export default function GuestCheckInPage() {
    return (
        <Suspense fallback={<LoadingSpinner text="Loading Visitor Gateway..." icon={Heart} />}>
            <GuestContent />
        </Suspense>
    );
}