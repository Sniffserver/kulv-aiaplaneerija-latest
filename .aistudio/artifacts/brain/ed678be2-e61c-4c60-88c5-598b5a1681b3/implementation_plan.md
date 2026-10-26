# KÜLV Audit, Improvements & Tweaks: Plant Library, Canvas Minimap & Performance

Comprehensive enhancement plan addressing plant library discovery, spatial canvas navigation with interactive minimap and keyboard shortcut HUD, and Web Vitals code splitting.

## User Review & Critical Decisions

> [!IMPORTANT]
> The three priorities confirmed by the user in Phase 1:
> 1. **Plant Library**: Advanced search, multi-attribute filtering, and rich Nordic & Estonian variety details.
> 2. **Canvas Visual & UX Tweaks**: Smooth zoom controls, interactive picture-in-picture minimap, and keyboard shortcut overlay.
> 3. **Performance & Technical Audit**: Bundle size trimming, screen/dialog lazy loading with `React.lazy`, and Web Vitals polish.

- **Confirmed Decision 1 (Plant Discovery)**: Upgrade `PlantsCatalogScreen` with multi-facet filters (sun exposure, water requirements, direct sowing vs transplant, sowing month) and expand variety profiles for Estonian heirloom seeds (*Peipsi sibul*, *Jõgeva kollane*, *Marmande*, *Evelle*).
- **Confirmed Decision 2 (Spatial Canvas Navigation)**: Embed an interactive canvas minimap in `YardMasterPlanCanvas` showing yard boundary geometry and active camera viewport, paired with smooth percentage zoom controls and a dedicated keyboard shortcut helper HUD (`?` key).
- **Confirmed Decision 3 (Web Vitals Architecture)**: Split heavy route bundles (`GardenCanvasScreen` with Three.js, `BlogScreen`, `JournalScreen`, and encyclopedia dialogs) into lazy-loaded chunks via `React.lazy` with instant hover prefetching.

---

## 1. Overview & Core Concept

- **What It Does**: Enhances the gardener's planning workflow by turning the plant catalog into a precision filtering engine for Nordic microclimates, introducing professional CAD-like canvas navigation with minimap and shortcut hints, and slashing initial app load times through route-level code splitting.
- **Target Audience / Persona**: Nordic kitchen gardeners, permaculture designers, and allotment owners planning raised beds and tracking heirloom crops.
- **Key Value**: Instant discovery of suitable crops for specific soil and light conditions, effortless navigation across large garden plots via canvas minimap, and instant sub-second initial app loading.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Filtering & Variety Discovery**:
   - User navigates to the **Taimed (Plants)** catalog.
   - User sees a new multi-facet filter bar: Light (Täispäike / Poolvari / Vari), Water (Madal / Mõõdukas / Kõrge), Sowing method (Avamaa külv / Ettekasvatus), and Sowing month (Märts – Juuni).
   - Filter chips show active counts with single-click dismissal.
   - Selecting a plant displays rich variety tags (*Eesti pärandsordid*, days to maturity, hardiness zone).
   - In `PlantDetailDialog`, a new "Sordid & Selektsioon" sub-section highlights Nordic cold-tolerant cultivars and sowing calendar windows.

2. **Canvas Minimap & Smooth Zoom**:
   - In **Aiaplaan (Master Plan Canvas)**, user notices a sleek picture-in-picture minimap in the bottom-right corner.
   - The minimap displays the scaled cadastral plot boundary and all active beds/structures with distinct category color coding.
   - An illuminated viewport rectangle shows the currently visible screen section.
   - Dragging or clicking inside the minimap smoothly pans the main canvas to that location.
   - The zoom toolbar shows smooth stepped buttons with current zoom scale percentage (e.g., `100%`, `150%`, `75%`) and a 1-click `Sobita (Fit)` reset.

