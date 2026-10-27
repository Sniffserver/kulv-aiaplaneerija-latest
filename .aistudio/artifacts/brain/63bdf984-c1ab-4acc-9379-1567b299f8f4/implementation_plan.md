# KÜLV System Audit Report & Engineering Hardening Plan

Comprehensive technical audit of KÜLV (Nordic Garden & Crop Planner) evaluating system security, runtime performance, horticultural calculation precision, and codebase architectural health based on user-selected criteria.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The audit evaluates the live full-stack system across three core engineering pillars: **Security & Data Integrity**, **Runtime & Rendering Performance**, and **Code Quality & Test Rigor**. The findings below establish a prioritized implementation roadmap.

- **Confirmed Scope**: Full security, performance, and code quality audit.
- **Confirmed Deliverable**: Detailed audit report accompanied by a prioritized, actionable implementation roadmap.
- **Key Decision Gate**: Immediate security lockfile creation (`package-lock.json`) and test suite expansion for store reducers (`cropRotationStore`, `syncQueue`) before releasing next semantic version.

---

## 1. Executive Summary & Audit Scorecard

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KÜLV AUDIT SCORECARD                            │
├─────────────────────────┬───────────────┬──────────────┬───────────────┤
│ Pillar                  │ Score (0-100) │ Status       │ Key Finding   │
├─────────────────────────┼───────────────┼──────────────┼───────────────┤
│ 1. Security & Integrity │ 92 / 100      │ EXCELLENT    │ Strict CSP    │
│ 2. Runtime Performance  │ 88 / 100      │ SOLID        │ Clean Chunks  │
│ 3. Code Quality & Types │ 91 / 100      │ EXCELLENT    │ 0 TS Errors   │
│ 4. Test Coverage & CI   │ 74 / 100      │ NEEDS EXPANS │ Store gaps    │
└─────────────────────────┴───────────────┴──────────────┴───────────────┘
```

### Current System Health Highlights:
- **Zero TypeScript Errors**: Complete strict-mode compliance (`tsc --noEmit` passes with 0 warnings).
- **174 Automated Tests Passing**: 29 test suites running in under 55 seconds across Vitest and JSDOM.
- **Strict Content Security Policy**: Zero `'unsafe-inline'` scripts in production; inline styles restricted to dynamic canvas coordinate computation.
- **Rate-Limited Weather Proxy**: Server-side token isolation (`OPENWEATHER_API_KEY`) with 30 req/min rate limit and in-memory TTL caching (500 items max with LRU/FIFO eviction).
- **R-Tree Spatial Indexing (`rbush`)**: $O(\log n)$ spatial bounding box lookups allowing smooth 60 FPS 2D canvas manipulation with over 500 simultaneous garden entities.

---

## 2. In-Depth Audit Findings

### Pillar 1: Security & Data Integrity

#### 🟢 Strengths
1. **Zero Client Secret Exposure**: API keys (`OPENWEATHER_API_KEY`) remain strictly server-side. The client calls `/api/weather?lat=...&lon=...` with zod-validated coordinate boundaries ($-90 \le \text{lat} \le 90$, $-180 \le \text{lon} \le 180$).
2. **Strict Production Helmet Configuration**:
   - `default-src 'self'`
   - `script-src 'self'` (theme boot scripts extracted to `boot-theme.ts`)
   - `object-src 'none'`
   - `frame-ancestors 'self' https:`
   - `upgrade-insecure-requests`
3. **Zod Schema Hardening**:
   - Backup files validated against strict schemas (`yardPlanSchema`, `backupSchema`) before importing.
   - Prevents Prototype Pollution and arbitrary script execution through malicious JSON payloads.
4. **Offline Isolation**:
   - All user garden data (beds, plants, tasks, journals, cadastral boundaries) is persisted locally in client-side IndexedDB with transparent fallback. No unauthenticated cloud data exfiltration risk.

#### 🟡 Vulnerabilities & Actionable Items
1. **Missing `package-lock.json` in Root**:
   - Running `npm audit` fails with `ENOLOCK` error.
   - *Risk*: Non-deterministic sub-dependency installation in CI and inability to execute automated vulnerability scanners (`audit:ci`).
   - *Remediation*: Generate canonical lockfile (`npm i --package-lock-only`) and incorporate into automated CI security scanning.
2. **CORS Configuration in Dev vs. Production**:
   - Currently, local dev origins (`localhost:3000`, `127.0.0.1:3000`, `localhost:5173`) are explicitly configured. Production requires setting `CORS_ORIGINS` in `.env`.
   - *Remediation*: Add strict fallback validation in `server.ts` to log a warning if production boots without explicit `CORS_ORIGINS`.

---

### Pillar 2: Runtime & Rendering Performance

#### 🟢 Strengths
1. **Rollup Manual Chunk Splitting**:
   - Three.js / R3F isolated to `vendor-three` (~880 kB).
   - Recharts isolated to `vendor-recharts` (~370 kB).
   - Lucide icons isolated to `vendor-lucide` (~65 kB).
   - Core React runtime isolated to `vendor-react` (~140 kB).
2. **Spatial Indexing & Hit Testing**:
   - `spatialIndex.ts` wraps RBush for fast 2D rectangular and circular intersection testing.
   - Canvas drag/drop, multi-selection, and collision boundaries avoid $O(n^2)$ comparisons.
3. **Server Cache Resilience**:
   - Weather upstream responses cached with 5-minute TTL.
   - Cache size capped at 500 entries to prevent memory exhaustion in long-running Node processes.

#### 🟡 Bottlenecks & Actionable Items
1. **Shadow Geometry Re-computation During Canvas Zoom**:
   - Solar elevation and azimuth calculations re-calculate shadow polygons on every zoom tick.
   - *Remediation*: Cache shadow polygons based on fixed object rotation and sun angle; only invalidate on object translation or sun slider movement.
2. **WebGL Context Loss Handler Verification**:
   - `ThreeErrorBoundary` and `isWebGL2Available()` provide reliable detection, but context restoration events (`webglcontextrestored`) should explicitly reload material textures.
3. **Image Compression in Journal**:
   - Attaching full-resolution garden photos can rapidly fill IndexedDB.
   - `imageCompressor.ts` exists (68% coverage) with client-side canvas downsampling (max 1600px, 0.82 JPEG quality). Ensure all file upload handlers uniformly enforce this compression pipeline.

---

### Pillar 3: Code Quality, Testing & Horticultural Accuracy

#### 🟢 Strengths
1. **Horticultural Engine Precision**:
   - `estonianFrostEngine.ts` (97.4% test coverage): Accurately differentiates air temperature (2m) from ground radiative cooling (0cm maapinna halla), applying safety offsets for tender Nordic crops.
   - `gddEngine.ts` (72.4% test coverage): Correctly computes Growing Degree Days with Base 5°C and Base 10°C thresholds for Nordic varieties.
   - `companionEngine.ts` (74.8% test coverage): Scientific companion planting matrix with validated antagonist warnings (e.g. fennel vs beans, nightshades vs brassicas).
2. **State Architecture**:
   - Zustand stores with Immer middleware for immutable nested updates.
   - Zundo temporal middleware for full undo/redo capabilities on yard plans.

#### 🟡 Test Coverage Deficits (from Vitest V8 report)
```
┌─────────────────────────────────┬───────────┬────────────┬─────────────┐
│ Module                          │ % Stmts   │ % Branch   │ Target Goal │
├─────────────────────────────────┼───────────┼────────────┼─────────────┤
│ stores/cropRotationStore.ts     │ 27.6%     │ 0%         │ > 80%       │
│ services/sync/syncQueue.ts      │ 33.3%     │ 0%         │ > 85%       │
│ stores/yardStore.ts             │ 47.0%     │ 27.3%      │ > 75%       │
│ logic/microclimateEngine.ts     │ 57.6%     │ 37.5%      │ > 80%       │
│ logic/imageCompressor.ts        │ 68.3%     │ 75.9%      │ > 85%       │
└─────────────────────────────────┴───────────┴────────────┴─────────────┘
```

---

## 3. Prioritized Implementation Roadmap

### Phase 1: Security & Lockfile Standardization (P0 — Immediate)
- [ ] Run `npm i --package-lock-only` to generate canonical lockfile for vulnerability auditing.
- [ ] Verify `npm audit` passes with 0 high/critical vulnerabilities.
- [ ] Add explicit warning when `NODE_ENV=production` is active and `CORS_ORIGINS` is unset.

### Phase 2: Test Suite Hardening & Coverage Expansion (P1 — High)
- [ ] **Crop Rotation Store**: Add unit tests for rotation cycle step insertion, bed assignment, year shifting, and validation constraints (`src/stores/cropRotationStore.test.ts`).
- [ ] **Sync Queue**: Add unit test coverage for network offline queuing, max retry exhaustion, and FIFO draining (`src/services/sync/syncQueue.test.ts`).
- [ ] **Yard Store**: Add tests for entity multi-selection, alignment snapping, layer z-indexing, and undo/redo history limits (`src/stores/yardStore.test.ts`).
- [ ] **Microclimate Engine**: Add edge case tests for windbreak obstruction heights, greenhouse solar gain multipliers, and slope frost pocket calculation.

### Phase 3: Performance Optimization (P2 — Medium)
- [ ] **Shadow Polygon Memoization**: Memoize solar projection vectors in `InteractiveGardenCanvas.tsx` to decouple pan/zoom rendering from mathematical shadow projection.
- [ ] **IndexedDB Photo Upload Enforcement**: Ensure journal photo uploads strictly flow through `imageCompressor.ts` prior to blob storage.
- [ ] **WebGL Context Restoration**: Implement active texture re-bind on `webglcontextrestored` in `Yard3DCanvas.tsx`.

### Phase 4: Polish & Documentation (P3 — Low)
- [ ] Update `CHANGELOG.md` with audit outcomes.
- [ ] Add audit verification checklist to `README.md`.

---

## 4. Technical Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KÜLV SYSTEM ARCHITECTURE                        │
└────────────────────────────────────────────────────────────────────────┘

  [ Client Browser (PWA) ]
     │
     ├── AppShell (Synchronous Route Dispatcher)
     │     ├── HomeScreen (Weather Overview, Tasks, Quick Sowing)
     │     ├── GardenCanvasScreen (2D R-Tree Canvas / 3D Three.js Viewport)
     │     ├── PlantsCatalogScreen (Faceted Search & Heirloom Cultivars)
     │     ├── CalendarScreen (Frost Radar & GDD Calculation)
     │     ├── JournalScreen (Photo Logs & Harvest Yield Charts)
     │     └── BlogScreen (Nordic Agricultural Knowledge Base)
     │
     ├── Local State & Storage Layer
     │     ├── Zustand Stores (yardStore [Undo/Redo], cropRotationStore)
     │     ├── GardenContext (Beds, Plants, Tasks, Journal)
     │     └── IndexedDB Engine (StorageDb, Automatic Migrations)
     │
     └── Horticultural Domain Engines
           ├── EstonianFrostEngine (0cm ground vs 2m air frost calculation)
           ├── CompanionEngine (Evidence-rated companion synergies)
           ├── GddEngine (Growing Degree Days Nordic baseline)
           └── SpatialIndex (RBush 2D R-Tree collision/selection)
     │
     ▼ HTTP / HTTPS (Local Proxy)
  [ Express 5 Security Server (server.ts) ]
     ├── Helmet (Strict CSP script-src 'self', frameguard, HSTS)
     ├── Rate Limiter (30 req/min window on /api/weather)
     ├── In-Memory LRU Cache (500 entries max, 5-min TTL)
     ├── Zod Validation (lat/lon coordinates, backup schemas)
     └── Upstream Weather Proxy (OpenWeatherMap / Open-Meteo)
```

---

## 5. Verification Gates

1. **Compilation**: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
2. **Build**: `npm run build` succeeds with PWA precache manifest generation.
3. **Unit Tests**: All Vitest test suites pass (`npm test`).
4. **Coverage Target**: Statement coverage increases from 72.3% to $\ge 80\%$.
5. **Security Audit**: `npm audit` executes cleanly against canonical lockfile.
