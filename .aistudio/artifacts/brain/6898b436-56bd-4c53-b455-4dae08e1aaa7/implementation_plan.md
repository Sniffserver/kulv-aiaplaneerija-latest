# Server Security Hardening, Rate Limiting, Server Tests & CI Integration (Revised)

Comprehensive hardening of the KÜLV backend service: installing `express-rate-limit` and `supertest`, upgrading `server.ts` with an exportable `createApp()` factory, structured JSON logging with UUID request correlation, environment-aware CORS origin filtering, 5-minute coordinate-rounded weather caching, dedicated Vitest server integration tests (`server.test.ts`), a dedicated `server` CI job in `.github/workflows/ci.yml`, and clean segmentation of `.env.example`.

## User Review & Critical Decisions

> [!IMPORTANT]
> The implementation incorporates all explicit technical specifications provided:
> - **Dependency Installation**: `express-rate-limit` for runtime rate limiting; `supertest` and `@types/supertest` for Vitest HTTP integration testing.
> - **Server Architecture (`createApp` Factory)**: `server.ts` exports `createApp()` so integration tests can mount the Express app directly via `supertest(createApp())` without port collisions, while `startServer()` binds to the network only when executed directly.
> - **Host & Port Resolution**: `process.env.HOST ?? (isProduction() ? '0.0.0.0' : '127.0.0.1')`. Local development defaults to `127.0.0.1`, and container/production defaults to `0.0.0.0`.
> - **CORS Allowlist**: Explicit allowlist parsed from `CORS_ORIGINS`. In non-production, standard local and preview dev origins (`localhost:3000`, `127.0.0.1:3000`, `4173`, `5173`) are permitted automatically. Unknown origins receive no CORS allowance headers.
> - **Rate Limiting & Memory Cache**: 30 requests/minute per IP with `draft-7` headers on `/api/weather`. Successful responses cached for 5 minutes (`WEATHER_CACHE_TTL_MS = 300_000`) with `X-Cache: HIT` / `X-Cache: MISS` headers.
> - **Structured Logging & Tracing**: Every request is assigned an `x-request-id` (forwarded or `crypto.randomUUID()`) and logs structured JSON with `timestamp`, `level`, `requestId`, `method`, `path`, `status`, and `durationMs`.
> - **Payload Limiting & Error Typing**: Explicit `express.json({ limit: '100kb' })` and strict error narrowing (`error instanceof Error`) avoiding `any`.
> - **CI Server Job**: `.github/workflows/ci.yml` introduces a dedicated `server` integration test job running `npm run test:server` after `quality`, with `release` dependent on `[quality, e2e, server]`.
> - **Environment Manifest**: `.env.example` categorized into required, optional, and planned sections.

---

## 1. Overview & Core Concept

- **What It Delivers**: Transforms `server.ts` into a secure, hardened, and testable backend service that defends against quota abuse, denial-of-service, and cross-origin exploitation.
- **Target Audience & Context**: KÜLV application runtime, Cloud Run production container instances, local developer workflows, and automated GitHub Actions CI pipelines.
- **Key Value**: Closes all remaining P1 and P2 vulnerabilities with high test coverage and zero regressions in local or cloud environments.

---

## 2. Developer Experience & API Contracts

- **Health Endpoint (`GET /health`)**:
  - Status 200: `{ "ok": true, "timestamp": "...", "version": "1.0.0", "environment": "..." }`
  - Unaffected by weather rate limiting.
- **Weather Proxy (`GET /api/weather?lat=...&lon=...`)**:
  - Status 200: Forwarded OpenWeather payload with `X-Cache: HIT` or `X-Cache: MISS`.
  - Status 400: Out-of-bounds coordinates or missing parameters (`lat` between -90 and 90, `lon` between -180 and 180).
  - Status 429: Too many requests (> 30 per min per IP) with Draft-7 `RateLimit` headers.
  - Status 500: Missing `OPENWEATHER_API_KEY` configuration.
  - Status 502: Upstream provider HTTP error.
  - Status 504: Upstream provider timeout (> 8s).
