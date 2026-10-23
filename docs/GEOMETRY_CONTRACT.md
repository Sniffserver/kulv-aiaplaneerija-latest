# Garden geometry contract

This document defines the coordinate and validity contract for geometry used by rendering, placement validation, collision warnings, planting capacity, clearance, and solar sampling.

## Units and coordinate spaces

- All garden geometry uses metres. Values are finite JavaScript numbers; no geometry helper should silently convert degrees, centimetres, or screen pixels into metres.
- **World coordinates** describe the yard boundary and persisted placement locations. A yard `boundaryPolygon` is always stored and interpreted in world coordinates. It is not translated or rotated with an item.
- **Item-local vertices** describe a custom-shaped garden item before its item transform is applied. Each vertex is an offset from the item's unrotated top-left placement anchor, in metres. The stored vertices are not pre-rotated world points.
- `GardenItem.x` and `GardenItem.y` anchor the unrotated item. `width` and `length` describe its local extents. `rotation` is in degrees and is applied once around the item's centre.
- Screen coordinates are a rendering concern only. World geometry must not be mutated to account for zoom, pan, canvas dimensions, or device pixel ratio.

## Transform contract

For an item with custom vertices, the shared footprint transform performs the following sequence exactly once:

1. Translate each item-local vertex by the item's `x` and `y` placement.
2. Rotate that translated point around `(x + width / 2, y + length / 2)` by `rotation` degrees.
3. Pass the resulting world-space polygon to containment, collision, clearance, and other world-geometry checks.

Rectangles use the same centre-of-item rotation convention. Helpers that sample points within a bed may start from bed-local grid coordinates, but must convert the sample into world coordinates through the same centre and angle convention before comparing it with world-space obstacles or using it for solar analysis. Never rotate persisted vertices and then rotate them again in the renderer.

## Polygon validity and boundary semantics

A polygon used as a filled footprint or yard boundary must contain at least three distinct, finite vertices; every edge must have non-zero length; non-adjacent edges must not cross or touch; and the absolute signed area must exceed (10^{-8}\,\text{m}^2). Import/editor validation may provide richer user-facing detail, but geometric safety checks must fail closed for invalid rings.

- Valid concave simple polygons are supported.
- An edge-only or vertex-only contact is not a filled-area collision.
- Proper crossings, containment, and overlapping filled areas are collisions.
- Collinear overlapping edges are handled explicitly; they do not imply a collision on their own, but do when the filled polygons also overlap.
- An invalid custom footprint is a data-integrity error, not merely an “outside the yard” warning.
- Clearances are shortest polygon-boundary distances in metres. The calculation must be symmetric when its two polygon arguments are swapped; an unavailable polygon boundary returns an explicit non-finite result rather than invented clearance.

## Required regression cases

The geometry test suite covers: translated and rotated item-local vertices; non-square rectangles rotated by 90 degrees; concave-yard cut-outs; a concave footprint and its empty notch; edge and vertex touching; actual overlap with collinear edges; zero-area collinear shapes; self-intersecting rings; and symmetric polygon clearance distances.

When changing geometry code, update this contract if the persisted coordinate model changes. Do not silently migrate stored vertex meaning; add a versioned migration and a before/after fixture instead.
