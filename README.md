# Microsoft Teams Messaging Hub

A production-grade MERN stack platform that connects to **Microsoft Teams via the Microsoft Graph API**. Browse teams, compose rich messages (plain text + Adaptive Cards), schedule future deliveries, and receive real-time reply notifications — all from a browser, without opening Teams.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph Browser["Browser (React SPA)"]
        UI[React UI / TipTap / Card Builder]
        MSAL[MSAL.js v3 — PKCE Flow]
        RTK[Redux Toolkit + RTK Query]
        Socket[Socket.IO Client v4]
    end

    subgraph Backend["Express API Server (Node.js 20)"]
        Auth[/api/auth — OBO + CC Token Exchange]
        Teams[/api/teams — Graph Proxy + Redis Cache]
        Messages[/api/messages — Send + History]
        Schedule[/api/schedule — BullMQ Jobs]
        Subs[/api/subscriptions — Webhook Lifecycle]
        WebhookRcv[/webhook/graph — HMAC Validated]
        Bot[/api/bot — Outgoing Webhook + Card Actions]
        WS[Socket.IO Server v4]
    end

    subgraph Data["Data Layer"]
        Mongo[(MongoDB 7)]
        Redis[(Redis 7 + BullMQ)]
    end

    subgraph MS["Microsoft Cloud"]
        AAD[Azure AD — OAuth 2.0]
        Graph[Microsoft Graph API v1.0]
    end

    UI -->|PKCE Auth| MSAL
    MSAL -->|id_token + access_token| AAD
    UI -->|REST + Cookie Session| Backend
    RTK -->|RTK Query API calls| Backend
    Socket -->|Socket.IO| WS
    Backend -->|OBO / CC Token| AAD
    Backend -->|Graph API Calls| Graph
    Graph -->|Webhook Notifications| WebhookRcv
    Backend --- Mongo
    Backend --- Redis
    WS -->|Broadcast Replies| Socket
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Auth (Frontend) | MSAL.js v3 — PKCE flow |
| State Management | Redux Toolkit + RTK Query |
| Rich Editor | TipTap v2 with @mention extension |
| Real-time | Socket.IO Client v4 |
| Forms & Validation | React Hook Form + Zod |
| Backend | Node.js 20 + Express.js 5 |
| Auth (Backend) | MSAL-Node v2 — OBO + Client Credentials |
| Graph SDK | @microsoft/microsoft-graph-client |
| Database | MongoDB 7 + Mongoose 8 |
| Queue / Cache | Redis 7 + BullMQ |
| Session | express-session + connect-redis |
| Testing | Jest + Supertest + MSW + Vitest + RTL |
| DevOps | Docker + Docker Compose + GitHub Actions |
| Docs | Swagger UI / OpenAPI 3.1 |

---

## Features

- **Sign in with Microsoft** — MSAL.js PKCE flow, silent token refresh, multi-account support
- **Teams & Channel Browser** — paginated sidebar with search, favourites, recent channels
- **Rich Message Composer** — TipTap editor with bold, italic, lists, links, @mentions, importance, subject, 28KB limit warning, 30-second draft auto-save
- **Adaptive Card Builder** — drag-and-drop canvas, Monaco JSON editor, two-way binding, v1.4 enforcement, template gallery
- **Message Scheduling** — BullMQ delayed jobs, daily/weekly/monthly recurrence, cancel-series, retry with Retry-After
- **Real-time Notifications** — Socket.IO live reply feed, toast alerts for all contract events
- **Graph Webhooks** — HMAC-validated, RSA-encrypted notifications, auto-renewal 5 min before expiry, delta catchup
- **Admin Panel** — Recharts analytics, audit log, webhook monitor, failed message retry
- **OneDrive File Picker** — attach files from OneDrive without leaving the app
- **Outgoing Webhook Bot** — `@Hub status` / `@Hub help` commands in Teams
- **Multi-tenant Onboarding** — admin consent flow for any M365 organisation
- **Security** — httpOnly session cookie, CSRF protection, CSP headers, no tokens in localStorage

