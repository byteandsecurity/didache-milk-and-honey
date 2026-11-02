'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    ShieldCheck, QrCode, Users, LogOut, Calendar, UserPlus,
    Search, CheckCircle2, XCircle, AlertCircle, Sparkles,
    UserCheck, Shield, X, Eye, Trash2, Edit2, Save
} from 'lucide-react';
import Footer from '@/Components/Footer';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'guests' | 'sessions' | 'staff'>('overview');

    // Data States
    const [adminProfile, setAdminProfile] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [guests, setGuests] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [adminList, setAdminList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Modal States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [isEditingMember, setIsEditingMember] = useState(false);

    // Member edit form states
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editGender, setEditGender] = useState('Male');

    // Guest edit states
    const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
    const [isEditingGuest, setIsEditingGuest] = useState(false);
    const [editGuestName, setEditGuestName] = useState('');
    const [editGuestPhone, setEditGuestPhone] = useState('');
    const [editGuestGender, setEditGuestGender] = useState('Male');

    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState<'member' | 'guest'>('member');

    // Form state for adding member/guest
    const [newFirstName, setNewFirstName] = useState('');
    const [newLastName, setNewLastName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newGender, setNewGender] = useState<'Male' | 'Female'>('Male');
    const [formMsg, setFormMsg] = useState<string | null>(null);
    const [savingUser, setSavingUser] = useState(false);

    // QR Session generator state (Persisted in localStorage)
    const [selectedSessionDate, setSelectedSessionDate] = useState('');
    const [activeQrCode, setActiveQrCode] = useState<string | null>(null);

    useEffect(() => {
        const savedDate = localStorage.getItem('didache_qr_date');
        const savedQr = localStorage.getItem('didache_qr_code');
        const todayStr = new Date().toISOString().split('T')[0];

        setSelectedSessionDate(savedDate || todayStr);
        if (savedQr) {
            setActiveQrCode(savedQr);
        }
    }, []);

    const [sundaysInMonth, setSundaysInMonth] = useState<Date[]>([]);
    const [nowDate, setNowDate] = useState<Date | null>(null);
    useEffect(() => {
        const now = new Date();
        setNowDate(now);
        const year = now.getFullYear();
        const month = now.getMonth();
        const sundays: Date[] = [];

        let d = new Date(year, month, 1);
        while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
        while (d.getMonth() === month) {
            sundays.push(new Date(d));
            d.setDate(d.getDate() + 7);
        }
        setSundaysInMonth(sundays);
    }, []);

    const router = useRouter();
    const supabase = createClient();

    // Load Admin Data
    const fetchDashboardData = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/auth/admin/login');
            return;
        }

        const { data: profile } = await supabase
            .from('admin_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (!profile) {
            await supabase.auth.signOut();
            router.push('/auth/admin');
            return;
        }

        setAdminProfile(profile);

        // Fetch Members
        const { data: memberData } = await supabase
            .from('profiles')
            .select('*')
            .order('first_name', { ascending: true });
        setMembers(memberData || []);

        // Fetch Guests
        const { data: guestData } = await supabase
            .from('guest_profiles')
            .select('*')
            .order('created_at', { ascending: false });
        setGuests(guestData || []);

        // Fetch Staff
        const { data: staffData } = await supabase
            .from('admin_profiles')
            .select('*')
            .order('role', { ascending: false });
        setAdminList(staffData || []);

        // Fetch Sessions & Attendance
        const { data: sessionData } = await supabase
            .from('sunday_sessions')
            .select('*')
            .order('session_date', { ascending: false });
        setSessions(sessionData || []);

        const { data: attendanceData } = await supabase
            .from('attendance')
            .select('*');
        setAttendance(attendanceData || []);

        setLoading(false);
    };

    useEffect(() => {
        void fetchDashboardData();
    }, [router, supabase]);

    const handleGenerateQr = (dateStr: string) => {
        const qrUrl = `https://didache-milk-and-honey.vercel.app/checkin?date=${dateStr}`;
        setActiveQrCode(qrUrl);
        setSelectedSessionDate(dateStr);
        localStorage.setItem('didache_qr_code', qrUrl);
        localStorage.setItem('didache_qr_date', dateStr);
    };

    // Manual Add Member / Guest
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingUser(true);
        setFormMsg(null);

        if (addType === 'member') {
            const { error } = await supabase.from('profiles').insert([
                {
                    first_name: newFirstName,
                    last_name: newLastName,
                    email: newEmail || null,
                    phone_number: newPhone,
                    gender: newGender,
                    role: 'member',
                },
            ]);
            if (error) { setFormMsg(`Error: ${error.message}`); setSavingUser(false); return; }
        } else {
            const { error } = await supabase.from('guest_profiles').insert([
                {
                    full_name: `${newFirstName} ${newLastName}`,
                    email: newEmail || null,
                    phone_number: newPhone,
                    gender: newGender,
                    attendance_count: 1,
                },
            ]);
            if (error) { setFormMsg(`Error: ${error.message}`); setSavingUser(false); return; }
        }

        setSavingUser(false);
        setShowAddModal(false);
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPhone('');
        void fetchDashboardData();
    };

    // Save Member Edits
    const handleSaveMemberEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: editFirstName,
                last_name: editLastName,
                email: editEmail || null,
                phone_number: editPhone,
                gender: editGender,
            })
            .eq('id', selectedMember.id);

        if (!error) {
            setIsEditingMember(false);
            setSelectedMember(null);
            void fetchDashboardData();
        } else {
            alert(`Failed to update member: ${error.message}`);
        }
    };

    // Delete Member
    const handleDeleteMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to delete this member?')) return;
        const { error } = await supabase.from('profiles').delete().eq('id', memberId);
        if (!error) {
            setSelectedMember(null);
            void fetchDashboardData();
        } else {
            alert(`Failed to delete member: ${error.message}`);
        }
    };

    // Save Guest Edits
    const handleSaveGuestEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGuest) return;

        const { error } = await supabase
            .from('guest_profiles')
            .update({
                full_name: editGuestName,
                phone_number: editGuestPhone,
                gender: editGuestGender,
            })
            .eq('id', selectedGuest.id);

        if (!error) {
            setIsEditingGuest(false);
            setSelectedGuest(null);
            void fetchDashboardData();
        } else {
            alert(`Failed to update guest: ${error.message}`);
        }
    };

    // Delete Guest
    const handleDeleteGuest = async (guestId: string) => {
        if (!confirm('Are you sure you want to delete this guest?')) return;
        const { error } = await supabase.from('guest_profiles').delete().eq('id', guestId);
        if (!error) {
            setSelectedGuest(null);
            void fetchDashboardData();
        } else {
            alert(`Failed to delete guest: ${error.message}`);
        }
    };

    // Upgrade Guest
    const handleUpgradeGuest = async (guest: any) => {
        const nameParts = guest.full_name.split(' ');
        const firstName = nameParts[0] || guest.full_name;
        const lastName = nameParts.slice(1).join(' ') || 'Member';

        const { error: insertErr } = await supabase.from('profiles').insert([
            {
                first_name: firstName,
                last_name: lastName,
                email: guest.email || null,
                phone_number: guest.phone_number,
                home_address: guest.home_address,
                gender: guest.gender || 'Male',
                role: 'member',
            },
        ]);

        if (!insertErr) {
            await supabase.from('guest_profiles').update({ is_converted_to_member: true }).eq('id', guest.id);
            void fetchDashboardData();
        }
    };

    const filteredMembers = members.filter(
        (m) =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.phone_number?.includes(searchQuery)
    );

    const upgradeEligibleGuests = guests.filter((g) => !g.is_converted_to_member && g.attendance_count >= 3);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('didache_admin_name');
        router.push('/auth/admin');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
                <div className="text-sm font-medium animate-pulse">Loading Admin Console...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-white">
                                {adminProfile?.first_name} {adminProfile?.last_name}
                            </h1>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                {adminProfile?.role}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">RCCG Milk & Honey Sunday School Portal</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                        onClick={() => { setAddType('member'); setShowAddModal(true); }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Member / Guest</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="my-6 flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
                {[
                    { id: 'overview', label: 'Overview Analytics', icon: Calendar },
                    { id: 'roster', label: `Member Roster (${members.length})`, icon: Users },
                    { id: 'guests', label: `Guest Management (${guests.length})`, icon: UserCheck, badge: upgradeEligibleGuests.length },
                    { id: 'sessions', label: 'Sunday QR Generator', icon: QrCode },
                    { id: 'staff', label: `Staff Directory (${adminList.length}/5)`, icon: Shield },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                                isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.badge ? <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">{tab.badge}</span> : null}
                        </button>
                    );
                })}
            </nav>

            <main className="flex-1 mb-8">
                {/* ================= TAB 1: OVERVIEW ================= */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                            💡 <strong>Attendance Legend:</strong> <span className="text-emerald-400 font-bold">✓</span> = Present | <span className="text-red-400 font-bold">✕</span> = Absent | <span className="text-slate-400 font-bold">○</span> = Pending (Future) | <span className="text-blue-400 font-bold">-</span> = Sunday School did not hold.
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                                <span className="text-xs font-semibold text-slate-400">Total Members</span>
                                <div className="text-2xl font-extrabold text-white mt-2">{members.length}</div>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                                <span className="text-xs font-semibold text-slate-400">Total Guests</span>
                                <div className="text-2xl font-extrabold text-amber-400 mt-2">{guests.length}</div>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                                <span className="text-xs font-semibold text-slate-400">Sundays This Month</span>
                                <div className="text-2xl font-extrabold text-indigo-400 mt-2">{sundaysInMonth.length}</div>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                                <span className="text-xs font-semibold text-slate-400">Upgrade Eligible</span>
                                <div className="text-2xl font-extrabold text-emerald-400 mt-2">{upgradeEligibleGuests.length}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TAB 2: MEMBER ROSTER MATRIX ================= */}
                {activeTab === 'roster' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <p>💡 <strong>Roster Matrix:</strong> Attendance status is automatically calculated from real database records.</p>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 pt-1">
                                    <span className="inline-flex items-center gap-1"><strong className="text-emerald-400">✓</strong> Present</span>
                                    <span className="inline-flex items-center gap-1"><strong className="text-red-400">✕</strong> Absent</span>
                                    <span className="inline-flex items-center gap-1"><strong className="text-slate-400">○</strong> Pending</span>
                                    <span className="inline-flex items-center gap-1"><strong className="text-blue-400">-</strong> No Service Held</span>
                                </div>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search member..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                                        <th className="py-3.5 px-4 font-semibold">Member Name</th>
                                        <th className="py-3.5 px-4 font-semibold">Gender</th>
                                        <th className="py-3.5 px-4 font-semibold">Phone / WhatsApp</th>
                                        {sundaysInMonth.map((s, idx) => (
                                            <th key={idx} className="py-3.5 px-3 font-semibold text-center">
                                                Sun {idx + 1}
                                                <div className="text-[9px] text-slate-500 font-normal">{s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                            </th>
                                        ))}
                                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                    {filteredMembers.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-semibold text-white">{m.first_name} {m.last_name}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${m.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {m.gender || 'Male'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">{m.phone_number}</td>

                                            {/* REAL DYNAMIC ATTENDANCE STATES */}
                                            {sundaysInMonth.map((sundayDate, sIdx) => {
                                                const dateStr = sundayDate.toISOString().split('T')[0];
                                                const isFuture = sundayDate > new Date();

                                                // Check if any attendance records exist for this Sunday date across the church
                                                const totalSundayAttendance = attendance.filter(att => att.checked_in_at?.startsWith(dateStr));
                                                const serviceHeld = totalSundayAttendance.length > 0;
                                                const memberCheckedIn = totalSundayAttendance.some(att => att.user_id === m.id);

                                                return (
                                                    <td key={sIdx} className="py-3 px-3 text-center">
                                                        {isFuture ? (
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-slate-500 font-bold" title="Pending (Future Sunday)">○</span>
                                                        ) : !serviceHeld ? (
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold" title="Sunday School did not hold">-</span>
                                                        ) : memberCheckedIn ? (
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold" title="Present">✓</span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold" title="Absent">✕</span>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedMember(m);
                                                        setEditFirstName(m.first_name);
                                                        setEditLastName(m.last_name);
                                                        setEditEmail(m.email || '');
                                                        setEditPhone(m.phone_number || '');
                                                        setEditGender(m.gender || 'Male');
                                                        setIsEditingMember(false);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-semibold"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Overview
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TAB 3: GUEST MANAGEMENT ================= */}
                {activeTab === 'guests' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                            💡 <strong>Guest Management:</strong> Upgrade consistent visitors to members, or edit / delete guest records.
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                                        <th className="py-3.5 px-4 font-semibold">Guest Name</th>
                                        <th className="py-3.5 px-4 font-semibold">Gender</th>
                                        <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                                        <th className="py-3.5 px-4 font-semibold text-center">Visits</th>
                                        <th className="py-3.5 px-4 font-semibold">Status</th>
                                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                    {guests.map((g) => (
                                        <tr key={g.id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3 px-4 font-semibold text-white">{g.full_name}</td>
                                            <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">{g.gender || 'Visitor'}</span></td>
                                            <td className="py-3 px-4 text-slate-400">{g.phone_number}</td>
                                            <td className="py-3 px-4 text-center font-bold text-amber-400">{g.attendance_count || 1}</td>
                                            <td className="py-3 px-4">
                                                {g.is_converted_to_member ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">Upgraded</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300">Guest</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                {!g.is_converted_to_member && (
                                                    <button onClick={() => handleUpgradeGuest(g)} className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                                                        Upgrade
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedGuest(g);
                                                        setEditGuestName(g.full_name);
                                                        setEditGuestPhone(g.phone_number);
                                                        setEditGuestGender(g.gender || 'Male');
                                                        setIsEditingGuest(true);
                                                    }}
                                                    className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-emerald-400"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 inline" />
                                                </button>
                                                <button onClick={() => handleDeleteGuest(g.id)} className="rounded bg-red-500/10 hover:bg-red-500/20 px-2 py-1 text-[11px] text-red-400">
                                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TAB 4: QR GENERATOR ================= */}
                {activeTab === 'sessions' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-emerald-400" /> Sunday Session QR Generator
                            </h2>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Sunday Date</label>
                                <input
                                    type="date"
                                    value={selectedSessionDate}
                                    onChange={(e) => setSelectedSessionDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={() => handleGenerateQr(selectedSessionDate)}
                                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow"
                            >
                                Generate QR Code
                            </button>
                        </div>
                        <div className="md:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl flex items-center justify-center text-center">
                            {activeQrCode ? (
                                <div className="p-4 bg-white rounded-2xl shadow-2xl">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeQrCode)}`} alt="QR" className="w-40 h-40 mx-auto" />
                                    <p className="text-[11px] text-slate-900 font-bold mt-2">{selectedSessionDate}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">Click generate to view active QR code</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= TAB 5: STAFF ================= */}
                {activeTab === 'staff' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {adminList.map((st) => (
                            <div key={st.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-2">
                                <div className="font-bold text-white text-sm">{st.first_name} {st.last_name}</div>
                                <div className="text-xs text-slate-400">{st.email}</div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400">{st.role}</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ================= MODAL: ADD MEMBER / GUEST ================= */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Manual Enrolment</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                            <button onClick={() => setAddType('member')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${addType === 'member' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Member</button>
                            <button onClick={() => setAddType('guest')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${addType === 'guest' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Guest</button>
                        </div>
                        {formMsg && <div className="p-3 rounded bg-red-500/10 text-xs text-red-300">{formMsg}</div>}
                        <form onSubmit={handleAddUser} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="First Name *" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} required className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white" />
                                <input type="text" placeholder="Last Name *" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} required className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white" />
                            </div>
                            <input type="email" placeholder="Email Address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white" />
                            <input type="tel" placeholder="Phone Number *" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white" />
                            <select value={newGender} onChange={(e) => setNewGender(e.target.value as any)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <button type="submit" disabled={savingUser} className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white">Save Record</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= MODAL: MEMBER OVERVIEW & EDIT / DELETE ================= */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Member Profile Details</h2>
                            <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>

                        {isEditingMember ? (
                            <form onSubmit={handleSaveMemberEdit} className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} placeholder="First Name" required className="rounded bg-slate-950 border border-slate-800 p-2 text-white" />
                                    <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} placeholder="Last Name" required className="rounded bg-slate-950 border border-slate-800 p-2 text-white" />
                                </div>
                                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email Address" className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white" />
                                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone Number" required className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white" />
                                <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex-1 rounded bg-emerald-600 py-2 font-semibold text-white">Save Changes</button>
                                    <button type="button" onClick={() => setIsEditingMember(false)} className="rounded bg-slate-800 px-3 py-2 text-slate-300">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Name</span><span className="font-semibold text-white">{selectedMember.first_name} {selectedMember.last_name}</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Email</span><span className="font-semibold text-white">{selectedMember.email || 'Nil'}</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Gender</span><span className="font-semibold text-white">{selectedMember.gender || 'Male'}</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Phone</span><span className="font-semibold text-white">{selectedMember.phone_number}</span></div>

                                <div className="flex items-center justify-between pt-4">
                                    <button onClick={() => setIsEditingMember(true)} className="inline-flex items-center gap-1 rounded bg-slate-800 px-3 py-2 font-semibold text-emerald-400 hover:bg-slate-700">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit Member
                                    </button>
                                    <button onClick={() => handleDeleteMember(selectedMember.id)} className="inline-flex items-center gap-1 rounded bg-red-500/10 px-3 py-2 font-semibold text-red-400 hover:bg-red-500/20">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete Member
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= MODAL: GUEST EDIT ================= */}
            {isEditingGuest && selectedGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Edit Guest Profile</h2>
                            <button onClick={() => setIsEditingGuest(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSaveGuestEdit} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                                <input type="text" value={editGuestName} onChange={(e) => setEditGuestName(e.target.value)} required className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
                                <input type="tel" value={editGuestPhone} onChange={(e) => setEditGuestPhone(e.target.value)} required className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender</label>
                                <select value={editGuestGender} onChange={(e) => setEditGuestGender(e.target.value)} className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-white">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 rounded bg-emerald-600 py-2 font-semibold text-white">Save Changes</button>
                                <button type="button" onClick={() => setIsEditingGuest(false)} className="rounded bg-slate-800 px-3 py-2 text-slate-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}