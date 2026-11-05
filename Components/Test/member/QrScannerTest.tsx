'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, CheckCircle2, Beaker } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface QrScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QrScannerTestable({ isOpen, onClose, onSuccess }: QrScannerProps) {
    const [scannerStatus, setScannerStatus] = useState<string | null>(null);
    const [isSuccessState, setIsSuccessState] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [simulatedDate, setSimulatedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const processingScanRef = useRef<boolean>(false);


    const supabase = createClient();

    const stopCamera = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    const processScannedDate = useCallback(async (scannedDateStr: string) => {
        if (processingScanRef.current) return;
        processingScanRef.current = true;

        const memberId = localStorage.getItem('didache_member_id');

        if (!memberId) {
            setSuccessMessage('Error: No active member session found. Please log in again.');
            setIsSuccessState(true);
            processingScanRef.current = false;
            return;
        }

        setScannerStatus(`QR Code detected for ${scannedDateStr}! Recording attendance...`);

        try {
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('id')
                .eq('user_id', memberId)
                .eq('session_date', scannedDateStr)
                .maybeSingle();

            if (existingAttendance) {
                setSuccessMessage('ℹ️ You have already checked in for this session!');
                setIsSuccessState(true);
                processingScanRef.current = false;
                return;
            }

            const { data: existingSession } = await supabase
                .from('sessions')
                .select('id')
                .eq('session_date', scannedDateStr)
                .maybeSingle();

            const attendancePayload: {
                user_id: string;
                session_date: string;
                checked_in_at: string;
                session_id?: string;
            } = {
                user_id: memberId,
                session_date: scannedDateStr,
                checked_in_at: new Date().toISOString(),
            };

            if (existingSession?.id) {
                attendancePayload.session_id = existingSession.id;
            }

            const { error: attendanceError } = await supabase
                .from('attendance')
                .insert([attendancePayload]);

            if (attendanceError) {
                if (attendanceError.message.includes('duplicate') || attendanceError.code === '23505') {
                    setSuccessMessage('ℹ️ You have already checked in for this session!');
                } else {
                    console.error('Supabase Attendance Error:', attendanceError);
                    setSuccessMessage(`Error recording attendance: ${attendanceError.message}`);
                }
            } else {
                setSuccessMessage('Attendance successfully recorded! God bless you!');
                setTimeout(() => {
                    onClose();
                    onSuccess();
                }, 1200);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to record attendance.';
            setSuccessMessage(`Error: ${msg}`);
        }

        setIsSuccessState(true);
        processingScanRef.current = false;
    }, [supabase, onClose, onSuccess]);

    const simulatePhysicalScan = async () => {
        stopCamera();
        await processScannedDate(simulatedDate);
    };

    const startCamera = useCallback(async () => {
        setScannerStatus('Starting camera...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: 'environment' } }
            }).catch(() => {
                return navigator.mediaDevices.getUserMedia({ video: true });
            });

            mediaStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsInline', 'true');
                await videoRef.current.play();
            }

            setScannerStatus('Camera active! Point at Sunday QR code.');

            if ('BarcodeDetector' in window) {
                // @ts-expect-error - BarcodeDetector is supported in modern mobile Chrome/Android browsers
                const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });

                scanIntervalRef.current = setInterval(() => {
                    void (async () => {
                        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
                        try {
                            const barcodes = await barcodeDetector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                const rawValue = barcodes[0].rawValue;
                                let detectedDate: string | null = null;

                                try {
                                    const urlObj = new URL(rawValue);
                                    detectedDate = urlObj.searchParams.get('date');
                                } catch {
                                    try {
                                        const parsedJson = JSON.parse(rawValue);
                                        detectedDate = parsedJson.date || null;
                                    } catch {
                                        if (rawValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                            detectedDate = rawValue;
                                        }
                                    }
                                }

                                if (detectedDate) {
                                    stopCamera();
                                    await processScannedDate(detectedDate);
                                }
                            }
                        } catch {
                            // Suppress frame processing noise
                        }
                    })();
                }, 500);
            } else {
                setScannerStatus('Live camera scanner ready. (Use simulated scanner below for PC browsers)');
            }
        } catch (err) {
            console.error('Camera error:', err);
            setScannerStatus('Camera access blocked or unavailable on this device.');
        }
    }, [stopCamera, processScannedDate]);

    useEffect(() => {
        if (isOpen) {
            setIsSuccessState(false);
            processingScanRef.current = false;
            void startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400" /> Sunday QR Scanner (Test Mode)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isSuccessState ? (
                    <div className="py-8 space-y-3 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                        <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                        <p className="text-sm font-bold text-white px-4">{successMessage}</p>
                    </div>
                ) : (
                    <>
                        <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 border-2 border-emerald-500/40 rounded-2xl m-8 pointer-events-none animate-pulse flex items-center justify-center">
                                <div className="w-32 h-32 border border-dashed border-emerald-400/60 rounded-xl" />
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">{scannerStatus}</p>

                        {/* Test Mode Simulation Bar */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1 font-semibold text-amber-400">
                                    <Beaker className="w-3.5 h-3.5" /> Test Scan Tool:
                                </span>
                                <input
                                    type="date"
                                    value={simulatedDate}
                                    onChange={(e) => setSimulatedDate(e.target.value)}
                                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                                />
                            </div>

                            <button
                                onClick={() => void simulatePhysicalScan()}
                                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition"
                            >
                                ⚡ Simulate QR Scan for {simulatedDate}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}