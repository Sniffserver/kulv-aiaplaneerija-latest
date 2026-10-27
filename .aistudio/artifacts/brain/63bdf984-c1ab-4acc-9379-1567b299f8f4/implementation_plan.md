# KÜLV UI/UX Design System & Experience Audit

Senior UI/UX audit and architectural implementation plan for **KÜLV** (Nordic Garden & Crop Planner). Evaluates information architecture, visual design tokens, typographic hierarchy, core horticultural planning workflows, and accessibility (WCAG 2.1 AA) under a **Nordic botanical papercraft** aesthetic.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This audit synthesizes findings from a comprehensive heuristic review across all main screens (`AppShell`, `HomeScreen`, `GardenCanvasScreen`, `PlantsCatalogScreen`, `CalendarScreen`, `JournalScreen`, and modal dialogs). It establishes an actionable implementation roadmap to elevate KÜLV into a polished, tactile, production-grade garden planning tool.

- **Confirmed Scope**: Full-app design system and core planning workflows.
- **Confirmed Deliverable**: Detailed audit findings paired with an actionable UI/UX implementation plan.
- **Confirmed Aesthetic**: Nordic botanical papercraft with warm earth tones (organic forest green `#385A40`, warm linen `#FAF6ED`, crisp paper sheet `#FFFDF8`, muted terracotta `#C76D3A`, and sage tints `#E2ECE3`).
- **Critical Architectural Gate**: Complete eradication of ad-hoc inline styling (`style={{ ... }}`) across core screens in favor of reusable `.kulv-*` design system tokens, establishing a strict 60-30-10 color balance and single-elevation surface hierarchy.

---

## 1. Executive Heuristic Evaluation & UX Scorecard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KÜLV UI/UX AUDIT SCORECARD                         │
├──────────────────────────────┬───────────────┬──────────────┬───────────────┤
│ UX Dimension                 │ Score (0-100) │ Status       │ Key Finding   │
├──────────────────────────────┼───────────────┼──────────────┼───────────────┤
│ 1. Visual Token Discipline   │ 72 / 100      │ NEEDS WORK   │ Mixed Inlines │
│ 2. Information Hierarchy     │ 76 / 100      │ MODERATE     │ Competing CTAs│
│ 3. Typographic Math & Flow   │ 82 / 100      │ SOLID        │ Tabular gaps  │
│ 4. Workflow Ergonomics       │ 85 / 100      │ STRONG       │ Canvas smooth │
│ 5. Accessibility & Inclusivity│ 88 / 100     │ VERY GOOD    │ A11y tests ok │
│ 6. Aesthetic Distinctiveness │ 89 / 100      │ STRONG       │ Nordic vibe   │
└──────────────────────────────┴───────────────┴──────────────┴───────────────┘
```

### Key Diagnostic Findings

#### 🟢 Strengths
1. **Compelling Nordic Botanical Identity**:
   - The foundation of warm cream canvas (`--kulv-bg: #faf6ed`), deep pine dark mode (`#131914`), and serif display headers (`Fraunces`) gives KÜLV an authentic, tactile notebook character rather than a sterile SaaS clone.
2. **Accessible Base Components**:
   - Recent additions (`EmptyState`, `HomeOverview`, `PlantCard`, SVG icon suites) strictly honor semantic HTML (`<button>`, `<section>`, `aria-labelledby`, `aria-describedby`, `:focus-visible`) and pass `axe-core` accessibility checks with zero violations.
3. **Rich Horticultural Capabilities**:
   - Multi-mode planning (2D cadastral yard master plan, 3D sun/shadow simulation with Three.js, bed cell grid planting, crop rotation timeline, companion engine) provides high domain value.

#### 🟡 Critical UX Friction Points & Anti-Patterns Identified

1. **Inline Style Fragmentation vs. Design System Debt**:
   - Screens like `HomeScreen.tsx`, `AppShell.tsx`, and `GardenCanvasScreen.tsx` contain hundreds of lines of ad-hoc `style={{ ... }}` objects with hardcoded hex codes (`#FFFDF8`, `#C9BFA9`, `#4F6B45`) and differing corner radii (`6px`, `8px`, `10px`, `12px`, `16px`).
   - *Impact*: Theme switching (light/dark or custom garden palettes) leaves un-themed or mismatched borders; visual rhythm is inconsistent.
2. **Cognitive Overload & Lack of Single Focal Anchor on Home**:
   - `HomeScreen.tsx` presents 7 competing full-width sections in immediate vertical succession: Feedback Toast $\to$ Welcome Title $\to$ WeatherWidget $\to$ 5-day WeatherChart $\to$ Quick Actions section $\to$ Stats Overview $\to$ Daily Tasks list.
   - *Impact*: The user is greeted by a wall of high-contrast cards with no clear primary action. The newly created `HomeOverview` component was built but never integrated as the primary dashboard anchor.
