'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    ShieldCheck, QrCode, Users, LogOut, Calendar, UserPlus,
    UserCheck, Shield, Cake, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import LoadingSpinner from '@/Components/LoadingSpinner';
import { DidacheGeometricIcon } from '@/Components/DidacheIcon';
import Footer from '@/Components/Footer';

// Import Shared Types from `@/types/admin` to eliminate TS2322 type mismatch errors
import { AdminProfile, MemberProfile, GuestProfile, SessionRecord, AttendanceRecord } from '@/types/admin';

// Import Modular Admin Components
import OverviewAnalytics from '@/Components/admin/OverviewAnalytics';
import MemberRoster from '@/Components/admin/MemberRoster';
import GuestManagement from '@/Components/admin/GuestManagement';
import QrGenerator from '@/Components/admin/QrGenerator';
import StaffDirectory from '@/Components/admin/StaffDirectory';
import BirthdayDirectory from '@/Components/admin/BirthdayDirectory';
import AddUserModal from '@/Components/admin/AddUserModal';

type AdminTab = 'overview' | 'roster' | 'guests' | 'sessions' | 'birthdays' | 'staff';

// Reusable Confirmation Modal Component
interface ConfirmationModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

function ConfirmationModal({
                               isOpen,
                               title = 'Confirm Action',
                               message,
                               confirmText = 'Yes, Proceed',
                               cancelText = 'Cancel',
                               isLoading = false,
                               onConfirm,
                               onClose,
                           }: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white shadow transition cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const router = useRouter();
    const supabase = createClient();

    // 1. Lazy state initializer to load saved tab without synchronous effect setState
    const [activeTab, setActiveTab] = useState<AdminTab>(() => {
        if (typeof window !== 'undefined') {
            const savedTab = localStorage.getItem('didache_admin_active_tab') as AdminTab;
            if (savedTab) return savedTab;
        }
        return 'overview';
    });

    const handleTabChange = (tabId: AdminTab) => {
        setActiveTab(tabId);
        localStorage.setItem('didache_admin_active_tab', tabId);
    };

    // Shared Data States
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [guests, setGuests] = useState<GuestProfile[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [adminList, setAdminList] = useState<AdminProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Toast Feedback Banner State
    const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal State for Manual Enrolment Component & Logout Confirmation
    const [showAddModal, setShowAddModal] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    // Optimized parallel data fetch using Promise.all
    const fetchDashboardData = useCallback(async () => {
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

        // Execute all table queries concurrently in parallel for maximum speed
        const [
            { data: memberData },
            { data: guestData },
            { data: staffData },
            { data: sessionData },
            { data: attendanceData }
        ] = await Promise.all([
            supabase.from('profiles').select('*').order('first_name', { ascending: true }),
            supabase.from('guest_profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('admin_profiles').select('*').order('role', { ascending: false }),
            supabase.from('sessions').select('*').order('session_date', { ascending: false }),
            supabase.from('attendance').select('*')
        ]);

        setMembers(memberData || []);
        setGuests(guestData || []);
        setAdminList(staffData || []);
        setSessions(sessionData || []);
        setAttendance(attendanceData || []);

        setLoading(false);
    }, [router, supabase]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchDashboardData();
    }, [fetchDashboardData]);

    // Delayed refresh wrapper so success toast banners display fully before data refetches
    const handleDelayedRefresh = () => {
        setActionMsg({ type: 'success', text: 'Data successfully synchronized!' });
        setTimeout(() => {
            void fetchDashboardData();
            setActionMsg(null);
        }, 1500);
    };

    const executeLogout = async () => {
        setLogoutConfirmOpen(false);
        await supabase.auth.signOut();
        localStorage.removeItem('didache_admin_name');
        localStorage.removeItem('didache_admin_active_tab');
        router.push('/auth/admin/login');
    };

    if (loading) {
        return <LoadingSpinner text="Loading Admin Console." icon={ShieldCheck} />;
    }

    const upgradeEligibleGuests = guests.filter((g) => !g.is_converted_to_member && (g.attendance_count >= 3 || (g.total_visits || 0) >= 3));

    return (
        <div className="min-h-screen flex flex-col justify-between p-3 sm:p-6 lg:p-12 max-w-7xl mx-auto overflow-x-hidden space-y-4">
            {/* Success/Error Banner Toast */}
            {actionMsg && (
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200 ${
                    actionMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                    {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span className="font-semibold">{actionMsg.text}</span>
                </div>
            )}

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
                    <button
                        onClick={() => void fetchDashboardData()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition cursor-pointer"
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Refresh Data</span>
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Member / Guest</span>
                    </button>

                    <button
                        onClick={() => setLogoutConfirmOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="Sign Out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="relative my-2 border-b border-slate-800/80 pb-3">
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
                                onClick={() => handleTabChange(tab.id as AdminTab)}
                                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
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
                    <MemberRoster members={members} attendance={attendance} sessions={sessions} onRefresh={handleDelayedRefresh} />
                )}
                {activeTab === 'guests' && (
                    <GuestManagement guests={guests} onRefresh={handleDelayedRefresh} />
                )}
                {activeTab === 'sessions' && (
                    <QrGenerator />
                )}
                {activeTab === 'birthdays' && (
                    <BirthdayDirectory members={members} />
                )}
                {activeTab === 'staff' && (
                    <StaffDirectory adminList={adminList} adminProfile={adminProfile} onRefresh={handleDelayedRefresh} />
                )}
            </main>

            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleDelayedRefresh}
            />

            {/* Logout Confirmation Modal */}
            <ConfirmationModal
                isOpen={logoutConfirmOpen}
                title="Confirm Sign Out"
                message="Are you sure you want to log out of your administrative session?"
                confirmText="Yes, Sign Out"
                cancelText="Cancel"
                onConfirm={() => void executeLogout()}
                onClose={() => setLogoutConfirmOpen(false)}
            />

            <Footer />
        </div>
    );
}