# Comprehensive Audit, Polish & Improvement Plan: KÜLV Aiaplaneerija

A production-grade audit and enhancement plan for the KÜLV Nordic garden planning platform, elevating mobile touch ergonomics, 2D/3D master plan canvas interactions, agronomic companion/rotation engines, and high-fidelity printable garden binders.

## User Review & Critical Decisions

> [!IMPORTANT]
> The implementation plan incorporates the user's explicit clarification answers:
> - **Prioritization**: Holistic audit covering canvas UX, agronomy intelligence engines, and mobile polish.
> - **Visual & Canvas Focus**: Enhanced touch gestures (pinch-to-zoom, two-finger pan), magnetic alignment guides, and responsive mobile docking controls.
> - **Operational Workflow Focus**: Production-ready Printable Garden Binder featuring scaled 2D bed layout maps, seasonal sowing schedules, and 4-year crop rotation worksheets.

- **Confirmed Decision 1**: Implement comprehensive mobile touch support (pinch-to-zoom, pan gesture arbitration, minimum 44px hitboxes) on the 2D master plan canvas.
- **Confirmed Decision 2**: Introduce dynamic magnetic alignment guides (edge and center alignment lines with distance readouts) when moving beds and structures.
- **Confirmed Decision 3**: Upgrade `GardenBinderPrintDialog` and `PrintableGardenReport` into a binder-ready, multi-page print layout optimized for physical field notes and seasonal planning.

---

## 1. Overview & Core Concept

- **What It Delivers**: Transforms KÜLV from a functional garden planner into an ergonomic, responsive, and field-ready agricultural operating system for Nordic and temperate gardeners.
- **Target Audience & Context**: Nordic home gardeners, permaculturists, and community garden managers using tablets or phones outdoors in garden beds, as well as desktop workstations during winter planning.
- **Key Value**: Delivers seamless physical-to-digital synergy: effortless master planning on touchscreen devices, deterministic botanical guidance (frost dates, crop rotations, companion pairing), and durable printable garden binders to carry directly into the greenhouse and soil.

---

## 2. Audit Findings & Critical Issues

### A. Critical Issues & Usability Roadblocks
1. **Canvas Touch Limitations on Mobile**:
   - *Problem*: `YardMasterPlanCanvas.tsx` listens primarily to mouse drag and wheel events. On phones and tablets, users cannot pinch-to-zoom or reliably pan without triggering browser viewport scrolling or accidental object drags.
   - *Impact*: Inability to comfortably edit yard layouts on mobile devices in the field.
   - *Resolution*: Implement dedicated touch gesture recognizers (handling 1-finger drag, 2-finger pan and pinch-zoom) with pointer capture and passive touch prevention on canvas surfaces.

2. **Absence of Object Alignment Guides**:
   - *Problem*: While cadastral boundary snapping exists, placing garden beds relative to neighboring beds currently relies on manual visual estimation.
   - *Impact*: Beds end up misaligned by millimeters, causing awkward pathway widths and uneven row arrangements.
   - *Resolution*: Introduce dynamic visual magnetic guidelines (smart center and edge snap lines) that render on canvas when an object's edges or centers align with nearby entities within 15cm tolerance.

3. **Printable Report Incomplete for Field Binders**:
   - *Problem*: Current printable reports lack structured page breaks, vector scale rulers, and crop rotation history worksheets necessary for 3-ring binder organization.
   - *Impact*: Gardeners cannot easily print physical copies of their master plans for rainproof clipboards.
   - *Resolution*: Create a modular, multi-section A4/Letter print engine with CSS `@media print` page breaks, high-contrast monochrome/color modes, bed inventory rosters, companion harmony summaries, and seasonal checklists.

### B. Aesthetic & Mobile Polish Deficiencies
1. **Mobile Object Dock Footprint**:
   - *Problem*: `YardObjectDock.tsx` consumes significant vertical screen real estate on mobile viewports.
   - *Resolution*: Implement a collapsible thumb-zone drawer (Pattern 3: Bottom Sheet from `references/10_mobile_touch_apps.md`) that parks into a sleek 48px bottom bar when drawing or inspecting.
2. **Touch Hitbox Violations**:
   - *Problem*: Several small canvas controls and filter buttons measure under 36px.
   - *Resolution*: Enforce a strict minimum 44x44px touch hitbox for all interactive icons and canvas handles.

---

## 3. User Experience & Visual Design

### Key User Flows
1. **Field Master Planning (Touch & Alignment)**:
   - User opens the 2D Garden Master Plan on a tablet or mobile screen.
   - Pinching zooms fluidly around the focal midpoint; dragging with two fingers pans across the yard.
   - Dragging a raised bed snaps magnetically to neighboring beds with dashed emerald guideline markers and distance tags (`1.2m`).
   - Releasing the bed saves state automatically to IndexedDB with instant undo/redo availability.

2. **Binder Generation & Field Export**:
   - User clicks "Aiaplaan printimiseks" (Garden Binder Print).
   - Dialog offers customizable sections: Master Plan Overview, Bed Inventory & Planting Schedule, 4-Year Crop Rotation Worksheet, and Companion Planting Matrix.
   - Generates a pristine print preview with clean typography (Fraunces + Plus Jakarta Sans) and zero clipped pages.

