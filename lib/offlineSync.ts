import { createClient } from '@/lib/supabase/client';

export interface PendingCheckIn {
    user_id: string;
    session_id: string;
    checked_in_at: string;
}

const QUEUE_KEY = 'didache_offline_queue';

// 1. Record check-in (handles offline vs online automatically)
export async function recordAttendance(userId: string, sessionId?: string, sessionDate?: string) {
    try {
        const offlineQueue = JSON.parse(localStorage.getItem('didache_offline_attendance') || '[]');

        const newRecord = {
            user_id: userId,
            session_id: sessionId || null,
            session_date: sessionDate || new Date().toISOString().split('T')[0],
            checked_in_at: new Date().toISOString(),
            synced: false
        };

        offlineQueue.push(newRecord);
        localStorage.setItem('didache_offline_attendance', JSON.stringify(offlineQueue));

        // Register background sync safely
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if ('sync' in registration) {
                await (registration as ServiceWorkerRegistration & {
                    sync: { register: (tag: string) => Promise<void> }
                }).sync.register('sync-attendance');
            }
        }
    } catch (err) {
        console.error('Failed to record attendance offline:', err);
    }
}

export async function recordGuestAttendance(guestId: string, sessionDate: string) {
    try {
        const offlineQueue = JSON.parse(localStorage.getItem('didache_offline_guest_attendance') || '[]');

        const newRecord = {
            guest_id: guestId,
            session_date: sessionDate,
            checked_in_at: new Date().toISOString(),
            synced: false
        };

        offlineQueue.push(newRecord);
        localStorage.setItem('didache_offline_guest_attendance', JSON.stringify(offlineQueue));

        // Register background sync safely with type casting
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if ('sync' in registration) {
                await (registration as ServiceWorkerRegistration & {
                    sync: { register: (tag: string) => Promise<void> }
                }).sync.register('sync-guest-attendance');
            }
        }
    } catch (err) {
        console.error('Failed to record guest attendance offline:', err);
    }
}

// 2. Save to localStorage queue
function saveToOfflineQueue(record: PendingCheckIn) {
    try {
        if (typeof window === 'undefined') return;
        const existing: PendingCheckIn[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        // Prevent duplicate entries for the same session
        const filtered = existing.filter(item => !(item.user_id === record.user_id && item.session_id === record.session_id));
        filtered.push(record);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
        console.error('Failed to save offline check-in queue:', e);
    }
}

// 3. Sync queue to Supabase when back online
export async function syncOfflineQueue() {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
        const queue: PendingCheckIn[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        if (queue.length === 0) return;

        const supabase = createClient();
        const { error } = await supabase.from('attendance').upsert(queue, { onConflict: 'user_id,session_id' });

        if (!error) {
            // Clear queue if successfully synced
            localStorage.removeItem(QUEUE_KEY);
            console.log('Successfully synced offline attendance records to Supabase!');
        }
    } catch (err) {
        console.error('Error syncing offline queue:', err);
    }
}