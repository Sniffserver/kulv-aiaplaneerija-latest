# Companion Planting Intelligence & Garden Canvas Overlay

A pure, deterministic agronomy domain engine and interactive 2D/3D visual overlay for analyzing plant compatibilities, botanical synergies, and bed harmony across garden layouts.

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions below were confirmed through Phase 1 requirements clarification:

- **Confirmed Proximity Scope**: Plant pairings are evaluated within the same bed container plus neighboring beds within a 1.5-meter spatial threshold.
- **Confirmed Visual Overlay**: Floating status badges on plant markers with dynamic SVG/vector connecting relation lines when a plant or bed is selected.
- **Confirmed Bed-Level Aggregation**: Overall Bed Harmony Score (0–100%) paired with highlighted beneficial synergies and incompatible warning pairs.
- **Scientific Evidence Discipline**: Strict distinction between established horticultural science (e.g., METK, EMÜ, RHS peer-reviewed allelopathy and trap crops) and traditional folklore claims; unknown pairs remain neutral/insufficient without fabricated incompatibilities.

---

### 1. Overview & Core Concept

- **What It Does**: Enhances the garden planning workspace with agronomic intelligence that guides gardeners on optimal companion plantings. It identifies mutual pest deterrents, nutrient fixers, pollinators, and disease vector conflicts across beds and proximity zones.
- **Target Audience**: Home gardeners, urban growers, and permaculture planners wanting scientifically grounded polyculture layouts.
- **Key Value**: Prevents catastrophic crop failures (e.g., blight transfer between Solanaceae) and maximizes natural pest control (e.g., Tagetes nematode suppression, Allium masking carrot flies) without guessing or unverified folklore.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Garden Master Workspace                         │
│                                                                        │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │     Tool Bar Mode      │  │        Canvas View (2D / 3D)         │  │
│  │ [🌿 Companion Overlay] │  │  ┌──────────────┐    ┌─────────────┐ │  │
│  │ Filters:               │  │  │ Bed A (Tomato│───▶│ Bed B (Basil│ │  │
│  │ [✓] Beneficial         │  │  │  + Marigold) │ ✦  │  & Lettuce) │ │  │
│  │ [✓] Incompatible       │  │  └──────────────┘    └─────────────┘ │  │
│  │ [✓] Uncertain          │  │         │ (relation vectors)         │  │
│  └────────────────────────┘  │         ▼                            │  │
│                              │  ┌─────────────────────────────────┐ │  │
│                              │  │ Bed C (Potato - Warning Line!)  │ │  │
│                              │  └─────────────────────────────────┘ │  │
│                              └──────────────────────────────────────┘  │
│                                                 │                      │
│                                                 ▼                      │
│                                  ┌─────────────────────────────┐       │
│                                  │ Companion Intelligence HUD  │       │
│                                  │ Harmony: 88%                │       │
│                                  │ • Evidence: METK / EMÜ      │       │
│                                  │ • Mechanism & Family rules  │       │
│                                  └─────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. User Experience & Visual Design

#### A. Interactive Canvas Overlay Mode
- **Overlay Switch**: A dedicated `Companion Intelligence` toggle in the canvas view controls bar (`🌿 Kaaslastaimede analüüs`).
- **Zero-Disruption Principle**: When toggled off, the canvas operates in its pristine standard layout state with zero visual artifacts, overlays, or performance overhead.
- **Active Overlay State**:
  - **Bed & Plant Badges**: Subtle indicator badges render over beds and planted cells showing harmony status (Beneficial check, Warning alert, Neutral dot).
  - **Connecting Relation Lines**: When a plant or bed is selected, vector arcs connect it to related neighbors within 1.5m, colored and styled with accessible dual cues (green solid lines with leaf icons for beneficial, amber/red dashed lines with warning icons for antagonistic).
  - **Accessible Design**: Never conveys status through color alone; always pairs high-contrast iconography (`Leaf`, `AlertTriangle`, `HelpCircle`), badge letters (`+`, `!`, `?`), and screen-reader labels.
  - **Filter Control Bar**: Segmented filter allowing growers to isolate `Beneficial (+)` synergies, `Incompatible (!)` warnings, or `Uncertain (?)` relationships.

