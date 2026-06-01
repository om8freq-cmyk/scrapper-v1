# 🧠 Technical Knowledge Base — Cognitive CRM (B2B SaaS Edition)

> **Version:** 2.0.0  
> **Last Updated:** June 2, 2026  
> **Purpose:** Comprehensive developer guide detailing multi-tenant RLS, dynamic schemas, AJV validation pipelines, BullMQ async parsing, and prompt injection factories.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Multi-Tenant Architecture Deep Dive](#2-multi-tenant-architecture-deep-dive)
3. [Metadata-Driven Dynamic Fields](#3-metadata-driven-dynamic-fields)
4. [Asynchronous Queues & AI Parsing Middleware](#4-asynchronous-queues--ai-parsing-middleware)
5. [AI Agent Prompt Injection & Communication State Machine](#5-ai-agent-prompt-injection--communication-state-machine)
6. [Onboarding Template Seeding Configurations](#6-onboarding-template-seeding-configurations)
7. [Environment Configurations](#7-environment-configurations)
8. [Development Workflow](#8-development-workflow)
9. [Coding Conventions](#9-coding-conventions)

---

## 1. Project Overview

Cognitive CRM is a modern, monorepo-based B2B SaaS platform that enables any organization to construct lead generation and customer relationship workflows with custom dynamic metadata structures, isolated data environments, and autonomous AI communication channels.

```
ScRaPpEr/
├── backend/                  → NestJS 11 + BullMQ + Playwright + Prisma v7
│   ├── prisma/               → Multi-tenant DDL migrations & Prisma Client
│   └── src/                  → Features, dynamic middlewares, queues, and agents
├── frontend/                 → React 19 + Vite 8 Dashboard
├── PRD.md                    → Product requirements and personas
├── ARCHITECTURE_BLUEPRINT.md → Technical execution document
├── KNOWLEDGE.md              → This reference file
└── README.md                 → Quick start guide
```

---

## 2. Multi-Tenant Architecture Deep Dive

Data isolation between separate business organizations is handled directly by the **PostgreSQL database engine** via **Row-Level Security (RLS)**. This is a critical security lock preventing any software-level leakages.

### 2.1 Dual-Context RLS Resolver
We utilize a context resolver function in PostgreSQL to identify the active `tenant_id` context under two different runtimes:
1. **API JWT Context**: Client-side requests authenticated via Supabase JWT claims access the `'tenant_id'` key in `auth.jwt()`.
2. **Backend Services & Workers**: Background processes, scraping pipelines, and mail queues do not use JWT tokens. They programmatically invoke a local parameter transaction: `SET LOCAL app.current_tenant_id = 'uuid'`.

```sql
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), '')::UUID,
        (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    );
EXCEPTION WHEN OTHERS THEN
    RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 Row-Level Security Rules
Row-Level Security is enabled on both the core `leads` and configuration `tenant_schemas` tables.

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_leads_policy ON leads
    FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
```

---

## 3. Metadata-Driven Dynamic Fields

Cognitive CRM avoids database migrations when clients reconfigure columns. Instead, it utilizes a JSONB "Schema-on-Read" column called `dynamic_attributes` on the `leads` table.

```
Incoming Payload ────► API Entry ────► AJV Compiler (loads tenant JSON schema)
                                             │
      ┌──────────────────────────────────────┴──────────────────────┐
      ▼                                                             ▼
[Valid Schema]                                               [Invalid Schema]
Save in 'dynamic_attributes'                                Reject with HTTP 400
```

### AJV Runtime Verification Middleware
When a lead is saved or modified, the backend retrieves the corresponding JSON Schema definition from `tenant_schemas.lead_fields` and compiles a validator dynamically:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DynamicSchemaValidationService {
  private ajv = new Ajv({ coerceTypes: true });

  constructor(private prisma: PrismaService) {}

  async validateLeadAttributes(tenantId: string, payload: Record<string, any>): Promise<boolean> {
    const schemaRecord = await this.prisma.tenantSchema.findUnique({
      where: { tenantId },
    });
    if (!schemaRecord) throw new BadRequestException('Schema context missing.');

    const validate = this.ajv.compile(schemaRecord.lead_fields as any);
    const valid = validate(payload);

    if (!valid) {
      throw new BadRequestException(validate.errors?.map(e => `${e.instancePath} ${e.message}`).join(', '));
    }
    return true;
  }
}
```

---

## 4. Asynchronous Queues & AI Parsing Middleware

To prevent scraping tasks from blocking REST API processes, all crawls are routed as asynchronous tasks through BullMQ in Redis.

```
[Raw Scraper Job] 
       │ (Crawl yields unstructured text/DOM details)
       ▼
[Pushed to BullMQ] ──► [LeadsParsingConsumer]
                              │
                              ▼ (Fetches client mappings definition)
                      [OpenAI GPT-4o-mini parser]
                              │
                              ▼ (Extracts attributes fitting mappings)
                      [AJV Runtime Validation]
                              │
                              ▼ (Saves within transactional RLS scope)
                       [Database Leads]
```

### OpenAI Structured Mapping Invocation
The consumer queries OpenAI using structured JSON outputs to map unstructured crawl streams into defined target columns, adhering to the client's custom database schema constraints.

---

## 5. Configurable AI Meta-Agent Core

We utilize a metadata-driven **Prompt Factory** to build contextually aware conversational agents that dynamically shift system instruction sets, terms, and pipeline capabilities depending on the active tenant's profile.

### 5.1 System Prompt Construction Factory
```typescript
const leadSingular = schema.lead_vocab.singular; // "Patient"
const leadPlural = schema.lead_vocab.plural;   // "Patients"
const pipelineStages = JSON.stringify(schema.pipeline_stages);

const baseComposedPrompt = `
  You are an automated conversational customer manager.
  Vocabulary rules:
  - Singular contact term: "${leadSingular}"
  - Plural collection term: "${leadPlural}"
  
  Active CRM Pipeline Stages:
  ${pipelineStages}

  Tenant Instructions:
  ${persona.system_instruction_template}
`;
```

### 5.2 Dynamic Communication State Machine
The Meta-Agent acts as an intent router. When receiving inputs from channels (WhatsApp, web widget), it classifies the action using LLM Function Calling:
- **`update_lead_stage`**: Invokes queries that update the lead's current stage in the active pipeline.
- **`log_custom_details`**: Compiles raw messages, extracts parameters, runs AJV validations, and saves properties to the `dynamic_attributes` column.

---

## 6. Onboarding Template Seeding Configurations

When a business register, their environment is bootstrapped using one of three structural industry templates:

1. **Healthcare & Clinics**: Singular: `"Patient"`, Plural: `"Patients"`. Custom columns track `primary_ailment`, `insurance_provider`, and `desired_appointment_date`. Stages cover: `Triage` → `Scheduled` → `Treatment` → `Discharged`.
2. **Hospitality & Hotels**: Singular: `"Guest Prospect"`, Plural: `"Guest Prospects"`. Columns track `event_type`, `estimated_attendees`, and `booking_budget`. Stages cover: `Inquiry` → `Proposal` → `Negotiation` → `Confirmed`.
3. **Commercial Real Estate & Malls**: Singular: `"Retail Tenant Prospect"`, Plural: `"Retail Tenant Prospects"`. Columns track `brand_name`, `desired_square_footage`, and `proposed_lease_term_months`. Stages cover: `Lease Prospect` → `Letter of Intent` → `Legal Review` → `Occupied`.

---

## 7. Environment Configurations

### 7.1 Required Variables
- `DATABASE_URL`: Safe PostgreSQL connection URI with pool parameters.
- `REDIS_HOST`: Local/remote Redis host for BullMQ queues.
- `REDIS_PORT`: Default Redis port (`6379`).
- `OPENAI_API_KEY`: API key for AI mapping parser and Meta-Agent actions.

---

## 8. Development Workflow

### Setup & Sync
```bash
# 1. Start database and Redis dependencies
docker-compose up -d

# 2. Synchronize Prisma Client models with RLS migrations
cd backend
npx prisma db push
npx prisma generate

# 3. Spin up NestJS API server
npm run start:dev
```

---

## 9. Coding Conventions

- **Database Transaction Contexts**: All queries written within worker consumers or controllers must map dynamic variables in the PostgreSQL session beforehand: `await tx.$executeRawUnsafe("SET LOCAL app.current_tenant_id = '...';")`.
- **Custom Schema Changes**: Do not write direct SQL alter-table commands for individual tenant schema changes. Define validations via the JSON Schema specification registered in `tenant_schemas`.

---

*© 2026 Cognitive CRM. All rights reserved.*
