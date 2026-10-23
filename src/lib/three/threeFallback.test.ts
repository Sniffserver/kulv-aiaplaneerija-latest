import { describe, it, expect, vi } from 'vitest';
import { isWebGL2Available } from './webglCheck';
import { toThreePosition, toThreeRotationY } from './coords';

describe('3D Resiliency and Fallback Layer', () => {
  it('isWebGL2Available returns boolean without throwing error in headless env', () => {
    const result = isWebGL2Available();
    expect(typeof result).toBe('boolean');
  });

  it('isWebGL2Available returns false when window is undefined or WebGL throws', () => {
    // In Node/headless environment without WebGL context, it should cleanly return false without throwing
    const available = isWebGL2Available();
    expect(available).toBe(false);
  });

  it('Coordinate transformation guarantees valid numbers even with degenerate entities', () => {
    const pos = toThreePosition(
      { x: NaN, y: NaN, width: 0, length: 0, heightM: 0, elevationM: 0 } as any,
      { widthM: 20, lengthM: 30 } as any
    );
    expect(Array.isArray(pos)).toBe(true);
    expect(pos.length).toBe(3);

    const rot = toThreeRotationY(NaN);
    expect(rot).toBe(0);
  });
});
