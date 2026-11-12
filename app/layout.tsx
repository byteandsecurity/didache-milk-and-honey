import "./globals.css";
import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import OfflineSyncProvider from "@/Components/OfflineSyncProvider";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Didache x Milk & Honey | Attendance & Portal",
    description: "Modern Sunday School Attendance & Youth Community Platform",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Didache:M&H",
    },
};

export const viewport: Viewport = {
    themeColor: "#059669",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white`}>
        {/* Offline Sync Background Listener */}
        <OfflineSyncProvider />

        <div className="relative flex min-h-screen flex-col justify-between overflow-hidden">
            {/* Ambient Background Gradient Blur */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-125 w-125 -translate-x-1/2 rounded-full bg-linear-to-tr from-indigo-600/30 via-purple-600/20 to-pink-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-100 w-100 rounded-full bg-linear-to-br from-blue-600/20 to-teal-500/10 blur-[100px]" />

            <main className="flex-1">
                {children}
            </main>
        </div>

        {/* Vercel Monitoring */}
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    );
}