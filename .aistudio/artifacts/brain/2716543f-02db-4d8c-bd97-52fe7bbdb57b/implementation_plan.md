# Nordic Botanical 2D Yard Planner & Vector Plant Iconography

Comprehensive design and implementation plan to elevate KÜLV with custom Nordic botanical vector plant icons, authentic warm wood and rich soil 2D bed styling, unified Nordic illustration assets across dialogs and empty states, and printable garden binder sheets.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during interactive planning and user clarification:
> - **Primary Polish Focus**: 2D garden planner interactions, bed rendering, and cell styling.
> - **Bed & Canvas Aesthetic**: Warm natural wood border frame, rich textured soil bed fill, and stylized Nordic botanical plant icon stamps.
> - **Export Capability**: Printable garden binder sheet featuring clean architectural bed layouts, planting cell coordinates, variety lists, and agronomic notes.
> - **Unified Botanical Palette**: Uniform flat cream background (`#F7F1E8`), off-white cards (`#FFFDF8`), crisp forest-green contours (`#3E5637`), leaf green (`#4F6B45`), soft muted sage (`#A9B89A`), rich soil brown (`#79634F`), and warm terracotta-orange accents (`#E08A3C`).
> - **Styling Discipline**: Flat, clean vector fills without artificial paper grains, vignettes, shiny gradients, or heavy drop shadows.

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades KÜLV's 2D garden planning experience from generic emojis and flat boxes into a cohesive Nordic botanical field notebook. Every vegetable and herb is rendered using dedicated, lightweight vector botanical icons following an authentic line-and-wash aesthetic. Beds on both the master yard canvas and the cell grid display warm timber framing and rich loam soil fills. Newly uploaded authentic botanical illustrations are integrated into empty states, task cards, soil recipes, and modals. A dedicated "Print Garden Binder Sheet" action produces crisp, printer-friendly A4 layouts for outdoor garden binders.
- **Target Audience / Persona**: Nordic gardeners, allotment growers, and homesteaders in Estonia and cold-climate zones who plan raised beds, monitor frost dates, companion plant, and take physical notes out in the dirt.
- **Key Value**: Immediate visual legibility in sunlight or on tablet/desktop, authentic hand-crafted botanical charm without performance lag, and practical offline binder printing.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **2D Yard Canvas & Bed Inspection**:
   - The user opens the 2D Yard layout. Beds are displayed with a natural timber perimeter (`#79634F` outer frame with subtle inner plank joint lines) and rich dark compost soil (`#5A4739`).
   - Circular entities (currant bushes, apple trees, rainwater barrels) and structures (greenhouse, shed) feature clean `#3E5637` vector linework and matching Nordic tones.
   - Selecting a bed slides out the `BedInspector` with dimensions, soil volume ($m^3$, liters), companion harmony, and a quick link to open the cell grid.
2. **Planting with Nordic Botanical Icons**:
   - In the Bed Detail Grid and Yard Canvas, each planted cell renders a stylized vector icon (e.g., Tomato, Cucumber, Carrot, Basil, Onion, Radish, Pea, Strawberry, Garlic, Potato, Lettuce, Cabbage, Pepper, Dill, Marigold, Blueberry, Apple Tree, Berry Bush).
   - The icons use crisp forest green outlines (`#3E5637`), gentle leaf green fills (`#4F6B45`), soft sage highlights (`#A9B89A`), and terracotta accents (`#E08A3C`).
   - Synergy badges, solar indicators, and companion cues sit quietly at the cell corners with WCAG-compliant contrast.
3. **Botanical Illustrations in Dialogs & States**:
   - Soil Recipes dialog features `/public/assets/aistudio/mulla-retseptid-illustration_726c3ec3.jpeg`.
   - Watering and tasks cards showcase `/public/assets/aistudio/kastmine-illustration_541cc1f3.jpeg` and `/public/assets/aistudio/aiandus-_lesanne-aiamaa-muld-peenrad_c342f2a6.jpeg`.
   - Greenhouse and nursery dialogs/empty states feature `/public/assets/aistudio/kasvuhoone-illustration_b1d4ea1c.jpeg`.
   - Fruit tree & berry bush presets in `YardObjectDock` feature matching illustrations.
4. **Garden Binder Sheet Generation**:
   - Clicking "Trüki raport / Print Report" or "Aiaplaani leht (Binder Sheet)" opens a dedicated print dialog with high-contrast, black-and-forest-green ink-friendly formatting.
   - Outputs a clean multi-section page: Property Map with scale, Bed-by-Bed cell planting chart with plant names and variety notes, and an Agronomist checklist.