3. **"Cards Within Cards" Violation in Quick Actions**:
   - The Quick Actions container (`bg-surface-muted`, `border`) nests four individual bordered buttons with internal icon tiles. This creates nested border-box visual clutter ("box inside a box").
4. **Tabular Numerals Missing on Agricultural Measurements**:
   - Metric displays, dates (`2026-10-27`), spacing (`15 cm`), maturity days (`75p`), and coordinates lack `font-variant-numeric: tabular-nums` or `font-mono tabular-nums`, leading to subtle layout shifts.
5. **Mobile Top & Bottom Navigation Height Cap**:
   - On viewports $<768\text{px}$, the top header ($56\text{px}$) plus bottom nav bar ($64\text{px}$) plus sticky quick-filter controls consume up to 22% of vertical screen height, exceeding the recommended 15% mobile sticky budget.

---

## 2. Target Visual Identity: Nordic Botanical Papercraft

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NORDIC BOTANICAL PAPERCRAFT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  CANVAS (60%)       SURFACES (30%)      ACCENTS (10%)       TYPOGRAPHY      │
│  ────────────       ──────────────      ─────────────       ──────────      │
│  #FAF6ED (Linen)    #FFFDF8 (Paper)     #385A40 (Forest)    Fraunces 700    │
│  #131914 (Night)    #F1EBDD (Muted)     #C76D3A (Terracotta)Plus Jakarta 400│
│  Hairline: 1px      Radius: 12-16px     #E2ECE3 (Sage soft) Tabular figures │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Constitution & Anti-Slop Rules
1. **Zero-Pill Metadata**:
   - All botanical families, harvest days, variety counts, and dates must be quiet unboxed text separated by subtle typographic dots (`·`), never static pill capsules or candy tags.
2. **Single-Elevation Depth**:
   - Exactly 1 level of elevation per screen. Surfaces use crisp hairline borders (`1px solid var(--kulv-border)`) and a subtle warm paper drop-shadow (`0 1px 3px rgba(67, 52, 35, 0.05)`).
3. **No Decorative Pulse Dots or Comment Headers**:
   - Remove fake telemetry indicators and decorative green dots. Headings must use clean, natural title case.
4. **Natural Editorial Numbering**:
   - Steps, guides, and list chapters use clean editorial numbers (`01.`, `02.`), never mechanical code syntax (`// 01_`).
5. **Human Action Verbs**:
   - Buttons use everyday action verbs: `"Kasta taimi"`, `"Lisa peenar"`, `"Vali taim"`, `"Salvesta"`.

---

## 3. Core Workflow UX Redesign

### Flow A: Home Dashboard (The Gardener's Morning Overview)
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Bar: Wordmark "KÜLV" · Weather Location Badge · Quick Actions · Lang] │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  TERE TULEMAST AEDA!                                                      │
│  Põhjamaine aiaplaneerija · Tartu vald, 27. oktoober                      │
│                                                                           │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│ │ TÄNANE FOOKUS        │ │ AED                  │ │ ILM                 │ │
│ │ 3 ülesannet ootel    │ │ 4 peenart · 18 taime │ │ 12°C · Mõõdukas tuul│ │
│ │ [Kasta herned jne.]  │ │ [Ava aiaplaan →]     │ │ [Vaata prognoosi →] │ │
│ └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│                                                                           │
│ ┌──────────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ TÄNASED HOOLDUSTÖÖD                  │ │ 5 PÄEVA ILMAPROGNOOS         │ │
│ │ • [ ] Kasta tomatipeenar (Hommik)    │ │ [Puhas Recharts graafik]     │ │
│ │ • [ ] Kata salat öökülma eest        │ │ Min 2°C / Max 14°C           │ │
│ │ • [x] Porgandi rohimine (Tehtud)     │ │                              │ │
│ └──────────────────────────────────────┘ └──────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```
- **Changes**:
  - Replace the scattered 7-section stack with the unified `HomeOverview` hero anchor.
  - Pair daily tasks with weather forecast in a balanced 2-column desktop grid (`lg:grid-cols-2`).
  - Flatten Quick Actions into quiet contextual buttons in the header toolbar, eliminating nested cards.

### Flow B: Garden Canvas & Spatial Planner
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [← Krundi plaan]   Mode: [Krundi plaan | Detailvaade | Külvikord]  [Prindi]│
├─────────────────────────────────────────────────────────────┬─────────────┤
│                                                             │ DOCK:       │
│                                                             │ • Peenrad   │
│                 INTERACTIVE 2D / 3D CANVAS                  │ • Rajatised │
│                (Pan, Zoom, Rotate, Drag-Drop)               │ • Kastmissüst│
│                                                             │ • Taimed    │
│                                                             │             │
│                                                             │ [Juhend]    │
└─────────────────────────────────────────────────────────────┴─────────────┘
```
- **Changes**:
  - Unify mode toggles (`yard` / `bed` / `timeline`) into a segmented control complying with the Single-Line Control contract.
  - Empty bed states seamlessly transition to `EmptyState` with `GardenEmptyIllustration`.
  - Add contextual keyboard hints (`[Space] + Drag to Pan`, `Scroll to Zoom`) for intuitive spatial navigation.

