# 📋 Product Requirements Document — Cognitive CRM (B2B SaaS Edition)

> **Version:** 2.0.0  
> **Last Updated:** June 2, 2026  
> **Author:** om8freq-cmyk / Antigravity AI  
> **Status:** Phase 1 active Integration (SaaS Core)

---

## 1. Executive Summary

**Cognitive CRM** is an intelligent, multi-tenant B2B SaaS platform that combines an automated multi-source Lead Scraper Engine with a metadata-driven Customer Relationship Management (CRM) system and an autonomous AI agent communication layer. 

Unlike traditional niche-locked CRMs, Cognitive CRM is globally adaptable. Any external business—regardless of industry vertical (e.g., a Hospital managing patients, a Hotel tracking event guest prospects, a Mall managing retail tenants, or a Gym tracking memberships)—can sign up, immediately select an onboarding profile, dynamically rename database vocabulary, configure scraper profiles, and deploy autonomous prompt-injected AI agents to manage custom CRM pipelines securely.

The platform is designed to guarantee **100% tenant data isolation** at the database layer using PostgreSQL Row-Level Security (RLS) and is hosted in the **Supabase Mumbai (ap-south-1)** region to deliver low latency for growth markets.

---

## 2. Problem Statement

Modern B2B CRM and lead generation tools face severe limitations:
- **Niche Inflexibility**: Standard CRMs have rigid, hardcoded database vocabularies (e.g., fields like "deal_value" or "stage"). Adapting a standard CRM for a clinic ("patient_ailment") or a retail mall ("lease_status") requires massive custom development.
- **Data Leakage Risks in Multi-Tenancy**: Shared-database SaaS platforms face persistent vulnerability to cross-tenant data leaks due to weak software-level logical queries (`WHERE tenant_id = X` bugs).
- **Manual Scraping & Mapping**: Connecting leads scraped from Google Maps, local directories, or social networks to a CRM requires complex CSV exports or fragile third-party integrations (Zapier, Make).
- **Static, Unconfigurable AI Agents**: Customer-facing conversational agents are usually single-purpose, failing to adjust terminology and operational instructions dynamically based on client industry categories.

---

## 3. Vision & Goals

### Vision
> Empower any business worldwide to instantly launch a secure, custom-branded, AI-driven lead generation and CRM ecosystem within 60 seconds.

### Primary Goals

| # | Goal | Success Metric |
|---|------|----------------|
| 1 | **Absolute Data Privacy** | 0% cross-tenant leakage rate verified at the database layer |
| 2 | **Instant Schema Dynamic Adaptation** | Rename/reconfigure CRM fields and vocabularies in < 1 second without code changes |
| 3 | **AI-Guided Automated Scraping** | Convert unstructured scrapes into dynamic tenant-defined attributes with ≥ 90% mapping accuracy |
| 4 | **Meta-Agent Prompt Composability** | Dynamically adjust system instruction templates and terminologies on client login |
| 5 | **Usage-Based Quota Lock** | Real-time billing limit enforcement with < 50ms check latencies |

---

## 4. Target Users & Personas

### Persona 1: Clinical Operations Director (Healthcare)
- **Name:** Dr. Sunita (42, Mumbai)
- **Use Case:** Scrapes local directories for corporate medical partners and tracks patient consultation pipelines.
- **Dynamic Terminology:** Single contact: *"Patient"*, Stages: *Triage → Scheduled → Treatment → Discharged*.
- **Key Pain:** Needs HIPAA-grade data privacy and customized medical triage terminology without building custom software.

### Persona 2: Group Revenue Manager (Hospitality & Events)
- **Name:** Jean-Pierre (31, Paris)
- **Use Case:** Scrapes wedding planners and event management companies, funneling them into an event-booking dashboard.
- **Dynamic Terminology:** Single contact: *"Guest Prospect"*, Stages: *Inquiry → Proposal → Negotiation → Confirmed*.
- **Key Pain:** Needs customizable fields to track room nights, estimated attendees, and corporate catering budgets.

### Persona 3: Leasing Manager (Commercial Real Estate & Malls)
- **Name:** Vikram (45, Dubai)
- **Use Case:** Extracts new retail brands and franchise operators, tracking retail lease agreements.
- **Dynamic Terminology:** Single contact: *"Tenant Prospect"*, Stages: *Prospect → Letter of Intent → Legal Review → Occupied*.
- **Key Pain:** Requires custom notifications that alert legal departments immediately when lease contracts enter review stages.

---

## 5. Feature Specifications

### 5.1 Multi-Tenant Security & Row-Level Isolation (P0)
- **PostgreSQL Row-Level Security (RLS)**: Enforces strict data separation at the database engine level. Every dynamic select, insert, update, or delete query automatically checks the authenticated tenant's identity.
- **Dual-Context Resolution**: Resolves tenant contexts dynamically from either Supabase JWT claims (for client-side REST APIs) or from secure local session parameters (`app.current_tenant_id`) within async backend threads.
- **Unique-Tenant Unique Constraints**: Restricts duplicate contacts per individual business (by email) while allowing separate businesses to save the same lead profile without collision.

### 5.2 Dynamic CRM Dashboard Schema (P0)
- **Metadata-Driven JSONB Architecture**: The unified `leads` table implements a structured JSONB `dynamic_attributes` column, storing custom tenant inputs.
- **AJV Runtime Schema Validator**: Compiles the tenant's dynamic configuration from the `tenant_schemas` metadata table on API entry. Any write or edit command violating the tenant’s schema is rejected with structured errors.
- **Vocabulary Mapper**: Replaces default dashboard labels on the frontend dynamically using terms specified in `tenant_schemas.lead_vocab`.

