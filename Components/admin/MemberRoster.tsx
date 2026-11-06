'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, X, Calendar, Filter, Users, Phone, RefreshCw, CheckCircle, ChevronLeft, ChevronRight, UserCheck, RotateCcw, AlertTriangle, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ALLOW_ANYDAY_ROSTER_TESTING = true; // 🧪 Toggle to false when done testing for production

export default function MemberRoster({ members = [], attendance = [], sessions = [], onRefresh }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSortBy, setMemberSortBy] = useState<'first_name' | 'last_name' | 'gender'>('first_name');
    const [memberGenderFilter, setMemberGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');

    // Default 5 Items Per Page
    const [pageSize, setPageSize] = useState<number>(5);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Trash Bin State
    const [showTrashBin, setShowTrashBin] = useState<boolean>(false);
    const [deletedMembers, setDeletedMembers] = useState<any[]>([]);

    // Custom Delete Confirmation Modal State
    const [memberToDelete, setMemberToDelete] = useState<any | null>(null);

    // Today's YYYY-MM-DD helper for max-date validation
    const getTodayISO = () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayISO = getTodayISO();

    // Dynamic default month calculation
    const currentYearMonth = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }, []);

    const [selectedRosterMonth, setSelectedRosterMonth] = useState<string>(currentYearMonth);

    // Member Profile Details & Edit State (Updated to occupation_type & occupation_detail)
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editWhatsapp, setEditWhatsapp] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editGender, setEditGender] = useState('Male');
    const [editMaritalStatus, setEditMaritalStatus] = useState('Single');
    const [editDob, setEditDob] = useState('');
    const [editOccupationType, setEditOccupationType] = useState('');
    const [editOccupationDetail, setEditOccupationDetail] = useState('');

    // Admin Manual Check-In State
    const [manualCheckInDate, setManualCheckInDate] = useState<string>(todayISO);
    const [manualCheckInMsg, setManualCheckInMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Dynamic Month Generator (Sept 2026 onwards, infinitely rolling forward)
    const availableMonths = useMemo(() => {
        const list = [];
        const startDate = new Date(2026, 8, 1); // September 2026
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12); // Rolls 1 year into future dynamically

        const currentIter = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

        while (currentIter >= startDate) {
            const y = currentIter.getFullYear();
            const m = String(currentIter.getMonth() + 1).padStart(2, '0');
            const value = `${y}-${m}`;
            const label = currentIter.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
            const isCurrent = value === currentYearMonth;
            list.push({ value, label: isCurrent ? `${label} (Current)` : label });
            currentIter.setMonth(currentIter.getMonth() - 1);
        }
        return list;
    }, [currentYearMonth]);

    const [columnsInSelectedMonth, setColumnsInSelectedMonth] = useState<Date[]>([]);

    useEffect(() => {
        const [yearStr, monthStr] = selectedRosterMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const columnDates: Date[] = [];

        if (ALLOW_ANYDAY_ROSTER_TESTING) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                columnDates.push(new Date(year, month, day));
            }
        } else {
            let d = new Date(year, month, 1);
            while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
            while (d.getMonth() === month) {
                columnDates.push(new Date(d));
                d.setDate(d.getDate() + 7);
            }
        }
        setColumnsInSelectedMonth(columnDates);
    }, [selectedRosterMonth]);

    const supabase = createClient();

    const normalizeDateStr = (rawDate: any): string => {
        if (!rawDate) return '';
        if (typeof rawDate === 'string') return rawDate.slice(0, 10);
        if (rawDate instanceof Date) {
            const y = rawDate.getFullYear();
            const m = String(rawDate.getMonth() + 1).padStart(2, '0');
            const d = String(rawDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return '';
    };

    const checkIsPresent = (memberId: string, targetDateObj: Date) => {
        const targetStr = normalizeDateStr(targetDateObj);
        return attendance.some((att: any) => {
            const matchesUser = att.user_id === memberId || att.member_id === memberId || att.profile_id === memberId;
            if (!matchesUser) return false;
            const attSessionDate = normalizeDateStr(att.session_date);
            const attCheckedInAt = normalizeDateStr(att.checked_in_at);
            const attDate = normalizeDateStr(att.date);
            const sessionObj = sessions?.find((s: any) => s.id === att.session_id);
            const sessionDate = normalizeDateStr(sessionObj?.session_date);
            return (
                attSessionDate === targetStr ||
                attCheckedInAt === targetStr ||
                attDate === targetStr ||
                sessionDate === targetStr
            );
        });
    };

    const handleSaveMemberEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedMember) return;
        const { error } = await supabase.from('profiles').update({
            first_name: editFirstName,
            last_name: editLastName,
            email: editEmail || null,
            phone_number: editPhone,
            whatsapp_number: editWhatsapp || editPhone,
            address: editAddress,
            gender: editGender,
            marital_status: editMaritalStatus,
            date_of_birth: editDob || null,
            occupation_type: editOccupationType,
            occupation_detail: editOccupationDetail,
        }).eq('id', selectedMember.id);

        if (!error) {
            setIsEditingMember(false);
            setSelectedMember(null);
            if (onRefresh) onRefresh();
        } else {
            alert(`Failed to update profile: ${error.message}`);
        }
    };

    const confirmMoveToTrash = async () => {
        if (!memberToDelete) return;

        const { error } = await supabase.from('profiles').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', memberToDelete.id);
        if (!error) {
            setDeletedMembers(prev => [...prev, { ...memberToDelete, deleted_at: new Date() }]);
            setMemberToDelete(null);
            setSelectedMember(null);
            if (onRefresh) onRefresh();
        } else {
            alert(`Failed to move member to trash: ${error.message}`);
            setMemberToDelete(null);
        }
    };

    const handleRestoreMember = async (memberId: string) => {
        const { error } = await supabase.from('profiles').update({ is_deleted: false, deleted_at: null }).eq('id', memberId);
        if (!error) {
            setDeletedMembers(prev => prev.filter(m => m.id !== memberId));
            if (onRefresh) onRefresh();
        } else {
            alert(`Failed to restore member: ${error.message}`);
        }
    };

    const handleAdminManualCheckIn = async (memberToSign?: any) => {
        const targetMember = memberToSign || selectedMember;
        if (!targetMember) return;
        setManualCheckInMsg(null);

        if (manualCheckInDate > todayISO) {
            setManualCheckInMsg({ type: 'error', text: 'Cannot check in for future dates.' });
            return;
        }

        const alreadyIn = checkIsPresent(targetMember.id, new Date(manualCheckInDate));
        if (alreadyIn) {
            setManualCheckInMsg({ type: 'error', text: `${targetMember.first_name} is already checked in for ${manualCheckInDate}.` });
            return;
        }

        const { error } = await supabase.from('attendance').insert([
            {
                user_id: targetMember.id,
                session_date: manualCheckInDate,
                checked_in_at: new Date().toISOString(),
            }
        ]);

        if (error) {
            setManualCheckInMsg({ type: 'error', text: `Sign-in failed: ${error.message}` });
        } else {
            setManualCheckInMsg({ type: 'success', text: `Successfully signed in ${targetMember.first_name} for ${manualCheckInDate}!` });
            if (onRefresh) onRefresh();
            setTimeout(() => setManualCheckInMsg(null), 3500);
        }
    };

    const activeMembers = members.filter((m: any) => !m.is_deleted);
    useEffect(() => {
        const inTrash = members.filter((m: any) => m.is_deleted);
        setDeletedMembers(inTrash);
    }, [members]);

    const filteredMembers = activeMembers
        .filter((m: any) => {
            const matchesQuery = `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.phone_number?.includes(searchQuery) || m.whatsapp_number?.includes(searchQuery);
            const matchesGender = memberGenderFilter === 'all' || m.gender === memberGenderFilter;
            return matchesQuery && matchesGender;
        })
        .sort((a: any, b: any) => {
            if (memberSortBy === 'last_name') return a.last_name.localeCompare(b.last_name);
            if (memberSortBy === 'gender') return (a.gender || '').localeCompare(b.gender || '');
            return a.first_name.localeCompare(b.first_name);
        });

    const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
    const paginatedMembers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredMembers.slice(start, start + pageSize);
    }, [filteredMembers, currentPage, pageSize]);

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2.5 text-[10px] text-slate-300">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/50">
                    <span className="font-semibold text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" /> Attendance Status Legend
                    </span>
                    {ALLOW_ANYDAY_ROSTER_TESTING && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold">
                            Testing Mode Active
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1.5">
                    <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px]">✓</span> <span>Present</span></div>
                    <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[9px]">○</span> <span>Ongoing Today</span></div>
                    <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[9px]">✕</span> <span>Absent</span></div>
                    <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[9px]">○</span> <span>Pending</span></div>
                    <div className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded bg-slate-950 text-slate-600 flex items-center justify-center font-bold text-[9px]">-</span> <span>No Service</span></div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                    <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 font-bold text-white text-sm">
                            <Users className="w-4 h-4 text-emerald-400" /> Member Roster Matrix
                        </p>
                        <p className="text-[11px] text-slate-400">Manage member records and view attendance histories.</p>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition shadow"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Refresh Roster</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-50">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, phone..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2.5 text-xs text-emerald-300 font-semibold focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        <select
                            value={selectedRosterMonth}
                            onChange={(e) => setSelectedRosterMonth(e.target.value)}
                            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none"
                        >
                            {availableMonths.map((m) => (
                                <option key={m.value} value={m.value} className="bg-slate-950 text-white">
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                        <select
                            value={memberSortBy}
                            onChange={(e) => setMemberSortBy(e.target.value as any)}
                            className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
                        >
                            <option value="first_name" className="bg-slate-950 text-white">Sort: First Name</option>
                            <option value="last_name" className="bg-slate-950 text-white">Sort: Last Name</option>
                            <option value="gender" className="bg-slate-950 text-white">Sort: Gender</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        <select
                            value={memberGenderFilter}
                            onChange={(e) => {
                                setMemberGenderFilter(e.target.value as any);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none"
                        >
                            <option value="all" className="bg-slate-950 text-white">All Genders</option>
                            <option value="Male" className="bg-slate-950 text-blue-400">Male Only</option>
                            <option value="Female" className="bg-slate-950 text-pink-400">Female Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                            <th className="py-3.5 px-4 font-semibold">Member Name</th>
                            <th className="py-3.5 px-4 font-semibold">Gender</th>
                            <th className="py-3.5 px-4 font-semibold">Phone / WhatsApp</th>
                            {columnsInSelectedMonth.map((d, idx) => (
                                <th key={idx} className="py-3.5 px-2 font-semibold text-center min-w-11">
                                    {d.getDate()}
                                    <div className="text-[9px] text-slate-500 font-normal">{d.toLocaleDateString(undefined, { month: 'short' })}</div>
                                </th>
                            ))}
                            <th className="py-3.5 px-4 font-semibold text-right min-w-28">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {paginatedMembers.map((m: any) => {
                            const memberCreatedDate = new Date(m.created_at || '2026-09-01');

                            return (
                                <tr key={m.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-4 font-semibold text-white">{m.first_name} {m.last_name}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${m.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {m.gender || 'Male'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-400">{m.phone_number || m.whatsapp_number || 'Nil'}</td>

                                    {columnsInSelectedMonth.map((dateObj, sIdx) => {
                                        const dateStr = normalizeDateStr(dateObj);
                                        const isToday = dateStr === todayISO;
                                        const isFuture = dateObj > new Date() && !isToday;
                                        const isBeforeJoined = dateObj < new Date(memberCreatedDate.getFullYear(), memberCreatedDate.getMonth(), memberCreatedDate.getDate());

                                        if (isBeforeJoined) {
                                            return (
                                                <td key={sIdx} className="py-3 px-2 text-center">
                                                    <span className="text-slate-600 font-bold" title="Before account creation">-</span>
                                                </td>
                                            );
                                        }

                                        const memberCheckedIn = checkIsPresent(m.id, dateObj);

                                        return (
                                            <td key={sIdx} className="py-3 px-2 text-center">
                                                {memberCheckedIn ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold" title={`Present on ${dateStr}`}>✓</span>
                                                ) : isToday ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold" title="Ongoing Today">○</span>
                                                ) : isFuture ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-slate-500 font-bold" title="Pending">○</span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold" title="Absent">✕</span>
                                                )}
                                            </td>
                                        );
                                    })}

                                    <td className="py-3 px-4 text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setEditFirstName(m.first_name);
                                                    setEditLastName(m.last_name);
                                                    setEditEmail(m.email || '');
                                                    setEditPhone(m.phone_number || '');
                                                    setEditWhatsapp(m.whatsapp_number || m.phone_number || '');
                                                    setEditAddress(m.address || '');
                                                    setEditGender(m.gender || 'Male');
                                                    setEditMaritalStatus(m.marital_status || 'Single');
                                                    setEditDob(m.date_of_birth || '');
                                                    setEditOccupationType(m.occupation_type || '');
                                                    setEditOccupationDetail(m.occupation_detail || '');
                                                    setIsEditingMember(false);
                                                    setManualCheckInMsg(null);
                                                }}
                                                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Overview
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setManualCheckInMsg(null);
                                                }}
                                                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                                            >
                                                <UserCheck className="w-3.5 h-3.5" /> Sign In
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-white focus:outline-none"
                        >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                        </select>
                        <span>members ({filteredMembers.length} total)</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-white transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-white">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-white transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Trash Bin Section */}
            <div className="pt-2">
                <button
                    onClick={() => setShowTrashBin(!showTrashBin)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>{showTrashBin ? 'Hide Deleted Members Trash Bin' : 'View Deleted Members Trash Bin'} ({deletedMembers.length})</span>
                </button>

                {showTrashBin && (
                    <div className="mt-3 rounded-2xl border border-red-500/20 bg-slate-900/40 p-4 space-y-3">
                        <p className="text-xs text-slate-400">Members removed in the last 30 days can be restored below:</p>
                        {deletedMembers.length > 0 ? (
                            <div className="space-y-2">
                                {deletedMembers.map((dm) => (
                                    <div key={dm.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                                        <div>
                                            <span className="font-bold text-white">{dm.first_name} {dm.last_name}</span>
                                            <span className="text-slate-500 text-[11px] ml-2">({dm.phone_number})</span>
                                        </div>
                                        <button
                                            onClick={() => void handleRestoreMember(dm.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">Trash bin is currently empty.</p>
                        )}
                    </div>
                )}
            </div>

            {/* High Z-Index Delete Confirmation Modal */}
            {memberToDelete && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white">Move to Trash Bin</h3>
                            <p className="text-xs text-slate-400">
                                Are you sure you want to delete <strong className="text-white">{memberToDelete.first_name} {memberToDelete.last_name}</strong>? You can restore them anytime from the Trash Bin.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setMemberToDelete(null)}
                                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void confirmMoveToTrash()}
                                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white shadow transition"
                            >
                                Move to Trash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Details & Actions Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-400" /> Member Overview & Admin Actions
                            </h2>
                            <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>

                        {manualCheckInMsg && (
                            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                                manualCheckInMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}>
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>{manualCheckInMsg.text}</span>
                            </div>
                        )}

                        {isEditingMember ? (
                            <form onSubmit={handleSaveMemberEdit} className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">First Name *</label>
                                        <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Last Name *</label>
                                        <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Phone Number *</label>
                                        <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">WhatsApp Number</label>
                                        <input type="tel" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} placeholder="If different" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Email Address</label>
                                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email Address" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Home Address</label>
                                    <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Residential Address" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Occupation Type</label>
                                        <input type="text" value={editOccupationType} onChange={(e) => setEditOccupationType(e.target.value)} placeholder="e.g. Banking" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Occupation Detail</label>
                                        <input type="text" value={editOccupationDetail} onChange={(e) => setEditOccupationDetail(e.target.value)} placeholder="e.g. Senior Accountant" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Gender</label>
                                        <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-emerald-400 font-semibold focus:outline-none">
                                            <option value="Male" className="bg-slate-950 text-blue-400">Male</option>
                                            <option value="Female" className="bg-slate-950 text-pink-400">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Marital Status</label>
                                        <select value={editMaritalStatus} onChange={(e) => setEditMaritalStatus(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none">
                                            <option value="Single" className="bg-slate-950 text-white">Single</option>
                                            <option value="Married" className="bg-slate-950 text-white">Married</option>
                                            <option value="Other" className="bg-slate-950 text-white">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Date of Birth</label>
                                        <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white transition shadow">Save Changes</button>
                                    <button type="button" onClick={() => setIsEditingMember(false)} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-slate-300 transition">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 text-xs">
                                <div className="space-y-2 rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Full Name</span><span className="font-semibold text-white">{selectedMember.first_name} {selectedMember.last_name}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Email Address</span><span className="font-semibold text-white">{selectedMember.email || 'Nil'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Phone Number</span><span className="font-semibold text-white">{selectedMember.phone_number || 'Nil'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">WhatsApp Number</span><span className="font-semibold text-emerald-400">{selectedMember.whatsapp_number || selectedMember.phone_number || 'Nil'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Home Address</span><span className="font-semibold text-white">{selectedMember.address || 'Nil'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Occupation Type</span><span className="font-semibold text-emerald-400 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {selectedMember.occupation_type || 'Nil'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Occupation Detail</span><span className="font-semibold text-white">{selectedMember.occupation_detail || 'Nil'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Gender</span><span className="font-semibold text-emerald-400">{selectedMember.gender || 'Male'}</span></div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Marital Status</span><span className="font-semibold text-white">{selectedMember.marital_status || 'Single'}</span></div>
                                    <div className="flex justify-between py-1"><span className="text-slate-400">Date of Birth</span><span className="font-semibold text-white">{selectedMember.date_of_birth || 'Nil'}</span></div>
                                </div>

                                {/* Admin Manual Sign-In Box */}
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                                        <UserCheck className="w-4 h-4" /> Admin Manual Sign-In
                                    </p>
                                    <p className="text-[11px] text-slate-400">Sign in for any past or current session date up to today ({todayISO}).</p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <input
                                            type="date"
                                            value={manualCheckInDate}
                                            max={todayISO}
                                            onChange={(e) => setManualCheckInDate(e.target.value)}
                                            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white font-semibold focus:outline-none flex-1 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                        <button
                                            onClick={() => void handleAdminManualCheckIn()}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition shrink-0"
                                        >
                                            Sign In Member
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button onClick={() => setIsEditingMember(true)} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 font-semibold text-emerald-400 transition">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                                    </button>
                                    <button onClick={() => setMemberToDelete(selectedMember)} className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 font-semibold text-red-400 transition">
                                        <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}