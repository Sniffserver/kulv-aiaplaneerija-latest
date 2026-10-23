import { describe, it, expect } from 'vitest';
import { toThreePosition, toThreeRotationY } from './coords';
import { YardPlan } from '../../types';

describe('3D Coordinate Transformation (toThreePosition & toThreeRotationY)', () => {
  const samplePlan: Pick<YardPlan, 'widthM' | 'lengthM'> = {
    widthM: 20,
    lengthM: 30
  };

  it('correctly maps top-left corner (0,0) to Three.js coordinates (-widthM/2, y, -lengthM/2)', () => {
    const topLeftEntity = {
      x: 0,
      y: 0,
      width: 0,
      length: 0,
      heightM: 2.0,
      elevationM: 0
    };

    const [threeX, threeY, threeZ] = toThreePosition(topLeftEntity, samplePlan);

    expect(threeX).toBeCloseTo(-samplePlan.widthM / 2); // -10
    expect(threeZ).toBeCloseTo(-samplePlan.lengthM / 2); // -15
    expect(threeY).toBeCloseTo(1.0); // 0 + 2.0/2 = 1.0 (center of object height)
  });

  it('correctly maps center of the yard plan to Three.js origin (0, y, 0)', () => {
    // An entity centered on the plot:
    // x = (widthM - width) / 2 = (20 - 4) / 2 = 8
    // y = (lengthM - length) / 2 = (30 - 6) / 2 = 12
    const centeredEntity = {
      x: 8,
      y: 12,
      width: 4,
      length: 6,
      heightM: 3.0,
      elevationM: 0
    };

    const [threeX, threeY, threeZ] = toThreePosition(centeredEntity, samplePlan);

    // Center of entity is x + width/2 = 8 + 2 = 10. 10 - widthM/2 = 0
    expect(threeX).toBeCloseTo(0);
    // Center of entity is y + length/2 = 12 + 3 = 15. 15 - lengthM/2 = 0
    expect(threeZ).toBeCloseTo(0);
    expect(threeY).toBeCloseTo(1.5);
  });

  it('factors in elevationM for raised platforms or balcony planters', () => {
    const elevatedPot = {
      x: 5,
      y: 5,
      width: 1,
      length: 1,
      heightM: 0.6,
      elevationM: 1.2
    };

    const [, threeY] = toThreePosition(elevatedPot, samplePlan);

    // y = 1.2 + 0.6 / 2 = 1.5
    expect(threeY).toBeCloseTo(1.5);
  });

  it('converts 90° clockwise rotation to -Math.PI / 2 radians', () => {
    const rad = toThreeRotationY(90);
    expect(rad).toBeCloseTo(-Math.PI / 2);
  });

  it('converts 180° and 270° clockwise rotations accurately', () => {
    expect(toThreeRotationY(180)).toBeCloseTo(-Math.PI);
    expect(toThreeRotationY(270)).toBeCloseTo(-(3 * Math.PI) / 2);
  });

  it('normalizes 0° and 360° to equivalent 0 radians', () => {
    const rad0 = toThreeRotationY(0);
    const rad360 = toThreeRotationY(360);
    const rad720 = toThreeRotationY(720);

    expect(rad0).toBe(0);
    expect(rad360).toBe(0);
    expect(rad720).toBe(0);
  });

  it('handles negative angles consistently', () => {
    // -90 deg is equivalent to 270 deg
    const neg90 = toThreeRotationY(-90);
    expect(neg90).toBeCloseTo(-(3 * Math.PI) / 2);
  });
});
