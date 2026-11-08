# Image Sizing & Compact Editorial Card Header Refinement

A targeted refinement plan to resize the four selected images across the Home page hero banner and the three `HomeOverview` cards, making them more compact to optimize vertical viewport space while containing the botanical illustrations with soft padding so the complete artwork is displayed without cropping.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters have been confirmed by the user and will govern the resizing implementation:

- **Confirmed Decision 1: Compact Sizing**: Reduce image container heights and footprints to reclaim vertical viewport space, ensuring more dashboard content and task actions remain visible above the fold on desktop and mobile.
- **Confirmed Decision 2: Contained Display with Soft Padding**: Switch from full-bleed cropped cover to `object-contain` with gentle inner padding (`p-2` / `p-2.5`), ensuring every botanical element is fully visible without edge clipping or distortion.
- **Targeted Elements (Focus Mode)**:
  1. *Hero Welcome Banner Image* (`HomeScreen.tsx`): Field notebook illustration container.
  2. *Card 1: Today's Focus Artwork* (`HomeOverview.tsx`): Watering illustration header.
  3. *Card 2: Garden Plan Artwork* (`HomeOverview.tsx`): Raised bed & seeds illustration header.
  4. *Card 3: Weather & Microclimate Artwork* (`HomeOverview.tsx`): Weather & microclimate illustration header.

---

### 1. Overview & Core Concept

- **What It Does**: Refines the scale and presentation of the 4 primary Home page illustrations. The card headers in `HomeOverview` are reduced from ~144px (`h-36`) down to a compact, elegant ~88px–96px (`h-22 sm:h-24`), styled as framed botanical vignette panels with soft parchment padding. The hero banner image is scaled from 176px down to a balanced 104px–112px (`w-26 h-26 sm:w-28 sm:h-28`).
- **Target Audience / Persona**: Nordic gardeners accessing KÜLV on laptops and mobile devices who want maximum data density and immediate task scannability without sacrificing the warm botanical aesthetic.
- **Key Value**: Delivers the ideal balance between editorial charm and utility—preserving the full, uncropped hand-crafted artwork while pulling urgent daily tasks and microclimate charts higher into the immediate viewport.

---

### 2. User Experience & Visual Design

#### Spatial Math & Container Adjustments
- **Hero Welcome Banner Container (`HomeScreen.tsx`)**:
  - *Current*: `w-36 h-36 sm:w-44 sm:h-44` (~144px–176px).
  - *Refined*: `w-24 h-24 sm:w-28 sm:h-28` (~96px–112px) with `p-1.5`, rounded-2xl border, containing the field notebook illustration cleanly.
  - *Result*: Compact banner that aligns harmoniously with the date kicker, title, and action buttons without pushing the overview cards down.

- **Overview Cards Artwork Headers (`HomeOverview.tsx`)**:
  - *Current*: `h-32 sm:h-36` (~128px–144px), `object-cover` (which crops edges of square botanical drawings).
  - *Refined*: `h-20 sm:h-24` (~80px–96px), `object-contain`, with `p-2` inner padding inside the warm parchment header container (`bg-[var(--kulv-surface-muted)]`).
  - *Result*: The complete illustration is framed like a botanical specimen plate; status badges (`To-do`, `Beds`, `Frost risk`) remain pinned cleanly in the corner without obscuring artwork.

```
┌────────────────────────────────────────────────────────┐
│ Card Header (Compact ~88px, bg-surface-muted)          │
│ ┌────────────────────────────────────────────────────┐ │
│ │  [Full Botanical Drawing, object-contain, p-2]     │ │ [Status Tag]
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ Title: Today's Focus                                   │
│ Subtitle: 2 tasks awaiting attention                   │
│ ...                                                    │
└────────────────────────────────────────────────────────┘
```

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Compact Fixed Height vs. Variable Aspect Ratio**:
  - *Chosen Approach*: Use `h-20 sm:h-24` with `objectFit="contain"` on the card headers rather than arbitrary percentages.
  - *Why*: Guarantees all three overview cards maintain identical, aligned heights across multi-column grids, preventing jagged baseline mismatches while showing the complete artwork.
  - *Alternatives Considered*: Shrinking to small circular avatars. Rejected by user preference for uncropped editorial artwork headers.

- **Decision 2: Soft Padding vs. Edge-to-Edge Framing**:
  - *Chosen Approach*: Apply `p-2` inner padding with background matching `var(--kulv-surface-muted)`.
  - *Why*: Botanical illustrations have natural paper backgrounds; soft padding gives them an intentional framed gallery effect and prevents artwork outlines from touching the card divider.

---

### 4. Technical Architecture & Component Mapping

#### Targeted Modifications
1. `src/screens/HomeScreen.tsx`:
   - Locate the hero image wrapper:
     ```tsx
     <div className="relative w-24 h-24 sm:w-28 sm:h-28 p-1.5 rounded-2xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] shadow-xs flex items-center justify-center">
       <BotanicalImage
         src="/assets/aistudio/lisa-p_evik-kanne-m_rkmik-notebook-garden-aiaplaneerija_9c90ce5a.jpeg"
         alt={...}
         aspectRatio="1/1"
         objectFit="contain"
         className="w-full h-full rounded-xl"
         imageClassName="p-1"
       />
     </div>
     ```

2. `src/components/home/HomeOverview.tsx`:
   - Update the 3 artwork header containers from `h-32 sm:h-36` to `h-20 sm:h-24`:
     ```tsx
     <div className="relative w-full h-20 sm:h-24 bg-[var(--kulv-surface-muted,#EFE6D4)] border-b border-[var(--kulv-border,#C9BFA9)] overflow-hidden flex items-center justify-center p-2">
       <BotanicalImage
         src="..."
         alt="..."
         aspectRatio="auto"
         objectFit="contain"
         className="w-full h-full"
         imageClassName="object-contain"
       />
       ...
     </div>
     ```

---

### Verification & Testing Plan

1. **Visual & Responsive Verification**:
   - Check rendered layout at mobile ($375\text{px}$–$430\text{px}$) and desktop ($1024\text{px}$–$1440\text{px}$).
   - Verify that all 4 illustrations are completely visible without cropped edges.
   - Verify that Today's Garden Tasks and Quick Actions are pulled higher on the screen.
2. **Automated Testing**:
   - Run Vitest test suites (`HomeOverview.test.tsx`, `HomeScreen.test.tsx`).
   - Confirm all 37 test suites and 212 tests pass.
3. **Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` in parallel to ensure clean TypeScript compilation.
