'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, MessageSquare, Briefcase, MapPin, CheckCircle, ArrowLeft, Mail, Users, Sparkles, Heart } from 'lucide-react';
import Footer from '@/Components/Footer';
import LoadingSpinner from '@/Components/LoadingSpinner';

function RegisterForm() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('Male');
    const [maritalStatus, setMaritalStatus] = useState('Single');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [email, setEmail] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobDay, setDobDay] = useState('');
    const [dobYear, setDobYear] = useState('');
    const [occupationType, setOccupationType] = useState('student');
    const [occupationDetail, setOccupationDetail] = useState('');
    const [homeAddress, setHomeAddress] = useState('');

    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [isRegisteredAndCheckedIn, setIsRegisteredAndCheckedIn] = useState(false);
    const [isDirectRegisterSuccess, setIsDirectRegisterSuccess] = useState(false);
    const [totalVisits, setTotalVisits] = useState(1);

    const router = useRouter();
    const searchParams = useSearchParams();
    const rawDateParam = searchParams.get('date');
    const supabase = createClient();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
        setRedirecting(false);
        setIsRegisteredAndCheckedIn(false);
        setIsDirectRegisterSuccess(false);
        setErrorMsg(null);
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setWhatsappNumber('');
        setEmail('');
        setHomeAddress('');
        setOccupationDetail('');
    }, []);

    useEffect(() => {
        if (rawDateParam) {
            localStorage.setItem('didache_qr_date', rawDateParam);
        }
    }, [rawDateParam]);

    const handleRegister = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const cleanPhone = phoneNumber.trim();
            const cleanWhatsapp = whatsappNumber.trim() || cleanPhone;
            const cleanEmail = email.trim() !== '' ? email.trim() : null;

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

            let formattedDOB: string | null = null;
            if (dobMonth && dobDay) {
                const yr = dobYear ? dobYear : '1900';
                formattedDOB = `${yr}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
            }

            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    gender: gender,
                    marital_status: maritalStatus,
                    phone_number: phoneNumber.trim(),
                    whatsapp_number: whatsappNumber.trim() || phoneNumber.trim(),
                    email: cleanEmail,
                    dob: formattedDOB,
                    occupation_type: occupationType,
                    occupation_detail: occupationDetail.trim() || null,
                    home_address: homeAddress.trim() || null,
                })
                .select()
                .single();

            if (error || !newProfile) {
                setErrorMsg(error?.message || 'Problem creating profile.');
                setLoading(false);
                return;
            }

            localStorage.setItem('didache_member_id', newProfile.id);
            localStorage.setItem('didache_member_name', `${newProfile.first_name} ${newProfile.last_name}`);

            const activeDate = rawDateParam || (typeof window !== 'undefined' ? localStorage.getItem('didache_qr_date') : null);

            if (activeDate) {
                await supabase.from('attendance').insert([
                    {
                        user_id: newProfile.id,
                        session_date: activeDate,
                        checked_in_at: new Date().toISOString(),
                    }
                ]);

                setTotalVisits(1);
                setIsRegisteredAndCheckedIn(true);
                setLoading(false);
                return;
            }

            setLoading(false);
            setRedirecting(true);
            setTimeout(() => {
                router.push('/member/dashboard');
            }, 800);
        } catch (err: unknown) {
            console.error('Registration error details:', err);
            const message = err instanceof Error ? err.message : 'Could not complete registration.';
            setErrorMsg(message);
            setLoading(false);
            setRedirecting(false);
        }
    };

    if (redirecting) {
        return <LoadingSpinner text="Setting up your dashboard..." icon={Heart} />;
    }

    if (isRegisteredAndCheckedIn) {
        return (
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        Registration & Attendance Confirmed
                    </span>
                    <h2 className="text-xl font-bold text-white">Welcome, {firstName}!</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Your profile has been created successfully, and your Sunday attendance is recorded. God bless you!
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 flex items-center justify-between">
                    <span>Total Sunday Visits:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">{totalVisits} Sunday</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        onClick={() => router.push('/member/dashboard')}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition"
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    if (isDirectRegisterSuccess) {
        return (
            <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        Registration Successful
                    </span>
                    <h2 className="text-xl font-bold text-white">Welcome to Milk & Honey, {firstName}!</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Your member profile has been created. To log your attendance on Sundays, visit your dashboard and scan the hall QR code.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        onClick={() => router.push('/member/dashboard')}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition"
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white">✕</button>
                </div>
            )}

            <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                required
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
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last Name"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

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
                        <label className="block text-xs font-medium text-slate-300 mb-1">Marital Status *</label>
                        <select
                            value={maritalStatus}
                            onChange={(e) => setMaritalStatus(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-3 text-sm text-slate-100 focus:outline-none"
                        >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Divorced">Divorced</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="08012345678"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Number</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="Same as phone? Leave Blank"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (Optional)</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-3 text-sm text-slate-100 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Date of Birth <span className="text-slate-500 font-normal">(Year Optional)</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
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

                            <select
                                value={dobYear}
                                onChange={(e) => setDobYear(e.target.value)}
                                className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-xs text-slate-100 focus:outline-none"
                            >
                                <option value="">Year</option>
                                {Array.from({ length: 90 }, (_, i) => 2026 - i).map((y) => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Occupation Type *</label>
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

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Profession / Details <span className="text-slate-500 font-normal">(e.g. Banking)</span>
                        </label>
                        <input
                            type="text"
                            value={occupationDetail}
                            onChange={(e) => setOccupationDetail(e.target.value)}
                            placeholder="Specify profession..."
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 px-3 text-sm text-slate-100 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Residential Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
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
                    {loading ? (
                        <span>Creating Profile...</span>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Register & Complete Setup</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function MemberRegisterPage() {
    const router = useRouter();

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

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

                    <Suspense fallback={<LoadingSpinner text="Preparing registration..." icon={Heart} />}>
                        <RegisterForm />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </div>
    );
}