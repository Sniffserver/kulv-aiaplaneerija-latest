# Implementation Plan: Warm Pine Night Theme, High-Legibility Typography & Luminous Botanical Badges

Upgrade KÜLV's visual ergonomics and night readability according to the user's selected preferences:
1. **Dark Theme Palette**: Warm pine forest night (`#141A15` / `#182019`) with elevated surface layers (`#1E2820`, `#253227`) and soft, soothing sage accents (`#A7C080` / `#B8D49A`).
2. **Typography Legibility**: Clean geometric sans-serif (`Plus Jakarta Sans`) with optical spacing, boosted dark-mode font weights to prevent dark halation/text bleed, and WCAG AAA-compliant high-contrast body text (`#F5F2EB`).
3. **Canvas & Data Badges**: Luminous botanical badges with glowing status rings for 2D/3D garden canvas overlays, cell inspection cards, companion synergy indicators, and quick preview modals.

---

## User Review Required

> [!IMPORTANT]
> - **Dark Palette Tuning**: The default dark theme (`.dark`) will transition from a neutral dark gray (`#171B17`) to an organic **warm pine forest night** palette with rich sage borders and warm parchment text (`#F5F2EB`), ensuring zero harsh eye strain during dim evening garden planning.
> - **Subtle Luminous Rings**: Botanical badges in dark mode will incorporate soft emerald/sage ambient glow rings (`box-shadow: 0 0 10px rgba(167, 192, 128, 0.35)` and SVG glowing strokes) to maintain immediate visual hierarchy on both 2D SVG canvas and 3D scenes without overpowering the garden map.
> - **Font Rendering**: Applies `-webkit-font-smoothing: antialiased`, elevated letter spacing (`+0.012em`), and a baseline weight boost for body copy in dark mode so text remains razor-sharp on OLED and LCD screens.

---

## Proposed Changes

### 1. Design Tokens & Theme Variables (`src/index.css`)
- **Warm Pine Forest Palette**:
  - Update `.dark` variables:
    - `--kulv-bg`: `#131914` (deep pine forest night)
    - `--kulv-surface`: `#1a231b` (organic dark pine surface)
    - `--kulv-surface-muted`: `#222d23` (elevated card backdrop)
    - `--kulv-workspace`: `#151c16` (canvas work area)
    - `--kulv-text`: `#f5f2eb` (warm luminous parchment, >12:1 contrast ratio against bg)
    - `--kulv-text-muted`: `#d2d9cb` (crisp readable muted text, >7:1 contrast ratio)
    - `--kulv-text-subtle`: `#aebaa5` (subtle secondary text, >4.8:1 contrast ratio, WCAG AA compliant)
    - `--kulv-border`: `#3a4a3b` / hover `#5a725c`
    - `--kulv-primary`: `#a7c080` (luminous sage green)
    - `--kulv-primary-hover`: `#b8d49a`
    - `--kulv-accent`: `#e59b6e` (warm apricot glow)
    - `--kulv-accent-soft`: `#3d281e`
    - `--kulv-ring-glow`: `0 0 10px rgba(167, 192, 128, 0.4)`
- **Typography & Font Legibility Rules**:
  - Define `.dark` typography enhancements: boosted baseline text rendering, `letter-spacing: 0.012em` for body text to counteract optical bleed in dark mode, and `font-weight: 450` for standard body copy.
  - Add utility classes for `.luminous-badge`, `.luminous-badge-success`, `.luminous-badge-warning`, `.luminous-badge-danger` with glowing status rings.
  - Enhance readability for table headers, form labels, and metric chips.

### 2. Canvas & Companion Harmony Badges (`src/components/garden/CompanionOverlayLayer.tsx`)
- Adapt SVG badges, cross-bed synergy pills, and popover cards to be fully dark-mode aware:
  - Replace static light hex colors (`#FAF6ED`, `#EBF4E8`, `#FFF8E6`, `#FDF0E9`) with theme-adaptive styles or dynamic dark variants with luminous status rings.
  - Add SVG glow filter (`<filter id="luminous-glow">`) for bed harmony score badges and cross-bed connection nodes.
  - Increase contrast on popover modal cards with frosted pine backgrounds (`rgba(26, 35, 27, 0.95)` in dark) and crisp sage/amber borders.

### 3. Garden Canvas Cell Grid & Plant Chips (`src/components/InteractiveGardenCanvas.tsx`)
- Enhance bed cell grid numbers, coordinate labels, and plant chips:
  - Boost cell hover/prospective highlight rings with luminous glow so empty/active cells are distinctly visible against the dark earth beds.
  - Upgrade companion harmony indicators and bed summary status chips with luminous botanical styling.
  - Ensure plant name tags and spacing chips have high contrast against all bed textures.

### 4. 3D Canvas Floating Billboard Badges (`src/components/garden3d/Yard3DCanvas.tsx` & `ControlOverlay.tsx`)
- Update the 3D Html billboard harmony pins and floating camera control HUD:
  - Add luminous glow rings to 3D HTML tags so they stand out clearly against the 3D terrain, sun shadows, and nocturnal lighting.
  - Ensure camera preset buttons and sun slider labels have bold, readable geometric font styling with high contrast.

---

## Verification Plan

### Automated Tests
- Run full test suite with coverage:
  `npm test -- --run`
- Ensure all 29 test files and 168+ tests pass with zero regressions and all v8 coverage thresholds satisfied (stmts $\ge 70\%$, branches $\ge 55\%$, funcs $\ge 65\%$, lines $\ge 70\%$).
- Run TypeScript linting:
  `npm run lint`
- Run applet compilation:
  Verify via `compile_applet`.

### Manual & Visual Verification
1. **Dark Theme Check**: Toggle light/dark mode and confirm the warm pine forest night background, soft sage accents, and high-contrast parchment text.
2. **Text Readability in Dark**: Verify body text, labels, and small subtitles are easily legible with clean optical spacing and zero eye fatigue.
3. **Luminous Badges on 2D Canvas**: Open garden master plan and bed view to inspect companion badges, bed score rings, and popovers with luminous botanical glow.
4. **3D View Readability**: Switch to 3D canvas and inspect camera HUD, time-of-day slider, and floating harmony pins in dark mode.