#### B. Contextual Companion Inspection Panel
- Floating responsive card docked non-intrusively in the viewport:
  - **Bed Harmony Score**: Tabular figure percentage (e.g. `92%`), with count of positive vs warning pairings.
  - **Pair Breakdown**: Detailed cards showing canonical species, botanical family (e.g. *Solanaceae* × *Lamiaceae*), mechanism tag (`Pest trap`, `Nitrogen fixation`, `Allelopathy`, `Root strata complementarity`), evidence level (`Established Science` vs `Traditional Practice`), and citation source (METK, EMÜ, RHS).
  - **Bed-Level Fallback**: If a bed has unpositioned species, it summarizes bed-level co-plantings honestly without fabricating fake sub-cell coordinates.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic Engine with Botanical Family Fallback**
  - *Chosen Approach*: Rule hierarchy that tests: (1) Exact canonical species pair match -> (2) Botanical family interaction rules (e.g., *Brassicaceae* × *Alliaceae*) -> (3) Explicit Neutral/Unknown default with `insufficient` confidence.
  - *Why*: Eliminates arbitrary hallucinated conflicts while providing robust recommendations even for rare cultivars.
  - *Alternatives Considered*: Fuzzy AI or heuristic scoring, rejected for lack of determinism and scientific auditability.

- **Decision 2: 1.5-Meter Cross-Bed Neighborhood Analysis**
  - *Chosen Approach*: Spatial index query finding all entities within Euclidean bounding radius of 1.5m to capture cross-bed interactions (e.g. marigolds in a border affecting adjacent greenhouse tomatoes).
  - *Why*: Pests and pollinators do not respect physical wooden bed walls; airborne volatiles and flying insects bridge 1–2 meter distances.

- **Decision 3: Dual 2D SVG Layer and 3D HUD Sync**
  - *Chosen Approach*: In 2D, SVG spline connectors with marker arrows and badges render directly on the zoom/pan transform matrix. In 3D, a synchronized HUD and billboard badges float over bed bounding coordinates.
  - *Why*: Gives full interactive depth in both planning modes without WebGL shader complications.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      src/logic/companionEngine.ts                      │
│                                                                        │
│  ┌──────────────────────────┐    ┌───────────────────────────────────┐ │
│  │ Plant & Alias Normalizer │───▶│   Pairwise Evaluation Engine      │ │
│  │ (EE / EN / Latin / ID)   │    │  • Exact Species Matrix           │ │
│  └──────────────────────────┘    │  • Botanical Family Rules         │ │
│                                  │  • Evidence Tier & Citation       │ │
│                                  └───────────────────────────────────┘ │
│                                                    │                   │
│                                                    ▼                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Evaluation Output Contract:                                       │ │
│  │ - classification: 'beneficial' | 'incompatible' | 'neutral' |     │ │
│  │                   'unknown'                                       │ │
│  │ - confidence: 'established' | 'traditional' | 'insufficient'      │ │
│  │ - mechanism: 'pest_control' | 'nutrient_sharing' | 'allelopathy'  │ │
│  │ - source: 'METK' | 'EMÜ' | 'RHS' | 'USDA'                         │ │
│  │ - bedHarmonyScore: { percentage, positiveCount, warningCount }    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Interactive Canvas Overlay Layer                    │
│                                                                        │
│  src/components/garden/CompanionOverlay.tsx (2D SVG Overlay)           │
│  src/components/garden/CompanionInspectPanel.tsx (Floating HUD)        │
│  src/components/garden3d/Yard3DCanvas.tsx (3D Marker Indicators)       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Planned Implementation Steps:
1. **Engine Core (`src/logic/companionEngine.ts`)**:
   - Expand database of verified botanical interactions with canonical IDs, botanical families, alias normalization (Estonian, English, botanical names), mechanism classification, evidence confidence tiers, and citations.
   - Implement spatial proximity pairing logic (same bed + cross-bed $\le 1.5\text{m}$).
   - Add bed-level aggregation calculating Bed Harmony Score with positive and warning counts.
   - Comprehensive unit test suite in `src/logic/companionEngine.test.ts`.

2. **2D Canvas Overlay (`src/components/garden/CompanionOverlay.tsx`)**:
   - Interactive SVG layer rendered above beds in `YardMasterPlanCanvas.tsx`.
   - Floating status badges for plants/beds.
   - Dynamic relation connecting curves when an entity is selected.
   - Accessible legend and type filter buttons (`Beneficial`, `Incompatible`, `All`).

3. **Contextual Inspection HUD (`src/components/garden/CompanionInspectPanel.tsx`)**:
   - Detailed side card showing selected bed harmony score, neighboring pairings, mechanism explanations, and scientific sources.

4. **3D Canvas Synchronization (`src/components/garden3d/ControlOverlay.tsx`)**:
   - Sync overlay state toggle with 3D canvas so gardeners can inspect companion harmony while exploring in 3D.
