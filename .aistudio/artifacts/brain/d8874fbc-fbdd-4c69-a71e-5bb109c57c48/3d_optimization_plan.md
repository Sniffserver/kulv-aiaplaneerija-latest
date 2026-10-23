# Implementation Plan: 3D View Mobile Optimization

## Goal
Optimize the 3D garden view for mobile (iPad, iPhone, Android) with full-viewport usage, consolidated controls, and performance-tuned rendering.

## 1. Viewport & Layout Optimization
- **Full Viewport:** Modify `Yard3DViewWrapper` and surrounding CSS to ensure the 3D canvas fills the screen when active on mobile.
- **Collapsible Control Dock:** Create a new unified, glassmorphic bottom dock for all controls (`<ControlOverlay />`), with a toggle to expand/collapse, adhering to Three.js skill directives.
- **Device Detection:** Implement logic to adjust `renderer` settings (e.g., lower resolution/pixel ratio, disable heavy post-processing) based on detected device type/performance.

## 2. Three.js Performance Tuning
- **Rendering Adjustments:** Implement performance-first settings for mobile:
  - Reduce `pixelRatio` on lower-end devices.
  - Disable heavy post-processing or expensive shaders (`transmission`, etc.) on mobile/slower hardware.
  - Optimize the animation loop to ensure frame stability on constrained devices.

## 3. Workflow
- Update `Yard3DViewWrapper` for layout control.
- Develop the `<ControlOverlay />` component and integrate it.
- Update `Yard3DCanvas` and rendering logic to implement device-aware performance tunings.
- Test across responsive breakpoints.
