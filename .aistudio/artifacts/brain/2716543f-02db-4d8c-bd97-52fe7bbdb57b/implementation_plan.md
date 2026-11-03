# UI/UX Deep Audit: Proportional Illustrations, Field Notes Artwork & 2026 Garden Dashboard

Elevate KÜLV into an intuitive, functional 2026 botanical field-notebook dashboard. Refine the sizing of the focused hero and card illustrations so they balance with clear action buttons, add artwork to the Field Notes card and Add Journal dialog, enhance note typography with warm notebook serif styling, and make weather diagrams and garden recommendations immediately actionable.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed with the user:
> - **Visual Sizing & Ergonomics**: Functional, intuitive 2026 UI standards — clear primary buttons, legible diagram legends, and balanced illustration sizing that never pushes key tools off-screen.
> - **Field Notes Section**: Add authentic botanical notebook artwork to both the Home Screen Field Notes header and the Add Journal Entry dialog.
> - **Typography**: Apply a warm, authentic notebook serif (`font-serif`, high-contrast heading and note body styling) for headings, field notes, and journal observations.

---

### 1. Overview & Core Concept

- **The Problem**: While the cream palette is established, the user highlighted 4 specific elements (the hero artwork and the 3 overview card vignettes) to ensure they feel purposefully sized and don't overwhelm functional buttons, graphs, and recommendations. Furthermore, the Field Notes section lacked symmetrical illustration treatment.
- **The Solution**:
  1. Fine-tune the 4 selected illustration elements so they sit comfortably beside clear, high-contrast action buttons and tabular metrics.
  2. Bring symmetrical botanical artwork to the Field Notes card header and the Add Journal Entry dialog.
  3. Style field notes in a warm botanical book serif (`font-serif leading-relaxed`), giving entries the tactile feel of handwritten physical garden records.
  4. Enhance graph and weather diagram readability with actionable frost recommendations and clear visual thresholds.

---

### 2. User Experience & Visual Design

#### A. Focused Element Refinements
- **Hero Welcome Banner (`HomeScreen.tsx` - Selector 1)**:
  - Maintain a balanced `w-24 h-24 sm:w-28 sm:h-28` vignette with responsive placement, ensuring primary CTAs ("Lisa ülesanne", "Prindi aiavihik", "Külvileht") remain prominent on mobile and desktop.
- **Home Overview Cards (`HomeOverview.tsx` - Selectors 2, 3, 4)**:
  - Refine the 3 card vignettes (`w-12 h-12` standard border frames) with crisp contrast, clear action buttons, and domain recommendations:
    - *Card 1 (Today's Focus)*: High-priority watering advice and immediate "Ava ülesanded" button.
    - *Card 2 (Garden Plan)*: Mini 2D bed diagram with clear bed/plant counts and "Ava aiaplaan" button.
    - *Card 3 (Weather & Microclimate)*: Real-time temperature, frost countdown, and actionable microclimate advisory.

#### B. Field Notes & Journal Enhancement
- **Field Notes Card Header**:
  - Add the botanical journal artwork (`/assets/aistudio/empty-state-p_evik_600dc83a.jpeg`) to the Recent Field Notes header in a matching `w-12 h-12` rounded frame, bringing complete 4-column visual symmetry to the dashboard.
- **Field Notes Body Typography**:
  - Style entry titles and content in warm notebook serif (`font-serif text-sm font-semibold text-[var(--kulv-text)]`), with category tags and timestamps formatted cleanly with middots (`·`).
- **Add Journal Dialog (`AddJournalDialog.tsx`)**:
  - Integrate botanical notebook artwork into the modal header with warm cream paper styling and clear form controls.

#### C. Weather Diagrams & Actionable Recommendations
- **Weather Chart & Widget**:
  - Enhance `WeatherChart.tsx` and `WeatherWidget.tsx` with clear frost threshold indicators ($4^\circ\text{C}$ alert line), legible legend labels, and crisp recommendation callouts for Nordic gardeners.

---

### 3. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ HomeScreen (Stock Cream #F7F1E8 · Warm Botanical Field Notebook)       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Illustrated Welcome Banner                                          │
│    └─ Sized Notebook Artwork · Primary CTAs (Add Task, Print Binder)   │
│                                                                        │
│ 2. HomeOverview (3 Symmetrical Cards)                                  │
│    ├─ Today's Focus Card (Watering Artwork · Priority Task Advice)     │
│    ├─ Garden Plan Card (Bed Artwork · Mini 2D Yard Map)                │
│    └─ Weather & Microclimate (Climate Artwork · Frost Countdown)       │
│                                                                        │
│ 3. Quick Actions Toolstrip (Water Plants, Calendar, Rotation, Recipes) │
│                                                                        │
│ 4. Two-Column Working Grid                                             │
│    ├─ Left Column: Garden Tasks List + Sowing Windows Preview          │
│    └─ Right Column: Weather Widget + Chart + Field Notes (With Artwork)│
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Implementation Steps & Verification

1. **Step 1: Focus Elements Polish (`HomeScreen.tsx` & `HomeOverview.tsx`)**:
   - Review and fine-tune CSS selectors 1-4 for clean responsiveness, proportional sizing, and button hierarchy.
2. **Step 2: Field Notes Artwork & Typography**:
   - Add botanical artwork vignette to the Recent Field Notes card in `HomeScreen.tsx`.
   - Update `AddJournalDialog.tsx` header with matching botanical illustration.
   - Apply warm notebook serif typography to journal cards.
3. **Step 3: Graph & Diagram Actionability**:
   - Ensure clear labels, tooltips, and recommendation callouts in weather components.
4. **Step 4: Automated Verification**:
   - Run `npx vitest run` across all test suites to guarantee 100% test pass rate.
   - Run axe-core accessibility check.
   - Run `compile_applet` and `lint_applet`.
