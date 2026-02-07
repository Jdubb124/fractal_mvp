# Fractal MVP - Codebase Analysis & Key Workflows

## Product Overview

**Fractal** is an **AI-powered marketing campaign orchestration platform** targeting SMB e-commerce businesses ($5-50M revenue). Its core concept is the **"Multiplication Effect"**:

> **Segments × Channels × Versions = Total Personalized Assets**

Instead of manually crafting individual marketing emails and ads, Fractal uses Claude AI to automatically generate personalized content for every combination of audience segment, marketing channel, and messaging strategy — turning one campaign brief into dozens of production-ready assets.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express (TypeScript) |
| **Frontend** | Angular 21 (standalone components, signals-based state) |
| **Database** | MongoDB with Mongoose ODM |
| **AI Engine** | Anthropic Claude API (claude-sonnet-4-20250514) |
| **Styling** | Tailwind CSS 3.4 |
| **Auth** | JWT (7-day expiry) + bcrypt (12 salt rounds) |
| **Email Processing** | juice (CSS inlining), archiver (ZIP), html-to-text |
| **Security** | Helmet, CORS, input validation (express-validator) |

---

## Data Model

```
User ──┬── BrandGuide    (colors, tone, core message)
       ├── Audience       (demographics, behavioral, messaging preferences)
       └── Campaign ──┬── Asset       (generic content versions for any channel)
                      └── EmailAsset  (full HTML emails with metadata & edit history)
```

### 6 MongoDB Collections

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Authentication & identity | email, password (hashed), name, company |
| **BrandGuide** | Brand identity for AI context | colors[], tone, coreMessage |
| **Audience** | Target audience segments | demographics, behavioral, messagingPreferences |
| **Campaign** | Campaign orchestration | segments[], channels[], keyMessages, CTA, urgencyLevel |
| **Asset** | Generic content versions | channel, assetType, versions[] (max 3) |
| **EmailAsset** | Production-ready HTML emails | emailType, content, html (full/inlined/liquid/plain), editHistory[] |

---

## Project Structure

```
fractal_mvp/
├── server/                          # Express.js backend
│   └── src/
│       ├── server.ts                # Entry point (:3000)
│       ├── config/
│       │   ├── constants.ts         # All app constants & limits
│       │   └── database.ts          # MongoDB connection
│       ├── models/                  # 6 Mongoose schemas
│       ├── controllers/             # 6 request handlers
│       ├── routes/                  # 6 route definitions
│       ├── services/                # Core business logic
│       │   ├── generation.service.ts          # Campaign asset generation via Claude
│       │   ├── email.service.ts               # Email orchestration (AI + template modes)
│       │   ├── email-html-generator.service.ts # Full HTML email generation via Claude
│       │   └── email-template.engine.ts       # Template-based fallback
│       ├── middleware/              # Auth, validation, error handling
│       └── utils/                   # CSS inlining, HTML validation, text conversion
│
├── client/                          # Angular frontend
│   └── src/app/
│       ├── app.routes.ts            # 7 routes with auth guards
│       ├── core/
│       │   ├── services/            # API, Auth, Campaign, Audience, Brand services
│       │   ├── guards/              # Auth & guest route guards
│       │   └── interceptors/        # JWT auth interceptor
│       ├── features/
│       │   ├── auth/                # Login & register pages
│       │   ├── dashboard/           # Main hub
│       │   ├── campaigns/           # List, wizard, detail views
│       │   ├── audiences/           # Audience management
│       │   ├── brand-guide/         # Brand identity editor
│       │   ├── email-builder/       # 5-step email wizard (core feature)
│       │   └── email-exporter/      # Email viewer & export
│       └── shared/                  # Layout, modal, loading components
│
└── CLAUDE_EMAIL_FEATURES_SPEC.md    # 70KB detailed email feature specification
```

---

## Key Workflows

### 1. Campaign Creation & Asset Generation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMPAIGN SETUP FLOW                       │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │  Define   │──▶│  Create/Pick │──▶│  Create Campaign  │   │
│  │  Brand    │   │  Audiences   │   │  (name, objective, │   │
│  │  Guide    │   │  (up to 5)   │   │   CTA, urgency)   │   │
│  └──────────┘   └──────────────┘   └────────┬──────────┘   │
│                                              │              │
│                                              ▼              │
│                                    ┌─────────────────┐      │
│                                    │  Select Channels │      │
│                                    │  (Email, Meta)   │      │
│                                    └────────┬────────┘      │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 AI GENERATION ENGINE                         │
│                                                             │
│  For each: Audience × Channel × Strategy                    │
│                                                             │
│  ┌────────────┐   ┌────────────────┐   ┌────────────────┐  │
│  │ Build Rich │──▶│  Call Claude    │──▶│  Parse & Store  │  │
│  │ Context    │   │  API with      │   │  Generated      │  │
│  │ Prompt     │   │  1024 tokens   │   │  Content        │  │
│  └────────────┘   └────────────────┘   └────────────────┘  │
│                                                             │
│  Strategies: conversion | awareness | urgency | emotional   │
│                                                             │
│  Example: 3 audiences × 1 channel × 2 strategies = 6 assets│
└─────────────────────────────────────────────────────────────┘
```

### 2. Email Builder Wizard (5-Step Frontend Flow)

```
 Step 1          Step 2          Step 3          Step 4          Step 5
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Campaign │──▶│ Select   │──▶│ Choose   │──▶│ Define   │──▶│ Generate │
│ Basics   │   │ Target   │   │ Email    │   │ Messages │   │ & Review │
│          │   │ Audiences│   │ Types    │   │ & CTA    │   │          │
│ - Name   │   │          │   │          │   │          │   │ - Preview│
│ - Goal   │   │ - Seg 1  │   │ - Promo  │   │ - Key    │   │ - Edit   │
│          │   │ - Seg 2  │   │ - Welcome│   │   msgs   │   │ - AI Edit│
│          │   │ - Seg 3  │   │ - Cart   │   │ - CTA    │   │ - Approve│
│          │   │          │   │ - News   │   │ - Urgency│   │ - Export │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │               │              │              │
     └──────────────┴───────────────┴──────────────┴──────────────┘
                    State managed by Angular Signals
                  (email-builder.service.ts — reactive)
