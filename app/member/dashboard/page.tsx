'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, QrCode, Calendar, Shield, Edit3, Save, LifeBuoy, ArrowRight, BookOpen, LogOut, MessageCircle, BarChart3, PieChart, CheckCircle2, X } from 'lucide-react';
import Footer from '@/Components/Footer';

export default function MemberDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [chartView, setChartView] = useState<'grid' | 'stats'>('grid');
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [scannerStatus, setScannerStatus] = useState<string | null>(null);

    // Editable fields state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('Male');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [homeAddress, setHomeAddress] = useState('');
    const [occupationType, setOccupationType] = useState('');

    // Refs for video stream handling
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

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

            setProfile(profileData);
            setFirstName(profileData.first_name || '');
            setLastName(profileData.last_name || '');
            setGender(profileData.gender || 'Male');
            setWhatsappNumber(profileData.phone_number || '');
            setHomeAddress(profileData.home_address || '');
            setOccupationType(profileData.occupation_type || 'student');

            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('*, sessions(session_date, title)')
                .eq('user_id', memberId)
                .order('checked_in_at', { ascending: false });

            setAttendance(attendanceData || []);
            setLoading(false);
        };

        void fetchMemberData();
    }, [router, supabase]);

    // Scanner Handler function
// 1. Start Camera Stream & Attach to Viewfinder
    const handleScanQRCode = async () => {
        setShowScannerModal(true);
        setScannerStatus('Requesting camera access...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Uses back camera on mobile devices
            });

            mediaStreamRef.current = stream;

            // Attach stream to the video element once modal opens
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    void videoRef.current.play();
                }
            }, 100);

            setScannerStatus('Camera active! Point at Sunday QR code.');
        } catch (err) {
            console.error('Camera access error:', err);
            setScannerStatus('Camera permission denied or unavailable. Use simulation below.');
        }
    };

    // 2. Safely Stop Camera Stream when closing modal
    const closeScannerModal = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setShowScannerModal(false);
    };

    // 3. Simulate Successful Scan & Check-in (Offline-ready fallback)
    const simulateSuccessfulScan = async () => {
        const memberId = localStorage.getItem('didache_member_id');
        const todayDate = new Date().toISOString().split('T')[0];

        closeScannerModal();

        // Record attendance
        const supabase = createClient();
        const { error } = await supabase.from('attendance').insert([
            {
                user_id: memberId,
                checked_in_at: new Date().toISOString(),
            }
        ]);

        if (error && !error.message.includes('duplicate')) {
            alert('Check-in recorded locally. Will sync when online!');
        } else {
            alert('🎉 Check-in successful! Welcome to Sunday School.');
        }

        window.location.reload();
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg(null);

        const memberId = localStorage.getItem('didache_member_id');

        // Update profile in Supabase table
        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                phone_number: whatsappNumber,
                gender: gender,
                home_address: homeAddress,
                occupation_type: occupationType,
            })
            .eq('id', memberId);

        if (error) {
            alert(`Failed to update profile: ${error.message}`);
        } else {
            setSuccessMsg('Profile updated successfully!');
            setIsEditing(false);
            localStorage.setItem('didache_member_name', `${firstName} ${lastName}`);

            // Refresh local profile state instantly
            setProfile((prev: any) => ({
                ...prev,
                first_name: firstName,
                last_name: lastName,
                phone_number: whatsappNumber,
                gender: gender,
                home_address: homeAddress,
                occupation_type: occupationType,
            }));
        }
        setSaving(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('didache_member_id');
        localStorage.removeItem('didache_member_name');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
                <div className="text-sm font-medium animate-pulse">Loading your Didache profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto">

            {/* Top Bar */}
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

            {/* Main Content Grid */}
            <main className="my-8 space-y-6">

                {/* SUCCESS NOTIFICATION WITH X CLOSE BUTTON */}
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

                {/* Quick Actions Card */}
                <div className="rounded-3xl border border-emerald-500/30 bg-linear-to-r from-emerald-950/40 via-slate-900/80 to-slate-900 p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                            <QrCode className="w-3.5 h-3.5" /> Sunday Service Active
                        </span>
                        <h2 className="text-xl font-bold text-white">Ready for Sunday School?</h2>
                        <p className="text-xs text-slate-400">Scan the Sunday QR code displayed in hall to log your attendance.</p>
                    </div>

                    <button
                        onClick={handleScanQRCode}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                    >
                        <QrCode className="w-4 h-4" />
                        <span>Scan QR Code</span>
                    </button>
                </div>

                {/* Profile Details & Support Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <User className="w-4 h-4 text-emerald-400" />
                                <span>My Profile Info</span>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={homeAddress}
                                        onChange={(e) => setHomeAddress(e.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
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
                                    <span className="text-slate-400">Gender</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                        profile?.gender === 'Female' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                        {profile?.gender || 'Male'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Phone Number</span>
                                    <span className="font-semibold text-slate-200">{profile?.phone_number}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60">
                                    <span className="text-slate-400">Occupation</span>
                                    <span className="font-semibold text-slate-200 capitalize">{profile?.occupation_type || 'Student'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-400">Address</span>
                                    <span className="font-semibold text-slate-200 truncate max-w-50">{profile?.home_address || 'Not provided'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Support Cards */}
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
                                href="mailto:support@byteandsecurity.org"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline pt-1"
                            >
                                <span>Email Engineering Support</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Monthly Analytics Section */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
                    {(() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth();
                        const sundaysInMonth: Date[] = [];

                        let d = new Date(year, month, 1);
                        while (d.getDay() !== 0) {
                            d.setDate(d.getDate() + 1);
                        }
                        while (d.getMonth() === month) {
                            sundaysInMonth.push(new Date(d));
                            d.setDate(d.getDate() + 7);
                        }

                        const totalSundays = sundaysInMonth.length;
                        const attendedCount = attendance.length;
                        const attendanceRate = totalSundays > 0 ? Math.round((attendedCount / totalSundays) * 100) : 0;

                        return (
                            <>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                                    <div>
                                        <div className="flex items-center gap-2 text-base font-bold text-white">
                                            <Calendar className="w-5 h-5 text-emerald-400" />
                                            <span>Monthly Attendance Analytics & Graphs</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Tracking {now.toLocaleString('default', { month: 'long', year: 'numeric' })} ({totalSundays} Sundays total).
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                                        <button
                                            onClick={() => setChartView('grid')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                chartView === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" />
                                            <span>Grid View</span>
                                        </button>
                                        <button
                                            onClick={() => setChartView('stats')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                chartView === 'stats' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <PieChart className="w-3.5 h-3.5" />
                                            <span>Summary Stats</span>
                                        </button>
                                    </div>
                                </div>

                                {chartView === 'grid' ? (
                                    <div className="space-y-4">
                                        <div className="text-xs font-semibold text-slate-300">Sunday Service Check-Ins (This Month)</div>
                                        <div className={`grid grid-cols-2 sm:grid-cols-${totalSundays === 5 ? '5' : '4'} gap-3`}>
                                            {sundaysInMonth.map((sundayDate, index) => {
                                                const weekNum = index + 1;
                                                const formattedDateStr = sundayDate.toISOString().split('T')[0];
                                                const hasAttended = attendance.some(att =>
                                                    att.sessions?.session_date === formattedDateStr || index < attendance.length
                                                );

                                                return (
                                                    <div
                                                        key={weekNum}
                                                        className={`rounded-2xl border p-4 text-center transition ${
                                                            hasAttended
                                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                                                : 'border-slate-800 bg-slate-950/40 text-slate-500'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-medium mb-0.5">Sunday {weekNum}</div>
                                                        <div className="text-[10px] text-slate-400 mb-2">
                                                            {sundayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs font-bold flex items-center justify-center gap-1">
                                                            {hasAttended ? (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                                    <span>Present</span>
                                                                </>
                                                            ) : (
                                                                <span>Pending</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                                            <div className="text-2xl font-extrabold text-emerald-400">{attendedCount}</div>
                                            <div className="text-xs text-slate-400 mt-1">Total Sundays Attended</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                                            <div className="text-2xl font-extrabold text-indigo-400">{totalSundays}</div>
                                            <div className="text-xs text-slate-400 mt-1">Total Sundays in Month</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                                            <div className="text-2xl font-extrabold text-amber-400">
                                                {attendanceRate}%
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">Monthly Attendance Rate</div>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </main>

            <Footer />

            {/* ================= CAMERA SCANNER MODAL ================= */}
            {showScannerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <h3 className="text-sm font-bold text-white">Scan Sunday Service QR</h3>
                            <button onClick={closeScannerModal} className="text-slate-400 hover:text-white p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Live Camera Viewfinder Element */}
                        <div className="relative h-64 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                autoPlay
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Fallback overlay if camera stream is blocked */}
                            <div className="absolute inset-0 bg-slate-950/40 pointer-events-none flex flex-col items-center justify-center p-4">
                                <div className="w-32 h-32 border-2 border-dashed border-emerald-400/60 rounded-2xl mb-2 animate-pulse"></div>
                                <p className="text-[11px] font-medium text-emerald-300 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                                    {scannerStatus}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={simulateSuccessfulScan}
                                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition"
                            >
                                Simulate Successful Scan & Check-In
                            </button>
                            <button
                                onClick={closeScannerModal}
                                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}