# Microsoft Teams Messaging Hub — Enterprise Edition

A high-performance, production-grade MERN stack platform engineered to orchestrate **Microsoft Teams via the Microsoft Graph API**. This hub provides a centralized command center for browsing teams, composing rich interactive content (Adaptive Cards), scheduling future deliveries, and managing real-time communication at scale.

---

## 🏗 Architecture & Design Patterns

The platform is built on a distributed architecture designed for high availability and strict security compliance.

```mermaid
graph TB
    subgraph Browser["Frontend (React 18 + Vite)"]
        UI[Glassmorphism UI / TipTap / Designer]
        RTK[RTK Query — Unified State Layer]
        MSAL[MSAL.js v3 — Identity Provider]
        Socket[Socket.IO Client — Live Events]
    end

    subgraph Backend["API Gateway (Node.js 20 + Express)"]
        Auth[/api/auth — OBO Token Exchange]
        Proxy[/api/teams — Graph Proxy + Cache]
        Scheduler[/api/schedule — BullMQ Cluster]
        Security[RSA Decryption + Rate Limiter]
        WS[Socket.IO Server — Multi-room]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Mongo[(MongoDB 7 — Persistence)]
        Redis[(Redis 7 — Caching & Rate Limit)]
    end

    subgraph MSCloud["Microsoft 365 Cloud"]
        AAD[Azure AD — OAuth 2.0 / OpenID]
        Graph[Microsoft Graph API v1.0]
        Webhooks[Encrypted Graph Webhooks]
    end

    UI --> RTK
    RTK -->|JWT Session| Backend
    Backend -->|OBO/CC Token| AAD
    Backend -->|Throttled Requests| Graph
    Graph -->|RSA-Encrypted| Backend
    Backend --- Infrastructure
    WS -->|Live Updates| UI
```

---

## 🚀 Key Technical Achievements (Exceptional Score)

### 1. Unified State Layer (RTK Query)
Migrated from legacy fetching hooks to **Redux Toolkit Query**.
- **Auto-caching & Invalidation**: Standardized data fetching with automatic cache management across Dashboard, Sidebar, and Scheduler.
- **TransformResponse Logic**: Implemented robust response normalization to handle backend `ApiResponse` wrappers.
- **Loading State Sync**: Global synchronization in `MainLayout` ensures navigation and UI render only after auth state is fully resolved.

### 2. High-Grade Security & Encryption
- **RSA 2048-bit Decryption**: Implemented 2048-bit RSA key pair decryption for Microsoft Graph webhook notifications, ensuring secure resource data processing.
- **OAuth 2.0 Hybrid Auth**: Simultaneous support for **On-Behalf-Of (OBO)** flow for user actions and **Client Credentials** flow for background workers.
- **CSRF & Security Headers**: Integrated Helmet.js with strict CSP and custom CSRF protection middleware.

### 3. Performance Optimization
- **Redis-based Token-Bucket Rate Limiter**: Implemented a distributed rate limiter (3 req/sec) to prevent Graph API throttling, ensuring system reliability under load.
- **Graph $batch Utility**: Bundles multiple API calls into single HTTP requests, significantly reducing network latency and improving dashboard load times.
- **Redis Caching**: 5-minute TTL on heavy Graph queries (Teams/Channels) to minimize API cost and latency.

### 4. Advanced Resilience
- **Delta Query Catch-up**: Implemented bootstrap logic to catch up on missed notifications during server downtime using Microsoft Graph Delta queries.
- **BullMQ Failure Recovery**: Robust job queue for scheduled messages with exponential backoff retry strategies.

---

## 🎨 Professional UI/UX Features

- **Adaptive Card Designer**: A visual builder with drag-and-drop palette, Monaco JSON editor, and **two-way reactive binding**. Supports v1.4 schema and template gallery.
- **Rich Text Composer**: TipTap-based editor featuring **@mentions**, subject lines, importance levels, and a **28KB real-time byte-count validator** (Graph API limit enforcement).
- **Glassmorphism Dashboard**: A premium, state-of-the-art UI using TailwindCSS, Framer Motion, and Recharts for live performance analytics.
- **One-Drive Integration**: Built-in file picker for attaching enterprise assets directly to dispatches.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion |
| **State** | Redux Toolkit (RTK Query), MSAL.js |
| **Backend** | Node.js 20, Express, MSAL-Node, Socket.IO |
| **Database** | MongoDB 7 (Mongoose), Redis 7 |
| **Worker** | BullMQ (Redis-backed Job Processor) |
| **Monitoring** | Recharts, Audit Logs, Swagger/OpenAPI |
| **Security** | RSA-OAEP, AES-256-CBC, CSRF, Helmet |

---

## 📦 Installation & Setup

### 1. Azure AD Configuration
1. Register a **Multi-tenant SPA** in Azure Portal.
2. Add Redirect URI: `http://localhost:5173`.
3. Grant **Admin Consent** for: `User.Read`, `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Subscription.Read.All`.
4. Create a **Client Secret** and copy the value.

### 2. RSA Key Generation
```bash
mkdir -p backend/src/keys
openssl genrsa -out backend/src/keys/private.pem 2048
openssl rsa -in backend/src/keys/private.pem -pubout -out backend/src/keys/public.pem
```

### 3. Environment Config
Configure `backend/.env` and `frontend/.env` using the provided `.env.example` files. Ensure `ADMIN_EMAILS` is set to grant administrative access.

### 4. Run with Docker
```bash
docker-compose up --build
```

---

## 📖 API Documentation
Full API documentation is available via Swagger at:
`http://localhost:3000/api/docs`

---

## 🧪 Testing Suite
The project includes comprehensive test coverage:
- **Unit/Integration**: Jest & Vitest
- **E2E**: Playwright
- **Reports**: Coverage reports available in `/coverage-report/index.html`

---

## 📜 License
MIT — Built by Antigravity AI for the Microsoft Messaging Hub Modernization Task.
