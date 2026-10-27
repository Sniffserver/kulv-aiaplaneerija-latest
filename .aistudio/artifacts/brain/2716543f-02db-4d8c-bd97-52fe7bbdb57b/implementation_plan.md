# 2D Nordic Botanical Yard Planner & Field-Notebook Redesign

Transform KÜLV from a split 2D/3D prototype into a singular, high-performance, accessible 2D garden planning system and warm botanical field notebook. Prioritize everyday cultivation workflows—bed layouts, sowing schedules, frost risk, watering advice, and soil notes—with zero visual clutter.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions were confirmed during Phase 1 interactive alignment and govern the redesign:

- **Garden Overview on Home Screen**: Interactive mini 2D map with quick zoom directly into the planner canvas, displaying real bed footprints and plant family icons.
- **Planner Bed Inspector**: Desktop slide-out inspector drawer that docks to the right on bed selection, and a responsive bottom drawer on mobile devices.
- **Botanical Illustrations**: Handcrafted botanical line notebook illustrations integrated into zero states for the Yard Plan, Plant Catalog, Sowing Calendar, and Garden Journal.
- **3D Sunset & Removal**: Safe deprecation and removal of `src/components/garden3d/*` and Three.js runtime overhead, streamlining bundle size and eliminating WebGL context crashes on low-power devices.

---

## 1. Overview & Core Concept

### What It Does
KÜLV is an offline-capable, Nordic garden planning PWA for vegetable beds, heirlooms, succession planning, weather tracking, and garden journaling. This release consolidates all spatial layout into a fast, vector-based 2D master yard planner and redesigns the home dashboard into a serene field notebook.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KÜLV Field Notebook                             │
│  Tere tulemast aeda! · Tallinn (59.4°N) · 27. oktoober 2026            │
├───────────────────────────────────┬────────────────────────────────────┤
│ 🌿 Tänane fookus                  │ 🌦️ Ilmateade & Öökülmarisk         │
│ • Kasta tomatitaimed (14:00)      │ • 8°C · Kerge vihm (45%)           │
│ • Külva taliküüslauk              │ • Esimene sügiskülm: 12 päeva      │
│ [ Ava ülesanded ]                 │                                    │
├───────────────────────────────────┼────────────────────────────────────┤
│ 📐 Aiaplaani ülevaade             │ 📅 Külvikalendri eelvaade          │
│ • 4 peenart · 18 taime            │ • Nov 02: Taliküüslauk (mahapanek) │
│ ┌───────────────────────────────┐ │ • Veebr 15: Tšillipipar (külv toas)│
│ │ [ Mini 2D Vector Yard Map ]   │ │                                    │
│ └───────────────────────────────┘ │                                    │
│ [ Ava 2D krundiplaan ]            │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│ ⚡ Kiirtegevused: [+ Lisa peenar] [+ Lisa taim] [+ Lisa töö] [+ Päevik] │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Value
- **Focus over novelty**: Gardeners need legible measurements, spacing guides, and planting schedules—not resource-intensive 3D meshes.
- **Instant load & battery efficiency**: Eliminating WebGL drops bundle weight and eliminates GPU drain outdoors in bright sunlight.
- **Nordic botanical notebook aesthetic**: Warm cream paper (`#F7F1E8`), forest green (`#4F6B45`), soft sage (`#A9B89A`), and terracotta accents (`#E08A3C`).

---

## 2. User Experience & Visual Design

### Design System & Component Library (`src/components/ui/`)
A unified, tokenized component library replacing ad-hoc inline styling:

