# Implementation Plan: Cadastral Boundary Snapping, Freeform Placement & Printable Garden Binder

This plan details the implementation of cadastral boundary snapping with freeform placement flexibility, together with a printable high-resolution garden binder featuring companion planting charts and bed inventories.

---

## 1. User Directives & Architecture Alignment

- **Cadastral Boundary Snapping**:
  - Implement magnetic snapping of garden beds and structures to the imported cadastral boundary segments (property perimeter/fence lines) within an intuitive snap distance threshold (0.5m – 1.0m).
  - Provide visual boundary snap indicators (highlighted boundary edge and snap guideline).
- **Freeform Placement**:
  - Maintain complete freedom of placement across the canvas grid without rigid boundary locking (as explicitly requested: *Allow free placement anywhere on the canvas grid*).
  - When an entity crosses or sits outside the boundary, display an unobtrusive, gentle outline hint without blocking placement or dragging.
- **Printable High-Resolution Garden Binder**:
  - Add a dedicated multi-page printable Garden Binder modal (`GardenBinderPrintDialog.tsx`) accessible from both the Garden Canvas toolbar and the Home/Calendar screen.
  - Multi-section binder designed with Nordic archival editorial aesthetic:
    1. **Kaanepilt & Krundi pass (Cover & Cadastral Dossier)**: Cadastral code, address, parcel area ($m^2$ and ha), orientation compass, and garden summary.
    2. **Peenarde detailpass (Bed-by-Bed Dossier)**: Microclimate, soil type, dimensions, current succession slots, and calculated sun exposure.
    3. **Seltsilistaimede maatriks (Companion Planting Matrix)**: Clear tabular matrix of beneficial and antagonist pairings, family disease prevention advice, and spacing guides.
    4. **Aasta külvi- ja koristuskalender (Sowing & Harvest Chronology)**: Grouped month-by-month planting and harvest schedule.
  - Optimized for print and PDF export with clean `@media print` rules, page breaks (`break-after: page`), high-contrast ink, and no UI clutter.

---

## 2. Proposed Changes & Technical Architecture

### A. Cadastral Boundary Snapping Engine (`src/logic/cadastralSnapping.ts`)
- Build a robust 2D geometry helper for distance-to-polygon-edges:
  - `findNearestBoundarySegment(point: Point2D, polygon: Point2D[], thresholdM: number)`: Calculates the closest projection onto any segment of the polygon.
  - Returns `snappedPoint`, `segmentIndex`, `distanceM`, and `edgeAngleDeg` (enabling optional alignment parallel to the fence/property line).
- Unit tests in `src/logic/cadastralSnapping.test.ts` covering perpendicular projection, corner vertices, and edge snapping.

### B. Master Plan Canvas Integration (`src/components/garden/YardMasterPlanCanvas.tsx`)
- In `handlePointerMove`:
  - When dragging an entity and `plan.boundaryPolygon` is present, check `findNearestBoundarySegment`.
  - If within threshold, snap the dragged entity to the boundary guideline and render a subtle snapped guideline on the canvas SVG.
- Allow seamless free movement anywhere across the grid; snapping can be bypassed naturally or toggled.
- Add "Prindi aiamapp (Binder)" button to the canvas toolbar alongside the existing export options.

### C. Printable High-Resolution Garden Binder (`src/components/dialogs/GardenBinderPrintDialog.tsx`)
- Editorial layout following the *Nordic Botanical Archive* aesthetic:
  - High-contrast serif display typography (`Fraunces` / `Lora`), restrained warm paper tones, and zero static pill clutter.
  - Print button executing `window.print()` with styled print stylesheets (`@media print` hiding modal overlay, backdrop, and browser navigation).
  - Page-by-page organization with automatic CSS page breaks:
    - Page 1: Garden parcel overview & high-resolution SVG boundary plan.
    - Page 2: Bed inventory and microclimate/soil details.
    - Page 3: Companion planting compatibility table and crop family warnings.
    - Page 4: Sowing and harvest calendar timeline.

### D. Navigation & Triggers
- Connect binder modal trigger in:
  - `src/components/garden/YardMasterPlanCanvas.tsx` (Toolbar action: "Aiamapp")
  - `src/screens/CalendarScreen.tsx` / `src/screens/HomeScreen.tsx` (Export/Print section)

---

## 3. Verification & Acceptance Criteria

1. **Cadastral Boundary Snapping**:
   - Beds smoothly snap to property boundary edges when dragged within 0.8m of a fence/boundary segment.
   - Placement remains completely unrestricted across the full grid without hard boundary locking.
2. **Garden Binder Printability**:
   - Clicking "Aiamapp" opens the preview modal with rich botanical data, companion matrix, and parcel map.
   - `@media print` generates a clean 3–4 page document without header/footer artifacts, modal overlays, or distorted SVG graphics.
3. **Automated Testing & Compilation**:
   - All 138+ vitest tests pass.
   - Clean compilation via `compile_applet` and 0 lint warnings via `lint_applet`.
