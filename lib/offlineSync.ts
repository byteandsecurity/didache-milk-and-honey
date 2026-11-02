import { createClient } from '@/lib/supabase/client';

export interface PendingCheckIn {
    user_id: string;
    session_id: string;
    checked_in_at: string;
}

const QUEUE_KEY = 'didache_offline_queue';

// 1. Record check-in (handles offline vs online automatically)
export async function recordAttendance(userId: string, sessionId: string) {
    const supabase = createClient();
    const checkInRecord: PendingCheckIn = {
        user_id: userId,
        session_id: sessionId,
        checked_in_at: new Date().toISOString(),
    };

    // Check if browser is offline
    if (!navigator.onLine) {
        saveToOfflineQueue(checkInRecord);
        return { success: true, offline: true, message: 'Saved offline. Will sync automatically when online!' };
    }

    try {
        const { error } = await supabase.from('attendance').insert([checkInRecord]);

        if (error) {
            // Queue locally if Supabase returns an error (network drop, etc.)
            saveToOfflineQueue(checkInRecord);
            return { success: true, offline: true, message: 'Network unstable. Saved to offline queue.' };
        }

        // Try flushing any other pending queue items while we have a good connection
        void syncOfflineQueue();

        return { success: true, offline: false, message: 'Attendance checked in successfully!' };
    } catch (err) {
        // Fallback to offline queue on unexpected runtime/network exceptions
        saveToOfflineQueue(checkInRecord);
        return { success: true, offline: true, message: 'Connection error. Saved offline for sync.' };
    }
}

// 2. Save to localStorage queue
function saveToOfflineQueue(record: PendingCheckIn) {
    try {
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
    if (!navigator.onLine) return;

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