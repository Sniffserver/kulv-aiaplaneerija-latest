# KÜLV: Production-Safe Local-First PWA & Hardened Node API

A comprehensive release-readiness and security hardening plan bringing KÜLV from a development prototype to a production-safe, local-first progressive web application with a hardened, test-isolated optional Node.js API proxy.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned and confirmed for this release:

- **Confirmed Decision 1: Strict Production CSP via Script Extraction**: Inline scripts currently in `index.html` (boot theme applicator and Vite HMR error suppressor) will be extracted into modular, versioned TypeScript entry scripts (`src/boot-theme.ts`), allowing the production Content Security Policy to enforce `script-src 'self'` without `'unsafe-inline'`.
- **Confirmed Decision 2: Semantic Versioning Release Pipeline**: Standard semantic versioning scripts coupled with GitHub Actions automation will create versioned releases, bundle production `dist/` archives, generate container image metadata, and upload signed artifacts on tag/release trigger.
- **Confirmed Decision 3: Multi-Layer Secret Scanning**: Gitleaks will be incorporated at both local developer pre-commit (via Husky) and automated GitHub Actions CI gates, backed by strict `.gitignore` rules and zero-token observability logging.

***

## 1. Overview & Core Concept

- **What It Does**: Hardens the KÜLV gardening companion PWA for production deployments. It ensures client-side operations are completely autonomous and local-first (IndexedDB), while the optional companion Node.js server acts as an isolated, rate-limited, and zero-leak reverse proxy for external weather telemetry and field sensor integrations.
- **Target Audience / Persona**: Nordic home gardeners, permaculturists, and community garden managers using mobile devices, tablets, and field notebooks in outdoor conditions with intermittent or zero internet connectivity.
- **Key Value**: Zero data loss offline, hermetic and reproducible test isolation, production-grade security headers (A+ grade CSP), automated container vulnerability gating, and zero exposed credentials.

***

## 2. User Experience & Visual Design

Because this phase focuses exclusively on reliability, security, deployment, and test isolation, no modifications to core garden planning screens or aesthetic palettes are introduced. However, UX resilience is significantly upgraded:

- **Zero-Flicker Boot Experience**: Extracted theme and palette application (`src/boot-theme.ts`) runs as a high-priority synchronous script before the DOM renders `#root`, preserving instantaneous dark mode and custom Nordic palette selection without layout shift (CLS < 0.01).
- **Graceful Offline Degradation**: The app continues to function seamlessly when the optional Node server or external weather API is unreachable, utilizing local cached degree-day models and cached frost forecasts.
- **Transparent Field Health Status**: Real-time readiness checks (`/health` and `/readyz`) provide clear operational telemetry for self-hosted instances (e.g. Raspberry Pi, Docker, Unraid, TrueNAS, Home Assistant Add-on).

***

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Dependency Injection for Express Server
- **Chosen Approach**: Refactor `createApp(options?: AppDependencies)` to accept optional instances of `weatherCache` (`Map<string, CacheEntry>`) and `weatherLimiter` (`RequestHandler`), with defaults initialized if omitted.
- **Why**: Eliminates module-global state in `server.ts`. Guarantees tests can instantiate multiple concurrent server instances that cannot leak cache entries or rate-limit tokens into neighboring test cases.
- **Alternatives Considered**: Global cache reset hooks (`__resetCache()`), rejected because they rely on shared memory and are prone to test race conditions in parallel test runners.

### Decision 2: Multi-Stage Container Runtime (Nginx vs. Node)
- **Chosen Approach**: Two production deployment pathways:
  1. Multi-stage Dockerfile building `dist/` with Node.js, served via a minimal, non-root Alpine Nginx container with reverse proxy headers and static asset compression for standard static PWA hosting.
  2. The standalone Node.js Express server (`server.ts`) for full-stack setups needing the weather API proxy and sensor ingestion.
- **Why**: Static hosting via Nginx provides the smallest container footprint (<30MB) and near-zero attack surface. Node.js backend serves users needing the proxy.

### Decision 3: Strict Script-Src 'Self'
- **Chosen Approach**: Move inline `<script>` blocks out of `index.html` into `src/boot-theme.ts` referenced via `<script type="module" src="/src/boot-theme.ts"></script>`.
- **Why**: Allows removing `'unsafe-inline'` from `script-src` in production CSP. Eliminates the maintenance overhead and brittle build-time calculation of SHA-256 script hashes.

***

## 4. Technical Architecture & Data Strategy

### System & Test Isolation Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KÜLV Architecture Boundary                       │
└────────────────────────────────────────────────────────────────────────┘

    Client PWA (Local-First)                Server Proxy Layer (Optional)
┌───────────────────────────────┐        ┌───────────────────────────────┐
│ Browser / WebView / PWA Cache │        │      Node.js / Express 5      │
│  - IndexedDB (StorageDB)      │        │  - Helmet (CSP, HSTS, Sniff)  │
│  - Zustand State Stores       │        │  - Request Correlation Logger │
│  - Boot Theme Script          │        │  - Graceful Shutdown Manager  │
└──────────────┬────────────────┘        └───────────────┬───────────────┘
               │ Local State Read/Write                  │
               │                                         │
               │ (Optional Weather Request)              │
               └──────────────────► /api/weather ────────┤
                                                         │
                                    ┌────────────────────┴───────────────┐
                                    │ Injected Testable Dependencies     │
                                    ├────────────────────────────────────┤
                                    │ - Isolated weatherCache (Map)      │
                                    │ - Isolated weatherLimiter (MW)     │
                                    │ - Eviction Guard (Max 500)         │
                                    └────────────────────┬───────────────┘
                                                         │
                                                         ▼
                                             OpenWeatherMap API
                                             (API Token server-only)
