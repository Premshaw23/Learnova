# 🏗️ Learnova System Architecture Blueprint

This document provides a highly detailed, advanced architectural blueprint of the **Learnova** platform, targeting maintainers and incoming developers. It details token pipelines, face recognition authentication workflows, offline sync strategies, and data entity relations.

---

## 🗺️ High-Level System Architecture

Learnova is designed around a hybrid Next.js 15 App Router architecture, blending client-side React 19 interactive dashboards with high-performance edge/node serverless routes.

```mermaid
graph TD
    Client[NextJS Client React 19] -->|Auth State| FBAuth[Firebase Authentication]
    Client -->|API Requests| Middleware[NextJS Middleware Gateway]
    Middleware -->|Authorize Routing| API[NextJS Serverless API Routes]
    API -->|Reads / Writes| Mongo[(MongoDB Database Atlas)]
    API -->|Fetch / Store Images| VBlob[(Vercel Blob Storage)]
    Client -->|Offline Events| IDB[(IndexedDB Local Cache)]
```

---

## 🔑 Authentication & Security Token Pipeline

Our route security relies on a dual-stage token check (client-side verification + cryptographic Next.js middleware token checking).

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Teacher
    participant App as Learnova Client
    participant Auth as Firebase Auth SDK
    participant Mid as NextJS Middleware
    participant API as Serverless Backend API

    User->>App: Submits login form credentials
    App->>Auth: Request JWT Access Token
    Auth-->>App: Returns Firebase IdToken (JWT)
    App->>App: Store token in secure HttpOnly Cookies & Authorization Header
    App->>Mid: Navigates to protected path (/student/dashboard)
    Mid->>Mid: Extract cookie & verify token signature against Firebase Key Sets
    alt Token is Valid & Email Verified
        Mid-->>App: Allow page rendering
        App->>API: Fetch Dashboard Stats (Bearer Token)
        API->>API: Verify role-based custom claims
        API-->>App: Returns customized profile statistics
    else Token Expired / Invalid Role
        Mid-->>App: Redirect user to /auth or /verify
    end
```

---

## 📸 Face API.js Liveness & Recognition Pipeline

The automated attendance engine integrates a client-side Neural Network model to perform face verification and avoid anti-spoofing attacks (liveness detection).

```mermaid
graph TD
    A[Start webcam scan] --> B[Load Face-API.js models]
    B --> C[Fetch student descriptors list from MongoDB]
    C --> D[Begin continuous canvas mapping loop]
    D --> E{Face detected?}
    E -- No --> D
    E -- Yes --> F[Compute Distance Matrix]
    F --> G{Confidence >= 60%?}
    G -- No --> D
    G -- Yes --> H[Liveness Check: Request random blinks]
    H --> I{Blink EAR threshold < 0.25 matched?}
    I -- No --> D
    I -- Yes --> J[Authentication Validated]
    J --> K[Record Attendance payload to local/remote sync]
```

---

## 📡 Offline Synchronization Strategy (PWA Queue)

When network connection drops, Learnova enters a persistent, standard-compliant fallback queue utilizing local browser storage:

1. **IndexedDB Intercept**: If `navigator.onLine` is false, `FaceRecognizer` diverts attendance payloads directly into a local IndexedDB buffer.
2. **Connectivity Listener**: The browser registers window listeners tracking `online` events.
3. **Queue Replay**: Once the connection recovers, `syncService.js` processes the queue records sequentially via background task loops and flushes them safely into the MongoDB backend.

---

## 📁 Repository Directory Reference

```
learnova/
├── .github/                  # CI/CD Workflows & Issue/PR Checklists
├── app/                      # App Router page components & NextJS layout layers
├── components/               # Shareable Visual UI elements (ThemeProviders, noticeboards)
├── constants/                # Project constants & default configurations
├── contexts/                 # Global Context singletons (Auth & Notices Pooling)
├── docs/                     # Comprehensive onboarding documentation & blueprints
├── hooks/                    # Reusable Custom React Hooks (useAuth, useAttendance)
├── lib/                      # Cryptographic configuration libraries (Firebase config)
├── services/                 # Remote API integration layers (Auth & DB requests)
└── utils/                    # Shared helper methods
```
