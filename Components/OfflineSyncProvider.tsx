'use client';

import { useEffect } from 'react';
import { syncOfflineQueue } from '@/lib/offlineSync';

export default function OfflineSyncProvider() {
    useEffect(() => {
        // Attempt syncing immediately when the app loads and user is online
        void syncOfflineQueue();

        // Listen for reconnection events
        const handleOnline = () => {
           void syncOfflineQueue();
        };

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return null;
}