- **CORS Handling**:
  - Matches origin against `getAllowedOrigins()`.
  - Sets `Access-Control-Allow-Origin: <origin>`, `Vary: Origin`, `Access-Control-Allow-Methods: GET, OPTIONS`, and `Access-Control-Allow-Headers: Content-Type, X-Request-Id`.
  - Rejects preflight `OPTIONS` with 204 or omits CORS headers for unauthorized origins.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Programmatic Test Harness (`createApp`) vs. Port Binding**
  - *Chosen Approach*: Decouple Express app creation (`createApp()`) from listener execution (`startServer()`).
  - *Why*: Allows `supertest` to dispatch requests directly in memory within Vitest workers without spawning listening ports, avoiding port clashes in parallel test execution.
- **Decision 2: In-Memory TTL Cache vs. External KV**
  - *Chosen Approach*: Node.js `Map<string, CacheEntry>` with coordinate keys rounded to 3 decimal places (`~110m` resolution).
  - *Why*: Simple, instant, zero latency, and perfectly suited for single-container Cloud Run deployment.
- **Decision 3: Dedicated CI Server Job**
  - *Chosen Approach*: Separate `server` job in GitHub Actions rather than bundling with `quality`.
  - *Why*: Pinpoints backend failures immediately on pull requests and enables independent caching and retry semantics.

---

## 4. Technical Architecture & Component Mapping

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HTTP / REST Client                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Origin: ... / X-Request-Id: ...
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Express Server (createApp)                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. requestLogger: crypto.randomUUID(), res.on('finish'), JSON log│  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │                                    │
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │ 2. CORS Guard: getAllowedOrigins() (CORS_ORIGINS + dev defaults) │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │                                    │
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │ 3. express.json({ limit: '100kb' })                              │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │                                    │
│         ┌─────────────────────────┴────────────────────────┐           │
│         ▼                                                  ▼           │
│  ┌──────────────┐                               ┌────────────────────┐ │
│  │ GET /health  │                               │  GET /api/weather  │ │
│  └──────────────┘                               └──────────┬─────────┘ │
│                                                            │           │
│                                                 ┌──────────▼─────────┐ │
│                                                 │ createWeatherLimit │ │
│                                                 │ (30 req/min/IP)    │ │
│                                                 └──────────┬─────────┘ │
│                                                            │           │
│                                                 ┌──────────▼─────────┐ │
│                                                 │ weatherCache Check │ │
│                                                 │ (5-min TTL, Map)   │ │
│                                                 └─────┬────────▲─────┘ │
│                                            Cache Miss │        │ Store │
│                                                       ▼        │       │
│                                                 ┌──────────────┴─────┐ │
│                                                 │ OpenWeather fetch  │ │
│                                                 │ (8s AbortTimeout)  │ │
│                                                 └────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### File Changes

1. **`package.json`**:
   - Dependencies: add `"express-rate-limit": "^8.0.0"`.
   - Dev Dependencies: add `"supertest": "^7.0.0"`, `"@types/supertest": "^6.0.0"`.
   - Scripts: add `"test:server": "vitest run server.test.ts"`.
2. **`server.ts`**:
   - Replace with the complete hardened implementation provided: `createApp()`, structured logging, `weatherCache`, `createWeatherLimiter()`, strict error typing, `registerStaticServing()`, and conditional `startServer()`.
3. **`server.test.ts`**:
   - Create comprehensive Vitest integration suite with 10 test cases covering health, coordinate validation, upstream errors, timeouts, caching, rate limiting, CORS origins, and request IDs.
4. **`.github/workflows/ci.yml`**:
   - Add `server` job with `npm run test:server` after `quality`.
   - Update `release` job dependencies to `needs: [quality, e2e, server]`.
5. **`.env.example`**:
   - Replace with clean structured template separating required, optional, and planned variables.
6. **Verification**:
   - Run `npm test`, `npm run test:server`, `npm run typecheck`, and `npm run build`.