### Flow C: Plants Catalog & Plant Detail
- **Changes**:
  - Full keyboard accessibility: every `PlantCard` is a focusable `<button>` with clear `:focus-visible` ring.
  - Unboxed metadata (`Perekonnanimi · ~75p valmimiseni · Vahe 5 cm`).
  - Seamless filter bar with search, botanical family filter, and sun/water requirements.
  - Dedicated empty state (`PlantsEmptyIllustration`) when search filters yield zero matches, with a 1-click `"Tühjenda filtrid"` button.

---

## 4. Technical Architecture & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            KÜLV COMPONENT SHELL                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AppShell (Desktop 240px Sidebar + Mobile 56px Header + 60px Bottom Bar)   │
│   │                                                                         │
│   ├── HomeScreen                                                            │
│   │    ├── HomeOverview (Tänane fookus · Aia statistika · Ilm)              │
│   │    ├── TodayTasksSection (TaskCard, checkbox interactions)              │
│   │    └── WeatherForecastSection (WeatherWidget, WeatherChart)             │
│   │                                                                         │
│   ├── GardenCanvasScreen                                                    │
│   │    ├── ModeSwitcherBar (Krundi plaan / Peenar / Külvikord)              │
│   │    ├── YardMasterPlanCanvas (2D Fabric/Canvas + R-Tree spatial index)   │
│   │    ├── Yard3DViewWrapper (Three.js WebGL spatial lighting)              │
│   │    └── EmptyState (GardenEmptyIllustration fallback)                    │
│   │                                                                         │
│   ├── PlantsCatalogScreen                                                   │
│   │    ├── FilterBar (Search, family select, sun/water segmented buttons)   │
│   │    ├── PlantGrid (Accessible PlantCard with PlantIcon SVG/Emoji)        │
│   │    └── EmptyState (PlantsEmptyIllustration + Clear Filters CTA)         │
│   │                                                                         │
│   └── Dialogs & Modals (Sheet elevations with accessible focus traps)       │
│        ├── PlantDetailDialog                                                │
│        ├── AddBedDialog                                                     │
│        ├── AddTaskDialog                                                    │
│        └── GardenBinderPrintDialog                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Shell & Home Dashboard Modernization
- **Task 1.1**: Integrate `HomeOverview` into `HomeScreen.tsx` as the primary hero focal point.
- **Task 1.2**: Remove "cards within cards" in `HomeScreen` Quick Actions, converting actions into an uncluttered toolstrip.
- **Task 1.3**: Clean up desktop sidebar in `AppShell.tsx`: replace inline style objects with `.kulv-nav-item`, `.kulv-sidebar`, and consistent typography.
- **Task 1.4**: Enforce `tabular-nums` on all home stats, temperature values, and date strings.

### Phase 2: Garden Canvas & Spatial Planner Ergonomics
- **Task 2.1**: Restyle planner mode switchers (`yard` / `timeline` / `bed`) into an accessible segmented control with tactile active states.
- **Task 2.2**: Refactor empty state in `GardenCanvasScreen.tsx` to use the unified `EmptyState` component.
- **Task 2.3**: Clean up the Yard Object Dock with `.kulv-icon-tile` badges and cohesive paper elevation borders.

### Phase 3: Plant Catalog & Modal Dialog Unification
- **Task 3.1**: Verify `PlantsCatalogScreen` uses accessible `<button>` plant cards with unboxed metadata strings.
- **Task 3.2**: Add empty state handling with a clean `"Tühjenda filtrid"` button when search queries return zero results.
- **Task 3.3**: Standardize modal dialogs (`AddBedDialog`, `PlantDetailDialog`) with consistent papercraft sheet elevations, clear close buttons, and focus traps.

### Phase 4: CSS Token Consolidation & Automated Verification
- **Task 4.1**: Expand `src/index.css` to cover all unified layout classes (`.kulv-toolstrip`, `.kulv-segmented-control`, `.kulv-dialog-sheet`), eliminating remaining ad-hoc hex codes.
- **Task 4.2**: Verify full test suite (`npm test`), TypeScript verification (`tsc --noEmit`), and production build (`npm run build`).

---

## 6. Verification & Acceptance Criteria

1. **Accessibility**: All interactive elements navigable via keyboard (<kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>) with visible focus rings (`3px solid var(--kulv-focus)`). Zero `axe-core` accessibility violations.
2. **Design Token Integrity**: Zero un-themed raw hex codes (`#FFFDF8`, `#C9BFA9`) in core component JSX; all styling delegates to CSS custom properties.
3. **Responsive Limits**: Mobile sticky elements strictly capped at $\le 15\%$ viewport height.
4. **Zero Regressions**: 100% of existing tests in `src/**/*.{test,spec}.{ts,tsx}` pass without error.
