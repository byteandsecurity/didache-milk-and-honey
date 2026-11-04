'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, MessageSquare, Briefcase, MapPin, CheckCircle, ArrowLeft, Mail, Users } from 'lucide-react';
import Footer from '@/Components/Footer';
import LoadingSpinner from '@/Components/LoadingSpinner';

export default function MemberRegisterPage() {
    // Initialize state from localStorage if available (prevents loss on refresh)
    const [firstName, setFirstName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_firstName') || '' : '');
    const [lastName, setLastName] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_lastName') || '' : '');
    const [gender, setGender] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_gender') || 'Male' : 'Male');
    const [phoneNumber, setPhoneNumber] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_phoneNumber') || '' : '');
    const [whatsappNumber, setWhatsappNumber] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_whatsappNumber') || '' : '');
    const [email, setEmail] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_email') || '' : '');
    const [dobMonth, setDobMonth] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_dobMonth') || '' : '');
    const [dobDay, setDobDay] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_dobDay') || '' : '');
    const [dobYear, setDobYear] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_dobYear') || '' : '');
    const [occupationType, setOccupationType] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_occupationType') || 'student' : 'student');
    const [homeAddress, setHomeAddress] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('draft_homeAddress') || '' : '');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    // Save drafts to localStorage whenever input changes
    useEffect(() => {
        localStorage.setItem('draft_firstName', firstName);
        localStorage.setItem('draft_lastName', lastName);
        localStorage.setItem('draft_gender', gender);
        localStorage.setItem('draft_phoneNumber', phoneNumber);
        localStorage.setItem('draft_whatsappNumber', whatsappNumber);
        localStorage.setItem('draft_email', email);
        localStorage.setItem('draft_dobMonth', dobMonth);
        localStorage.setItem('draft_dobDay', dobDay);
        localStorage.setItem('draft_dobYear', dobYear);
        localStorage.setItem('draft_occupationType', occupationType);
        localStorage.setItem('draft_homeAddress', homeAddress);
    }, [firstName, lastName, gender, phoneNumber, whatsappNumber, email, dobMonth, dobDay, dobYear, occupationType, homeAddress]);

    // Clear drafts from localStorage after successful registration
    const clearDrafts = () => {
        localStorage.removeItem('draft_firstName');
        localStorage.removeItem('draft_lastName');
        localStorage.removeItem('draft_gender');
        localStorage.removeItem('draft_phoneNumber');
        localStorage.removeItem('draft_whatsappNumber');
        localStorage.removeItem('draft_email');
        localStorage.removeItem('draft_dobMonth');
        localStorage.removeItem('draft_dobDay');
        localStorage.removeItem('draft_dobYear');
        localStorage.removeItem('draft_occupationType');
        localStorage.removeItem('draft_homeAddress');
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const cleanPhone = phoneNumber.trim();
            const cleanWhatsapp = whatsappNumber.trim() || cleanPhone;
            const cleanEmail = email.trim();

            // 1. Check if profile exists matching phone OR whatsapp OR email
            let orConditions = `phone_number.eq.${cleanPhone},whatsapp_number.eq.${cleanPhone},phone_number.eq.${cleanWhatsapp},whatsapp_number.eq.${cleanWhatsapp}`;
            if (cleanEmail) {
                orConditions += `,email.eq.${cleanEmail}`;
            }

            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, phone_number, whatsapp_number, email')
                .or(orConditions)
                .maybeSingle();

            if (existingProfile) {
                if (existingProfile.email === cleanEmail && cleanEmail) {
                    setErrorMsg(`An account with email ${cleanEmail} already exists. Please sign in!`);
                } else {
                    setErrorMsg(`An account with this phone/WhatsApp number already exists for ${existingProfile.first_name} ${existingProfile.last_name}. Please sign in instead!`);
                }
                setLoading(false);
                return;
            }

            // Construct Date of Birth string (Handle optional year)
            let formattedDOB: string | null = null;
            if (dobMonth && dobDay) {
                const yr = dobYear ? dobYear : '1900'; // Default placeholder year if omitted
                formattedDOB = `${yr}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
            }

            // 2. Insert new profile into database with Gender, Email & Optional DOB
            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert({
                    id: crypto.randomUUID(),
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    gender: gender,
                    phone_number: phoneNumber.trim(),
                    whatsapp_number: whatsappNumber.trim() || phoneNumber.trim(),
                    email: email.trim() || null,
                    date_of_birth: formattedDOB,
                    occupation_type: occupationType,
                    home_address: homeAddress.trim() || null,
                    role: 'member',
                })
                .select()
                .single();

            if (error) {
                setErrorMsg(error.message || `Problem Creating a Profile`);
                setLoading(false);
                return;
            }

            if (newProfile) {
                localStorage.setItem('didache_member_id', newProfile.id);
                localStorage.setItem('didache_member_name', `${newProfile.first_name} ${newProfile.last_name}`);
            }

            clearDrafts();
            router.push('/member/dashboard');
        } catch (err: any) {
            console.error('Registration error details:', err);
            if (err?.message?.includes('row-level security') || err?.code === '42501') {
                setErrorMsg('Registration temporarily unavailable. Please try again or contact support.');
            } else if (err?.message?.includes('duplicate key') || err?.code === '23505') {
                setErrorMsg('This phone number or email is already registered. Please sign in instead.');
            } else {
                setErrorMsg('Could not complete registration. Please check your internet connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Creating your member profile..." icon={User} />;
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-2xl mx-auto">
            <div>
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-6 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Go Back</span>
                </button>

                <div className="space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                            Member Registration
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Fill in your details once. Your phone will remember you for instant Sunday check-ins!
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                        {errorMsg && (
                            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">

                            {/* First & Last Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            autoComplete="given-name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="First Name"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Last Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            autoComplete="family-name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Last Name"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gender & Phone Number */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Gender *</label>
                                    <div className="relative">
                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            required
                                            autoComplete="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="08012345678"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp & Email Address */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Number</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            autoComplete="tel"
                                            value={whatsappNumber}
                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                            placeholder="Same as phone? Leave Blank"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (Optional)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Date of Birth (Optional Year) & Occupation */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Date of Birth <span className="text-slate-500 font-normal">(Year is optional)</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {/* Month */}
                                        <select
                                            value={dobMonth}
                                            onChange={(e) => setDobMonth(e.target.value)}
                                            className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-xs text-slate-100 focus:outline-none"
                                        >
                                            <option value="">Month</option>
                                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                                                <option key={m} value={String(idx + 1)}>{m}</option>
                                            ))}
                                        </select>

                                        {/* Day */}
                                        <select
                                            value={dobDay}
                                            onChange={(e) => setDobDay(e.target.value)}
                                            className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-xs text-slate-100 focus:outline-none"
                                        >
                                            <option value="">Day</option>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                                <option key={d} value={String(d)}>{d}</option>
                                            ))}
                                        </select>

                                        {/* Optional Year */}
                                        <select
                                            value={dobYear}
                                            onChange={(e) => setDobYear(e.target.value)}
                                            className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-xs text-slate-100 focus:outline-none"
                                        >
                                            <option value="">Year (Opt)</option>
                                            {Array.from({ length: 90 }, (_, i) => 2026 - i).map((y) => (
                                                <option key={y} value={String(y)}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Occupation</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <select
                                            value={occupationType}
                                            onChange={(e) => setOccupationType(e.target.value)}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                        >
                                            <option value="student">Student</option>
                                            <option value="employed">Employed</option>
                                            <option value="self_employed">Self Employed / Business</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Residential Address */}
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Residential Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        autoComplete="street-address"
                                        value={homeAddress}
                                        onChange={(e) => setHomeAddress(e.target.value)}
                                        placeholder="Residential area..."
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] disabled:opacity-50 transition-all"
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span>Register & Complete Setup</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}