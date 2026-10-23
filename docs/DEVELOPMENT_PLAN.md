# KÜLV — Engineering & Gardening Quality Roadmap

**Goal:** make KÜLV a dependable Estonian-first garden planner that is genuinely useful as a standalone web app, remains safe for personal garden records, and adds optional Home Assistant / ESP32 integrations without making them prerequisites.

## Current mainline audit — 2026-10-10

The current audit has landed IndexedDB schema v10, complete yard-plan normalization, transactional per-cell planting history, omitted-versus-empty restore semantics, persisted crop-rotation overrides, schema-version alignment across client/server backups, and one canonical solar-exposure calculation path. CI now records performance baselines for 50, 200, 500, 1,000 and 2,000-object scenes.

The Pages deployment workflow now checks that the repository already has GitHub Pages enabled with “GitHub Actions” as its source. Initial Pages enablement is a repository configuration task: the workflow's GITHUB_TOKEN cannot create the first Pages site. Release remains blocked until a repository admin completes that one-time setting and the full CI/E2E run succeeds for the commit intended for deployment.

## Release gates

Do not merge a release while any of these are true:

- [ ] npm ci, type-check, unit tests, production build, and browser E2E tests are failing.
- [ ] Backend tests can read, overwrite, or delete a user's configured garden data.
- [ ] A fresh install reports offline-ready when the app shell or required JS/CSS chunks are missing.
- [ ] A normal garden action reports "saved" before its IndexedDB transaction has succeeded.
- [ ] A backup import or database migration can leave the garden in a partly applied state.
- [ ] Public frontend configuration contains a master API key or Home Assistant token.

## P0 — Release blockers and data safety

### 1. Reproducible builds and browser test suite
- Keep package-lock.json in sync with package.json; require npm ci in CI.
- Run TypeScript checks, unit tests with coverage, production build, and Playwright against vite preview.
- Keep tests deterministic: target elements by role/test ID, wait for actual application/SW state, avoid fixed sleeps, and capture traces on failure.
- Test deployed base path /kulv-aiaplaneerija/ as well as the root preview path.
- Use CI artifacts for Playwright traces and coverage; never commit generated results.

**Acceptance:** clean checkout passes the same CI commands without manual setup; tests pass repeatedly on mobile 320/360/375/390/412 and desktop 1280/1440 viewports.

### 2. Storage isolation, migration safety, and recovery
- Keep every backend test on temporary SQLite + JSON paths and use TestClient as a context manager so startup/shutdown lifecycle code actually runs.
- Make initialization failure fatal; never serve requests with a partial database schema.
- Convert hand-written SQLite migrations to numbered, transactional migrations with a schema-version table. Make migration recovery safe if the process stops halfway.
- Add backup/restore tests against representative legacy files and old database schemas.
- Make clear/reset/import/undo operations transactional, with a confirmation summary and a recoverable backup where records are replaced.

**Acceptance:** tests prove that pre-existing user data remains byte-for-byte unchanged; simulated migration failure rolls back or leaves an explicitly recoverable state.

### 3. Persistence truthfulness and race-free autosave
- Replace the single global save-status flag with a per-store/per-resource save ledger; aggregate status must only say "saved" when all pending writes have committed.
- Serialize async IndexedDB writes (garden, tasks, journal, settings) or use transaction/version semantics that prevent stale writes from overtaking newer edits.
- Debounce non-critical edits, but flush on visibility change/page hide where possible. Do not promise beforeunload has awaited an asynchronous IndexedDB write.
- Show a clear, persistent "not saved"/retry state if storage is full, blocked, or unavailable; never suppress failures.
- Use crypto.randomUUID() with a tested fallback instead of millisecond-only IDs for rapidly created records.

**Acceptance:** stress tests create/edit/delete/undo rapidly and reopen the app; the latest state is the one persisted, and UI status matches database outcomes.

## P1 — Product correctness for gardeners