### Visual Identity & Theme
- **Color Discipline (60-30-10)**:
  - *60% Neutral Canvas*: `#FAF6ED` (Warm Linen Light) / `#171B17` (Charcoal Deep Dark).
  - *30% Structural Elements*: Earthy sage borders (`--kulv-border`), clean muted surfaces (`--kulv-surface`).
  - *10% Accent Intent*: Botanical forest green (`--kulv-primary: #385A40`) and terracotta accents (`--kulv-accent: #C76D3A`) reserved strictly for active tools and primary CTAs.
- **Zero-Pill Metadata**: Badges replaced with unboxed metadata paired with quiet typographic bullets (`·`).
- **Typography**: Display headings set in *Fraunces* serif; interface controls, schedules, and metrics set in *Plus Jakarta Sans* with tabular numerals (`tabular-nums`).

---

## 4. Key Architectural Decisions & Trade-Offs

- **Decision 1: Native Touch Gesture Engine vs. Heavy External Gesture Libraries**
  - *Chosen Approach*: Implement a lightweight, zero-dependency multi-touch handler inside `YardMasterPlanCanvas.tsx` tracking active pointer IDs for pinch-to-zoom and two-finger translation.
  - *Why*: Eliminates extra dependencies, guarantees zero bundle bloat, and prevents event listener conflicts with existing HTML5 canvas pointer events.
  - *Trade-off*: Requires explicit touch coordinate math and distance calculations, which are well-understood and thoroughly testable.

- **Decision 2: Canvas Magnetic Alignment Guides via Spatial Query**
  - *Chosen Approach*: Leverage the existing RBush spatial index (`spatialIndex.ts`) to query bounding boxes of neighboring entities during drag operations, calculating delta thresholds ($\le 0.15\text{m}$).
  - *Why*: Delivers $O(\log n)$ lookup speed even with 200+ yard entities without causing frame drops during 60fps drag operations.

- **Decision 3: Dedicated CSS Print Engine for Binders**
  - *Chosen Approach*: Pure CSS `@media print` with explicit page container divs and CSS Paged Media properties (`page-break-after: always; break-inside: avoid;`).
  - *Why*: Universal browser support, zero external PDF binary bloat, sharp vector text rendering, and direct integration with OS print/save-to-PDF dialogs.

---

## 5. Technical Architecture & Component Mapping

### System Interaction Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KÜLV Application Shell                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   HomeScreen     │       │ YardMasterPlan   │       │ GardenBinder     │
│  WeatherWidget   │       │   (2D Canvas)    │       │   Print Engine   │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         │ - Live Open-Meteo        │ - Multi-Touch Engine     │ - Page Break Layout
         │ - Frost Warning Alerts   │ - Smart Magnetic Snap    │ - Vector Plan SVG
         │ - Seasonal Advice        │ - RBush Spatial Guides   │ - Rotation Tables
         │                          │ - Collapsible Mobile Dock│ - Companion Matrix
         ▼                          ▼                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Central State & Agronomy Intelligence Core                 │
│                                                                        │
│   • GardenContext (Beds, Plants, Tasks, Settings)                      │
│   • yardStore (Master Plan Entities, Transformations, Undo/Redo)       │
│   • companionEngine & cropRotationEngine (Harmony & Succession)        │
│   • estonianFrostEngine & gddEngine (Agricultural Timing)              │
│   • storageDb (IndexedDB Local Offline Persistence)                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Module Upgrades
1. **`src/components/garden/YardMasterPlanCanvas.tsx`**:
   - Multi-touch gesture listener supporting simultaneous pinch-to-zoom and two-finger canvas panning.
   - Smart alignment engine rendering horizontal and vertical magnetic guidelines when aligning entity edges/centers.
2. **`src/components/garden/YardObjectDock.tsx`**:
   - Collapsible mobile docking drawer with thumb-zone expansion button and $\ge 44\text{px}$ touch targets.
3. **`src/components/dialogs/GardenBinderPrintDialog.tsx` & `PrintableGardenReport.tsx`**:
   - Multi-page print layout: Cover page, 2D master plan diagram, planting calendar, companion harmony matrix, and 4-year crop rotation worksheets.
   - High-contrast printer-friendly styling, custom print header/footer, and clean A4 pagination.
4. **`src/components/WeatherWidget.tsx`**:
   - Refined mobile touch hitboxes on the 7-day forecast selector strip and refresh button.

---

## 6. Execution Steps & Verification Plan

1. **Step 1: Multi-Touch & Smart Snapping Engine on 2D Canvas**
   - Add pointer event tracking for multi-touch gestures (two-finger pan, pinch zoom).
   - Implement spatial guide calculation in `cadastralSnapping.ts` / canvas drag handler.
2. **Step 2: Mobile Ergonomics & Dock Optimization**
   - Refactor `YardObjectDock.tsx` into a responsive, collapsible bottom drawer on viewports $<768\text{px}$.
   - Ensure all touch targets meet the $\ge 44\text{px}$ requirement.
3. **Step 3: Enhanced Printable Garden Binder**
   - Upgrade print templates with modular page sections, rotation history, and clean CSS print rules.
4. **Step 4: Quality & Verification**
   - Run `npm test` and `npm run test:server` to verify zero regression across agronomy engines and backend routes.
   - Run `compile_applet` and `lint_applet` to confirm clean builds.
