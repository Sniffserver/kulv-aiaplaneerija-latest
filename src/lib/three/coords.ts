import { GardenEntity, YardPlan } from '../../types';

/**
 * Converts a 2D garden plan entity coordinate to Three.js 3D world space.
 * 
 * In the 2D yard coordinate system:
 * - Origin (0, 0) is at the top-left corner of the yard.
 * - X extends to the right (width in metres).
 * - Y extends downward (length in metres).
 * - entity.x and entity.y represent the top-left corner of the entity's bounding box.
 * 
 * In the Three.js 3D coordinate system:
 * - Origin (0, 0, 0) is at the exact center of the yard ground plane.
 * - X extends to the right (+X).
 * - Y is elevation above ground level (+Y = up).
 * - Z extends towards the bottom / south (+Z).
 * 
 * @param entity The garden entity with position, dimensions, elevation, and height.
 * @param plan The yard plan containing yard dimensions (widthM, lengthM).
 * @returns [x, y, z] coordinate tuple in metres for Three.js.
 */
export function toThreePosition(entity: Pick<GardenEntity, 'x' | 'y' | 'width' | 'length' | 'heightM' | 'elevationM'>, plan: Pick<YardPlan, 'widthM' | 'lengthM'>): [number, number, number] {
  const safeX = Number.isFinite(entity.x) ? entity.x : 0;
  const safeY = Number.isFinite(entity.y) ? entity.y : 0;
  const safeWidth = Number.isFinite(entity.width) ? entity.width : 0;
  const safeLength = Number.isFinite(entity.length) ? entity.length : 0;
  const safeHeightM = Number.isFinite(entity.heightM) ? entity.heightM : 0;
  const safeElevationM = Number.isFinite(entity.elevationM) ? (entity.elevationM ?? 0) : 0;
  const planWidth = Number.isFinite(plan.widthM) ? plan.widthM : 20;
  const planLength = Number.isFinite(plan.lengthM) ? plan.lengthM : 30;

  const x = safeX + safeWidth / 2 - planWidth / 2;
  const z = safeY + safeLength / 2 - planLength / 2;
  const y = safeElevationM + safeHeightM / 2;
  return [x, y, z];
}

/**
 * Converts rotation degrees around the vertical axis (clockwise in 2D)
 * to Three.js Y-axis rotation in radians (counter-clockwise in right-handed Three.js system).
 * 
 * Normalizes 360° to 0 rad for canonical angle representation.
 * 
 * @param rotationDeg Rotation in degrees clockwise.
 * @returns Rotation angle in radians for Three.js Euler rotation on Y axis.
 */
export function toThreeRotationY(rotationDeg: number): number {
  if (!Number.isFinite(rotationDeg)) return 0;
  const normalizedDeg = ((rotationDeg % 360) + 360) % 360;
  if (normalizedDeg === 0) return 0;
  return -(normalizedDeg * Math.PI) / 180;
}
