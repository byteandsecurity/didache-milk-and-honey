'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Edit2, Trash2, X, Calendar, Filter, UserCheck, Phone, Search, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, CornerDownLeft, Eye, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface GuestProfile {
    id: string;
    full_name: string;
    phone_number: string | null;
    gender: 'Male' | 'Female' | null;
    home_address: string | null;
    attendance_count: number;
    first_attended_at: string | null;
    last_attended_at: string | null;
    is_converted_to_member: boolean;
    created_at: string;
}

interface AttendanceLog {
    session_date: string;
    checked_in_at: string;
}

interface GuestManagementProps {
    guests: GuestProfile[];
    onRefresh: () => void;
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

    // Modals States
    const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
    const [isEditingGuest, setIsEditingGuest] = useState<boolean>(false);
    const [editGuestName, setEditGuestName] = useState<string>('');
    const [editGuestPhone, setEditGuestPhone] = useState<string>('');
    const [editGuestGender, setEditGuestGender] = useState<string>('Male');
    const [editFirstAttended, setEditFirstAttended] = useState<string>('');

    // Visit Dates History Modal States
    const [viewingVisitDatesGuest, setViewingVisitDatesGuest] = useState<GuestProfile | null>(null);
    const [visitHistoryLogs, setVisitHistoryLogs] = useState<AttendanceLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // Custom Delete Confirmation Modal State
    const [deleteModalConfig, setDeleteModalConfig] = useState<{ isOpen: boolean; ids: string[]; isBulk: boolean }>({
        isOpen: false,
        ids: [],
        isBulk: false,
    });

    const supabase = createClient();