- **AppShell**: Responsive layout with header wordmark, top-level navigation, and bottom touch bar on mobile.
- **PageHeader**: Semantic hierarchy with title, language-aware subtitle, and primary actions.
- **Card**: Papercraft surfaces (`#FFFDF8` surface, 1px `#C9BFA9` border, `12–16px` radius, subtle paper shadow).
- **EmptyState**: Integration of uploaded botanical illustrations (`/public/assets/aistudio/...`) with descriptive text and high-contrast action buttons.
- **PrimaryButton / SecondaryButton / IconButton**: Minimum `44px` touch target, clear active states, visible focus ring (`--kulv-focus`).
- **Badge**: Unboxed metadata typography paired with semantic status icons.
- **Dialog & Sheet**: Accessible modal overlays and slide-up mobile drawers with trapped focus and ARIA labels.
- **BedInspector**: Slide-out drawer displaying bed dimensions, soil volume, plant inventory, companion analysis, and rotation history.

### Color Tokens & Palette Discipline
- Canvas Background: `#F7F1E8` (Warm Cream Paper)
- Surface Cards: `#FFFDF8` (Card Surface)
- Muted Surface: `#EFE6D4` (Toolbar and inactive tabs)
- Primary Brand: `#4F6B45` (Pine / Forest Green)
- Soft Sage: `#A9B89A` (Secondary accents, borders, and botanical foliage)
- Terracotta: `#E08A3C` (Critical alerts, frost warnings, and focus badges)
- Text Primary: `#2A2E24` (Deep peat brown, WCAG AAA contrast $\ge 7:1$)
- Text Muted: `#5F675A` (WCAG AA contrast $\ge 4.5:1$)

---

## 3. Phased Implementation Roadmap

### Phase 1: 3D Deprecation & Safe Removal
1. **Remove `garden3d` Module**:
   - Delete `src/components/garden3d/` (`Yard3DCanvas.tsx`, `Yard3DViewWrapper.tsx`, `Entity3DMesh.tsx`, `ControlOverlay.tsx`, `ThreeErrorBoundary.tsx`).
   - Remove unused Three.js helpers (`src/lib/three/webglCheck.ts`, `src/lib/three/threeFallback.test.ts`).
2. **Neutral Geometry Types**:
   - Verify all coordinate logic in `src/lib/three/coords.ts` and migrate any required 2D projection or export utilities into `src/lib/garden/coords.ts`.
3. **Store & State Cleansing**:
   - Update `src/stores/yardStore.ts`: deprecate `viewMode: '2d' | '3d'`, setting fixed 2D mode.
   - Update `src/screens/GardenCanvasScreen.tsx`: remove `planner_mode_3d_btn` and R3F canvas wrapper, keeping only clean 2D modes (Yard Layout, Crop Rotation, Bed Grid).
4. **Test Suite Adaptation**:
   - Update `src/stores/yardStore.test.ts` to remove 3D assertions.
   - Add regression spec `src/screens/__tests__/GardenCanvasScreen2D.test.tsx` verifying clean 2D rendering without Three.js error boundaries.

### Phase 2: Redesigned Home Field-Notebook Dashboard
1. **Header & Context**:
   - Dynamic greeting with Estonian/English date formatting and location context.
2. **Today's Focus & Watering Action**:
   - Direct calculation of due tasks, rain forecast, and one-click quick-watering action with accessible feedback toast.
3. **Garden Overview with Interactive 2D Minimap**:
   - Render vector bed outlines directly in the overview card with quick-zoom navigation to the 2D planner.
4. **Weather & Frost Risk Widget**:
   - Nordic cold-frame temperature ranges, Estonian frost risk status, and custom weather SVG icons (`Sunny`, `Rain`, `Frost`, `Wind`).
5. **Quick-Actions Toolstrip**:
   - Primary single-click affordances: Add Bed, Add Plant, Add Task, Add Journal Note, Print Dossier.
6. **Botanical Empty States**:
   - Replace placeholder SVGs with uploaded artwork:
     - `t_hi-aiaplaan_255327f6.jpeg` (Empty Yard Plan)
     - `minimalist-empty-state-illustration-for-the_plant-catalog-screen_fc45c689.jpeg` (Empty Seed Tray / Plant Catalog)
     - `minimalistlik-empty-state-illustratioon-kalender_d9b9513f.jpeg` (Empty Calendar)
     - `empty-state-p_evik_600dc83a.jpeg` (Empty Journal)

