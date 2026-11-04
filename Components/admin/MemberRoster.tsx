'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, X, Calendar, Filter, Users, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ALLOW_ANYDAY_ROSTER_TESTING = true; // 🧪 Toggle to false when done testing for production

export default function MemberRoster({ members, attendance, sessions, onRefresh }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSortBy, setMemberSortBy] = useState<'first_name' | 'last_name' | 'gender'>('first_name');
    const [memberGenderFilter, setMemberGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');

    // Dynamic default month calculation (current year-month)
    const currentYearMonth = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }, []);

    const [selectedRosterMonth, setSelectedRosterMonth] = useState<string>(currentYearMonth);

    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editGender, setEditGender] = useState('Male');

    // Generate dynamic month options (Current month + past 6 months dynamically)
    const availableMonths = useMemo(() => {
        const list = [];
        const date = new Date();
        for (let i = 0; i < 6; i++) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const value = `${y}-${m}`;
            const label = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
            list.push({ value, label: i === 0 ? `${label} (Current)` : label });
            date.setMonth(date.getMonth() - 1);
        }
        return list;
    }, []);

    const [columnsInSelectedMonth, setColumnsInSelectedMonth] = useState<Date[]>([]);

    useEffect(() => {
        const [yearStr, monthStr] = selectedRosterMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const columnDates: Date[] = [];

        if (ALLOW_ANYDAY_ROSTER_TESTING) {
            // TESTING MODE: Generate every day of the month as a column
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                columnDates.push(new Date(year, month, day));
            }
        } else {
            // PRODUCTION MODE: Strict Sundays only
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

    const handleSaveMemberEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedMember) return;
        const { error } = await supabase.from('profiles').update({
            first_name: editFirstName,
            last_name: editLastName,
            email: editEmail || null,
            phone_number: editPhone,
            gender: editGender,
        }).eq('id', selectedMember.id);

        if (!error) {
            setIsEditingMember(false);
            setSelectedMember(null);
            if (onRefresh) onRefresh();
        } else {
            alert(`Failed to update member: ${error.message}`);
        }
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to delete this member?')) return;
        const { error } = await supabase.from('profiles').delete().eq('id', memberId);
        if (!error) {
            setSelectedMember(null);
            if (onRefresh) onRefresh();
        } else {
            alert(`Failed to delete member: ${error.message}`);
        }
    };

    const filteredMembers = members
        .filter((m: any) => {
            const matchesQuery = `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.phone_number?.includes(searchQuery);
            const matchesGender = memberGenderFilter === 'all' || m.gender === memberGenderFilter;
            return matchesQuery && matchesGender;
        })
        .sort((a: any, b: any) => {
            if (memberSortBy === 'last_name') return a.last_name.localeCompare(b.last_name);
            if (memberSortBy === 'gender') return (a.gender || '').localeCompare(b.gender || '');
            return a.first_name.localeCompare(b.first_name);
        });

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Attendance Legend Banner*/}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                💡 <strong>Attendance Legend:</strong> <span className="text-emerald-400 font-bold">✓</span> = Present | <span className="text-red-400 font-bold">✕</span> = Absent | <span className="text-slate-400 font-bold">○</span> = Pending (Future) | <span className="text-blue-400 font-bold">-</span> = Service did not hold.
                {ALLOW_ANYDAY_ROSTER_TESTING && <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Testing Mode Active (All Days Shown)</span>}
            </div>

            {/* Filter & Controls Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <div className="space-y-1">
                    <p className="flex items-center gap-1.5 font-medium text-white">
                        <Users className="w-4 h-4 text-emerald-400" /> Member Roster Matrix
                    </p>
                    <p className="text-[11px] text-slate-400">Attendance status automatically calculated from database records.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    {/* Month Selection Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <select
                            value={selectedRosterMonth}
                            onChange={(e) => setSelectedRosterMonth(e.target.value)}
                            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none w-full"
                        >
                            {availableMonths.map((m) => (
                                <option key={m.value} value={m.value} className="bg-slate-950 text-white">
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
                        <select
                            value={memberSortBy}
                            onChange={(e) => setMemberSortBy(e.target.value as any)}
                            className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none w-full"
                        >
                            <option value="first_name" className="bg-slate-950 text-white">Sort by First Name</option>
                            <option value="last_name" className="bg-slate-950 text-white">Sort by Last Name</option>
                            <option value="gender" className="bg-slate-950 text-white">Sort by Gender</option>
                        </select>
                    </div>

                    {/* Gender Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        <select
                            value={memberGenderFilter}
                            onChange={(e) => setMemberGenderFilter(e.target.value as any)}
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none w-full"
                        >
                            <option value="all" className="bg-slate-950 text-white">All Genders</option>
                            <option value="Male" className="bg-slate-950 text-blue-400">Male Only</option>
                            <option value="Female" className="bg-slate-950 text-pink-400">Female Only</option>
                        </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-48 w-full">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                        <input
                            type="text"
                            placeholder="Search member..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-emerald-300 font-semibold focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Responsive Card List (Visible on phones) */}
            <div className="block sm:hidden space-y-3">
                {filteredMembers.length > 0 ? (
                    filteredMembers.map((m: any) => {
                        const memberCreatedDate = new Date(m.created_at);
                        const [selYear, selMonth] = selectedRosterMonth.split('-').map(Number);
                        const isBeforeMemberJoined = memberCreatedDate.getFullYear() > selYear ||
                            (memberCreatedDate.getFullYear() === selYear && memberCreatedDate.getMonth() + 1 > selMonth);

                        return (
                            <div key={m.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-lg">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{m.first_name} {m.last_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {m.gender || 'Male'}
                                            </span>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-slate-500" /> {m.phone_number || 'No phone'}
                                            </span>
                                        </div>
                                    </div>
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
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 text-xs font-semibold"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                </div>

                                {/* Attendance Badges for Mobile */}
                                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs overflow-x-auto pb-1">
                                    <span className="text-slate-400 text-[11px] shrink-0 mr-2">Dates ({columnsInSelectedMonth.length}):</span>
                                    <div className="flex items-center gap-1">
                                        {columnsInSelectedMonth.map((dateObj, sIdx) => {
                                            const dateStr = dateObj.toISOString().split('T')[0];
                                            const isFuture = dateObj > new Date();

                                            if (isBeforeMemberJoined) {
                                                return <span key={sIdx} className="w-6 h-6 flex items-center justify-center rounded bg-slate-950 text-slate-600 font-bold text-[10px]">-</span>;
                                            }

                                            // Check if user checked in on this date
                                            const memberCheckedIn = attendance.some((att: any) => {
                                                const sessionObj = sessions.find((s: any) => s.id === att.session_id);
                                                const matchesSession = sessionObj?.session_date === dateStr;
                                                const matchesDate = att.checked_in_at?.startsWith(dateStr);
                                                const matchesUser = att.user_id === m.id;
                                                return matchesUser && (matchesSession || matchesDate || ALLOW_ANYDAY_ROSTER_TESTING);
                                            });

                                            return (
                                                <span key={sIdx} className={`w-6 h-6 flex items-center justify-center rounded font-bold text-[11px] shrink-0 ${
                                                    isFuture ? 'bg-slate-800 text-slate-500' :
                                                        memberCheckedIn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                            'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`} title={dateStr}>
                                                    {isFuture ? '○' : memberCheckedIn ? '✓' : '✕'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                        No members found matching your search.
                    </div>
                )}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                            <th className="py-3.5 px-4 font-semibold">Member Name</th>
                            <th className="py-3.5 px-4 font-semibold">Gender</th>
                            <th className="py-3.5 px-4 font-semibold">Phone / WhatsApp</th>
                            {columnsInSelectedMonth.map((d, idx) => (
                                <th key={idx} className="py-3.5 px-2 font-semibold text-center min-w-[45px]">
                                    {d.getDate()}
                                    <div className="text-[9px] text-slate-500 font-normal">{d.toLocaleDateString(undefined, { month: 'short' })}</div>
                                </th>
                            ))}
                            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredMembers.map((m: any) => {
                            const memberCreatedDate = new Date(m.created_at);
                            const [selYear, selMonth] = selectedRosterMonth.split('-').map(Number);
                            const isBeforeMemberJoined = memberCreatedDate.getFullYear() > selYear ||
                                (memberCreatedDate.getFullYear() === selYear && memberCreatedDate.getMonth() + 1 > selMonth);

                            return (
                                <tr key={m.id} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-4 font-semibold text-white">{m.first_name} {m.last_name}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${m.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {m.gender || 'Male'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-400">{m.phone_number || 'Nil'}</td>

                                    {columnsInSelectedMonth.map((dateObj, sIdx) => {
                                        const dateStr = dateObj.toISOString().split('T')[0];
                                        const isFuture = dateObj > new Date();

                                        if (isBeforeMemberJoined) {
                                            return (
                                                <td key={sIdx} className="py-3 px-2 text-center">
                                                    <span className="text-slate-600 font-bold">-</span>
                                                </td>
                                            );
                                        }

                                        // Check if this member checked in on this specific date
                                        const memberCheckedIn = attendance.some((att: any) => {
                                            const sessionObj = sessions.find((s: any) => s.id === att.session_id);
                                            const matchesSession = sessionObj?.session_date === dateStr;
                                            const matchesDate = att.checked_in_at?.startsWith(dateStr);
                                            const matchesUser = att.user_id === m.id;
                                            return matchesUser && (matchesSession || matchesDate);
                                        });

                                        return (
                                            <td key={sIdx} className="py-3 px-2 text-center">
                                                {isFuture ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-slate-500 font-bold" title="Pending">○</span>
                                                ) : memberCheckedIn ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold" title={`Present on ${dateStr}`}>✓</span>
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
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Member Edit Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Member Profile Details</h2>
                            <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>

                        {isEditingMember ? (
                            <form onSubmit={handleSaveMemberEdit} className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">First Name</label>
                                        <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 mb-1">Last Name</label>
                                        <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Email</label>
                                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email Address" className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Phone Number</label>
                                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Gender</label>
                                    <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-emerald-400 font-semibold focus:outline-none">
                                        <option value="Male" className="bg-slate-950 text-blue-400">Male</option>
                                        <option value="Female" className="bg-slate-950 text-pink-400">Female</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white transition shadow">Save Changes</button>
                                    <button type="button" onClick={() => setIsEditingMember(false)} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-slate-300 transition">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Name</span><span className="font-semibold text-white">{selectedMember.first_name} {selectedMember.last_name}</span>Id</div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Email</span><span className="font-semibold text-white">{selectedMember.email || 'Nil'}</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Gender</span><span className="font-semibold text-emerald-400">{selectedMember.gender || 'Male'}</span></div>
                                <div className="flex justify-between py-1 border-b border-slate-800/60"><span className="text-slate-400">Phone</span><span className="font-semibold text-white">{selectedMember.phone_number}</span></div>
                                <div className="flex items-center justify-between pt-4">
                                    <button onClick={() => setIsEditingMember(true)} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 font-semibold text-emerald-400 transition">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit Member Row
                                    </button>
                                    <button onClick={() => handleDeleteMember(selectedMember.id)} className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 font-semibold text-red-400 transition">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete Member
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