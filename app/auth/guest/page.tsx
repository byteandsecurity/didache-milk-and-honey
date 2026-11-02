'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserCheck, Heart, Sparkles, Phone, MapPin, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Footer from '@/Components/Footer';

export default function GuestCheckInPage() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('Male');
    const [homeAddress, setHomeAddress] = useState('');

    const [isExistingGuest, setIsExistingGuest] = useState<boolean | null>(null);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [guestNameConfirmed, setGuestNameConfirmed] = useState('');
    const [visitCount, setVisitCount] = useState(1);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    // 1. Phone number lookup handler
    const handlePhoneLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber.trim()) return;

        setIsCheckingPhone(true);
        setErrorMsg(null);

        // Check if phone exists in guest_profiles
        const { data: existingGuest, error } = await supabase
            .from('guest_profiles')
            .select('*')
            .eq('phone_number', phoneNumber.trim())
            .maybeSingle();

        if (error) {
            setErrorMsg('Could not verify phone number. Please try again.');
            setIsCheckingPhone(false);
            return;
        }

        if (existingGuest) {
            // Returning Guest found! Automatically update check-in stats
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
                setIsCheckingPhone(false);
                return;
            }

            setGuestNameConfirmed(existingGuest.full_name);
            setVisitCount(newCount);
            setIsCheckedIn(true);
        } else {
            // New Guest detected! Ask for Name & Address
            setIsExistingGuest(false);
        }

        setIsCheckingPhone(false);
    };

    // 2. New Guest registration & initial check-in handler
    const handleNewGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim() || !phoneNumber.trim()) {
            setErrorMsg('Please enter your full name and phone number.');
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        const { data: newGuest, error } = await supabase
            .from('guest_profiles')
            .insert([
                {
                    full_name: fullName.trim(),
                    phone_number: phoneNumber.trim(),
                    gender: gender,
                    home_address: homeAddress.trim() || null,
                    attendance_count: 1,
                },
            ])
            .select()
            .single();

        if (error || !newGuest) {
            setErrorMsg('Could not complete registration. Please try again.');
            setSubmitting(false);
            return;
        }

        setGuestNameConfirmed(newGuest.full_name);
        setVisitCount(1);
        setIsCheckedIn(true);
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
                <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </button>
                <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                        Visitor Check-In
                    </span>
                    <p className="text-xs text-slate-400">RCCG Milk & Honey</p>
                </div>
            </header>

            {/* Main Content Card */}
            <main className="my-8">
                {isCheckedIn ? (
                    /* SUCCESS CONFIRMATION DISPLAY */
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

                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-[11px] text-amber-300/90 text-left space-y-1">
                            <p className="font-semibold flex items-center gap-1 text-amber-400">
                                <Heart className="w-3.5 h-3.5" /> Note for Guests:
                            </p>
                            <p>
                                Guest check-ins do not require a password or dashboard setup. If you decide to attend regularly, your profile can easily be upgraded to full membership!
                            </p>
                        </div>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-200 transition"
                        >
                            Done
                        </button>
                    </div>
                ) : isExistingGuest === false ? (
                    /* NEW GUEST REGISTRATION FORM */
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                                <UserCheck className="w-4 h-4" /> First-Time Visitor Registration
                            </div>
                            <h1 className="text-xl font-bold text-white">Welcome to Milk & Honey!</h1>
                            <p className="text-xs text-slate-400">
                                Please provide a few quick details to complete your check-in for today's service.
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleNewGuestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone / WhatsApp Number</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                        <Phone className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        disabled
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 pl-9 pr-3 py-2.5 text-xs text-slate-400 cursor-not-allowed"
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
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Samuel Adebayo"
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Gender Selection Field */}
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender *</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Residential Address (Optional for visitation)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                        <MapPin className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        value={homeAddress}
                                        onChange={(e) => setHomeAddress(e.target.value)}
                                        placeholder="e.g. 12 Ikeja Way, Lagos"
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition"
                            >
                                {submitting ? 'Registering...' : 'Complete Guest Check-In'}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* INITIAL PHONE LOOKUP STEP */
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                                <Heart className="w-4 h-4" /> Visitor Check-In Portal
                            </div>
                            <h1 className="text-xl font-bold text-white">Enter Your Phone Number</h1>
                            <p className="text-xs text-slate-400">
                                Enter your phone number to check into Sunday service as a guest.
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handlePhoneLookup} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                        <Phone className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="08012345678"
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isCheckingPhone}
                                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition"
                            >
                                {isCheckingPhone ? 'Checking record...' : 'Continue Check-In'}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}