### 4. Astronomy, timezone, and microclimate
- Keep SunCalc v2 degrees and north-based azimuth explicit; add regression tests for low sun angles and shadow direction.
- Anchor sunrise/sunset queries to the selected local calendar date rather than a timestamp near midnight that can belong to the prior solar day.
- Use the configured location timezone consistently when formatting dawn/sunset, journal timestamps, frost dates, and calendar exports.
- Handle alwaysUp / alwaysDown explicitly. Never substitute an arbitrary six hours of sunlight when SunCalc has no sunrise/sunset.
- Validate shadows against known scenarios: equinox, midsummer, autumn, high-latitude low sun, tree canopy, buildings, and rotated beds.
- Clearly label geometric shadow results as estimates. Avoid presenting canopy softness or 15-minute sampling as field-grade measurements.

**Acceptance:** astronomical tests include UTC fixtures and Europe/Tallinn local-calendar cases; no daylight or shade estimate is silently fabricated.

### 5. Horticultural data quality and explainable advice
- Give plant records provenance: source, review date, geographic suitability, and uncertainty where recommendations vary by cultivar or soil.
- Separate general planting guidance from location-adjusted predictions. Make frost dates explicitly "starting estimates"; support local station/history input later.
- Crop rotation should use botanical family IDs and planting year, warn about missing history, and allow gardeners to override a warning with a note.
- Companion planting advice should be evidence-weighted; do not imply every good/bad neighbor relationship is equally proven.
- Replace universal soil-moisture percentages with per-sensor calibration (dry/field-capacity/wet points), substrate context, and adjustable crop thresholds.
- Ensure VPD and greenhouse alerts explain the units, formula inputs, crop/stage assumptions, and what is actually measured versus estimated.
- Add Estonian seasonal tests for sowing/planting windows, frost boundaries, leap years, and year rollover.

**Acceptance:** every actionable gardening warning explains its evidence, assumptions, freshness, and safe next step; unknown calibration is shown as unknown rather than false precision.

### 6. Standalone-first and data portability
- The public web build must be usable without a backend, Home Assistant, account, secret, or local server. Integrations are opt-in enhancements.
- Clearly explain that IndexedDB records belong to that browser/profile/device; offline does not mean cross-device sync.
- Make backup export and import robust: schema versioning, pre-import backup, full transaction, import preview/counts, and clear failure rollback.
- Add a visible "last backup" reminder without nagging users; offer portable JSON export and document browser-storage limitations.
- Never put a server master key or HA token in VITE_* build variables or a public client bundle. Store only least-privilege device credentials client-side, and warn that browser storage is not a secure secret vault.

**Acceptance:** a fresh private browser can use the planner with no server configured; after disabling network it can navigate, edit, reload, and retain its data once the first load and required assets have been cached.

## P2 — UX, accessibility, and performance

### 7. Mobile ergonomics, Warning UX, and accessibility
- Keep the bottom navigation above all scrolling content and test real click interception at small viewport widths.
- Verify focus enters modals, remains trapped, returns to a persistent trigger, and does not become lost when a dropdown unmounts.
- Add meaningful accessible names to geometry handles (rotation, resize corners, boundary vertices), keyboard movement alternatives for canvas objects (Arrow keys, bracket cycling `[` and `]`), reduced-motion behavior, and accessible live announcements (`aria-live="polite"`).
- Implement mandatory Warning UX contract: concise title, severity badge, explanation of evaluated condition, affected object, measurements and rule provenance, actionable next step, and route to acknowledge/override where permitted (never color alone).
- Test WCAG issues with axe, plus manual keyboard, zoom/reflow, and contrast checks. Do not silently exclude color contrast from all release gates.
- Preserve the calm/low-distraction mode and reduce unnecessary animations, repeated toasts, and non-actionable badges.

### 8. Performance and offline behavior
- Measure JS chunk size, cold start, layout shift, IndexedDB query/write latency, and render time with realistic large gardens.
- Verify lazy-loaded modules and all referenced assets are included in the production precache manifest.
- Give navigations a bounded network timeout; fall back to cached shell promptly on poor networks.
- Version caches deliberately, retain the previous working worker if new assets fail validation, and provide a simple recovery/reset-cache help path.
- Add cache policy tests for only owned KÜLV caches; never clear unrelated origin caches.
- Avoid loading a live server-health probe in ways that delay or reset core offline navigation.