    // Fetch real historical attendance dates from guest_attendance table safely without cascading render warnings
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    // Handle Upgrade Guest to Full Member
    const handleUpgradeGuest = async (guest: GuestProfile) => {
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
            if (onRefresh) onRefresh();
        } else {
            window.alert(`Failed to upgrade guest: ${insertErr.message}`);
        }
    };

    // Handle Demote / Un-upgrade Guest Back
    const handleDemoteGuest = async (guestId: string) => {
        const { error } = await supabase.from('guest_profiles').update({ is_converted_to_member: false }).eq('id', guestId);
        if (!error) {
            if (onRefresh) onRefresh();
        } else {
            window.alert(`Failed to move guest back: ${error.message}`);
        }
    };

    // Save Guest Edits
    const handleSaveGuestEdit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!selectedGuest) return;

        const updateData: Record<string, unknown> = {
            full_name: editGuestName,
            phone_number: editGuestPhone,
            gender: editGuestGender,
        };

        if (editFirstAttended) {
            updateData.first_attended_at = new Date(editFirstAttended).toISOString();
        }

        const { error } = await supabase.from('guest_profiles').update(updateData).eq('id', selectedGuest.id);

        if (!error) {
            setIsEditingGuest(false);
            setSelectedGuest(null);
            if (onRefresh) onRefresh();
        } else {
            window.alert(`Failed to update guest: ${error.message}`);
        }
    };

    // Execute Deletion (Single or Bulk)
    const confirmDelete = async () => {
        const { ids } = deleteModalConfig;
        if (ids.length === 0) return;

        const { error } = await supabase.from('guest_profiles').delete().in('id', ids);

        if (!error) {
            setSelectedGuestIds([]);
            setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false });
            if (onRefresh) onRefresh();
        } else {
            window.alert(`Failed to delete records: ${error.message}`);
        }
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
                        className="self-start sm:self-auto flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition shadow text-xs font-semibold"
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
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0 " />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none w-full flex-1 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        {selectedDate && (
                            <button onClick={() => setSelectedDate('')} className="text-slate-500 hover:text-white text-[10px] ml-1 font-bold">Clear</button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <select
                            value={guestGenderFilter}
                            onChange={(e) => { setGuestGenderFilter(e.target.value as 'all' | 'Male' | 'Female'); setCurrentPage(1); }}
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none w-full"
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
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none w-full"
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
                        className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 font-bold text-white transition shadow"
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
                                    <button onClick={() => toggleSelectGuest(g.id)} className="text-slate-400">
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
                                    className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                                >
                                    Visits: {g.attendance_count || 1} <Eye className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                                <button
                                    onClick={() => void handleUpgradeGuest(g)}
                                    className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white transition shadow"
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
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px]"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setDeleteModalConfig({ isOpen: true, ids: [g.id], isBulk: false })}
                                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px]"
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
                                <button onClick={toggleSelectAll} className="text-slate-400">
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
                            <th className="py-3.5 px-4 font-semibold">Status</th>
                            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {paginatedGuests.length > 0 ? (
                            paginatedGuests.map((g: GuestProfile) => (
                                <tr key={g.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-3 text-center">
                                        <button onClick={() => toggleSelectGuest(g.id)} className="text-slate-400">
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
                                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 font-bold text-amber-400 transition"
                                            title="Click to view all visit dates"
                                        >
                                            <span>{g.attendance_count || 1} Visits</span>
                                            <Eye className="w-3 h-3" />
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Guest</span>
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2">
                                        <button
                                            onClick={() => void handleUpgradeGuest(g)}
                                            className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow transition"
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
                                            className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-emerald-400 transition"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 inline" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModalConfig({ isOpen: true, ids: [g.id], isBulk: false })}
                                            className="rounded bg-red-500/10 hover:bg-red-500/20 px-2 py-1 text-[11px] text-red-400 transition"
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
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none"
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
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white transition"
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
                        className="w-full p-4 flex items-center justify-between bg-slate-950/60 hover:bg-slate-950 transition text-xs font-bold text-slate-300"
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
                                    <th className="py-2.5 px-3">First Joined</th>
                                    <th className="py-2.5 px-3 text-right">Demote / Revert</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {upgradedGuestsList.map((g: GuestProfile) => (
                                    <tr key={g.id} className="hover:bg-slate-800/20">
                                        <td className="py-2.5 px-3 font-semibold text-white">{g.full_name}</td>
                                        <td className="py-2.5 px-3 text-slate-400">{g.phone_number || 'Nil'}</td>
                                        <td className="py-2.5 px-3 text-emerald-400">{formatDateDisplay(g.first_attended_at || g.created_at)}</td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button
                                                onClick={() => void handleDemoteGuest(g.id)}
                                                className="inline-flex items-center gap-1 rounded bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition"
                                                title="Move back to active guest roster"
                                            >
                                                <CornerDownLeft className="w-3 h-3" /> Un-upgrade
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

            {/* Visit Dates History Modal (Fully Mobile-Responsive Stack) */}
            {viewingVisitDatesGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-slate-900 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-amber-400 shrink-0" />
                                <div>
                                    <h3 className="text-sm font-bold text-white truncate max-w-50 sm:max-w-xs">{viewingVisitDatesGuest.full_name}</h3>
                                    <p className="text-[11px] text-amber-400">Visitor Profile & Attendance History</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingVisitDatesGuest(null)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Responsive Grid: Stacks vertically on mobile, splits side-by-side on desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">

                            {/* Left Side: Visitor Info Summary (self-start prevents it from stretching with the right side) */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs self-start">
                                <p className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1.5">Visitor Summary</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Phone Number:</span>
                                    <span className="font-semibold text-white">{viewingVisitDatesGuest.phone_number || 'Nil'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Gender:</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${viewingVisitDatesGuest.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {viewingVisitDatesGuest.gender || 'Visitor'}
            </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">First Joined Date:</span>
                                    <span className="font-bold text-emerald-400">{formatDateDisplay(viewingVisitDatesGuest.first_attended_at || viewingVisitDatesGuest.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Total Visits:</span>
                                    <span className="font-extrabold text-amber-400">{viewingVisitDatesGuest.attendance_count || 1} Sunday(s)</span>
                                </div>
                            </div>

                            {/* Right Side: Scrollable List of Sunday Attendance Dates */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs flex flex-col">
                                <p className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1.5">Attendance Service Dates</p>
                                <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1 flex-1">
                                    {loadingHistory ? (
                                        <p className="text-center text-slate-500 py-6">Loading dates...</p>
                                    ) : visitHistoryLogs.length > 0 ? (
                                        visitHistoryLogs.map((log: AttendanceLog, idx: number) => (
                                            <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-900 p-2.5 flex items-center justify-between">
                        <span className="text-slate-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            Service Session
                        </span>
                                                <span className="font-bold text-amber-400">
                            {new Date(log.session_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-500 py-6">No date logs found.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setViewingVisitDatesGuest(null)}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition"
                        >
                            Close Modal
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white">Confirm Record Deletion</h3>
                            <p className="text-xs text-slate-400">
                                {deleteModalConfig.isBulk
                                    ? `Are you sure you want to delete these ${deleteModalConfig.ids.length} selected guest records?`
                                    : 'Are you sure you want to delete this guest record? This action cannot be undone.'}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => void confirmDelete()}
                                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white shadow transition"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setDeleteModalConfig({ isOpen: false, ids: [], isBulk: false })}
                                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditingGuest && selectedGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Edit Guest Profile</h2>
                            <button onClick={() => setIsEditingGuest(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={(e) => void handleSaveGuestEdit(e)} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={editGuestName}
                                    onChange={(e) => setEditGuestName(e.target.value)}
                                    required
                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editGuestPhone}
                                    onChange={(e) => setEditGuestPhone(e.target.value)}
                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Gender</label>
                                <select
                                    value={editGuestGender}
                                    onChange={(e) => setEditGuestGender(e.target.value)}
                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-emerald-400 font-semibold focus:outline-none"
                                >
                                    <option value="Male" className="bg-slate-950 text-blue-400">Male</option>
                                    <option value="Female" className="bg-slate-950 text-pink-400">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">Date First Attended</label>
                                <input
                                    type="date"
                                    value={editFirstAttended}
                                    onChange={(e) => setEditFirstAttended(e.target.value)}
                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-emerald-400 font-semibold focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white shadow transition">
                                    Save Changes
                                </button>
                                <button type="button" onClick={() => setIsEditingGuest(false)} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-slate-300 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}