### Phase 3: Enhanced 2D Yard Planner
1. **Visual Distinction of Entity Categories**:
   - Clean vector rendering: Raised beds (wooden grain border `#79634F`), greenhouse (`#A9B89A` translucent), paths (`#E5DAC6` pavers), water barrels (`#5E8296`), and trees/shrubs (botanical rings).
2. **Predictable Transformations & Controls**:
   - High-contrast drag handles and rotation knobs (`min-h-[44px]`).
   - Grid snapping (0.25m / 0.5m) and magnetic alignment guidelines.
3. **Desktop Slide-Out Inspector Drawer & Mobile Bottom Sheet**:
   - Selecting a bed slides out the `BedInspector` panel displaying:
     - Bed identifier, dimensions ($W \times L \times H$), soil volume ($m^3$ and liters).
     - Currently planted crops with botanical symbols and companion harmony badges.
     - Quick actions: Open cell grid, calculate soil recipe, delete/archive bed.
4. **Undo / Redo & View Modes**:
   - Clear UI controls for `useYardTemporal()` undo/redo.
   - View mode toggle: Edit layout mode vs. Solar simulation / Companion overlay mode.
5. **Performance Guardrails**:
   - Pure SVG memoization (`React.memo`) for 200+ entities without frame drops during pan/zoom.

### Phase 4: Remaining Views Modernization
- **Plants Catalog**: Multi-attribute filter (Brassicas, Nightshades, Herbs, Legumes), Estonian heirloom variety markers, and detail drawer.
- **Calendar**: Month/week schedule with color-coded sowing, transplanting, and frost dates.
- **Journal**: Clean timeline grouped by harvest, observation, issue, and fertilization notes.
- **Weather View**: Detailed multi-day GDD (Growing Degree Days) calculation and Estonian frost engine insights.
- **Settings**: Categorized drawer for language, location coordinates, frost presets, theme palettes, and JSON backup/restore.

### Phase 5 & 6: Verification, Testing & Quality Gates
- **Unit & Integration Tests**: Update vitest suites for stores, engines, and new UI components.
- **Accessibility Verification**: Vitest-axe automated sweeps on Home, Garden 2D Canvas, Bed Inspector, and Empty States.
- **Production Build & CI**: Verify `npm run typecheck`, `npm test`, and `npm run build`.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AppShell (React 18 + TS)                        │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│   HomeScreen    │ GardenCanvasView │  PlantsCatalog  │ JournalTimeline │
│  Field Notebook │ 2D Master Plan   │ Encyclopedia    │  Field Log      │
├─────────────────┴──────────────────┴─────────────────┴─────────────────┤
│                    Garden Context & Zustand Stores                     │
│  ┌───────────────────────────────┐ ┌─────────────────────────────────┐ │
│  │ GardenContext (IndexedDB sync)│ │ useYardStore (Zustand + Zundo)  │ │
│  │ • beds, plants, tasks, logs   │ │ • 2D vector plan, entities      │ │
│  │ • local-first offline storage │ │ • undo/redo temporal history    │ │
│  └───────────────────────────────┘ └─────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                       Botanical Engines (Pure TS)                      │
│   • EstonianFrostEngine · CompanionEngine · SolarEngine · GDDEngine    │
└────────────────────────────────────────────────────────────────────────┘
```

### State Mutations & Interactive Handlers
- **Entity Selection**: Clicking any bed or entity in `YardMasterPlanCanvas` sets `selectedEntityId`, opening `BedInspector` with zero layout shift.
- **Transformation Tracking**: Moving, rotating, or resizing beds triggers Zundo temporal state records, enabling instant undo/redo via `Ctrl+Z` / `Ctrl+Y` and UI buttons.
- **Quick Water Action**: Mutates plant moisture dates in `GardenContext`, updates local IndexedDB, and issues an accessible polite notification.