**Acceptance:** Lighthouse/Web Vitals and a realistic 500–2,000 item garden test are captured as baselines before performance optimizations are accepted.

## P3 — Optional integrations and operational maturity

### 9. Backend and telemetry
- Keep backend optional and local-first. Document LAN/Tailscale reverse-proxy boundaries clearly.
- Use separate admin and device tokens in production; warn when the device token is inheriting the admin key.
- Validate telemetry timestamps/units consistently; document sensor calibration and payload limits.
- Include targetId, unit, aggregate period, sample count, min/max/average consistently in telemetry contracts and generated types.
- Return appropriate HTTP error statuses for database failures instead of 200 with success:false; log details server-side without leaking secrets.
- Use bounded database connection lifetimes, explicit transaction boundaries, structured logs, and retention metrics.
- Add integration tests for duplicate/idempotent ingestion, concurrent sync conflict, hourly rollups, migration upgrade, retention, and shutdown during maintenance.

### 10. Delivery and documentation
- Use a pull request with CI checks required before merging; deploy Pages only after the release-gate build and test pipeline succeeds.
- Pin GitHub Actions to current maintained major versions, and review permissions so only deployment has Pages-write and id-token permissions.
- Document local web-only setup separately from optional Docker/Home Assistant setup.
- Maintain a short user-facing changelog and migration notes; keep secrets, compiled Python files, Playwright output, coverage, and dist/ out of Git.
- Track bugs by impact: data loss/security first, garden advice and astronomy correctness second, interaction polish third.

## Implemented Optimization & Horticultural Milestones — October 2026

- [x] **IndexedDB Persistence & Migration (`src/logic/storageDb.ts`)**: Migrates and synchronizes garden beds, plants, tasks, and journal records into IndexedDB with automatic `localStorage` migration, preventing 5MB quota errors.
- [x] **15-Minute Weather Rate Protection (`src/logic/weatherService.ts`)**: Added 15-minute multi-tier cache (in-memory + sessionStorage) for Open-Meteo forecasts with stale fallback on network interruption.
- [x] **Bundle Optimization & Code Splitting**: Converted `PlantGrowthProgressChart` and `WeatherChart` to `React.lazy()` with `Suspense`, isolating `vendor-recharts` and reducing the main initial bundle from ~1MB to 315 kB.
- [x] **Shadow Polygon Memoization (`src/logic/solarEngine.ts`)**: Cached shadow vectors to eliminate redundant trigonometry during canvas panning, zooming, and frame ticks.
- [x] **Efektiivsete temperatuuride summa (GDD - Growing Degree Days) (`src/logic/gddEngine.ts`)**: Implemented thermal day sum calculation (base 5°C and 10°C) calibrated for Estonian cultivars and embedded in `CalendarScreen` and `PlantDetailDialog`.
- [x] **Automated Night Frost Action Task**: Context engine automatically adds "Sulge kasvuhoone uksed ja luugid!" to the user's task list whenever upcoming night temperatures dip to $\le 2^\circ\text{C}$.

## Suggested sequence

1. Stabilize release CI: lockfile + E2E failures + deterministic PWA registration/navigation.
2. Land data-safety fixes: isolated backend tests, lifecycle-only DB init, fail-fast initialization, transactional clear/reset/import.
3. Fix garden date/solar correctness: local dates, SunCalc units, local-noon date anchor, polar-day/night behavior, timezone-aware formatting.
4. Make autosave truthful: resource-level status and serialized persistence; add rapid-edit/reload recovery tests.
5. Gardening quality pass: calibration-aware sensor alerts, advice provenance, rotation/companion confidence, frost assumptions.
6. Validate the standalone product: fresh-browser setup, offline edit/reload, backup export/import, mobile/keyboard/a11y, and real-device smoke tests.
7. Harden optional backend: error contracts, aggregate metadata, credential scopes, migration/version strategy, observability.
8. Release: draft PR → all checks green → review diff and migration behavior → merge → verify deployed Pages path and one real mobile installation.
