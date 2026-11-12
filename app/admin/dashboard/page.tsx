'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    ShieldCheck, QrCode, Users, LogOut, Calendar, UserPlus,
    UserCheck, Shield, X, Cake, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import {DidacheGeometricIcon} from "@/Components/DidacheIcon";
import Footer from '@/Components/Footer';

// Import Modular Admin Components
import OverviewAnalytics from '@/Components/admin/OverviewAnalytics';
import MemberRoster from '@/Components/admin/MemberRoster';
import GuestManagement from '@/Components/admin/GuestManagement';
import QrGenerator from '@/Components/admin/QrGenerator';
import StaffDirectory from '@/Components/admin/StaffDirectory';
import BirthdayDirectory from '@/Components/admin/BirthdayDirectory';

export default function AdminDashboard() {
    // 1. Initialize Active Tab from localStorage so refresh stays on current page
    const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'guests' | 'sessions' | 'birthdays' | 'staff'>('overview');

    useEffect(() => {
        const savedTab = localStorage.getItem('didache_admin_active_tab') as any;
        if (savedTab) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab(savedTab);
        }
    }, []);

    const handleTabChange = (tabId: 'overview' | 'roster' | 'guests' | 'sessions' | 'birthdays' | 'staff') => {
        setActiveTab(tabId);
        localStorage.setItem('didache_admin_active_tab', tabId);
    };

    // Shared Data States
    const [adminProfile, setAdminProfile] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [guests, setGuests] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [adminList, setAdminList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State for Manual Enrolment
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState<'member' | 'guest'>('member');
    const [newFirstName, setNewFirstName] = useState('');
    const [newLastName, setNewLastName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newGender, setNewGender] = useState<'Male' | 'Female'>('Male');
    const [formMsg, setFormMsg] = useState<string | null>(null);
    const [savingUser, setSavingUser] = useState(false);

    const router = useRouter();
    const supabase = createClient();

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
            router.push('/auth/admin/login');
            return;
        }

        setAdminProfile(profile);

        const { data: memberData } = await supabase.from('profiles').select('*').order('first_name', { ascending: true });
        setMembers(memberData || []);

        const { data: guestData } = await supabase.from('guest_profiles').select('*').order('created_at', { ascending: false });
        setGuests(guestData || []);

        const { data: staffData } = await supabase.from('admin_profiles').select('*').order('role', { ascending: false });
        setAdminList(staffData || []);

        const { data: sessionData } = await supabase.from('sessions').select('*').order('session_date', { ascending: false });
        setSessions(sessionData || []);

        const { data: attendanceData } = await supabase.from('attendance').select('*');
        setAttendance(attendanceData || []);

        setLoading(false);
    };

    useEffect(() => {
        void fetchDashboardData();
    }, [router, supabase]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingUser(true);
        setFormMsg(null);

        if (addType === 'member') {
            const { error } = await supabase.from('profiles').insert([{
                first_name: newFirstName,
                last_name: newLastName,
                email: newEmail || null,
                phone_number: newPhone,
                gender: newGender,
                role: 'member',
            }]);
            if (error) { setFormMsg(`Error: ${error.message}`); setSavingUser(false); return; }
        } else {
            const { error } = await supabase.from('guest_profiles').insert([{
                full_name: `${newFirstName} ${newLastName}`,
                phone_number: newPhone,
                gender: newGender,
                attendance_count: 1,
            }]);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('didache_admin_name');
        localStorage.removeItem('didache_admin_active_tab');
        router.push('/auth/admin/login');
    };

    if (loading) {
        return <LoadingSpinner text='Loading Admin Console.' icon={ShieldCheck} />;
    }

    const upgradeEligibleGuests = guests.filter((g) => !g.is_converted_to_member && (g.attendance_count >= 3 || g.total_visits >= 3));

    return (
        <div className="min-h-screen flex flex-col justify-between p-3 sm:p-6 lg:p-12 max-w-7xl mx-auto overflow-x-hidden">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                        <DidacheGeometricIcon className="w-9 h-9" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-base sm:text-lg font-bold text-white">
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
                    {/* Refresh Data Button */}
                    <button
                        onClick={() => void fetchDashboardData()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition"
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Refresh Data</span>
                    </button>

                    <button
                        onClick={() => { setAddType('member'); setShowAddModal(true); }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Member / Guest</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition"
                        title="Sign Out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Navigation Tabs - With horizontal scroll indicator & clean inline text badge */}
            <div className="relative my-6 border-b border-slate-800/80 pb-3">
                <nav className="flex items-center gap-2 overflow-x-auto scroll-smooth pb-1 text-xs font-semibold scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {[
                        { id: 'overview', label: 'Overview Analytics', icon: Calendar },
                        { id: 'roster', label: `Member Roster (${members.length})`, icon: Users },
                        { id: 'guests', label: `Guest Management (${guests.length})`, icon: UserCheck, badge: upgradeEligibleGuests.length },
                        { id: 'sessions', label: 'Sunday QR Generator', icon: QrCode },
                        { id: 'birthdays', label: 'Birthdays', icon: Cake },
                        { id: 'staff', label: `Staff Directory (${adminList.length})`, icon: Shield }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                                    isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{tab.label}</span>
                                {Boolean(tab.badge) && (
                                    <span className="font-extrabold text-amber-400 text-xs ml-0.5">
                                        ({tab.badge})
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <main className="flex-1 mb-8">
                {activeTab === 'overview' && (
                    <OverviewAnalytics members={members} guests={guests} attendance={attendance} sessions={sessions} />
                )}
                {activeTab === 'roster' && (
                    <MemberRoster members={members} attendance={attendance} sessions={sessions} onRefresh={fetchDashboardData} />
                )}
                {activeTab === 'guests' && (
                    <GuestManagement guests={guests} onRefresh={fetchDashboardData} />
                )}
                {activeTab === 'sessions' && (
                    <QrGenerator />
                )}
                {activeTab === 'birthdays' && (
                    <BirthdayDirectory members={members} />
                )}
                {activeTab === 'staff' && (
                    <StaffDirectory adminList={adminList} adminProfile={adminProfile} onRefresh={fetchDashboardData} />
                )}
            </main>

            {/* Manual Enrolment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
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
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">First Name *</label>
                                    <input type="text" placeholder="First Name" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Last Name *</label>
                                    <input type="text" placeholder="Last Name" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Email Address</label>
                                <input type="email" placeholder="Email Address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Phone Number *</label>
                                <input type="tel" placeholder="Phone Number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Gender *</label>
                                <select value={newGender} onChange={(e) => setNewGender(e.target.value as any)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-emerald-400 font-semibold focus:outline-none">
                                    <option value="Male" className="bg-slate-950 text-blue-400">Male</option>
                                    <option value="Female" className="bg-slate-950 text-pink-400">Female</option>
                                </select>
                            </div>
                            <button type="submit" disabled={savingUser} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition">Save Record</button>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}