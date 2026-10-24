# Implementation Plan - Sharded E2E, Dockerfile, Nginx & Visual Regression

## Objective
Establish a robust production release and testing architecture featuring:
1. 2-way parallel Playwright sharding in GitHub Actions with blob report merging.
2. Production-grade Dockerfile with multi-stage build, Nginx 1.27-alpine, SPA fallback, security headers, and health checks.
3. Visual regression testing infrastructure with on-demand snapshot generation (`e2e/visual.spec.ts`).
4. Flaky test quarantine patterns (`test.fixme()`, `@quarantine` tag support).
5. UI adjustments: ensure `data-testid="bottom_nav_bar"` exists on the mobile bottom nav for visual tests.

---

## Proposed Changes

### 1. UI Enhancements for E2E & Visual Testing
- In `src/components/layout/AppShell.tsx`:
  - Add `data-testid="bottom_nav_bar"` to the `<nav className="bottom-nav-bar">` container.

### 2. Playwright Configuration (`playwright.config.ts`)
- Add visual snapshot settings to `expect`:
  ```ts
  expect: {
    timeout: 7_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide'
    }
  }
  ```

### 3. Visual Regression & Quarantine Specs
- Create `e2e/visual.spec.ts` for on-demand baseline generation:
  - Home baseline
  - Garden screen baseline
  - Mobile bottom navigation baseline
- Create `e2e/quarantine.example.spec.ts` demonstrating the `test.fixme()` and tag-based quarantine workflow.

### 4. Docker & Nginx Deployment Configuration
- Create `Dockerfile`:
  - Stage 1: `node:22-alpine` builder running `npm ci` and `npm run build`.
  - Stage 2: `nginx:1.27-alpine` serving `/usr/share/nginx/html`.
  - Health check at `/health` returning `{"ok":true}`.
  - Non-root or minimal alpine configuration.
- Create `nginx.conf`:
  - SPA routing fallback: `try_files $uri $uri/ /index.html;`
  - Asset caching: `/assets/` cached 1y immutable.
  - Security headers: nosniff, frame-options DENY, referrer-policy, permissions-policy.
  - Gzip compression for text, css, js, json, svg.
- Create `.dockerignore` excluding `node_modules`, `dist`, `coverage`, `.git`, `.env*`, etc.

### 5. GitHub Actions Workflow (`.github/workflows/ci.yml`)
- Update `e2e` job with a 2-shard matrix:
  ```yaml
  strategy:
    fail-fast: false
    matrix:
      shardIndex: [1, 2]
      shardTotal: [2]
  ```
  - Exclude visual specs from merge-blocking CI (`--grep-invert "@visual"`) until baselines are generated.
  - Run with `--reporter=blob` and upload `blob-report-${{ matrix.shardIndex }}-${{ github.run_id }}`.
- Add `e2e-report` job:
  - Download all blob reports.
  - Merge via `npx playwright merge-reports --reporter html ./all-blob-reports`.
  - Upload unified HTML report.
- Update `release` job dependencies to wait on `quality` and `e2e-report`.

---

## Verification Plan

1. **Lint & Typecheck**:
   - `npx eslint src/`
   - `npm run typecheck`
2. **Unit Tests & Coverage**:
   - `npm test`
   - `npm run test:coverage`
3. **Audit**:
   - `npm run audit:ci`
4. **Build & Applet Compilation**:
   - `npm run build`
   - `compile_applet`