---

## Prerequisites

- **Node.js 20 LTS**
- **Docker & Docker Compose**
- **Microsoft 365 account** with Teams (free dev tenant at [developer.microsoft.com/microsoft-365/dev-program](https://developer.microsoft.com/microsoft-365/dev-program))
- **ngrok** for webhook development

---

## 1. Azure AD App Registration

> This is required before running the app. Follow every step.

### Step 1 — Create the App

1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App Registrations** → **New registration**
2. Fill in:
   - **Name**: `Microsoft Messaging Hub`
   - **Supported account types**: `Accounts in any organizational directory (Multi-tenant) and personal Microsoft accounts`
   - **Redirect URI**: Platform = `Single-page application (SPA)`, URL = `http://localhost:5173`
3. Click **Register**

### Step 2 — Copy Credentials

From the **Overview** page:
- **Application (client) ID** → `CLIENT_ID` / `VITE_AZURE_CLIENT_ID`
- **Directory (tenant) ID** → `TENANT_ID` / `VITE_AZURE_TENANT_ID`

### Step 3 — Add Redirect URIs

Go to **Authentication** → under Single-page application, add:
- `http://localhost:80`
- `http://localhost:3000`

Enable both **Access tokens** and **ID tokens** checkboxes → **Save**

### Step 4 — Create Client Secret

Go to **Certificates & secrets** → **New client secret**:
- Description: `hub-secret`
- Expires: 24 months
- Click **Add** → **immediately copy the Value** (it disappears after you leave)

This is your `CLIENT_SECRET`.

### Step 5 — API Permissions

Go to **API permissions** → **Add a permission** → **Microsoft Graph**

**Delegated permissions:**
- `Team.ReadBasic.All`
- `Channel.ReadBasic.All`
- `ChannelMessage.Send`
- `ChatMessage.Send`
- `User.Read`
- `User.ReadBasic.All`
- `Files.ReadWrite`
- `offline_access`
- `openid`
- `profile`

**Application permissions:**
- `ChannelMessage.Read.All`
- `ChannelMessage.Send`
- `Subscription.Read.All`

Click **Grant admin consent for Default Directory** → **Yes**

### Step 6 — Token Configuration (Optional Claims)

Go to **Token configuration** → **Add optional claim** → **ID Token**:
- Add: `preferred_username`, `email`

Repeat for **Access Token**.

---

## 2. RSA Key Generation (Encrypted Webhook Notifications)

```bash
mkdir -p backend/certs
openssl genrsa -out backend/certs/private.pem 2048
openssl rsa -in backend/certs/private.pem -pubout -out backend/certs/public.pem
```

> The `certs/` directory is gitignored. Never commit private keys.

---

## 3. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Azure credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your Azure credentials
```

### backend/.env

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/microsoft-messaging-hub

REDIS_HOST=localhost
REDIS_PORT=6379

# Azure AD — from App Registration Overview
TENANT_ID=your_tenant_id_or_common
CLIENT_ID=your_application_client_id
CLIENT_SECRET=your_client_secret_value

# Webhook — update after starting ngrok
WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app/webhook/graph
WEBHOOK_CLIENT_STATE=generate_with_node_crypto_32_bytes_hex

# RSA Keys
RSA_PRIVATE_KEY_PATH=./certs/private.pem
RSA_PUBLIC_KEY_PATH=./certs/public.pem

# JWT Session
JWT_SECRET=generate_with_node_crypto_64_bytes_hex

# Outgoing Webhook Bot (optional)
TEAMS_OUTGOING_WEBHOOK_TOKEN=from_teams_outgoing_webhook_setup
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### frontend/.env

```env
VITE_AZURE_CLIENT_ID=your_application_client_id
VITE_AZURE_TENANT_ID=common
VITE_API_BASE_URL=http://localhost:3000/api
```

> Use `common` as tenant ID to support both personal and work Microsoft accounts.

---

## 4. ngrok Setup (Webhook Development)

Microsoft Graph requires a **publicly accessible HTTPS URL** to send webhook notifications.

```bash
# Install ngrok: https://ngrok.com/download
ngrok config add-authtoken <your-ngrok-auth-token>

# Start tunnel (in a separate terminal)
ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok-free.app`) and set in `backend/.env`:

```env
WEBHOOK_URL=https://abc123.ngrok-free.app/webhook/graph
```

> Free ngrok URLs change on every restart. Update `WEBHOOK_URL` and any active Graph subscriptions after each restart.

---

## 5. Running Locally

```bash
# Terminal 1 — MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7

# Terminal 2 — Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Terminal 3 — Backend
cd backend && npm install && npm run dev

# Terminal 4 — Frontend
cd frontend && npm install && npm run dev

# Terminal 5 — ngrok
ngrok http 3000
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger Docs | http://localhost:3000/api/docs |
| ngrok Dashboard | http://localhost:4040 |

---

## 6. Running with Docker Compose

```bash
# Full stack (production mode)
docker-compose up --build

# Development mode with ngrok sidecar
NGROK_AUTHTOKEN=your_token docker-compose --profile dev up --build
```

Services:
- `http://localhost:80` — Frontend (Nginx)
- `http://localhost:3000` — Backend API
- `http://localhost:27017` — MongoDB
- `http://localhost:6379` — Redis
- `http://localhost:4040` — ngrok Dashboard (dev profile)

> Full stack starts in under 5 minutes.

---

## 7. Seed Test Data

After starting the backend, populate the database with realistic test data:

```bash
cd backend
npx ts-node src/scripts/seed.ts
```

This creates:
- **12 sent messages** across demo teams and channels
- **5 Adaptive Card templates** (Status Update, Incident Alert, Meeting Invite, Deployment, Approval)
- **15 audit log entries** spanning 14 days
- **3 Graph subscriptions** (active, expiring soon, expired)
- **5 scheduled messages** (pending, sent, failed, recurring)

---

## 8. How to Use the App

### Sign In
1. Open `http://localhost:5173`
2. Click **Sign in with Microsoft**
3. Authenticate with your Microsoft account
4. You'll land on the Dashboard

### Browse Teams & Channels
- The left sidebar shows all Teams you belong to
- Click a Team to expand its channels
- Click a channel to select it as the active context
- Use the search box to filter teams
- Star icon to favourite a channel (persisted to your profile)

### Send a Message
1. Select a channel from the sidebar
2. The **Message Composer** appears on the Dashboard
3. Type your message — supports **bold**, *italic*, lists, links
4. Type `@` to trigger member mention autocomplete
5. Set **Importance** (Normal / High / Urgent) and optional **Subject**
6. Click **Send Now** — message posts to Teams via Graph API

### Send an Adaptive Card
1. Click **Designer** in the left navigation
2. Drag elements from the left palette onto the canvas
3. Edit JSON directly in the Monaco editor on the right
4. Click **Templates** to load a pre-built template
5. Click **Send to Teams** to post the card to the selected channel

### Schedule a Message
1. Click **Scheduler** in the navigation
2. Fill in the **Schedule Message** form:
   - Team ID and Channel ID
   - Message content
   - Date & time (must be in the future)
   - Recurrence: One-time / Daily / Weekly / Monthly
3. Click **Schedule Message**
4. View all scheduled jobs in the table below
5. Hover a pending job to reveal the **Cancel** button

### Admin Panel
1. Click **Admin** in the navigation
2. **Analytics tab** — bar charts of sent vs failed messages per day
3. **Webhooks tab** — manage Graph subscriptions, create new ones, view expiry countdown
4. **Audit Logs** — paginated table of all actions with retry button for failures

### Outgoing Webhook Bot (Teams)
Type commands in any Teams channel where the bot is registered:
- `@Hub status` — check system health
- `@Hub help` — list available commands

Setup:
1. Teams channel → **Manage Team** → **Apps** → **Create outgoing webhook**
2. Name: `Hub`, Callback URL: `https://your-ngrok-url/api/bot/command`
3. Copy the Security Token → set as `TEAMS_OUTGOING_WEBHOOK_TOKEN` in `backend/.env`

### Multi-Tenant Onboarding
For new organisations to connect their M365 tenant:
1. Direct their admin to: `http://localhost:3000/api/auth/admin-consent?tenantId=<their-tenant-id>`
2. Admin grants consent in Azure AD
3. They're redirected back with a success banner
4. Their tenant is now registered and all users can sign in

---

## 9. API Documentation

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Postman Collection**: [`/docs/api-collection.json`](./docs/api-collection.json)

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/msal-token` | Exchange MSAL token → session cookie |
| GET | `/api/auth/me` | Current user + Graph /me data |
| GET | `/api/teams` | List joined Teams (cached) |
| GET | `/api/teams/:id/channels` | List channels |
| POST | `/api/messages/send` | Send message or Adaptive Card |
| POST | `/api/messages/reply` | Reply to a thread |
| GET | `/api/messages/sent` | Paginated sent history |
| POST | `/api/schedule` | Create scheduled/recurring job |
| DELETE | `/api/schedule/:id` | Cancel scheduled message |
| POST | `/api/subscriptions` | Create Graph webhook subscription |
| POST | `/webhook/graph` | Graph notification receiver (public) |
| GET | `/api/analytics/messages` | Message stats for charts |
| GET | `/api/audit` | Paginated audit log |
| GET | `/api/health` | Liveness + Redis + MongoDB status |

---

## 10. Running Tests

```bash
# Backend tests (Jest + MSW)
cd backend && npm test

# Backend tests with coverage report
cd backend && npm test -- --coverage

# Frontend component tests (Vitest + RTL)
cd frontend && npx vitest run

# E2E tests (Playwright)
npx playwright test
```

Coverage report is generated at `/coverage-report/index.html`.

---

## 11. Auth Flow Details

The app uses **three distinct auth flows simultaneously**:

### PKCE Flow (Frontend)
- Browser uses MSAL.js to authenticate with Azure AD
- Gets `id_token` + `access_token` via PKCE (no client secret in browser)
- Token stored in MSAL's internal cache (never in localStorage)
- Session JWT set as **httpOnly cookie** by backend — never accessible to JavaScript

### On-Behalf-Of (OBO) Flow (Backend)
- Frontend passes its `access_token` to `POST /api/auth/msal-token`
- Backend exchanges it for a Graph-scoped token using MSAL-Node OBO flow
- OBO tokens cached in Redis per user per scope
- Used for all delegated Graph calls (teams, messages, channels)

### Client Credentials Flow (Daemon)
- BullMQ workers use `client_id` + `client_secret` to get app-only tokens
- No user context — used for scheduled messages and webhook subscription management
- Tokens cached in Redis with automatic refresh

---

## 12. Security Notes

- **Session JWT** is stored in an `httpOnly` cookie — never exposed to JavaScript
- **CSRF protection** — every mutating request requires `X-CSRF-Token` header matching the `csrf-token` cookie
- **Content-Security-Policy** header set via Helmet
- **Webhook HMAC** — every Graph notification validated against `WEBHOOK_CLIENT_STATE`
- **RSA-encrypted notifications** — Graph encrypts payloads with your public key; backend decrypts with private key
- **Client secret** never appears in any frontend file, git history, or log output
- **Token-bucket rate limiter** — Redis Lua script prevents Graph API abuse
- **Circuit breaker** — after 5 consecutive Graph failures, opens for 60 seconds

---

## 13. Common Issues

**Login redirects back to login page**
- Clear browser cookies and localStorage for `localhost:5173` and `localhost:3000`
- Make sure `handleRedirectPromise()` is called on app init (already done in `AuthProvider.tsx`)

**Teams not showing (empty sidebar)**
- Personal Microsoft accounts don't have Teams — use a work/school account or M365 dev tenant
- Demo teams are shown as fallback when Graph returns empty

**Webhook not receiving notifications**
- Ensure ngrok is running and `WEBHOOK_URL` in `.env` matches the current ngrok URL
- The `/webhook/graph` endpoint must be publicly accessible
- Check ngrok dashboard at `http://localhost:4040` for incoming requests

**OBO token exchange fails (AADSTS50027)**
- Personal accounts don't support OBO — the app falls back to using the access token directly
- For full OBO support, use a work/school M365 account

**`RedisStore is not a constructor`**
- Use named import: `import { RedisStore } from 'connect-redis'` (not `require().default`)

---

## 14. Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── auth/               # MSAL OBO, Client Credentials, authMiddleware
│   │   ├── config/             # MSAL, GraphClient, Redis, DB, env validation
│   │   ├── models/             # User, SentMessage, ScheduledMessage, GraphSubscription, MessageTemplate, AuditLog
│   │   ├── modules/
│   │   │   ├── auth/           # Login, logout, /me, multi-tenant onboarding
│   │   │   ├── teams/          # Teams/channels list, members, photos, $batch
│   │   │   ├── messages/       # Send, reply, history, search, delete
│   │   │   ├── scheduler/      # BullMQ jobs, recurrence, cancel
│   │   │   ├── templates/      # Adaptive Card template CRUD
│   │   │   ├── webhooks/       # Graph subscription lifecycle, HMAC, RSA decrypt
│   │   │   ├── analytics/      # Stats, failures, audit log
│   │   │   ├── favourites/     # Channel favourites (persisted to User model)
│   │   │   └── bot/            # Outgoing webhook + Action.Submit handler
│   │   ├── queues/             # scheduledMessageWorker, subscriptionRenewalWorker
│   │   ├── shared/middleware/  # graphMiddleware (OBO token + Graph client)
│   │   ├── socket/             # Socket.IO server, room management
│   │   └── utils/              # GraphClient (circuit breaker), rateLimiter, adaptiveCards, logger
│   ├── tests/                  # Jest + MSW test files
│   ├── certs/                  # RSA key pair (gitignored)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                # Redux store + RTK Query API slices
│   │   ├── auth/               # MSAL config, AuthProvider, useAuth, useGraphToken
│   │   ├── features/
│   │   │   ├── auth/           # LogoutButton, ProtectedRoute, AdminConsentBanner
│   │   │   ├── builder/        # Adaptive Card designer (drag-drop + Monaco)
│   │   │   ├── composer/       # TipTap message composer with @mention
│   │   │   ├── dashboard/      # Main dashboard with stats
│   │   │   ├── history/        # Sent message history + search
│   │   │   ├── scheduler/      # Schedule form (React Hook Form + Zod) + dashboard
│   │   │   ├── templates/      # Template library
│   │   │   └── admin/          # Analytics, webhooks, audit log
│   │   ├── hooks/              # useSocket, useTeamsData, useMessagesData, useGraphToken, etc.
│   │   ├── components/         # TeamsSidebar, OneDrivePicker
│   │   └── tests/              # Vitest + RTL component tests
│   └── .env.example
├── e2e/                        # Playwright E2E tests
├── docs/
│   └── api-collection.json     # Postman collection
├── coverage-report/            # Jest coverage HTML report
├── docker-compose.yml
├── playwright.config.ts
└── README.md
```

---

## 15. Submission Checklist

- [x] GitHub repository with clean commit history
- [x] `docker-compose up --build` starts full stack
- [x] `.env.example` with all variables documented
- [x] README with Azure AD setup guide, ngrok setup, architecture diagram
- [x] `docs/api-collection.json` — Postman collection
- [x] `coverage-report/index.html` — Test coverage report
- [x] Swagger UI at `/api/docs`
- [x] Multi-tenant onboarding (bonus +5)
- [x] Outgoing webhook bot (bonus +4)
- [x] Adaptive Cards Action.Submit handling (bonus +4)
- [x] OneDrive file picker (bonus +3)
- [x] Playwright E2E tests (bonus +4)
- [ ] Screen recording (3–5 min demo) — record manually

---

## License

MIT — Built for the Senior MERN Stack Developer Technical Assessment.
