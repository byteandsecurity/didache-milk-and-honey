export type AdminTab = 'overview' | 'roster' | 'guests' | 'sessions' | 'birthdays' | 'staff';

export interface AdminProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null | undefined;
    role: 'admin' | 'super_admin' | string;
    [key: string]: unknown;
}

export interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    dob?: string | null;
    birth_month?: number | null;
    birth_day?: number | null;
    occupation_type?: string | null;
    occupation_detail?: string | null;
    home_address?: string | null;
    is_deleted?: boolean;
    created_at?: string;
    [key: string]: unknown;
}

export interface GuestProfile {
    id: string;
    full_name: string;
    phone_number: string | null;
    gender: 'Male' | 'Female' | null;
    home_address: string | null;
    attendance_count: number;
    total_visits?: number;
    first_attended_at: string | null;
    last_attended_at: string | null;
    is_converted_to_member: boolean;
    created_at: string;
    [key: string]: unknown;
}

export interface SessionRecord {
    id: string;
    session_date: string;
    [key: string]: unknown;
}

export interface AttendanceRecord {
    id: string;
    user_id?: string;
    profile_id?: string;
    session_id?: string;
    session_date?: string;
    checked_in_at?: string;
    [key: string]: unknown;
}