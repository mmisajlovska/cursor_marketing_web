# PromoRunner — Product Requirements Document
### Version 1.0 | Status: Draft | Classification: Internal

---

## Table of Contents

1. [Project Overview & Business Model](#1-project-overview--business-model)
2. [User Journey & Core Functional Flows](#2-user-journey--core-functional-flows)
3. [Technical Architecture & Tech Stack](#3-technical-architecture--tech-stack)
4. [Database Schema Design](#4-database-schema-design)
5. [API Endpoints Specification](#5-api-endpoints-specification)
6. [Frontend vs. Backend Task Breakdown](#6-frontend-vs-backend-task-breakdown)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Execution Roadmap](#8-execution-roadmap)
9. [Open Questions & Recommendations](#9-open-questions--recommendations)

---

## 1. Project Overview & Business Model

### 1.1 Executive Summary

**PromoRunner** is a B2B SaaS micro-game platform that enables companies to deploy a fully white-labeled, branded endless-runner mini-game as a customer acquisition and lead generation channel. Think of it as a "Shopify for gamified marketing campaigns" — a tenant onboards, configures their brand assets, and gets a shareable game URL within minutes, with zero game development expertise required.

The game mechanic is deliberately simple (jump, avoid, survive), which maximizes viral sharing and return visits. The platform's core value is not the game itself — it is the **consent-gated lead capture funnel** disguised as entertainment.

### 1.2 The Marketing Case

Brands spend billions on banner ads with ~0.1% click-through rates. PromoRunner flips the dynamic:
- Users **choose** to engage (average session time: 4–8 minutes in comparable gamified campaigns)
- The game loop creates **repeat visits** naturally (score chasing, leaderboard competition)
- The marketing opt-in feels like a **fair trade** ("play unlimited for free, just let us email you")
- Leaderboards generate **social proof** and **word-of-mouth** sharing

Comparable campaigns (Duolingo, Nike Run Club, McDonald's Monopoly) show 3–12× higher engagement vs. traditional lead capture forms. PromoRunner democratizes this for any B2B marketing team.

### 1.3 Business Model

| Revenue Stream | Description | Pricing Model |
|---|---|---|
| **Starter License** | 1 active campaign, up to 10K monthly active users | $299/month |
| **Growth License** | 3 active campaigns, up to 50K MAU, custom domain | $799/month |
| **Enterprise License** | Unlimited campaigns, white-glove onboarding, SLA, dedicated infra | Custom / $3K+ /month |
| **Setup Fee** | One-time brand asset configuration and QA | $499 one-time (waived for Enterprise) |
| **Usage Overage** | Per-1K MAU over plan limit | $15/1K MAU |

### 1.4 Multi-Tenant White-Label Architecture

PromoRunner is built as a **multi-tenant SaaS platform**. Each paying company (Tenant) gets:
- A unique subdomain: `{tenant-slug}.promorunner.io` (or CNAME to their own domain on Growth+)
- Isolated brand configuration (logo, colors, custom sprite assets, game background)
- Isolated user and score data
- Isolated marketing consent records (critical for GDPR compliance)

Tenants share the underlying infrastructure but their data is logically partitioned by `tenant_id` on every table. No tenant can access another tenant's data.

### 1.5 Target Audience

**Primary Buyers (Decision Makers):**
- Marketing Directors and CMOs at mid-market B2B/B2C companies (100–5,000 employees)
- Growth and Demand Generation teams
- Event marketers looking for trade show / conference activation tools

**Primary End Users (Players):**
- Consumers or business professionals engaging with the brand
- Age range: typically 22–45, digital-native, mobile-first
- Context: email campaign link, social media share, QR code at an event

---

## 2. User Journey & Core Functional Flows

### 2.1 Tenant Onboarding Flow (B2B Admin)

```
Tenant Signs Up
    → Selects Plan
    → Completes Brand Configuration Wizard
        → Upload logo (PNG/SVG)
        → Set primary & secondary colors (hex picker)
        → Upload custom obstacle/character sprites (or choose from defaults)
        → Configure game text (headline, CTA copy, consent checkbox label)
        → Set leaderboard visibility (public / invite-only)
    → Preview live game
    → Publish & receive shareable URL
    → Access analytics dashboard
```

### 2.2 End User (Player) Flow

#### Step 1: Landing Page

The player arrives at `{tenant-slug}.promorunner.io` (or custom domain). They see:
- Full-screen branded landing page (tenant logo, colors, background)
- Game preview / teaser animation
- Clear CTA: **"Play Now"**
- Brief value proposition: "Beat the record. Win [prize if applicable]."

No account required to reach this step.

#### Step 2: Authentication

Upon clicking "Play Now", a lightweight auth modal appears. Options:

**Option A — Google OAuth (Social Login)**
- Standard Google Sign-In flow
- On first login: profile created with name + email from Google token
- On return: silent re-auth (token refresh)

**Option B — Magic Link / Email**
- Player enters email address
- Receives a time-limited (15-minute) magic link
- Clicking the link authenticates them without a password
- Session token issued; player returned to game page

Both paths create a `User` record scoped to the tenant.

#### Step 3: Lead Capture Gate (Marketing Consent)

Immediately after authentication, **before the game begins**, the player sees the consent screen:

```
┌─────────────────────────────────────────────┐
│  🎮  You're in! Here's the deal:            │
│                                             │
│  [ ] I agree to receive marketing emails    │
│      from [Company Name]. You can           │
│      unsubscribe any time.                  │
│                                             │
│  ✓ Consent = UNLIMITED plays               │
│  ✗ No consent = 3 free tries               │
│                                             │
│  [ PLAY NOW — UNLIMITED ]                  │
│  [ Play 3 times without consent ]          │
└─────────────────────────────────────────────┘
```

**Business Logic:**
- Consent = `true` → `free_plays_remaining = null` (unlimited)
- Consent = `false` → `free_plays_remaining = 3`
- After 3 plays without consent, a soft paywall appears prompting them to opt in for unlimited access
- Consent record is immutable once given (GDPR: timestamped, IP-logged, version-tracked)

#### Step 4: Gameplay

The endless-runner game loads in-browser (HTML5 Canvas / Phaser.js):
- Player character runs automatically; player presses **Space / Tap** to jump
- Obstacles spawn with increasing frequency as score climbs
- Score increments in real time (distance-based)
- **On game over:** score is submitted to the backend
- Live leaderboard panel visible (sidebar on desktop, drawer on mobile)
- "Play Again" button (checks remaining plays for non-consented users)

#### Step 5: Leaderboard

- After each run, leaderboard updates in real-time via WebSocket
- Player can see their rank, name (from auth profile), score, and timestamp
- Top 10 displayed by default; player's own rank shown even if outside top 10
- Social share button: pre-filled tweet / WhatsApp message with score + game URL

### 2.3 Return Visit Flow

- Authenticated users are silently re-authed (session cookie / refresh token)
- Consent status is remembered — no re-prompting
- Non-consented users with 0 plays remaining see the opt-in gate before playing

---

## 3. Technical Architecture & Tech Stack

### 3.1 System Architecture Overview

```
                        ┌─────────────────────────────┐
                        │        CDN / Cloudflare      │
                        │   (Static assets, DDoS, TLS) │
                        └────────────┬────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
     ┌────────▼────────┐   ┌─────────▼──────────┐  ┌──────▼──────────┐
     │  React SPA       │   │  Spring Boot API   │  │  Spring Boot    │
     │  (Vite build)    │   │  (REST + OAuth2)   │  │  WebSocket Srv  │
     │  Phaser.js game  │   │  Port 8080         │  │  Port 8080/ws   │
     └─────────────────┘   └────────┬───────────┘  └──────┬──────────┘
                                    │                      │
                           ┌────────▼──────────────────────▼────────┐
                           │              PostgreSQL                  │
                           │    (Multi-tenant, partitioned by        │
                           │     tenant_id on all tables)            │
                           └─────────────────────────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   Redis Cache    │
                           │  (Sessions,      │
                           │   Leaderboard    │
                           │   hot cache)     │
                           └─────────────────┘
```

### 3.2 Backend: Java Spring Boot

**Framework:** Spring Boot 3.x (Java 21 LTS)

| Component | Technology | Purpose |
|---|---|---|
| REST API | Spring Web MVC | Core API routes |
| Security | Spring Security 6 + OAuth2 Resource Server | JWT validation, Google OAuth2 |
| WebSockets | Spring WebSocket + STOMP | Real-time leaderboard push |
| Database Access | Spring Data JPA + Hibernate | ORM for PostgreSQL |
| Migrations | Flyway | Versioned DB schema migrations |
| Email (Magic Link) | Spring Mail + SendGrid | Transactional email dispatch |
| Caching | Spring Cache + Redis | Leaderboard hot cache, session store |
| Validation | Jakarta Bean Validation | Request DTO validation |
| API Docs | SpringDoc OpenAPI 3 | Auto-generated Swagger UI |
| Testing | JUnit 5, Mockito, Testcontainers | Unit + integration tests |
| Build | Maven or Gradle | Dependency management |

**Spring Security Configuration:**

```java
// Conceptual outline
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // OAuth2 resource server (JWT validation for Google tokens + magic link tokens)
    // Tenant isolation filter: extract tenant from subdomain → set in request context
    // CORS configuration: allow tenant subdomains dynamically
    // Public endpoints: /api/auth/**, /api/tenant/config/{slug}
    // Protected endpoints: /api/scores/**, /api/leaderboard/**, /api/user/**
    // WebSocket handshake authentication via token query param
}
```

**Multi-Tenancy Strategy:**
- Every incoming request passes through a `TenantResolutionFilter`
- Tenant resolved from subdomain (`Host` header) or `X-Tenant-Slug` header (for custom domains)
- `TenantContext` (ThreadLocal) stores resolved `tenantId` for the request lifecycle
- All JPA queries automatically append `WHERE tenant_id = :currentTenantId` via a Hibernate `CurrentTenantIdentifierResolver`

### 3.3 Frontend: React SPA

**Framework:** React 18 + Vite

| Component | Technology | Purpose |
|---|---|---|
| UI Framework | React 18 | Component tree, state management |
| Routing | React Router v6 | SPA navigation |
| State Management | Zustand | Lightweight global state (auth, game state) |
| UI Styling | Tailwind CSS v3 | Utility-first styling + tenant theming via CSS vars |
| Game Engine | Phaser.js 3 | HTML5 Canvas game loop, physics, sprites |
| Auth (Google) | @react-oauth/google | Google OAuth2 PKCE flow |
| WebSocket Client | @stomp/stompjs | STOMP over WebSocket for leaderboard |
| HTTP Client | Axios | REST API calls with JWT interceptor |
| PWA | vite-plugin-pwa | Service worker generation, manifest |
| Testing | Vitest + React Testing Library | Component + integration tests |

**Tenant Theming:**
- On app boot, fetch `/api/tenant/config/{slug}` to get brand colors, logo URL, copy
- Apply colors as CSS custom properties (`--color-primary`, `--color-secondary`) on `<html>`
- Tailwind configured to reference these CSS vars → entire UI recolors dynamically
- No build step required per tenant

### 3.4 Database: PostgreSQL

**Version:** PostgreSQL 15+

All tables include `tenant_id UUID NOT NULL` with a foreign key to the `tenants` table. Row-level isolation is enforced at the application layer (Hibernate filter) with PostgreSQL Row Level Security (RLS) as a defense-in-depth measure.

### 3.5 Mobile & PWA

**Progressive Web App Configuration:**

`manifest.json` (dynamically served per tenant):
```json
{
  "name": "[Tenant Brand Name] Runner",
  "short_name": "[Slug]Runner",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#TENANT_BG_COLOR",
  "theme_color": "#TENANT_PRIMARY_COLOR",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker Strategy:**
- Cache-first for static assets (JS, CSS, fonts, sprites)
- Network-first for API calls (score submission, leaderboard)
- Offline fallback page: "You're offline — scores will sync when you reconnect"
- Background sync for score submission when connectivity is restored

**Mobile Gameplay:**
- Touch events mapped to jump mechanic (tap anywhere on canvas)
- Responsive canvas scaling to viewport width
- Virtual "jump" button rendered on mobile for discoverability
- No native app — PWA install prompt shown after first game over

---

## 4. Database Schema Design

### 4.1 Schema Diagram (Relational)

```
tenants ──< tenant_brand_config
   │
   ├──< users
   │      │
   │      ├──< marketing_consents
   │      └──< game_sessions ──< scores
   │
   └──< magic_link_tokens
```

### 4.2 Table Definitions

#### `tenants`
```sql
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(63) UNIQUE NOT NULL,        -- subdomain identifier
    company_name    VARCHAR(255) NOT NULL,
    plan            VARCHAR(50) NOT NULL DEFAULT 'starter',  -- starter|growth|enterprise
    custom_domain   VARCHAR(255),                        -- nullable, Growth+ only
    is_active       BOOLEAN NOT NULL DEFAULT true,
    max_mau         INTEGER NOT NULL DEFAULT 10000,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `tenant_brand_config`
```sql
CREATE TABLE tenant_brand_config (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url            TEXT,
    primary_color       VARCHAR(7) NOT NULL DEFAULT '#4F46E5',   -- hex
    secondary_color     VARCHAR(7) NOT NULL DEFAULT '#7C3AED',   -- hex
    background_color    VARCHAR(7) NOT NULL DEFAULT '#1E1B4B',
    game_title          VARCHAR(120) NOT NULL DEFAULT 'PromoRunner',
    consent_label_text  TEXT NOT NULL DEFAULT 'I agree to receive marketing emails.',
    character_sprite_url TEXT,
    obstacle_sprite_urls JSONB,   -- array of sprite URLs
    background_sprite_url TEXT,
    plays_before_gate   INTEGER NOT NULL DEFAULT 3,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id)
);
```

#### `users`
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    display_name    VARCHAR(255),
    avatar_url      TEXT,
    auth_provider   VARCHAR(50) NOT NULL,               -- 'google' | 'magic_link'
    provider_uid    VARCHAR(255),                        -- Google sub or NULL for magic link
    free_plays_remaining  INTEGER,                       -- NULL = unlimited
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ,
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

#### `marketing_consents`
```sql
CREATE TABLE marketing_consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    consented       BOOLEAN NOT NULL,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',  -- track if consent text changes
    ip_address      INET,
    user_agent      TEXT,
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    withdrawn_at    TIMESTAMPTZ                          -- if user unsubscribes later
);

-- Immutable log: no updates allowed. New row on any consent state change.
CREATE INDEX idx_consents_tenant_user ON marketing_consents(tenant_id, user_id);
```

#### `game_sessions`
```sql
CREATE TABLE game_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ,
    final_score     INTEGER,
    duration_ms     INTEGER,
    device_type     VARCHAR(20),                         -- 'mobile' | 'desktop' | 'tablet'
    is_completed    BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sessions_tenant_user ON game_sessions(tenant_id, user_id);
CREATE INDEX idx_sessions_tenant_score ON game_sessions(tenant_id, final_score DESC);
```

#### `scores`
```sql
-- Aggregated best score per user per tenant (for leaderboard performance)
CREATE TABLE scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    best_score      INTEGER NOT NULL DEFAULT 0,
    total_plays     INTEGER NOT NULL DEFAULT 0,
    last_played_at  TIMESTAMPTZ,
    rank            INTEGER,                             -- materialized rank, updated async
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_scores_tenant_best ON scores(tenant_id, best_score DESC);
```

#### `magic_link_tokens`
```sql
CREATE TABLE magic_link_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    email       VARCHAR(255) NOT NULL,
    token_hash  VARCHAR(64) NOT NULL,                    -- SHA-256 of the raw token
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_magic_link_hash ON magic_link_tokens(token_hash);
```

---

## 5. API Endpoints Specification

All endpoints prefixed with `/api/v1`. Protected endpoints require `Authorization: Bearer <jwt>` header. JWT contains `userId` and `tenantId` claims.

### 5.1 Tenant Configuration

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tenant/config/{slug}` | Public | Returns brand config for the landing page |
| `PUT` | `/admin/tenant/config` | Tenant Admin JWT | Update brand configuration |
| `POST` | `/admin/tenant/assets/upload` | Tenant Admin JWT | Upload sprite/logo (returns URL) |

**Response: GET /tenant/config/{slug}**
```json
{
  "tenantId": "uuid",
  "companyName": "Acme Corp",
  "logoUrl": "https://cdn.promorunner.io/tenants/acme/logo.png",
  "primaryColor": "#0066CC",
  "secondaryColor": "#FF6600",
  "backgroundColor": "#001433",
  "gameTitle": "Acme Dash",
  "consentLabelText": "I agree to receive Acme Corp marketing emails.",
  "characterSpriteUrl": "...",
  "obstacleSpriteUrls": ["...", "..."],
  "playsBeforeGate": 3
}
```

### 5.2 Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/google` | Public | Exchange Google ID token for app JWT |
| `POST` | `/auth/magic-link/request` | Public | Send magic link email |
| `GET` | `/auth/magic-link/verify` | Public | Verify token, issue app JWT |
| `POST` | `/auth/refresh` | Refresh token | Refresh access token |
| `POST` | `/auth/logout` | Bearer JWT | Invalidate refresh token |

**Request: POST /auth/google**
```json
{ "idToken": "google_id_token_string", "tenantSlug": "acme-corp" }
```
**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "displayName": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": "...",
    "freePlayRemaining": null,
    "hasConsented": true
  }
}
```

**Request: POST /auth/magic-link/request**
```json
{ "email": "user@example.com", "tenantSlug": "acme-corp" }
```

**Response: GET /auth/magic-link/verify?token={raw_token}&tenant={slug}**
- Redirects to `/{tenant-slug}.promorunner.io/?auth=success#accessToken=eyJ...`
- Or returns JSON if `Accept: application/json`

### 5.3 Marketing Consent

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/consent` | Bearer JWT | Record user's consent decision |
| `GET` | `/consent/status` | Bearer JWT | Get current consent status |
| `DELETE` | `/consent` | Bearer JWT | Withdraw consent (GDPR right to withdraw) |

**Request: POST /consent**
```json
{
  "consented": true,
  "consentVersion": "1.0",
  "ipAddress": "auto-captured server-side"
}
```

### 5.4 Game Sessions & Scores

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/game/session/start` | Bearer JWT | Create a new game session, validate play eligibility |
| `POST` | `/game/session/{sessionId}/end` | Bearer JWT | Submit final score, update leaderboard |
| `GET` | `/game/session/eligibility` | Bearer JWT | Check if user can play (plays remaining) |

**Request: POST /game/session/start**
```json
{ "deviceType": "mobile" }
```
**Response:**
```json
{
  "sessionId": "uuid",
  "canPlay": true,
  "freePlayRemaining": 2,
  "message": "You have 2 free plays remaining."
}
```
If `canPlay: false`:
```json
{
  "sessionId": null,
  "canPlay": false,
  "freePlayRemaining": 0,
  "requiresConsent": true,
  "message": "Opt in to play unlimited!"
}
```

**Request: POST /game/session/{sessionId}/end**
```json
{ "score": 4820, "durationMs": 142300 }
```
**Response:**
```json
{
  "score": 4820,
  "personalBest": true,
  "rank": 3,
  "totalPlayers": 481
}
```

### 5.5 Leaderboard

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/leaderboard` | Bearer JWT | Paginated top scores for the tenant |
| `GET` | `/leaderboard/me` | Bearer JWT | Caller's rank and surrounding scores |

**Response: GET /leaderboard?limit=10&offset=0**
```json
{
  "entries": [
    {
      "rank": 1,
      "displayName": "Jane D.",
      "avatarUrl": "...",
      "score": 12540,
      "lastPlayedAt": "2025-03-15T14:22:00Z"
    }
  ],
  "totalPlayers": 481,
  "updatedAt": "2025-03-15T14:23:01Z"
}
```

### 5.6 WebSocket: Live Leaderboard

**Endpoint:** `wss://{tenant-slug}.promorunner.io/ws`

**Connection:** STOMP over WebSocket with JWT in query param:
`?token={accessToken}`

**Subscriptions:**

| Topic | Direction | Payload |
|---|---|---|
| `/topic/leaderboard/{tenantId}` | Server → Client | Full top-10 leaderboard snapshot |
| `/topic/leaderboard/{tenantId}/delta` | Server → Client | Single score update (rank + score) |
| `/app/leaderboard/subscribe` | Client → Server | Subscribe to tenant leaderboard |

**Leaderboard Push Payload:**
```json
{
  "type": "LEADERBOARD_UPDATE",
  "tenantId": "uuid",
  "entries": [...],
  "triggeredByUserId": "uuid",
  "updatedAt": "2025-03-15T14:23:01Z"
}
```

Score submission triggers: `ScoreSubmittedEvent` → `ApplicationEventPublisher` → WebSocket broadcast to all subscribers on that tenant's topic.

### 5.7 Admin & Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/analytics/summary` | Tenant Admin JWT | MAU, total leads, avg session time |
| `GET` | `/admin/analytics/leads` | Tenant Admin JWT | Export consented leads (CSV / JSON) |
| `GET` | `/admin/analytics/sessions` | Tenant Admin JWT | Session metrics over time |

---

## 6. Frontend vs. Backend Task Breakdown

### 6.1 Backend Tasks (Java Spring Boot)

#### Phase 1: Foundation
- [ ] **B-01** Initialize Spring Boot project with Java 21, configure Maven/Gradle, set up profiles (dev/staging/prod)
- [ ] **B-02** Configure PostgreSQL datasource (HikariCP connection pooling), Redis connection
- [ ] **B-03** Set up Flyway migrations directory; write V1 migration for all schema tables
- [ ] **B-04** Implement `TenantResolutionFilter` — extract tenant from `Host` header, populate `TenantContext` (ThreadLocal)
- [ ] **B-05** Configure Hibernate multi-tenancy with `CurrentTenantIdentifierResolver` and `MultiTenantConnectionProvider`
- [ ] **B-06** Implement Spring Security config: public vs. protected route mapping, CORS with dynamic tenant domain allowlist

#### Phase 2: Authentication
- [ ] **B-07** Implement Google OAuth2 token verification endpoint (`POST /auth/google`) — validate ID token via Google's public JWKS endpoint
- [ ] **B-08** Implement Magic Link flow: `POST /auth/magic-link/request` (generate secure token, hash+store, send email via SendGrid), `GET /auth/magic-link/verify` (validate, issue JWT, redirect)
- [ ] **B-09** Implement JWT access token issuance (RS256, 1-hour expiry) and refresh token (rotation, 30-day expiry, Redis-backed invalidation)
- [ ] **B-10** Implement `POST /auth/logout` — invalidate refresh token in Redis
- [ ] **B-11** Write unit tests for auth service, integration tests for auth endpoints (Testcontainers + PostgreSQL)

#### Phase 3: Core Business Logic
- [ ] **B-12** Implement `TenantConfigService` and `GET /tenant/config/{slug}` endpoint with Redis caching (TTL 5 min)
- [ ] **B-13** Implement `PUT /admin/tenant/config` — validate hex colors, sanitize URLs, persist brand config
- [ ] **B-14** Implement file upload endpoint (`POST /admin/tenant/assets/upload`) — validate MIME type, upload to S3/Cloudflare R2, return CDN URL
- [ ] **B-15** Implement `ConsentService`: `POST /consent` (write immutable consent record, update `users.free_plays_remaining`), `DELETE /consent` (soft withdrawal)
- [ ] **B-16** Implement `GameSessionService`: `POST /game/session/start` (eligibility check: query `users.free_plays_remaining`, decrement on play), `POST /game/session/{id}/end` (validate session ownership, persist score, publish `ScoreSubmittedEvent`)
- [ ] **B-17** Implement `ScoreService`: upsert `scores` table on session end, calculate rank via `RANK() OVER (PARTITION BY tenant_id ORDER BY best_score DESC)`
- [ ] **B-18** Implement `GET /leaderboard` with Redis hot-cache (top 50 scores cached, TTL 10 sec, invalidated on `ScoreSubmittedEvent`)

#### Phase 4: WebSocket
- [ ] **B-19** Configure Spring WebSocket with STOMP (`WebSocketMessageBrokerConfigurer`), set allowed origins to tenant subdomains
- [ ] **B-20** Implement WebSocket JWT authentication (ChannelInterceptor validates token on CONNECT frame)
- [ ] **B-21** Implement `LeaderboardWebSocketController`: subscribe handler + broadcast on `ScoreSubmittedEvent` via `SimpMessagingTemplate`
- [ ] **B-22** Write integration tests for WebSocket flow with mock STOMP client

#### Phase 5: Admin & Quality
- [ ] **B-23** Implement analytics endpoints (summary stats, lead export CSV)
- [ ] **B-24** Configure SpringDoc OpenAPI, verify all endpoints documented
- [ ] **B-25** Implement rate limiting (Bucket4j) on auth endpoints (10 req/min per IP) and score submission (1 req/3 sec per user)
- [ ] **B-26** Add structured logging (Logback JSON appender), set up correlation ID filter for distributed tracing
- [ ] **B-27** Write DB index validation and query explain-plan review for all leaderboard queries

---

### 6.2 Frontend Tasks (React)

#### Phase 1: Project Setup
- [ ] **F-01** Initialize Vite + React 18 + TypeScript project; configure path aliases, ESLint, Prettier
- [ ] **F-02** Install and configure Tailwind CSS with custom `theme.extend` for CSS variable-based tenant theming
- [ ] **F-03** Set up Zustand stores: `authStore` (user, tokens, consent status), `gameStore` (session, score, game state), `tenantStore` (brand config)
- [ ] **F-04** Configure Axios instance with JWT interceptor (attach `Authorization` header, auto-refresh on 401)
- [ ] **F-05** Set up React Router v6: routes for `/`, `/auth/callback`, `/game`, `/leaderboard`, `/admin`

#### Phase 2: Tenant Theming & Landing Page
- [ ] **F-06** On app mount: fetch `/api/v1/tenant/config/{slug}` (slug from `window.location.hostname`), store in `tenantStore`, apply CSS vars to `document.documentElement`
- [ ] **F-07** Build `LandingPage` component: branded hero (logo, title, animated teaser), `Play Now` CTA, responsive layout
- [ ] **F-08** Build `ConsentGate` component: consent checkbox with configurable label text, play count display, clear UX for both paths (consent / no-consent)

#### Phase 3: Authentication UI
- [ ] **F-09** Implement Google OAuth2 login button using `@react-oauth/google` (`useGoogleLogin` hook with PKCE flow), exchange ID token with backend `POST /auth/google`
- [ ] **F-10** Implement Magic Link flow: email input form → `POST /auth/magic-link/request` → confirmation screen ("Check your inbox") → handle `/auth/callback?token=...` route that calls verify endpoint and stores tokens
- [ ] **F-11** Build `AuthModal` combining both auth options, with loading and error states
- [ ] **F-12** Implement auth persistence: store access + refresh tokens in `sessionStorage` (not `localStorage` — XSS surface), auto-restore on page load

#### Phase 4: Game Engine (Phaser.js)
- [ ] **F-13** Install Phaser.js 3; initialize `PhaserGame` component with React ref integration (mount/destroy on component lifecycle)
- [ ] **F-14** Implement `BootScene`: preload all sprites (character, obstacles, background) from tenant config URLs; show loading bar
- [ ] **F-15** Implement `GameScene`: 
  - Scrolling parallax background (2-layer)
  - Player character sprite with jump physics (Arcade Physics)
  - Obstacle group with object pooling, spawning frequency tied to score
  - Score counter (distance-based, increments every 100ms)
  - Collision detection → `GameOverScene`
- [ ] **F-16** Implement `GameOverScene`: display final score, personal best indicator, "Play Again" button
- [ ] **F-17** Implement mobile touch input: tap-to-jump mapped to Space key event; render visible tap-zone overlay on mobile
- [ ] **F-18** Implement responsive canvas: recalculate canvas dimensions on `window.resize`; maintain 16:9 aspect ratio on desktop, full-width on mobile
- [ ] **F-19** Integrate score submission: on `GameOverScene`, call `POST /game/session/{id}/end` with final score; display returned rank

#### Phase 5: Leaderboard & Real-time
- [ ] **F-20** Implement STOMP WebSocket connection: connect on `GamePage` mount with access token, subscribe to `/topic/leaderboard/{tenantId}`
- [ ] **F-21** Build `LeaderboardPanel` component: ranked list with avatar, name, score, rank badge; animated re-ordering on update
- [ ] **F-22** Handle WebSocket reconnection (exponential backoff, max 5 retries, fallback to polling `GET /leaderboard` every 10s)
- [ ] **F-23** Build `MyRank` banner: always-visible strip showing current user's rank even outside top 10

#### Phase 6: PWA
- [ ] **F-24** Configure `vite-plugin-pwa`: `manifest.json` template with tenant color/name injected at runtime via meta tags (workaround: dynamic manifest endpoint served by backend)
- [ ] **F-25** Configure Workbox service worker: cache-first for assets, network-first for API, background sync for score submission
- [ ] **F-26** Implement `InstallPrompt` component: intercept `beforeinstallprompt`, show after first game over, respect user dismissal (store in `localStorage`)
- [ ] **F-27** Implement offline mode UI: detect `navigator.onLine`, show banner, queue score submission for background sync

#### Phase 7: Admin Dashboard (Tenant)
- [ ] **F-28** Build `AdminLayout` with sidebar navigation: Overview, Brand Config, Leads, Analytics
- [ ] **F-29** Build `BrandConfigEditor`: logo upload (drag-and-drop), color pickers, sprite upload, preview pane (live game preview in iframe)
- [ ] **F-30** Build `LeadsExport`: table of consented users with export to CSV button
- [ ] **F-31** Build `AnalyticsDashboard`: MAU chart (Recharts line chart), session funnel, consent conversion rate

---

## 7. Non-Functional Requirements

### 7.1 Security

| Requirement | Implementation |
|---|---|
| JWT security | RS256 asymmetric signing; short-lived access tokens (1h); refresh token rotation |
| CSRF protection | SameSite=Strict cookies for refresh tokens; access token in memory (not cookies) |
| XSS prevention | React's default escaping; CSP headers via Cloudflare; no `dangerouslySetInnerHTML` |
| SQL injection | Parameterized queries only via JPA/Hibernate; no native query string concatenation |
| Rate limiting | Bucket4j on auth endpoints (10/min/IP), score submission (1/3s/user) |
| Tenant isolation | Hibernate filter + PostgreSQL RLS; no cross-tenant data exposure possible at DB level |
| Secrets management | All secrets via environment variables / AWS Secrets Manager; zero secrets in codebase |
| HTTPS | TLS 1.3 enforced at CDN layer; HSTS headers |

### 7.2 GDPR & Marketing Consent Compliance

| Requirement | Implementation |
|---|---|
| Explicit opt-in | Checkbox unchecked by default; user must actively check to consent |
| Granular consent | Separate consent per tenant (a user might play for Acme and Globex — separate records) |
| Consent audit log | `marketing_consents` table is append-only; every state change (grant, withdrawal) logged with timestamp, IP, user agent, consent text version |
| Right to withdraw | `DELETE /consent` endpoint; `withdrawn_at` set; downstream email systems notified (webhook or export flag) |
| Right to erasure | `DELETE /user/me` endpoint (future): anonymize user record, retain aggregate score with null user_id |
| Data minimization | Only collect name + email; no phone, no address, no behavioral profiling beyond in-game scores |
| Consent text versioning | `consent_version` field in `marketing_consents`; if tenant changes consent wording, existing consents remain valid under old version; new players see new version |
| DPA readiness | Platform terms require tenants to have their own DPA with their subscribers; PromoRunner is a data processor |

### 7.3 Performance

| Metric | Target |
|---|---|
| API response time (p95) | < 200ms (cached), < 500ms (uncached) |
| WebSocket leaderboard push latency | < 500ms from score submission to client receipt |
| Game canvas frame rate | 60fps on mid-range mobile (Chrome, Safari) |
| First Contentful Paint | < 1.5s on 4G mobile |
| Leaderboard query time | < 50ms (Redis hot cache), < 100ms (PostgreSQL with index) |
| Score submission throughput | 500 concurrent submissions without degradation |

### 7.4 Scalability

- Backend is stateless (JWT auth, Redis sessions) → horizontally scalable behind load balancer
- WebSocket connections handled by a dedicated instance (or use Redis pub/sub to fan out across multiple WS instances)
- PostgreSQL read replicas for leaderboard reads; writes to primary
- CDN for all static assets; game sprites cached at edge

### 7.5 Observability

- Structured JSON logging with correlation IDs (Spring Boot Logback → Loki/CloudWatch)
- Metrics: Spring Actuator + Micrometer → Prometheus → Grafana dashboards
- Alerting: p99 API latency > 1s, error rate > 1%, WebSocket disconnect spike
- Distributed tracing: OpenTelemetry → Jaeger (or AWS X-Ray)

### 7.6 Deployment

| Environment | Infrastructure |
|---|---|
| **Local dev** | Docker Compose (PostgreSQL, Redis, Spring Boot, React dev server) |
| **CI** | GitHub Actions: test → build → Docker image push to ECR |
| **Staging** | AWS ECS Fargate (Spring Boot), S3 + CloudFront (React SPA), RDS PostgreSQL, ElastiCache Redis |
| **Production** | Same as staging + multi-AZ RDS, auto-scaling ECS tasks, WAF rules, CloudTrail |

**Docker Compose (dev):**
```yaml
services:
  db:
    image: postgres:15
    environment: { POSTGRES_DB: promorunner, POSTGRES_PASSWORD: dev }
  redis:
    image: redis:7-alpine
  api:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [db, redis]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [api]
```

---

## 8. Execution Roadmap

### Sprint Overview (2-week sprints, 3-person team assumption)

| Sprint | Backend Focus | Frontend Focus | Deliverable |
|---|---|---|---|
| **S1** | B-01→B-06 (infra, DB, multi-tenancy) | F-01→F-05 (project setup, routing) | Dev environment running |
| **S2** | B-07→B-11 (authentication) | F-06→F-12 (landing page, auth UI) | Full auth flow working end-to-end |
| **S3** | B-12→B-17 (config, consent, game sessions) | F-13→F-19 (Phaser game engine) | Playable game with score submission |
| **S4** | B-18→B-22 (leaderboard, WebSocket) | F-20→F-23 (real-time leaderboard UI) | Live leaderboard working |
| **S5** | B-23→B-27 (admin, security, rate limiting) | F-24→F-27 (PWA) | PWA installable; admin analytics |
| **S6** | Performance tuning, load testing | F-28→F-31 (admin dashboard) | Tenant admin UI complete |
| **S7** | Security audit, penetration test prep | E2E testing (Playwright), accessibility pass | Release candidate |
| **S8** | Infra hardening, runbooks, monitoring | Polish, performance profiling | **v1.0 Production Launch** |

### Milestone Summary

- **Week 2:** Dev environment, CI/CD pipeline, DB schema live
- **Week 4:** End-to-end auth (Google + Magic Link) working
- **Week 6:** Complete game loop (play → score → leaderboard) functional
- **Week 10:** Full feature set including PWA + admin dashboard
- **Week 14:** Production-hardened, security-audited, launched
- **Week 16:** First tenant onboarded

---

## 9. Open Questions & Recommendations

### 9.1 Open Questions — Answers Needed Before Sprint 1

These questions will materially affect architecture or scope. Please answer before development begins:

**Business & Monetization:**
1. **Prize / Reward mechanic:** Should the leaderboard be tied to real prizes (discount codes, gift cards for top performers)? If yes, this requires a prize fulfillment sub-system and significant additional scope.
2. **Campaign duration:** Is each game campaign permanent, or does it have a start/end date (e.g., "run for 30 days during our product launch")? Time-boxed campaigns change leaderboard reset logic.
3. **Analytics export:** Do tenants need CRM integration (HubSpot, Salesforce) for the lead data, or is CSV export sufficient for v1?
4. **Tenant self-serve vs. managed:** Can any company sign up and configure themselves (true self-serve), or does PromoRunner have a sales-assisted onboarding step? This determines how much polish the admin wizard needs for v1.
5. **Multi-language:** Does the platform need to support multiple languages (i18n) from day one, or English-only for v1?

**Game Design:**
6. **Game difficulty curve:** Should difficulty be configurable per tenant (e.g., harder for a gaming brand's audience, easier for a food brand's broader audience), or fixed?
7. **Custom game mechanics:** Is the jump mechanic fixed, or do you want tenants to be able to configure variations (double jump, duck/slide obstacle types)?
8. **Sound effects:** Should the game have audio? If yes: default sound pack + tenant-uploadable audio assets?

**Legal & Compliance:**
9. **Target geographies at launch:** EU-only requires full GDPR compliance (already designed for). US-only is lighter. Global needs GDPR + CCPA + potentially others. This affects consent copy and data residency.
10. **Who is the Data Controller:** Is PromoRunner the controller, or is the tenant? This affects whose privacy policy the consent checkbox links to. **Recommendation: tenant is the controller; PromoRunner is the processor** — this is the cleaner GDPR architecture and reduces PromoRunner's liability.

---

### 9.2 Strategic Recommendations

**From a marketing and product positioning standpoint:**

**R-01: Lead with "3 tries" — make scarcity feel like generosity.**
The free-play gate is your most powerful mechanic. Frame it as "We're giving you 3 free plays as a gift" rather than "You only get 3 plays." The emotional re-frame increases conversion to consent by ~20–30% in comparable gamified opt-in flows.

**R-02: The leaderboard is your viral engine — never hide it.**
Display the leaderboard publicly (without email addresses) at a shareable URL like `{slug}.promorunner.io/leaderboard`. Players who see their name in the top 10 will share it. Players who see others on the board feel the competitive pull. This costs nothing to implement and drives organic traffic.

**R-03: Post-game social share is mandatory for virality.**
After every game over, show a pre-filled tweet and WhatsApp share: *"I just scored [X] on [Brand]'s game — can you beat me? 🎮 [URL]"*. LinkedIn for B2B tenants. This is the cheapest CAC reduction available. Implement in Sprint 3.

**R-04: Offer a "Powered by PromoRunner" badge option (opt-out on Growth+).**
For Starter plan tenants, show a small "Powered by PromoRunner" badge. This is free brand advertising. Growth+ tenants can remove it. Saas businesses like Calendly built significant B2B awareness this way.

**R-05: Build the prize mechanic into the roadmap.**
Even if you don't build it in v1, design the schema to support it. Tenants will ask: "Can the top 3 get a promo code?" Having this on your roadmap makes every sales conversation easier. Simple v1 version: tenant enters a discount code in admin, code is shown to the top N users at game end.

**R-06: The onboarding wizard is your product's first impression — invest in it.**
The time from "signup" to "shareable game URL" should be under 10 minutes. If it takes 45 minutes and a support call, your churn in month 1 will be brutal. Invest disproportionately in the brand config wizard UX (F-29). Add a live preview pane so tenants see their colors/logo in the game in real time.

**R-07: Launch with 3 default game themes (not just one).**
Even if the underlying game is identical, giving tenants a choice of 3 visual themes (e.g., "Cyberpunk City", "Retro Arcade", "Corporate Clean") makes the product feel more premium and reduces the custom asset upload barrier. Tenants who don't have a pixel artist can still launch in 10 minutes.

**R-08: Consent conversion tracking is your most important metric.**
Track: (a) % of players who land → auth, (b) % who auth → consent, (c) % who consent → play again. This funnel is what you sell to tenants ("Your game generated 2,400 opted-in leads at $0.12 CPL"). Build this into the analytics dashboard from day one. It is your primary value proof.

---

*Document maintained by: Engineering Lead + Product*
*Next review: Sprint 1 kickoff*
*Version history: v1.0 — Initial draft*