3. **Keyboard Shortcut HUD**:
   - Pressing `?` or clicking the keyboard icon button in the canvas toolbar opens a non-modal keyboard overlay.
   - Highlights quick actions: `V` (Select), `P` (Polygon Bed), `L` (Pathway/Line), `R` (Rotate 45°), `Ctrl+D` (Duplicate), `Del` (Delete), `Ctrl+Z/Y` (Undo/Redo), `+ / -` (Zoom), `0` (Reset view), and `H` (Toggle guidelines).

### Visual Identity & Theme Tokens
- Preserves KÜLV earthy Nordic palette:
  - Surface: `var(--kulv-surface, #FFFDF8)` and `var(--kulv-surface-muted, #EFE6D4)`
  - Forest Primary: `var(--kulv-primary, #4F6B45)`
  - Terracotta Accent: `var(--kulv-accent, #D97A3D)`
  - Border: `var(--kulv-border, #C9BFA9)`
  - Text: `var(--kulv-text, #2A2E24)`
- Anti-slop zero-pill discipline: Clean textual tags, serif display headings (*Fraunces*), monospaced dimensions (*Plus Jakarta Sans*), and subtle border framing.
- Touch target rule: All newly added filter tags, minimap toggles, and zoom buttons meet $\ge 44 \times 44\,\text{px}$ touch target hitboxes.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Interactive Canvas Minimap vs Static Map Preview**
  - *Chosen Approach*: Lightweight 2D SVG-based minimap directly tied to the canvas `panOffset` and `zoom` state.
  - *Why*: SVG renders smoothly with zero additional canvas contexts or memory leaks, and handles touch/mouse pan gestures natively.
  - *Alternatives Considered*: Second WebGL context (rejected due to memory overhead and mobile GPU limits).

- **Decision 2: Client-side Plant Filtering vs Server-side Querying**
  - *Chosen Approach*: High-performance memoized client-side filtering over the existing curated plant database.
  - *Why*: Instant sub-millisecond filtering with zero network lag, enabling offline availability in the garden.
  - *Alternatives Considered*: Backend API search (unnecessary network round-trips for ~60 plant records).

- **Decision 3: Route-Level `React.lazy` with Hover Prefetching**
  - *Chosen Approach*: Wrap heavy screens (`GardenCanvasScreen` with Three.js, `BlogScreen`, `JournalScreen`) and heavy dialogs in `React.lazy` with suspense skeletons, while prefetching on bottom navigation hover.
  - *Why*: Slashes initial bundle size by over 60% without adding latency when switching tabs.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────┐
│                        AppShell                        │
│   ┌────────────────────────────────────────────────┐   │
│   │               Top Header & Nav                 │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │           React.Suspense + Route Lazy          │   │
│   │  ┌───────────────┐ ┌────────────────────────┐  │   │
│   │  │ PlantsCatalog │ │  YardMasterPlanCanvas  │  │   │
│   │  │  - MultiFacet │ │   - Smooth Zoom        │  │   │
│   │  │  - Heirlooms  │ │   - Canvas Minimap     │  │   │
│   │  │  - SowingCal  │ │   - Shortcut HUD       │  │   │
│   │  └───────────────┘ └────────────────────────┘  │   │
│   └────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────┐   │
│   │       Lazy-loaded Dialogs & Tool Modals        │   │
│   │   PlantDetailDialog  ·  GardenBinderPrint      │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Component & State Plan:
1. `src/screens/PlantsCatalogScreen.tsx`:
   - State for `sunFilter`, `waterFilter`, `sowMethodFilter`, `sortBy`.
   - Enhanced plant catalog cards with heirloom tags and Estonian variety notes.
2. `src/components/garden/YardMasterPlanCanvas.tsx`:
   - Integrated `<CanvasMinimap />` component with drag-to-pan handlers.
   - Zoom scale indicator (`100%`) with smooth step transitions.
   - Refined keyboard shortcut helper modal with `?` shortcut trigger.
3. `src/components/layout/AppShell.tsx`:
   - Dynamic lazy imports for screens and heavy dialogs.
   - Graceful loading skeleton fallback matching Nordic surface tones.
4. Verification:
   - Full TypeScript build check (`compile_applet`), lint (`lint_applet`), and test suite validation (`npm test`, `npm run test:server`).