```

### Component & State Mapping

| Component / Subsystem | Injected State / Scope | Event / Trigger | Failure / Safety Strategy |
| :--- | :--- | :--- | :--- |
| `server.ts` (`createApp`) | `weatherCache`, `weatherLimiter` | HTTP GET `/api/weather` | 429 on limit, 502 on upstream drop, 504 on timeout (8s) |
| `server.ts` (`/readyz`) | Env check (`OPENWEATHER_API_KEY`) | Kubernetes / Docker liveness | 200 OK or 503 Service Unavailable (zero token exposure) |
| `server.ts` (Graceful Shutdown) | Server listener, connections set | SIGTERM / SIGINT | `server.close()`, 10s force-kill timer, drains in-flight HTTP |
| `src/boot-theme.ts` | LocalStorage tokens | Synchronous pre-paint | Try-catch wrapped fallback to system preference |
| `nginx.conf` | Static assets & SPA fallback | HTTP GET `/*` | URI fallback to `/index.html`, security headers injected |

***

## 5. Step-by-Step Execution Plan

### Step 1: Dependency Manager Ambiguity & Stale Artifact Cleanup
- Standardize on npm as the sole package manager.
- Verify `bun.lock` removal and refresh `package-lock.json` via `npm install`.
- Inspect and delete `coverage-test/` directory.
- Update `.gitignore` to explicitly ignore `coverage-test/`, `coverage/`, `dist/`, `playwright-report/`, `test-results/`.
- Update `README.md` and `CONTRIBUTING.md` to specify npm requirements.

### Step 2: Server State Testability & Dependency Injection
- Refactor `createApp` in `server.ts` to accept `AppDependencies`:
  ```typescript
  export interface AppDependencies {
    weatherCache?: Map<string, CacheEntry>;
    weatherLimiter?: RequestHandler;
    clock?: () => number;
  }
  ```
- Remove module-global cache references inside `createApp()`.
- Add integration tests in `server.test.ts`:
  - Verify two distinct `createApp()` instances maintain independent caches.
  - Verify two distinct rate limiters isolate client IP quotas.
  - Verify LRU/TTL cache eviction when exceeding 500 entries.

### Step 3: Hardened Production Startup, Shutdown & Observability
- Update `package.json` start script: `"start": "NODE_ENV=production tsx server.ts"`.
- Implement graceful shutdown in `server.ts`:
  - Capture `SIGTERM` and `SIGINT`.
  - Close HTTP listener, stop accepting connections, wait for pending requests.
  - Impose a strict 10-second timeout to exit process forcefully if hanging.
- Implement `/readyz` endpoint verifying process health and configuration presence without leaking secret tokens.
- Add structured logging for cache hits, cache misses, upstream latency, and rate-limit blocks (sanitizing coordinates and removing keys).

### Step 4: Strict CSP & Script Extraction
- Extract inline scripts from `index.html` into `src/boot-theme.ts`.
- In `server.ts`, enforce strict production Content-Security-Policy:
  - `script-src 'self'` (no `'unsafe-inline'`).
  - `style-src 'self' 'unsafe-inline'` (with documented follow-up ticket in code comments).
  - Explicit directives for fonts, images, and blob/data URLs.
- Add automated server tests asserting production security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, strict CSP, HSTS in production, CSP disabled in dev).

### Step 5: Production Dockerfile & Container Verification
- Create multi-stage `Dockerfile`:
  - Build stage: Node 22 Alpine, `npm ci`, `npm run build`.
  - Runtime stage: unprivileged Alpine Nginx serving `dist/` with custom `nginx.conf` (SPA fallback, `/health`, custom headers).
- Create `.dockerignore` excluding unnecessary directories and secrets.
- Add GitHub Actions CI job `docker-verify`:
  - Build container.
  - Scan with Trivy (`severity: 'HIGH,CRITICAL'`, exit-code 1).
  - Start container on port 8080 and curl `/health`.

### Step 6: Secret Scanning & CI Hardening
- Add Gitleaks workflow in `.github/workflows/ci.yml`.
- Add pre-commit hook in `.husky/pre-commit` to prevent committing secrets or `bun.lock`.
- Verify `.env.example` has zero real API keys.
- Update `node-version: 22` in `.github/workflows/ci.yml` (replacing stale `.nvmrc` reference).

### Step 7: Release Readiness, CHANGELOG & Architecture Documentation
- Add release workflow in `.github/workflows/release.yml` with semantic versioning triggers.
- Update `CHANGELOG.md` with detailed entry covering security headers, rate limiting, cache isolation, and test suites.
- Update `SECURITY.md` with CSP policy, secret handling, rate limiting rules, and vulnerability reporting protocols.
- Create `docs/ARCHITECTURE.md` documenting the local-first PWA boundary, optional Node API proxy, and field deployment patterns.

***

## 6. Verification & Done Criteria

- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm test` passes all unit tests.
- [ ] `npm run test:server` passes all server integration tests including dependency injection and shutdown.
- [ ] `npm run test:coverage` passes coverage gates.
- [ ] `npm run audit:ci` passes with no high/critical vulnerabilities.
- [ ] `npm run build` succeeds; `dist/index.html` has zero inline scripts.
- [ ] `dist/` static files serve correctly with strict `script-src 'self'`.
- [ ] Docker image builds and passes Trivy scan without HIGH or CRITICAL issues.
- [ ] Local container `/health` returns 200 OK.
- [ ] Gitleaks scan confirms no credentials in repository history or code.
- [ ] Playwright E2E suite passes (`npm run test:e2e`).
