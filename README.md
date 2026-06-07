# Cognitive CRM (Multi-Tenant B2B SaaS)

An intelligent, multi-tenant lead generation and Customer Relationship Management (CRM) platform. Any external business can sign up, select an industry profile (Healthcare, Hotels, Real Estate, etc.), dynamically configure database schemas and vocabulary, deploy web scrapers to gather industry leads, and configure autonomous prompt-injected AI agents to manage custom CRM pipelines.

---

## Technical Stack

- **Backend**: NestJS 11 (TypeScript) — Modular REST API, BullMQ async parser workers, Playwright browser scraper.
- **Frontend**: React 19 + Vite 8 + Zustand + Tailwind CSS — Premium responsive dashboard with light/dark theme toggle.
- **Database**: PostgreSQL 16 + Supabase Row-Level Security (RLS) + Prisma ORM v7 (Mumbai `ap-south-1` hosted).
- **Asynchronous Queue**: Redis 7 + BullMQ 5.77.
- **AI Middleware**: OpenAI API (GPT-4o & GPT-4o-mini).
- **Schema Validation**: AJV (Another JSON Schema Validator) for dynamic client schemas.

---

## Core SaaS Architecture Features

1. **100% Tenant Isolation**: Data is separated at the database layer using PostgreSQL Row-Level Security (RLS). Cross-tenant queries are blocked directly at the database engine level.
2. **Metadata-Driven Fields**: Custom fields are saved under a GIN-indexed JSONB column. Payloads are checked at runtime using AJV compiler modules.
3. **AI Parsing Middleware**: Unstructured scraper runs are mapped directly to custom dynamic fields using OpenAI structured output parsers.
4. **Composed Prompt Factory**: Meta-Agents compile vocabulary, pipeline stages, and tone variables on client authentication, enabling custom industry workflows.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker Desktop](https://www.docker.com/) (to run database and Redis services)
- [Git](https://git-scm.com/)

---

## Quick Start

### 1. Launch Docker Services
```bash
docker-compose up -d
```
This runs PostgreSQL and Redis instances in the background.

### 2. Configure Environment Variables
Copy and configure backend variables:
```bash
cd backend
cp ../.env.example .env
```
Ensure you provide your `DATABASE_URL` (Supabase or local PostgreSQL) and your `OPENAI_API_KEY` to run AI parsing.

### 3. Sync Database Schema & Build Client
```bash
npm install
npx prisma db push
npx prisma generate
```

### 4. Run Applications Locally
Start the backend NestJS server:
```bash
npm run start:dev
```
Backend runs at `http://localhost:3000`.

Start the frontend Vite React server:
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 5. Run Mobile App (Android)
To compile the mobile application wrapper:
```bash
cd frontend
npm run build:android
```
This bundles web assets, syncs them to the Capacitor Android project, and launches the project configurations.
The compiled package can be found at the workspace root: `cognitive-crm-scraper.apk`.

---

## Key API Endpoints
All client-facing requests must supply the custom `x-tenant-id` header to route queries within RLS isolation.

| Method | Endpoint | Headers | Description |
|---|---|---|---|
| `GET` | `/api/leads` | `x-tenant-id` | Retrieve paginated leads for active tenant |
| `POST`| `/api/leads` | `x-tenant-id` | Save custom lead (validated via AJV schema) |
| `POST`| `/api/scraper/jobs`| `x-tenant-id` | Deploy structured scraping task (supports URL Mode & Omni-Discovery Mode) |
| `POST`| `/api/v1/webhooks/communication/inbound`| None | Public unauthenticated endpoint for communication replies |

---

## V5.0 Production Discovery Engine
The Cognitive CRM now features a **Hybrid Scraper & Contact Retrieval Engine**:
- **URL Targeting**: Aggressively crawls target websites, follows internal sub-routes `/about`, `/contact`, `/terms` up to 3 links, and parses structured contact data.
- **Omni-Discovery Search**: Enter an industry and region (e.g. "Restaurant" in "Mumbai"). The scraper autonomously sweeps search engine results, harvests domain targets, and fetches direct mobile lines, emails, Instagram handles, and Facebook URLs.
- **Strict B2B Filtration**: Drops low-intent front-desk addresses (`info@`, `support@`, etc.) and placeholder records. Contacts lacking complete endpoints are cleanly marked as `INCOMPLETE` or dropped to preserve lead quality.

---

## Documentation Directories

* [Product Requirements Document (PRD)](PRD.md): Detailed product features, user target personas, and roadmap goals.
* [Architectural Blueprint](ARCHITECTURE_BLUEPRINT.md): Production DDL schemas, RLS rules, NestJS filters, and AI state machine blocks.
* [Technical Knowledge Base](KNOWLEDGE.md): Detailed reference guide on RLS context middleware, AJV validator, and BullMQ worker structures.

---

*© 2026 Cognitive CRM. All rights reserved.*
