'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Edit2, Trash2, X, Calendar, Filter, UserCheck, Phone, Search, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GuestProfile } from "@/types/admin";

interface AttendanceLog {
    session_date: string;
    checked_in_at: string;
}

interface GuestManagementProps {
    guests: GuestProfile[];
    onRefresh: () => void;
}

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

export default function GuestManagement({ guests, onRefresh }: GuestManagementProps) {
    const [guestGenderFilter, setGuestGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortOption, setSortOption] = useState<'newest' | 'earliest' | 'firstname' | 'lastname'>('newest');

    // Pagination States
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(5);

    // Upgraded Guests Table Collapse State
    const [showUpgradedSection, setShowUpgradedSection] = useState<boolean>(false);

    // Selection State for Bulk Deletion
    const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

    // Toast Feedback Banner State
    const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modals States
    const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
    const [isEditingGuest, setIsEditingGuest] = useState<boolean>(false);
    const [editGuestName, setEditGuestName] = useState<string>('');
    const [editGuestPhone, setEditGuestPhone] = useState<string>('');
    const [editGuestGender, setEditGuestGender] = useState<string>('Male');
    const [editFirstAttended, setEditFirstAttended] = useState<string>('');
    const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

    // Guest Manual Sign-In State
    const todayISO = new Date().toISOString().split('T')[0];
    const [manualCheckInDate, setManualCheckInDate] = useState<string>(todayISO);
    const [signingGuestId, setSigningGuestId] = useState<string | null>(null);

    // Visit Dates History Modal States
    const [viewingVisitDatesGuest, setViewingVisitDatesGuest] = useState<GuestProfile | null>(null);
    const [visitHistoryLogs, setVisitHistoryLogs] = useState<AttendanceLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // Confirmation Modal Configs
    const [deleteModalConfig, setDeleteModalConfig] = useState<{ isOpen: boolean; ids: string[]; isBulk: boolean }>({
        isOpen: false,
        ids: [],
        isBulk: false,
    });
    const [editConfirmModalOpen, setEditConfirmModalOpen] = useState<boolean>(false);
    const [upgradeConfirmModalOpen, setUpgradeConfirmModalOpen] = useState<boolean>(false);
    const [guestToUpgrade, setGuestToUpgrade] = useState<GuestProfile | null>(null);
    const [signInConfirmModalOpen, setSignInConfirmModalOpen] = useState<boolean>(false);
    const [guestToSignIn, setGuestToSignIn] = useState<GuestProfile | null>(null);

    const supabase = createClient();

    // Fetch real historical attendance dates from guest_attendance table safely
    const fetchVisitHistory = useCallback(async (guestId: string) => {
        setLoadingHistory(true);
        const { data, error } = await supabase
            .from('guest_attendance')
            .select('session_date, checked_in_at')
            .eq('guest_id', guestId)
            .order('session_date', { ascending: false });

        if (!error && data) {
            setVisitHistoryLogs(data as AttendanceLog[]);
        } else {
            setVisitHistoryLogs([]);
        }
        setLoadingHistory(false);
    }, [supabase]);

    useEffect(() => {
        if (viewingVisitDatesGuest) {
            void fetchVisitHistory(viewingVisitDatesGuest.id);
        } else {
            setVisitHistoryLogs([]);
        }
    }, [viewingVisitDatesGuest, fetchVisitHistory]);

    // 1. Separate Active Guests from Upgraded Members
    const activeGuestsList = useMemo(() => {
        return guests.filter((g: GuestProfile) => !g.is_converted_to_member);
    }, [guests]);

    const upgradedGuestsList = useMemo(() => {
        return guests.filter((g: GuestProfile) => g.is_converted_to_member);
    }, [guests]);

    // Filter, Search, and Multi-Option Sort Active Guests
    const filteredAndSortedGuests = useMemo(() => {
        return activeGuestsList
            .filter((g: GuestProfile) => {
                const matchesGender = guestGenderFilter === 'all' || (g.gender || 'Male') === guestGenderFilter;

                const fullName = (g.full_name || '').toLowerCase();
                const phone = (g.phone_number || '').toLowerCase();
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch = !query || fullName.includes(query) || phone.includes(query);

                const rawDate = g.first_attended_at || g.created_at;
                const formattedDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : '';
                const matchesDate = !selectedDate || formattedDate === selectedDate;

                return matchesGender && matchesSearch && matchesDate;
            })
            .sort((a: GuestProfile, b: GuestProfile) => {
                if (sortOption === 'newest' || sortOption === 'earliest') {
                    const dateA = new Date(a.first_attended_at || a.created_at || 0).getTime();
                    const dateB = new Date(b.first_attended_at || b.created_at || 0).getTime();
                    return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
                } else if (sortOption === 'firstname') {
                    return (a.full_name || '').localeCompare(b.full_name || '');
                } else if (sortOption === 'lastname') {
                    const getLastName = (name: string) => {
                        const parts = name.trim().split(' ');
                        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
                    };
                    return getLastName(a.full_name || '').localeCompare(getLastName(b.full_name || ''));
                }
                return 0;
            });
    }, [activeGuestsList, guestGenderFilter, searchQuery, selectedDate, sortOption]);

    // Paginated Slice
    const totalPages = Math.ceil(filteredAndSortedGuests.length / pageSize) || 1;
    const paginatedGuests = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedGuests.slice(start, start + pageSize);
    }, [filteredAndSortedGuests, currentPage, pageSize]);

    // Handle Upgrade Guest to Full Member (Confirmed via Modal)
    const executeUpgradeGuest = async () => {
        if (!guestToUpgrade) return;
        const guest = guestToUpgrade;
        setUpgradeConfirmModalOpen(false);

        const nameParts = guest.full_name.split(' ');
        const firstName = nameParts[0] || guest.full_name;
        const lastName = nameParts.slice(1).join(' ') || 'Member';

        const { error: insertErr } = await supabase.from('profiles').insert([{
            first_name: firstName,
            last_name: lastName,
            phone_number: guest.phone_number,
            gender: guest.gender || 'Male',
            role: 'member',
        }]);

        if (!insertErr) {
            await supabase.from('guest_profiles').update({ is_converted_to_member: true }).eq('id', guest.id);
            setActionMsg({ type: 'success', text: `Successfully upgraded ${guest.full_name} to a full member!` });
            if (onRefresh) onRefresh();
        } else {
            setActionMsg({ type: 'error', text: `Failed to upgrade guest: ${insertErr.message}` });
        }
        setGuestToUpgrade(null);
        setTimeout(() => setActionMsg(null), 3000);
    };

    // Handle Demote / Un-upgrade Guest Back
    const handleDemoteGuest = async (guestId: string) => {
        const { error } = await supabase.from('guest_profiles').update({ is_converted_to_member: false }).eq('id', guestId);
        if (!error) {
            setActionMsg({ type: 'success', text: 'Guest successfully moved back to active roster.' });
            if (onRefresh) onRefresh();
        } else {
            setActionMsg({ type: 'error', text: `Failed to move guest back: ${error.message}` });
        }
        setTimeout(() => setActionMsg(null), 3000);
    };

    // Save Guest Edits (Confirmed via Modal)
    const executeSaveGuestEdit = async () => {
        if (!selectedGuest) return;
        setIsSavingEdit(true);
        setEditConfirmModalOpen(false);

        const updateData: Record<string, unknown> = {
            full_name: editGuestName,
            phone_number: editGuestPhone,
            gender: editGuestGender,
        };

        if (editFirstAttended) {
            updateData.first_attended_at = new Date(editFirstAttended).toISOString();
        }

        const { error } = await supabase.from('guest_profiles').update(updateData).eq('id', selectedGuest.id);

        setIsSavingEdit(false);
        if (!error) {
            setIsEditingGuest(false);
            setSelectedGuest(null);
            setActionMsg({ type: 'success', text: `Successfully updated guest record for ${editGuestName}!` });
            if (onRefresh) onRefresh();
        } else {
            setActionMsg({ type: 'error', text: `Failed to update guest: ${error.message}` });
        }
        setTimeout(() => setActionMsg(null), 3000);
    };

    // Admin Manual Check-In for Guest
    const executeGuestManualCheckIn = async () => {
        if (!guestToSignIn) return;
        const guest = guestToSignIn;
        setSignInConfirmModalOpen(false);
        setSigningGuestId(guest.id);

        // 1. Check if already checked in for this date
        const { data: existingLog } = await supabase
            .from('guest_attendance')
            .select('id')
            .eq('guest_id', guest.id)
            .eq('session_date', manualCheckInDate)
            .maybeSingle();

        if (existingLog) {
            setActionMsg({ type: 'error', text: `${guest.full_name} is already signed in for ${manualCheckInDate}.` });
            setSigningGuestId(null);
            setGuestToSignIn(null);
            setTimeout(() => setActionMsg(null), 3000);
            return;
        }

        // 2. Insert attendance record
        const { error: attError } = await supabase.from('guest_attendance').insert([{
            guest_id: guest.id,
            session_date: manualCheckInDate,
            checked_in_at: new Date().toISOString(),
        }]);

        if (attError) {
            setActionMsg({ type: 'error', text: `Failed to sign in guest: ${attError.message}` });
            setSigningGuestId(null);
            setGuestToSignIn(null);
            setTimeout(() => setActionMsg(null), 3000);
            return;
        }

        // 3. Increment attendance count on guest profile
        const newCount = (guest.attendance_count || 0) + 1;
        const { error: updateError } = await supabase
            .from('guest_profiles')
            .update({ attendance_count: newCount })
            .eq('id', guest.id);

        setSigningGuestId(null);
        setGuestToSignIn(null);

        if (!updateError) {
            setActionMsg({ type: 'success', text: `Successfully signed in ${guest.full_name} for session date ${manualCheckInDate}!` });
            if (onRefresh) onRefresh();
        } else {
            setActionMsg({ type: 'error', text: `Attendance recorded, but failed to update counter: ${updateError.message}` });
        }
        setTimeout(() => setActionMsg(null), 3000);
    };

    // Execute Deletion (Single or Bulk Confirmed via Modal)
    const confirmDelete = async () => {
        const { ids } = deleteModalConfig;
        if (ids.length === 0) return;

        const { error } = await supabase.from('guest_profiles').delete().in('id', ids);

        if (!error) {
            setSelectedGuestIds([]);
            setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false });
            setActionMsg({ type: 'success', text: `Successfully deleted ${ids.length} guest record(s).` });
            if (onRefresh) onRefresh();
        } else {
            setActionMsg({ type: 'error', text: `Failed to delete records: ${error.message}` });
        }
        setTimeout(() => setActionMsg(null), 3000);
    };

    const toggleSelectAll = () => {
        if (selectedGuestIds.length === paginatedGuests.length) {
            setSelectedGuestIds([]);
        } else {
            setSelectedGuestIds(paginatedGuests.map((g: GuestProfile) => g.id));
        }
    };

    const toggleSelectGuest = (id: string) => {
        if (selectedGuestIds.includes(id)) {
            setSelectedGuestIds(selectedGuestIds.filter((i: string) => i !== id));
        } else {
            setSelectedGuestIds([...selectedGuestIds, id]);
        }
    };

    const formatDateDisplay = (rawDateStr: string | null) => {
        if (!rawDateStr) return 'N/A';
        const d = new Date(rawDateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Action Feedback Banner Toast */}
            {actionMsg && (
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200 ${
                    actionMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                    {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span className="font-semibold">{actionMsg.text}</span>
                </div>
            )}

            {/* Header Controls Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                    <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 font-medium text-white text-sm">
                            <UserCheck className="w-4 h-4 text-emerald-400" /> Guest Management Roster
                        </p>
                        <p className="text-[11px] text-slate-400">Track active visitors, review attendance history, upgrade frequent visitors, or manage records.</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        title="Refresh Roster Data"
                        className="self-start sm:self-auto flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition shadow text-xs font-semibold cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Refresh Roster</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative flex-1 min-w-50">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search guest name or phone..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2.5 text-xs text-emerald-300 font-semibold focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none w-full flex-1 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        {selectedDate && (
                            <button onClick={() => setSelectedDate('')} className="text-slate-500 hover:text-white text-[10px] ml-1 font-bold cursor-pointer">Clear</button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <select
                            value={guestGenderFilter}
                            onChange={(e) => { setGuestGenderFilter(e.target.value as 'all' | 'Male' | 'Female'); setCurrentPage(1); }}
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none w-full cursor-pointer"
                        >
                            <option value="all" className="bg-slate-950 text-white">All Genders</option>
                            <option value="Male" className="bg-slate-950 text-blue-400">Male Only</option>
                            <option value="Female" className="bg-slate-950 text-pink-400">Female Only</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
                        <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as 'newest' | 'earliest' | 'firstname' | 'lastname')}
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none w-full cursor-pointer"
                        >
                            <option value="newest" className="bg-slate-950 text-white">Newest First (Arrival)</option>
                            <option value="earliest" className="bg-slate-950 text-white">Earliest First (Arrival)</option>
                            <option value="firstname" className="bg-slate-950 text-white">First Name (A-Z)</option>
                            <option value="lastname" className="bg-slate-950 text-white">Last Name / Surname (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {selectedGuestIds.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center justify-between text-xs text-red-200">
                    <span className="font-semibold">{selectedGuestIds.length} visitor record(s) selected</span>
                    <button
                        onClick={() => setDeleteModalConfig({ isOpen: true, ids: selectedGuestIds, isBulk: true })}
                        className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 font-bold text-white transition shadow cursor-pointer"
                    >
                        Delete Selected Records
                    </button>
                </div>
            )}

            {/* Mobile Responsive Card List */}
            <div className="block sm:hidden space-y-3">
                {paginatedGuests.length > 0 ? (
                    paginatedGuests.map((g: GuestProfile) => (
                        <div key={g.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleSelectGuest(g.id)} className="text-slate-400 cursor-pointer">
                                        {selectedGuestIds.includes(g.id) ? (
                                            <CheckSquare className="w-4 h-4 text-amber-400" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-600" />
                                        )}
                                    </button>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{g.full_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${g.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {g.gender || 'Visitor'}
                                            </span>
                                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-emerald-400" />
                                                Joined: {formatDateDisplay(g.first_attended_at || g.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Guest</span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                                <span className="flex items-center gap-1 text-slate-300">
                                    <Phone className="w-3 h-3 text-slate-500" /> {g.phone_number || 'No phone'}
                                </span>
                                <button
                                    onClick={() => setViewingVisitDatesGuest(g)}
                                    className="font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    Visits: {g.attendance_count || 1} <Eye className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Guest Manual Sign In Box (Mobile) */}
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1.5">
                                <p className="font-semibold text-[11px] text-emerald-400">Sign In Guest for Session</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={manualCheckInDate}
                                        max={todayISO}
                                        onChange={(e) => setManualCheckInDate(e.target.value)}
                                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-[11px] text-white font-semibold focus:outline-none flex-1 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                    <button
                                        onClick={() => {
                                            setGuestToSignIn(g);
                                            setSignInConfirmModalOpen(true);
                                        }}
                                        disabled={signingGuestId === g.id}
                                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow transition shrink-0 cursor-pointer disabled:opacity-50"
                                    >
                                        {signingGuestId === g.id ? 'Signing...' : 'Sign In'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                                <button
                                    onClick={() => {
                                        setGuestToUpgrade(g);
                                        setUpgradeConfirmModalOpen(true);
                                    }}
                                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white transition shadow cursor-pointer"
                                >
                                    Upgrade to Member
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedGuest(g);
                                        setEditGuestName(g.full_name);
                                        setEditGuestPhone(g.phone_number || '');
                                        setEditGuestGender(g.gender || 'Male');
                                        const rawDate = g.first_attended_at || g.created_at;
                                        setEditFirstAttended(rawDate ? new Date(rawDate).toISOString().split('T')[0] : '');
                                        setIsEditingGuest(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] cursor-pointer"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setDeleteModalConfig({ isOpen: true, ids: [g.id], isBulk: false })}
                                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                        No active guest records match your search or date filters.
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                            <th className="py-3 px-3 w-10 text-center">
                                <button onClick={toggleSelectAll} className="text-slate-400 cursor-pointer">
                                    {selectedGuestIds.length > 0 && selectedGuestIds.length === paginatedGuests.length ? (
                                        <CheckSquare className="w-4 h-4 text-amber-400" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-600" />
                                    )}
                                </button>
                            </th>
                            <th className="py-3.5 px-4 font-semibold">Guest Name</th>
                            <th className="py-3.5 px-4 font-semibold">Gender</th>
                            <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                            <th className="py-3.5 px-4 font-semibold">First Joined</th>
                            <th className="py-3.5 px-4 font-semibold text-center">Visits & History</th>
                            <th className="py-3.5 px-4 font-semibold">Manual Sign-In</th>
                            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {paginatedGuests.length > 0 ? (
                            paginatedGuests.map((g: GuestProfile) => (
                                <tr key={g.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-3 text-center">
                                        <button onClick={() => toggleSelectGuest(g.id)} className="text-slate-400 cursor-pointer">
                                            {selectedGuestIds.includes(g.id) ? (
                                                <CheckSquare className="w-4 h-4 text-amber-400" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-600" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-white">{g.full_name}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${g.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {g.gender || 'Visitor'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-400">{g.phone_number || 'Nil'}</td>
                                    <td className="py-3 px-4 font-semibold text-emerald-400">
                                        {formatDateDisplay(g.first_attended_at || g.created_at)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => setViewingVisitDatesGuest(g)}
                                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 font-bold text-amber-400 transition cursor-pointer"
                                            title="Click to view all visit dates"
                                        >
                                            <span>{g.attendance_count || 1} Visits</span>
                                            <Eye className="w-3 h-3" />
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="date"
                                                value={manualCheckInDate}
                                                max={todayISO}
                                                onChange={(e) => setManualCheckInDate(e.target.value)}
                                                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-white font-semibold focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                            <button
                                                onClick={() => {
                                                    setGuestToSignIn(g);
                                                    setSignInConfirmModalOpen(true);
                                                }}
                                                disabled={signingGuestId === g.id}
                                                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow transition cursor-pointer disabled:opacity-50"
                                            >
                                                {signingGuestId === g.id ? 'Signing...' : 'Sign In'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-1.5">
                                        <button
                                            onClick={() => {
                                                setGuestToUpgrade(g);
                                                setUpgradeConfirmModalOpen(true);
                                            }}
                                            className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow transition cursor-pointer"
                                        >
                                            Upgrade
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedGuest(g);
                                                setEditGuestName(g.full_name);
                                                setEditGuestPhone(g.phone_number || '');
                                                setEditGuestGender(g.gender || 'Male');
                                                const rawDate = g.first_attended_at || g.created_at;
                                                setEditFirstAttended(rawDate ? new Date(rawDate).toISOString().split('T')[0] : '');
                                                setIsEditingGuest(true);
                                            }}
                                            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-emerald-400 transition cursor-pointer"
                                            title="Edit Guest"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 inline" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModalConfig({ isOpen: true, ids: [g.id], isBulk: false })}
                                            className="rounded bg-red-500/10 hover:bg-red-500/20 px-2 py-1 text-[11px] text-red-400 transition cursor-pointer"
                                            title="Delete Guest"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-500">
                                    No active guest records found matching your filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer: Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400 gap-3">
                    <div className="flex items-center gap-2">
                        <span>Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none cursor-pointer"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                        <span>per page (Total: {filteredAndSortedGuests.length})</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span>Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white transition cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white transition cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible Upgraded Guests Section */}
            {upgradedGuestsList.length > 0 && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg mt-6">
                    <button
                        onClick={() => setShowUpgradedSection(!showUpgradedSection)}
                        className="w-full p-4 flex items-center justify-between bg-slate-950/60 hover:bg-slate-950 transition text-xs font-bold text-slate-300 cursor-pointer"
                    >
                        <span className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                            Upgraded Guests / Converted Members ({upgradedGuestsList.length})
                        </span>
                        <span className="text-[11px] text-amber-400">{showUpgradedSection ? 'Hide Section ▲' : 'Show Section ▼'}</span>
                    </button>

                    {showUpgradedSection && (
                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                                    <th className="py-2.5 px-3">Full Name</th>
                                    <th className="py-2.5 px-3">Phone</th>
                                    <th className="py-2.5 px-3">Gender</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {upgradedGuestsList.map((ug: GuestProfile) => (
                                    <tr key={ug.id} className="hover:bg-slate-800/20">
                                        <td className="py-2.5 px-3 font-semibold text-white">{ug.full_name}</td>
                                        <td className="py-2.5 px-3 text-slate-400">{ug.phone_number || 'Nil'}</td>
                                        <td className="py-2.5 px-3">{ug.gender || 'Male'}</td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button
                                                onClick={() => void handleDemoteGuest(ug.id)}
                                                className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-medium text-amber-400 transition cursor-pointer"
                                            >
                                                Move Back to Guests
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Guest Modal */}
            {isEditingGuest && selectedGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Guest Record
                            </h3>
                            <button onClick={() => setIsEditingGuest(false)} className="text-slate-400 hover:text-white cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); setEditConfirmModalOpen(true); }} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={editGuestName}
                                    onChange={(e) => setEditGuestName(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editGuestPhone}
                                        onChange={(e) => setEditGuestPhone(e.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Gender *</label>
                                    <select
                                        value={editGuestGender}
                                        onChange={(e) => setEditGuestGender(e.target.value)}
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-emerald-400 font-semibold focus:outline-none cursor-pointer"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">First Attended Date</label>
                                <input
                                    type="date"
                                    value={editFirstAttended}
                                    onChange={(e) => setEditFirstAttended(e.target.value)}
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingGuest(false)}
                                    className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 font-semibold text-slate-300 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white shadow cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Visit Dates History Modal */}
            {viewingVisitDatesGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="text-sm font-bold text-white">{viewingVisitDatesGuest.full_name}&apos;s Visits</h3>
                                <p className="text-[11px] text-slate-400">Total Recorded Visits: {visitHistoryLogs.length || viewingVisitDatesGuest.attendance_count || 1}</p>
                            </div>
                            <button onClick={() => setViewingVisitDatesGuest(null)} className="text-slate-400 hover:text-white cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                            {loadingHistory ? (
                                <p className="text-xs text-slate-400 text-center py-6">Loading attendance history...</p>
                            ) : visitHistoryLogs.length > 0 ? (
                                visitHistoryLogs.map((log, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> Session Date: {log.session_date}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            Checked In: {new Date(log.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-xs text-slate-500">
                                    No historical logs found in attendance table for this guest. (Initial profile creation record)
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setViewingVisitDatesGuest(null)}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={deleteModalConfig.isOpen}
                title="Confirm Record Deletion"
                message={deleteModalConfig.isBulk ? `Are you sure you want to delete these ${deleteModalConfig.ids.length} guest records? This action cannot be undone.` : "Are you sure you want to delete this guest record? This action cannot be undone."}
                confirmText="Yes, Delete"
                cancelText="Cancel"
                onConfirm={() => void confirmDelete()}
                onClose={() => setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false })}
            />

            <ConfirmationModal
                isOpen={editConfirmModalOpen}
                title="Confirm Profile Update"
                message={`Are you sure you want to save changes for ${editGuestName}?`}
                confirmText="Yes, Save Changes"
                cancelText="Review"
                isLoading={isSavingEdit}
                onConfirm={() => void executeSaveGuestEdit()}
                onClose={() => setEditConfirmModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={upgradeConfirmModalOpen}
                title="Confirm Member Upgrade"
                message={guestToUpgrade ? `Are you sure you want to upgrade ${guestToUpgrade.full_name} to a full member profile?` : ""}
                confirmText="Yes, Upgrade"
                cancelText="Cancel"
                onConfirm={() => void executeUpgradeGuest()}
                onClose={() => setUpgradeConfirmModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={signInConfirmModalOpen}
                title="Confirm Guest Sign-In"
                message={guestToSignIn ? `Sign in ${guestToSignIn.full_name} for session date ${manualCheckInDate}?` : ""}
                confirmText="Sign In Guest"
                cancelText="Cancel"
                onConfirm={() => void executeGuestManualCheckIn()}
                onClose={() => setSignInConfirmModalOpen(false)}
            />
        </div>
    );
}