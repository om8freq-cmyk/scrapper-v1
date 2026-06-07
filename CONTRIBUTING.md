# 🤝 Contributing to Cognitive CRM & Lead Scraper

Welcome to the **Cognitive CRM** project! We are excited to have you collaborate with us. This guide will walk you through setting up your environment, understanding the architecture, and contributing code to this repository.

---

## 📂 Repository Structure

The project is structured as a monorepo containing:
*   **[backend/](file:///d:/ScRaPpEr/backend)**: NestJS 11 (TypeScript) REST API, BullMQ asynchronous workers, and Playwright browser crawler.
*   **[frontend/](file:///d:/ScRaPpEr/frontend)**: React 19 + Vite 8 + Zustand dashboard.
*   **[redis-portable/](file:///d:/ScRaPpEr/redis-portable)**: Portable Redis server executable (for Windows environment convenience).
*   **[android-sdk/](file:///d:/ScRaPpEr/android-sdk)**: Dedicated location for local Android SDK (excluded from Git).

---

## 🛠️ Onboarding Quick Start (Local Setup)

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   **Node.js** v20 or later
*   **PostgreSQL 16** (either a native local service or a Docker container)
*   **Java Runtime Environment (JRE)** (required for Android builds)

### 2. Configure Environment Variables
Copy and configure the environment settings:
```bash
cd backend
cp ../.env.example .env
```
Open `backend/.env` and update the database URL and API keys:
*   `DATABASE_URL`: `"postgresql://<user>:<password>@localhost:5432/<db>?schema=public"`
*   `OPENAI_API_KEY`: Required for LLM structured output parsing.

### 3. Spin Up Services
#### Database:
Ensure PostgreSQL is running on port `5432`.

#### Redis Cache:
If you do not have Redis installed natively or via Docker, start the portable Redis server included in the workspace:
```powershell
cd redis-portable
.\redis-server.exe .\redis.windows.conf
```

### 4. Build & Initialize the Database Schema
Install backend packages and generate the Prisma Client:
```bash
cd backend
npm install
npx prisma db push
```

### 5. Launch the Development Servers

#### Start Backend:
```bash
cd backend
npm run start:dev
```
The REST API runs at [http://localhost:3000](http://localhost:3000).

#### Start Frontend:
```bash
cd ../frontend
npm install
npm run dev
```
The dashboard UI runs at [http://localhost:5173](http://localhost:5173).

---

## 📱 Mobile App (Android) Development

We package the React dashboard into an Android `.apk` binary using **Ionic Capacitor**.

### 1. Configure the SDK
If your machine does not have the Android SDK tools configured:
*   Open a PowerShell terminal as Administrator (or with ExecutionPolicy Bypassed) at the root of the workspace and run:
    ```powershell
    powershell -ExecutionPolicy Bypass -File .\setup_android.ps1
    ```
    This script automatically downloads the Android Command-line tools, sets up `local.properties`, accepts the licenses, and installs the required platform tools.

### 2. Compile and package the APK
To build and sync your React assets, then package the native binary:
```bash
cd frontend
npm run build:android
```
The generated APK will be compiled and copied to the root of the workspace as `cognitive-crm-scraper.apk`.

---

## 📝 Codebase Coding Conventions

To maintain data security and codebase health, developers must follow these paradigms:

### 1. Multi-Tenant Row-Level Security (RLS)
All database queries written inside backend services, controllers, or background consumers must establish the active tenant context:
```typescript
await this.prisma.$transaction(async (tx) => {
  // Always set tenant context before querying leads
  await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}';`);
  
  const leads = await tx.lead.findMany();
  // ...
});
```

### 2. Dynamic Schemas and Metadata
Avoid writing SQL migrations to create fields for individual tenant industries. Save all custom attributes in the GIN-indexed `dynamic_attributes` JSONB column under the `Lead` model, validating them at runtime using AJV schemas.

---

## 🚀 How to Commit and Submit Changes

1.  **Create a branch**:
    ```bash
    git checkout -b feat/your-feature-name
    ```
2.  **Commit with conventional messages**:
    *   `feat: add dynamic email Relayer`
    *   `fix: resolve CORS credentials issues on mobile`
    *   `docs: update onboarding requirements`
3.  **Push and Open a Pull Request**:
    ```bash
    git push -u origin feat/your-feature-name
    ```

Thank you for building the Cognitive CRM ecosystem with us!
