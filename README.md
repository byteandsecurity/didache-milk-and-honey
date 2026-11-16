# Didache: Milk & Honey

A production-hardened, offline-resilient church attendance and member intelligence portal designed as a modular, template-ready system for Sunday school check-ins and general church attendance logging.

While this particular implementation was structured and modeled around RCCG Sunday school requirements, the codebase is fully adaptable and built for general use. You can easily clone this repository, make a few configuration tweaks, and tailor it for any church denomination, ministry, or attendance-tracking use case.

---

## Key Features

* **Universal & Cloneable Template:** Easily fork and customize the codebase for your own church's specific registration forms, branding, and check-in workflows.
* **Offline-First Attendance Engine:** Built-in IndexedDB / LocalStorage queueing with automatic background sync triggers for when connectivity is restored at the venue.
* **Geofenced Check-Ins:** Enforces a strict 100m radius validation around the service venue to maintain attendance integrity.
* **Multi-Tier Executive Analytics:** Rollup intelligence across Daily Sunday Services, Monthly reports, Quarterly Q1–Q4 breakdowns, and Full Annual Fiscal years.
* **Dual-Portal Onboarding:** Seamless sign-in and registration flows for both registered members and returning/first-time visitors.
* **Smart Security Controls:** Session expiration handling, Sunday-only business constraints, and toggleable testing/production modes.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4
* **Database & Auth:** Supabase
* **Icons & UI:** Lucide React, custom geometric SVG components

---

## 📁 Project Structure

```text
didache-milk-and-honey/
├── README.md
├── package.json
├── env.local
├── app/
│   ├── page.tsx                                      # Landing Page
│   ├── layout.tsx                                    # Root Layout
│   ├── globals.css                                   # Global Styles
│   ├── icon.svg                                      # App Favicon
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx                              # Admin Dashboard
│   │   └── analytics/
│   │       └── page.tsx                              # Executive Analytics Dashboard
│   ├── auth/
│   │   ├── admin/
│   │   │   └── login/
│   │   │       └── page.tsx                          # Admin Login Page
│   │   ├── guest/
│   │   │   └── page.tsx                              # Guest / Visitor Check-In Portal
│   │   └── member/
│   │       ├── login/
│   │       │   └── page.tsx                          # Member Sign In
│   │       └── register/
│   │           └── page.tsx                          # Member Registration
│   ├── checking/
│   │   └── page.tsx                                  # Primary QR & Geofenced Check-In Gateway
│   └── member/
│       └── dashboard/
│           └── page.tsx                              # Member Dashboard
├── Components/
│   ├── DidacheIcon.tsx                              # Custom Geometric Icons
│   ├── Footer.tsx                                    # Footer Styles
│   ├── LoadingSpinner.tsx                           # Loading Indicator
│   ├── OfflineSyncProvider.tsx                     # Offline Sync for Log In & Sign Up
│   ├── admin/
│   │   ├── AddUserModal.tsx                        # Add User Modal
│   │   ├── BirthdayDirectory.tsx                    # Member Birthday Directory
│   │   ├── ConfirmationModal.tsx                    # Confirmation Actions
│   │   ├── GuestManagement.tsx                      # Visitor Roster Management
│   │   ├── MemberRoster.tsx                         # Member Roster Directory
│   │   ├── OverviewAnalytics.tsx                    # Overview Charts & Metrics
│   │   ├── QrGenerator.tsx                          # Hall QR Generator
│   │   ├── StaffDirectory.tsx                       # Staff Management
│   │   └── analytics/
│   │       ├── DailyView.tsx                        # Daily Service Card & Roster Accordion
│   │       ├──MmonthlyView.tsx                      # November / Monthly Deep Dive Rollup
│   │       ├── QuarterlyView.tsx                    # Q1 Fiscal Performance View
│   │       └── YearlyView.tsx                       # Annual Fiscal Year & YoY Rollup
│   ├── guest/
│   │   └── GuestQrScanner.tsx                      # Visitor QR Scanner Component
│   ├── member/
│   │   ├── MemberAnalytics.tsx                      # Personal Member Analytics
│   │   └── QrScanner.tsx                            # Member QR Scanner
│   └── Test/
│       └── member/
│           ├── MemberAnalyticsTest.tsx             # Test Harness for Analytics
│           └── QrScannerTest.tsx                   # Test Harness for Scanner
├── lib/
│   ├── geofence.ts                                   # Geolocation Verification Logic
│   ├── offlineSync.ts                               # IndexedDB / LocalStorage Attendance Queue
│   ├── analytics/
│   │   └── admin/
│   │       └── engine.ts                             # Multi-tier administrative rollup engine
│   └── supabase/
│       ├── client.ts                                 # Supabase Browser Client
│       └── server.ts                                 # Supabase Server Client
├── public/
│   ├── icon.svg                                      # Public SVG Icon
│   └── manifest.json                                 # PWA Manifest
└── types/
    └── admin.ts