```

### 3. Email HTML Generation Pipeline

```
┌─────────────────┐
│ Generation Mode │
│   Selection     │
└───────┬─────────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
┌───────┐  ┌───────────┐
│  AI   │  │ Template  │  (fallback if AI fails)
│Design │  │  Based    │
└───┬───┘  └─────┬─────┘
    │            │
    ▼            ▼
┌──────────────────────────────────────┐
│     AI-DESIGNED PATH                 │
│                                      │
│  1. Build context from:              │
│     • Brand (colors, tone, message)  │
│     • Campaign (objective, CTA)      │
│     • Audience (demographics, pain   │
│       points, motivators)            │
│     • Strategy (conversion/urgency/  │
│       awareness/emotional)           │
│                                      │
│  2. Claude generates full HTML       │
│     (table-based, email-compatible)  │
│                                      │
│  3. Validate HTML                    │
│     ✓ DOCTYPE, charset, viewport     │
│     ✓ Table layout (no flexbox)      │
│     ✓ Inline styles present          │
│     ✓ CAN-SPAM unsubscribe link      │
│                                      │
│  4. Post-process HTML                │
│     • CSS inlining via juice         │
│     • Plain text generation          │
│     • Liquid template variant        │
│                                      │
│  5. Extract structured content       │
│     • Subject line (≤60 chars)       │
│     • Preheader (≤90 chars)          │
│     • Headline (≤80 chars)           │
│     • Body copy (150-200 words)      │
│     • CTA text (≤25 chars)           │
│                                      │
│  6. Store EmailAsset in MongoDB      │
└──────────────────────────────────────┘
```

### 4. Authentication Flow

```
┌──────────┐    POST /auth/register     ┌──────────────┐
│  Client  │ ──────────────────────────▶│   Server     │
│ (Angular)│    or POST /auth/login     │  (Express)   │
│          │                            │              │
│          │◀────────────────────────── │  • Validate  │
│          │    { token, user }         │  • bcrypt    │
│          │                            │  • JWT sign  │
│          │                            └──────────────┘
│          │
│  localStorage.setItem(token)
│          │
│  ┌───────────────────────────┐
│  │ HTTP Interceptor adds     │
│  │ Authorization: Bearer xxx │──▶ Every API request
│  │ to outgoing requests      │
│  └───────────────────────────┘
│          │
│  On 401 ──▶ Clear storage ──▶ Redirect to /login
└──────────┘
```

### 5. Export Workflow

```
┌─────────────────────────────────────────────────┐
│              EXPORT OPTIONS                      │
│                                                  │
│  Single Email Export:                            │
│  GET /api/emails/:id/export?format=              │
│    ├── html         → Production-ready HTML      │
│    ├── liquid       → ESP template (Klaviyo)     │
│    ├── plain_text   → Text-only fallback         │
│    └── json         → Structured data            │
│                                                  │
│  Bulk Export:                                    │
│  POST /api/emails/export/bulk                    │
│    ├── by_audience  → ZIP organized by segment   │
│    ├── by_type      → ZIP organized by email type│
│    └── flat         → All files in one folder    │
│                                                  │
│  Output → Download ZIP → Upload to ESP           │
│           (Klaviyo, Mailchimp, SendGrid, etc.)   │
└─────────────────────────────────────────────────┘
```

### 6. API Architecture

```
Client (Angular :4200)
    │
    │  HTTP + JWT
    ▼
Express Server (:3000)
    │
    ├── /api/auth/*        → Auth Controller       → User Model
    ├── /api/brand/*       → Brand Controller      → BrandGuide Model
    ├── /api/audiences/*   → Audience Controller    → Audience Model
    ├── /api/campaigns/*   → Campaign Controller    → Campaign Model
    │   └── /:id/generate  → Generation Service    → Claude API
    ├── /api/assets/*      → Asset Controller       → Asset Model
    └── /api/emails/*      → Email Controller       → EmailAsset Model
        ├── /generate      → Email Service
        │                    ├── Email HTML Generator → Claude API
        │                    ├── CSS Inliner (juice)
        │                    ├── HTML Validator
        │                    └── Plain Text Generator
        └── /export        → ZIP Archive (archiver)
                             → Multiple formats
```

---

## Key Constants & Limits

| Constraint | Limit |
|-----------|-------|
| Audiences per user | 5 |
| Campaigns per user | 10 |
| Segments per campaign | 5 |
| Channels per campaign | 2 (email, meta_ads) |
| Versions per asset | 3 |
| Brand guides per user | 10 |
| Brand colors | 6 |
| JWT expiry | 7 days |
| Password min length | 8 characters |
| bcrypt salt rounds | 12 |

## Campaign Statuses

`draft` → `generated` → `approved` → `archived`

## Asset Statuses

`pending` → `generated` → `edited` → `approved`

## Version Strategies

| Strategy | Purpose |
|----------|---------|
| **conversion** | Direct response, purchase-focused |
| **awareness** | Brand building, educational |
| **urgency** | FOMO, time-limited offers |
| **emotional** | Storytelling, emotional connection |

## Email Types

`promotional` · `welcome` · `abandoned_cart` · `newsletter` · `announcement`

## Email Templates (fallback)

`minimal` · `hero_image` · `product_grid` · `newsletter`
