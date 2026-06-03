# 📡 Dynamic API Documentation — Cognitive CRM (B2B SaaS Edition)

> **Version:** 2.0.0  
> **Last Updated:** June 2, 2026  
> **Status:** Phase 1 API Specs (Integrated)

To operate in our Multi-Tenant SaaS platform, **all API calls** targeting tenant resources must supply the client's registered identification within the custom header:  
`x-tenant-id: <UUID>`

---

## Table of Contents

1. [Lead Management APIs](#1-lead-management-apis)
2. [Scraper Configuration APIs](#2-scraper-configuration-apis)
3. [AI Agent Meta-Communication APIs](#3-ai-agent-meta-communication-apis)
4. [Tenant Onboarding & Settings APIs](#4-tenant-onboarding--settings-apis)

---

## 1. Lead Management APIs

End-to-end CRM lead queries adapt automatically to the tenant's registered vocabulary definitions ("Patient", "Guest Prospect", "Retail Tenant Prospect") and are verified at runtime via JSON Schema.

### 1.1 List Leads
* **Endpoint**: `GET /api/leads`
* **Headers**: 
  - `x-tenant-id`: `UUID` (Required)
* **Query Parameters**:
  - `page`: Integer (Default: `1`)
  - `limit`: Integer (Default: `10`)
  - `status`: String (Optional filter by CRM stage ID)
  - `search`: String (Search across name and email)
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "7a90f23d-c119-450c-b26a-1bbcdde99ff8",
      "name": "Dr. Sunita Sharma",
      "email": "sunita.sharma@mumbaiclinic.com",
      "phone": "+919876543210",
      "source": "Google Maps (Mumbai Clinics Search)",
      "status_stage_id": "triage",
      "dynamic_attributes": {
        "primary_ailment": "Cardiology Consultation",
        "insurance_provider": "ICICI Lombard",
        "desired_appointment_date": "2026-06-15"
      },
      "created_at": "2026-06-02T00:45:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 1.2 Create Dynamic Lead
* **Endpoint**: `POST /api/leads`
* **Headers**: 
  - `x-tenant-id`: `UUID` (Required)
* **Request Body**:
```json
{
  "name": "Vikram Singh",
  "email": "vikram@singhrentals.ae",
  "phone": "+971501234567",
  "source": "Manual Import",
  "dynamic_attributes": {
    "brand_name": "Singh Apparel",
    "desired_square_footage": 2500,
    "proposed_lease_term_months": 24
  }
}
```
* **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Lead registered successfully inside isolated tenant scope.",
  "data": {
    "id": "e0b904f7-33f7-41ab-a5a8-b63116812850",
    "tenant_id": "299b4f77-d04a-4c1f-9234-8d1f17e3e2eb",
    "name": "Vikram Singh",
    "email": "vikram@singhrentals.ae",
    "phone": "+971501234567",
    "status_stage_id": "new",
    "dynamic_attributes": {
      "brand_name": "Singh Apparel",
      "desired_square_footage": 2500,
      "proposed_lease_term_months": 24
    },
    "created_at": "2026-06-02T01:00:00Z"
  }
}
```
* **Error Response (`400 Bad Request` - Validation Failure)**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Schema validation failed: /desired_square_footage must be integer"
}
```

---

## 2. Scraper Configuration & Job APIs

Democratize data mining by updating mappings between platform scraper outputs and local columns and launching automation scraping workers.

### 2.1 Set Up Scraper Wizard Config
* **Endpoint**: `POST /api/scraper/configs`
* **Headers**:
  - `x-tenant-id`: `UUID` (Required)
* **Request Body**:
  ```json
  {
    "name": "Google Maps Dental Clinics",
    "sources": ["google_maps"],
    "search_keywords": ["Dental Clinics", "Orthodontists"],
    "target_locations": ["Mumbai, MH", "Pune, MH"],
    "field_mappings": {
      "patient_name": "name",
      "primary_ailment": "category",
      "insurance_provider": "unstructured_metadata.insurance_accepted"
    }
  }
  ```
* **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "configId": "e1f13bc4-00e1-4560-84a2-94776101c518"
  }
  ```

### 2.2 Launch Scraper Automation Job
* **Endpoint**: `POST /api/scraper/jobs`
* **Request Body (URL Mode)**:
  ```json
  {
    "targetUrl": "https://example.com/directory",
    "config": {
      "mode": "url",
      "deepLinkTraversal": true
    }
  }
  ```
* **Request Body (Omni-Discovery Search Mode)**:
  ```json
  {
    "targetUrl": "Omni-Discovery: Restaurant in Mumbai",
    "config": {
      "mode": "omni",
      "targetIndustry": "Restaurant",
      "targetRegion": "Mumbai",
      "deepLinkTraversal": true
    }
  }
  ```
* **Response (`201 Created`)**:
  ```json
  {
    "id": "job_uuid_12345",
    "targetUrl": "Omni-Discovery: Restaurant in Mumbai",
    "status": "PENDING",
    "leadsFound": 0,
    "createdAt": "2026-06-03T11:00:00Z"
  }
  ```

---

## 3. Communication & Webhook APIs

Enables incoming customer replies (via SMS, WhatsApp, or other messaging channels) to be captured, logged, and routed for pipeline progression.

### 3.1 Inbound Communication Webhook
* **Endpoint**: `POST /api/v1/webhooks/communication/inbound`
* **Request Body**:
```json
{
  "contactPhone": "+919876543210",
  "messageBody": "I am interested in joining next week, please count me in!",
  "channel": "WHATSAPP"
}
```
* **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Inbound message processed and status updated.",
  "data": {
    "logId": "f74fb903-f315-43db-8827-b7a102b5ffd1",
    "leadId": "3a607e07-1a47-4b9d-b2bc-acb3c2cc52d4",
    "newStatus": "CONTACTED"
  }
}
```

---

## 4. System Settings APIs

Provides endpoints to read and update dynamic system-wide scraper configuration and SMTP mailing gateway credentials.

### 4.1 Fetch System Settings
* **Endpoint**: `GET /api/settings`
* **Response (`200 OK`)**:
```json
{
  "concurrency": "3",
  "delay": "1500",
  "retries": "3",
  "smtp-host": "smtp.ethereal.email",
  "smtp-port": "587",
  "smtp-user": "your_ethereal_user@ethereal.email",
  "smtp-pass": "your_ethereal_password"
}
```

### 4.2 Update System Settings
* **Endpoint**: `PATCH /api/settings`
* **Request Body**:
```json
{
  "concurrency": "4",
  "delay": "2000"
}
```
* **Response (`200 OK`)**:
```json
{
  "concurrency": "4",
  "delay": "2000",
  "retries": "3",
  "smtp-host": "smtp.ethereal.email",
  "smtp-port": "587",
  "smtp-user": "your_ethereal_user@ethereal.email",
  "smtp-pass": "your_ethereal_password"
}
```

---

## 5. Tenant Onboarding & Settings APIs

### 5.1 Onboard New Business Tenant
* **Endpoint**: `POST /api/tenants/onboard`
* **Request Body**:
```json
{
  "businessName": "Apollo Wellness Centre",
  "industryProfile": "healthcare"
}
```
* **Response (`201 Created`)**:
```json
{
  "success": true,
  "tenantId": "c92842aa-b80c-4fa6-a36c-9411f1816aa1",
  "assignedVocabulary": {
    "singular": "Patient",
    "plural": "Patients"
  },
  "stagesSeededCount": 4,
  "credentials": {
    "apiKey": "sk_tenant_apollocentre_xxx"
  }
}
```

---

*© 2026 Cognitive CRM. All rights reserved.*
