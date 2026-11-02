'use client';

import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, X, Calendar, Filter, UserCheck, Phone, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function GuestManagement({ guests, onRefresh }: any) {
    const [guestGenderFilter, setGuestGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
    const [selectedDate, setSelectedDate] = useState<string>(''); // Calendar date picker filter
    const [searchQuery, setSearchQuery] = useState<string>(''); // Name / Phone search filter

    // Guest Edit States
    const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
    const [isEditingGuest, setIsEditingGuest] = useState(false);
    const [editGuestName, setEditGuestName] = useState('');
    const [editGuestPhone, setEditGuestPhone] = useState('');
    const [editGuestGender, setEditGuestGender] = useState('Male');
    const [editFirstAttended, setEditFirstAttended] = useState('');

    const supabase = createClient();

    // Filter and sort guests by name search, date picker, and gender, ordered by latest Sunday arrival
    const filteredAndSortedGuests = useMemo(() => {
        return guests
            .filter((g: any) => {
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
            .sort((a: any, b: any) => {
                const dateA = new Date(a.first_attended_at || a.created_at || 0).getTime();
                const dateB = new Date(b.first_attended_at || b.created_at || 0).getTime();
                return dateB - dateA; // Descending: latest first
            });
    }, [guests, guestGenderFilter, searchQuery, selectedDate]);

    // Handle Upgrade Guest to Full Member
    const handleUpgradeGuest = async (guest: any) => {
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
            alert(`Failed to upgrade guest: ${insertErr.message}`);
        }
    };

    // Save Guest Edits
    const handleSaveGuestEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGuest) return;

        const updateData: any = {
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
            alert(`Failed to update guest: ${error.message}`);
        }
    };

    // Delete Guest
    const handleDeleteGuest = async (guestId: string) => {
        if (!confirm('Are you sure you want to delete this guest record?')) return;
        const { error } = await supabase.from('guest_profiles').delete().eq('id', guestId);
        if (!error) {
            if (onRefresh) onRefresh();
        } else {
            alert(`Failed to delete guest: ${error.message}`);
        }
    };

    const formatDateDisplay = (rawDateStr: string) => {
        if (!rawDateStr) return 'N/A';
        const d = new Date(rawDateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Controls Bar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <div className="space-y-1">
                    <p className="flex items-center gap-1.5 font-medium text-white">
                        <UserCheck className="w-4 h-4 text-emerald-400" /> Guest Management
                    </p>
                    <p className="text-[11px] text-slate-400">Sorted by latest arrival. Upgrade 3+ visit guests to members.</p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Name / Phone Search Input */}
                    <div className="relative flex-1 sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                        <input
                            type="text"
                            placeholder="Search guest name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-2 text-xs text-emerald-300 font-semibold focus:outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Calendar Date Picker Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none w-full [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        {selectedDate && (
                            <button onClick={() => setSelectedDate('')} className="text-slate-500 hover:text-white text-[10px] ml-1 font-bold">Clear</button>
                        )}
                    </div>

                    {/* Gender Filter with Color */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        <select
                            value={guestGenderFilter}
                            onChange={(e) => setGuestGenderFilter(e.target.value as any)}
                            className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none w-full"
                        >
                            <option value="all" className="bg-slate-950 text-white">All Genders</option>
                            <option value="Male" className="bg-slate-950 text-blue-400">Male Only</option>
                            <option value="Female" className="bg-slate-950 text-pink-400">Female Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Mobile Responsive Card List (Visible on phones) */}
            <div className="block sm:hidden space-y-3">
                {filteredAndSortedGuests.length > 0 ? (
                    filteredAndSortedGuests.map((g: any) => (
                        <div key={g.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{g.full_name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${g.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {g.gender || 'Visitor'}
                                        </span>
                                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-emerald-400" />
                                            {formatDateDisplay(g.first_attended_at || g.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    {g.is_converted_to_member ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Upgraded</span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Guest</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                                <span className="flex items-center gap-1 text-slate-300">
                                    <Phone className="w-3 h-3 text-slate-500" /> {g.phone_number || 'No phone'}
                                </span>
                                <span className="font-bold text-amber-400">Visits: {g.attendance_count || 1}</span>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                                {!g.is_converted_to_member && (
                                    <button
                                        onClick={() => handleUpgradeGuest(g)}
                                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white transition shadow"
                                    >
                                        Upgrade
                                    </button>
                                )}
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
                                    onClick={() => handleDeleteGuest(g.id)}
                                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px]"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                        No guest records match your search or date filters.
                    </div>
                )}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                            <th className="py-3.5 px-4 font-semibold">Guest Name</th>
                            <th className="py-3.5 px-4 font-semibold">Gender</th>
                            <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                            <th className="py-3.5 px-4 font-semibold">Date Came</th>
                            <th className="py-3.5 px-4 font-semibold text-center">Visits</th>
                            <th className="py-3.5 px-4 font-semibold">Status</th>
                            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredAndSortedGuests.length > 0 ? (
                            filteredAndSortedGuests.map((g: any) => (
                                <tr key={g.id} className="hover:bg-slate-800/30 transition">
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
                                    <td className="py-3 px-4 text-center font-bold text-amber-400">
                                        {g.attendance_count || 1}
                                    </td>
                                    <td className="py-3 px-4">
                                        {g.is_converted_to_member ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Upgraded</span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Guest</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2">
                                        {!g.is_converted_to_member && (
                                            <button
                                                onClick={() => handleUpgradeGuest(g)}
                                                className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow transition"
                                            >
                                                Upgrade
                                            </button>
                                        )}
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
                                            onClick={() => handleDeleteGuest(g.id)}
                                            className="rounded bg-red-500/10 hover:bg-red-500/20 px-2 py-1 text-[11px] text-red-400 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-500">
                                    No guest records found matching your filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Guest Edit Modal */}
            {isEditingGuest && selectedGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h2 className="text-sm font-bold text-white">Edit Guest Profile</h2>
                            <button onClick={() => setIsEditingGuest(false)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveGuestEdit} className="space-y-3 text-xs">
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