'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, QrCode, Edit3, Save, LifeBuoy, ArrowRight, BookOpen, LogOut, MessageCircle, X, Maximize2 } from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import Footer from '@/Components/Footer';
import QrScanner from '@/Components/member/QrScanner';
import MemberAnalyticsTestable from "@/Components/Test/member/MemeberAnalyticsTest";

interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    gender?: string;
    marital_status?: string;
    whatsapp_number?: string;
    phone_number?: string;
    email?: string;
    home_address?: string;
    occupation_type?: string;
    occupation_detail?: string;
    created_at?: string;
}

interface AttendanceRecord {
    id: string;
    user_id: string;
    session_date: string;
    checked_in_at?: string;
}

export default function MemberDashboard() {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [showExpandModal, setShowExpandModal] = useState(false); // Modal for expanded profile view

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('Male');
    const [maritalStatus, setMaritalStatus] = useState('Single');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [homeAddress, setHomeAddress] = useState('');
    const [occupationType, setOccupationType] = useState('student');
    const [occupationDetail, setOccupationDetail] = useState('');

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchMemberData = async () => {
            const memberId = localStorage.getItem('didache_member_id');
            if (!memberId) {
                router.push('/auth/member/login');
                return;
            }

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', memberId)
                .single();

            if (profileError || !profileData) {
                localStorage.removeItem('didache_member_id');
                router.push('/auth/member/login');
                return;
            }

            setProfile(profileData as MemberProfile);
            setFirstName(profileData.first_name || '');
            setLastName(profileData.last_name || '');
            setGender(profileData.gender || 'Male');
            setMaritalStatus(profileData.marital_status || 'Single');
            setWhatsappNumber(profileData.whatsapp_number || '');
            setPhoneNumber(profileData.phone_number || '');
            setEmail(profileData.email || '');
            setHomeAddress(profileData.home_address || '');
            setOccupationType(profileData.occupation_type || 'student');
            setOccupationDetail(profileData.occupation_detail || '');

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', memberId)
                .order('session_date', { ascending: false });

            setAttendance((attendanceData as AttendanceRecord[]) || []);
            setLoading(false);
        };

        void fetchMemberData();
    }, [router, supabase]);

    const handleUpdateProfile = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg(null);

        const memberId = localStorage.getItem('didache_member_id');
        const cleanEmail = email.trim() !== '' ? email.trim() : null;

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                gender: gender,
                marital_status: maritalStatus,
                whatsapp_number: whatsappNumber,
                phone_number: phoneNumber,
                email: cleanEmail,
                home_address: homeAddress,
                occupation_type: occupationType,
                occupation_detail: occupationDetail,
            })
            .eq('id', memberId);

        if (error) {
            window.alert(`Failed to update profile: ${error.message}`);
        } else {
            setSuccessMsg('Profile updated successfully!');
            setIsEditing(false);
            localStorage.setItem('didache_member_name', `${firstName} ${lastName}`);

            setProfile((prev) => prev ? {
                ...prev,
                first_name: firstName,
                last_name: lastName,
                gender: gender,
                marital_status: maritalStatus,
                whatsapp_number: whatsappNumber,
                phone_number: phoneNumber,
                email: cleanEmail || undefined,
                home_address: homeAddress,
                occupation_type: occupationType,
                occupation_detail: occupationDetail,
            } : null);
        }
        setSaving(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('didache_member_id');
        localStorage.removeItem('didache_member_name');
        localStorage.removeItem('didache_qr_date');
        router.push('/');
    };

    if (loading) {
        return <LoadingSpinner text="Loading your Didache profile..." icon={BookOpen} />;
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto">
            <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-white">
                            Welcome, {profile?.first_name}!
                        </h1>
                        <p className="text-xs text-slate-400">Milk & Honey Sunday School Portal</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-red-400 hover:border-red-500/30 transition"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                </button>
            </header>

            <main className="my-8 space-y-6">
                {successMsg && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
                        <span>{successMsg}</span>
                        <button
                            onClick={() => setSuccessMsg(null)}
                            className="text-emerald-400 hover:text-white p-1 transition"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="rounded-3xl border border-emerald-500/30 bg-linear-to-r from-emerald-950/40 via-slate-900/80 to-slate-900 p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                            <QrCode className="w-3.5 h-3.5" /> Sunday Service Active
                        </span>
                        <h2 className="text-xl font-bold text-white">Ready for Sunday School?</h2>
                        <p className="text-xs text-slate-400">Scan the Sunday QR code displayed in hall to log your attendance.</p>
                    </div>

                    <button
                        onClick={() => setShowScannerModal(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                    >
                        <QrCode className="w-4 h-4" />
                        <span>Scan QR Code</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <User className="w-4 h-4 text-emerald-400" />
                                <span>My Profile Info</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowExpandModal(true)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition"
                                    title="Expand Profile View"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Expand</span>
                                </button>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    {isEditing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <form onSubmit={(e) => void handleUpdateProfile(e)} className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender</label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Marital Status</label>
                                        <select
                                            value={maritalStatus}
                                            onChange={(e) => setMaritalStatus(e.target.value)}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                        >
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Widowed">Widowed</option>
                                            <option value="Divorced">Divorced</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Whatsapp Number</label>
                                    <input
                                        type="tel"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@domain.com"
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Occupation</label>
                                        <select
                                            value={occupationType}
                                            onChange={(e) => setOccupationType(e.target.value)}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                        >
                                            <option value="student">Student</option>
                                            <option value="employed">Employed</option>
                                            <option value="self_employed">Self Employed</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Profession Detail</label>
                                        <input
                                            type="text"
                                            value={occupationDetail}
                                            onChange={(e) => setOccupationDetail(e.target.value)}
                                            placeholder="e.g. Developer"
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={homeAddress}
                                        onChange={(e) => setHomeAddress(e.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Full Name</span>
                                    <span className="font-semibold text-slate-200">{profile?.first_name} {profile?.last_name}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Gender / Status</span>
                                    <span className="font-semibold text-slate-200">{profile?.gender || 'Male'} • {profile?.marital_status || 'Single'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Whatsapp Number</span>
                                    <span className="font-semibold text-slate-200">{profile?.whatsapp_number}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Phone Number</span>
                                    <span className="font-semibold text-slate-200">{profile?.phone_number}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Email Address</span>
                                    <span className="font-semibold text-slate-200 truncate max-w-50">{profile?.email || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Occupation</span>
                                    <span className="font-semibold text-slate-200 capitalize">{profile?.occupation_type} {profile?.occupation_detail ? `(${profile.occupation_detail})` : ''}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-400">Address</span>
                                    <span className="font-semibold text-slate-200 truncate max-w-50">{profile?.home_address || 'Not provided'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-6 space-y-4">
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                <span>Sunday School Department Support</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Have questions about Sunday school lessons or manuals? Reach out to teachers.
                            </p>
                            <a
                                href="https://wa.me/"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline pt-1"
                            >
                                <span>Chat with Sunday School Teachers</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <LifeBuoy className="w-4 h-4 text-emerald-400" />
                                <span>Technical Support (Byte & Security)</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Facing scanning or login issues? Contact the tech engineering team.
                            </p>
                            <a
                                href="mailto:byteandsecurity.support+didache-milk-and-honey-member@gmail.com?subject=Didache%20Portal%20Support%20Request"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline pt-1"
                            >
                                <span>Email Engineering Support</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Testable Analytics Component */}
                <MemberAnalyticsTestable attendanceHistory={attendance} profileCreatedAt={profile?.created_at} />
            </main>

            {/* EXPANDED PROFILE VIEW MODAL */}
            {showExpandModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-base font-bold text-white">
                                <User className="w-5 h-5 text-emerald-400" />
                                <span>Expanded Profile Information</span>
                            </div>
                            <button
                                onClick={() => setShowExpandModal(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs sm:text-sm">
                            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">First Name</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.first_name}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Last Name</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.last_name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Gender</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.gender || 'Male'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Marital Status</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.marital_status || 'Single'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Phone Number</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.phone_number}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">WhatsApp Number</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.whatsapp_number || profile?.phone_number}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Email Address</span>
                                <p className="font-semibold text-slate-200 mt-0.5 break-all">{profile?.email || 'Not provided'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Occupation</span>
                                    <p className="font-semibold text-slate-200 mt-0.5 capitalize">{profile?.occupation_type}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Profession Detail</span>
                                    <p className="font-semibold text-slate-200 mt-0.5">{profile?.occupation_detail || 'None specified'}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Residential Address</span>
                                <p className="font-semibold text-slate-200 mt-0.5 break-words">{profile?.home_address || 'Not provided'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowExpandModal(false)}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-white transition"
                        >
                            Close View
                        </button>
                    </div>
                </div>
            )}

            <QrScanner
                isOpen={showScannerModal}
                onClose={() => setShowScannerModal(false)}
                onSuccess={() => window.location.reload()}
            />

            <Footer />
        </div>
    );
}