### 5.3 Universal Scraper Routing & AI Parsing (P0)
- **Scraper Setup UI/UX Wizard**: Guides business owners through parameter configs: Source (Google Maps, YellowPages, Yelp) → Keywords & Location filters → Field Mapping Matrix.
- **Asynchronous BullMQ Parser Worker**: Feeds unstructured crawler payloads into a persistent Redis queue to preserve server resources.
- **OpenAI AI Parsing Middleware**: Evaluates raw crawls against the client's field mapping definitions, compiles variables, runs dynamic AJV validators, and inserts records into the RLS-isolated table.

### 5.4 Configurable AI Meta-Agent (P1)
- **Prompt Composability Factory**: Merges a standard global assistant framework with the active tenant’s persona templates, terms, and custom pipeline stages.
- **Communication State-Machine Webhook**: Evaluates incoming SMS, WhatsApp, and Webchat interactions using LLM function calling, updating lead pipeline status and dynamic attributes automatically in real-time.

### 5.5 Monetization & Usage Tracking (P1)
- **Usage-Based Quota Guards**: Intercepts ingestion endpoints and API routes, checking real-time counts against active monthly subscriptions (Free, Pro, Enterprise).
- **Automatic Overage Caps**: Blocks scraping workers and chat responses immediately upon quota exhaustion to prevent excessive API costs.

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (React 19 + Vite 8 + Zustand)             │
│   Dynamic Label Mapper ──► Resolves Singular/Plural Vocab       │
│   Dashboard Widget ──────► Scraper Config UI / Client Mapping   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Request (X-Tenant-Id Custom Header)
┌───────────────────────────▼─────────────────────────────────────┐
│                     BACKEND (NestJS 11)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ NestJS API Gateway                                        │  │
│  │  ├─ TenantMiddleware (Injects app.current_tenant_id DB context)│  │
│  │  ├─ QuotaGuard (Validates Subscription limits in cache)  │  │
│  │  └─ AJV Schema Validator (Validates dynamic JSONB)        │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │ Asynchronous Queues & AI Middleware                       │  │
│  │  ├─ BullMQ Ingestion Queue (Redis 7)                      │  │
│  │  ├─ OpenAI Parser Middleware (Formats unstructured crawls)│  │
│  │  └─ Meta-Agent Prompt Composability Factory               │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │ Data & Security Layer                                    │  │
│  │  ├─ Prisma Client (Type-safe, handles local contexts)      │  │
│  │  └─ PostgreSQL / Supabase RLS (Mumbai ap-south-1)        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Models (Core Schema Entities)

### Tenant
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, Auto-generated | Unique tenant identifier |
| `name` | String | Required | Name of the registered business |
| `industry_profile` | String | Required | Industry profile (healthcare, hospitality, etc.) |
| `subscription_tier`| String | Default: `free` | `free`, `pro`, `enterprise` |
| `created_at` | DateTime | Auto-set | Record creation time |

### Tenant Schema
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, Auto-generated | Unique record identifier |
| `tenant_id` | UUID | FK (tenants.id), Unique | Target business owner |
| `lead_vocab` | JSONB | Required | Custom naming terms (`singular`, `plural`) |
| `lead_fields` | JSONB | Required | Valid validation JSON Schema |
| `pipeline_stages` | JSONB | Required | Customizable stage arrays |

### Lead
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, Auto-generated | Unique contact identifier |
| `tenant_id` | UUID | FK (tenants.id), RLS Isolation | Owning business owner |
| `name` | String | Required | Primary contact name |
| `email` | String | Nullable | Primary contact email |
| `phone` | String | Nullable | Primary contact phone |
| `source` | String | Required | Crawler profile source name |
| `status_stage_id` | String | Default: `new` | Active CRM phase ID |
| `dynamic_attributes`| JSONB | Default: `{}` | Custom tenant properties |

---

## 8. Non-Functional Requirements

- **Security & Compliance**: Standard Helmet security headers, CORS strict configuration, JWT token parsing, and forced SSL transport.
- **Reliability & Queue Recovery**: Persistent BullMQ jobs in Redis. Completed job parameters are auto-cleaned while failures trigger systematic backoff retries.
- **Scalability**: High-throughput indexes on PostgreSQL GIN JSONB columns allowing fast dynamic query resolutions (< 100ms) even with millions of rows.

---

## 9. Phase Roadmap

- **Phase 1 — Core Database & Multi-Tenant Isolation [Completed]**: Deploy PostgreSQL migrations, configure RLS rules, build the RLS context middleware inside NestJS, and run integration security tests.
- **Phase 2 — Metadata Mapping Engine & UI Wizard [Completed]**: Design dynamic schemas, compile runtime AJV validators, and build the frontend scraper configuration wizard.
- **Phase 3 — Configurable AI Meta-Agent & Queues [Completed]**: Deploy BullMQ parsing workers, implement prompt injection factories, and enable subscription guards.
- **Phase 5 — Unified Production Lifecycle & Hybrid Scraper [Completed]**: Added dual-mode hybrid launch parameters (URL Mode vs Omni-Discovery Mode), Playwright Bing Search web directory sweeping, deep sub-route contact crawler traversal, social graph extraction (Instagram handles and Facebook URLs), strict B2B omission filters, and automated inbound webhook pipeline upgrades to `CONTACTED`.

---

*© 2026 Cognitive CRM. All rights reserved.*