#### Visual Identity & Design Tokens
```css
--kulv-bg-canvas: #F7F1E8;       /* Uniform flat warm cream */
--kulv-surface-card: #FFFDF8;     /* Off-white paper card */
--kulv-outline-dark: #3E5637;     /* Deep forest-green contour */
--kulv-primary-leaf: #4F6B45;     /* Leaf green brand color */
--kulv-sage-muted: #A9B89A;       /* Muted sage secondary */
--kulv-wood-timber: #79634F;      /* Timber bed frame */
--kulv-soil-loam: #5A4739;        /* Rich dark compost fill */
--kulv-accent-orange: #E08A3C;    /* Warm terracotta accent */
```

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vector SVG Icons vs. Emojis or Raster Bitmaps**
  - *Chosen Approach*: Implement a comprehensive `BotanicalPlantIcon` vector component with hand-crafted SVG definitions for all Nordic plants in the catalog (tomatoes, cucumbers, root vegetables, brassicas, legumes, alliums, herbs, berries, trees).
  - *Why*: SVGs scale perfectly from 16px minimap badges up to 96px inspector cards, accept Tailwind fill/stroke colors, look sharp on retina screens and printed sheets, and weigh under 15KB with zero network requests.
  - *Alternatives Considered*: Emoji fonts look inconsistent across Android/iOS/Windows and clash with the botanical palette; raster PNGs blur when zoomed in.
- **Decision 2: 2D Bed Visual Representation on Canvas**
  - *Chosen Approach*: Render raised beds with a 2-layer wood plank border (`#79634F` with subtle corner joints) and rich loam soil fill (`#5A4739`), with small plant vector stamps positioned inside.
  - *Why*: Immediately communicates that it is a garden bed while maintaining high contrast with the grass canvas (`#EDF2E8`) and grid guides.
- **Decision 3: Dedicated Garden Binder Sheet Print View**
  - *Chosen Approach*: Add an `@media print` optimized `GardenBinderSheet` component with high contrast, monochrome/duotone ink-conserving styling, grid coordinate matrices, and plant variety summaries.
  - *Why*: Real gardeners bring physical paper binders into the yard where mobile phones suffer from glare, wet fingers, or dirt.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KÜLV GARDEN PLANNER                             │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│   YardMasterPlanCanvas (2D)     │        │    InteractiveGardenCanvas       │
│  - Wood plank border & loam soil│        │  - Cell grid (0.5m x 0.5m cells) │
│  - Solar shadow projection      │        │  - BotanicalPlantIcon stamps     │
│  - Vector tree / bush stamps    │        │  - Companion heatmap overlays    │
│  - BedInspector slide-out       │        │  - MobileCellSheet quick actions │
└─────────────────────────────────┘        └──────────────────────────────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BotanicalPlantIcon Registry                          │
│  - Tomato, Cucumber, Carrot, Onion, Garlic, Potato, Cabbage, Pea,      │
│    Bean, Strawberry, Basil, Dill, Parsley, Marigold, Beetroot, etc.    │
│  - Consistent palette: #3E5637, #4F6B45, #A9B89A, #79634F, #E08A3C    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│    Botanical Illustrations Hub   │        │     GardenBinderPrintSheet       │
│  - Soil recipes & compost       │        │  - A4 / Letter field sheet       │
│  - Watering & seed task cards   │        │  - Crisp vector scale yard plan  │
│  - Greenhouse & nursery views   │        │  - Tabular planting bed index    │
└─────────────────────────────────┘        └──────────────────────────────────┘
```

#### Core Components & Deliverables
1. `src/components/icons/BotanicalPlantIcon.tsx`: Complete SVG component covering all plant categories (`solanaceae`, `cucurbitaceae`, `allium`, `apiaceae`, `brassicaceae`, `fabaceae`, `lamiaceae`, `asteraceae`, `rosaceae`, `berry`, `tree`) plus fallback botanicals with consistent line width (1.5px) and palette.
2. `src/components/garden/YardMasterPlanCanvas.tsx`: Update bed and entity drawing with warm timber framing, rich soil fills, and vector botanical stamps.
3. `src/components/InteractiveGardenCanvas.tsx`: Replace emoji displays with `BotanicalPlantIcon` across grid cells, inspector docks, and companion cards.
4. `src/components/dialogs/GardenBinderPrintDialog.tsx` & `src/components/garden/PrintableGardenReport.tsx`: Enhanced printable binder sheet with bed dimensions, companion score, variety details, and notes.
5. Integration of newly provided authentic Nordic illustrations into `SoilRecipesDialog`, `TaskCard`, `MobileCellSheet`, and empty states.
