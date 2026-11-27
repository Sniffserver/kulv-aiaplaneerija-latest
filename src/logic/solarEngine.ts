export type SolarSeasonPresetId = 'midsummer' | 'late_summer' | 'spring_equinox' | 'autumn_equinox';

export interface SolarSeasonPreset {
  id: SolarSeasonPresetId;
  dayOfYear: number;
  labelEt: string;
  labelEn: string;
  dateStr: string;
  descriptionEt: string;
  descriptionEn: string;
}

export const SOLAR_SEASON_PRESETS: SolarSeasonPreset[] = [
  {
    id: 'midsummer',
    dayOfYear: 172,
    labelEt: 'Jaanipäev / Suvine pööripäev (21. juuni)',
    labelEn: 'Midsummer / Summer Solstice (June 21)',
    dateStr: '06-21',
    descriptionEt: 'Päike tõuseb Eestis kuni 54° kõrgusele, pikim päev (18.5h) ja lühimad varjud.',
    descriptionEn: 'Peak solar altitude up to 54°, longest daylight (18.5h) and shortest shadows.'
  },
  {
    id: 'late_summer',
    dayOfYear: 213,
    labelEt: 'Südasuvi / Viljumisaeg (1. august)',
    labelEn: 'Late Summer / Ripening (August 1)',
    dateStr: '08-01',
    descriptionEt: 'Köögiviljade peamine valmimisaeg, päevapikkus ~16h, soojenenud muld.',
    descriptionEn: 'Prime vegetable growth & ripening season, ~16h daylight, warmed soil.'
  },
  {
    id: 'spring_equinox',
    dayOfYear: 79,
    labelEt: 'Kevadine pööripäev (20. märts)',
    labelEn: 'Spring Equinox (March 20)',
    dateStr: '03-20',
    descriptionEt: 'Ettekasvatuse ja kasvuhoone käivitamise aeg, päikese tipp 30°, pikad varjud.',
    descriptionEn: 'Seed starting & greenhouse thawing season, sun peak at 30°, long shadows.'
  },
  {
    id: 'autumn_equinox',
    dayOfYear: 265,
    labelEt: 'Sügisene pööripäev (22. september)',
    labelEn: 'Autumn Equinox (September 22)',
    dateStr: '09-22',
    descriptionEt: 'Saagikoristus ja taliküüslaugu mahapanek, päikese tipp 30°, jahenevad ööd.',
    descriptionEn: 'Harvest & garlic planting season, sun peak at 30°, cooling nights.'
  }
];

export const SolarEngine = {
  /**
   * Calculates peak sun altitude in degrees at solar noon for a given latitude and day of year.
   * Estonia latitude ~58.5°N - 59.5°N.
   */
  calculateSolarNoonAltitude(lat: number, dayOfYear: number): number {
    const declination = 23.45 * Math.sin(((360.0 / 365.0) * (dayOfYear - 81) * Math.PI) / 180.0);
    const altitude = 90.0 - lat + declination;
    return Math.max(0.0, Math.min(90.0, altitude));
  },

  /**
   * Calculates daylight hours for a given latitude and day of year.
   * In Estonia: midsummer (day ~172) has ~18.5 hours daylight, midwinter has ~6 hours.
   */
  calculateDaylightHours(lat: number, dayOfYear: number): number {
    const latRad = (lat * Math.PI) / 180.0;
    const declinationRad = (23.45 * Math.sin(((360.0 / 365.0) * (dayOfYear - 81) * Math.PI) / 180.0) * Math.PI) / 180.0;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(declinationRad);
    const clampedCos = Math.max(-1.0, Math.min(1.0, cosHourAngle));
    const hourAngle = (Math.acos(clampedCos) * 180.0) / Math.PI;
    return (2.0 * hourAngle) / 15.0;
  },

  /**
   * Calculates exact sun altitude and azimuth for any time of day in Estonia.
   * hourDecimal: e.g. 12.0 for 12:00, 14.5 for 14:30.
   */
  calculateSunPosition(
    lat: number,
    dayOfYear: number,
    hourDecimal: number
  ): { altitudeDeg: number; azimuthDeg: number; isAboveHorizon: boolean } {
    const latRad = (lat * Math.PI) / 180.0;
    const declination = 23.45 * Math.sin(((360.0 / 365.0) * (dayOfYear - 81) * Math.PI) / 180.0);
    const declinationRad = (declination * Math.PI) / 180.0;

    // Solar noon is roughly 12:00 solar time (or ~13:15 local daylight savings time in Tallinn)
    const hourAngleDeg = (hourDecimal - 12.0) * 15.0;
    const hourAngleRad = (hourAngleDeg * Math.PI) / 180.0;

    const sinAltitude =
      Math.sin(latRad) * Math.sin(declinationRad) +
      Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
    const clampedSin = Math.max(-1.0, Math.min(1.0, sinAltitude));
    const altitudeRad = Math.asin(clampedSin);
    const altitudeDeg = (altitudeRad * 180.0) / Math.PI;

    if (altitudeDeg <= 0) {
      return { altitudeDeg: 0, azimuthDeg: 180, isAboveHorizon: false };
    }

    const cosAzimuth =
      (Math.sin(declinationRad) - Math.sin(latRad) * Math.sin(altitudeRad)) /
      (Math.cos(latRad) * Math.cos(altitudeRad) || 0.0001);
    const clampedCosAz = Math.max(-1.0, Math.min(1.0, cosAzimuth));
    let azimuthDeg = (Math.acos(clampedCosAz) * 180.0) / Math.PI;

    if (hourDecimal > 12.0) {
      azimuthDeg = 360.0 - azimuthDeg;
    }

    return {
      altitudeDeg: Math.round(altitudeDeg * 10) / 10,
      azimuthDeg: Math.round(azimuthDeg * 10) / 10,
      isAboveHorizon: true
    };
  },

  /**
   * Calculates shadow length (in metres) cast by an obstacle of a given height at solar noon.
   */
  calculateShadowLength(heightM: number, solarAltitudeDeg: number): number {
    if (solarAltitudeDeg <= 5.0) return heightM * 10;
    const altRad = (solarAltitudeDeg * Math.PI) / 180.0;
    return heightM / Math.tan(altRad);
  },

  /**
   * Evaluates whether a garden bed location receives sufficient sun based on nearby objects.
   */
  evaluateSunScore(bedSunHours: number, requiredHours: number, lang: 'et' | 'en' = 'et'): string {
    if (lang === 'en') {
      if (bedSunHours >= requiredHours) {
        return `Excellent sunlight (${bedSunHours.toFixed(1)} h / needed ${requiredHours} h)`;
      }
      if (bedSunHours >= requiredHours - 1.5) {
        return `Adequate sunlight (${bedSunHours.toFixed(1)} h / needed ${requiredHours} h)`;
      }
      return `Too shaded (${bedSunHours.toFixed(1)} h / needs at least ${requiredHours} h)`;
    }

    if (bedSunHours >= requiredHours) {
      return `Suurepärane päikesevalgus (${bedSunHours.toFixed(1)} h / vajalik ${requiredHours} h)`;
    }
    if (bedSunHours >= requiredHours - 1.5) {
      return `Rahuldav päikesevalgus (${bedSunHours.toFixed(1)} h / vajalik ${requiredHours} h)`;
    }
    return `Liiga varjuline (${bedSunHours.toFixed(1)} h / vajalik vähemalt ${requiredHours} h)`;
  },

  /**
   * Calculates and caches shadow displacement vector for an obstacle given height, sun altitude, and sun azimuth.
   * Uses memoization to prevent expensive trigonometry during 60 FPS canvas redraws.
   */
  getCachedShadowVector(
    heightM: number,
    solarAltitudeDeg: number,
    solarAzimuthDeg = 180
  ): { dx: number; dy: number; length: number } {
    const roundedAlt = Math.round(solarAltitudeDeg * 2) / 2;
    const roundedAz = Math.round(solarAzimuthDeg * 2) / 2;
    const cacheKey = `${heightM.toFixed(1)}_${roundedAlt}_${roundedAz}`;

    const cached = shadowCache.get(cacheKey);
    if (cached) return cached;

    const length = this.calculateShadowLength(heightM, solarAltitudeDeg);
    // Shadow falls opposite to sun azimuth:
    const shadowAngleRad = ((solarAzimuthDeg + 180) % 360) * (Math.PI / 180);
    const dx = Math.sin(shadowAngleRad) * length;
    const dy = -Math.cos(shadowAngleRad) * length;

    const result = { dx, dy, length };
    if (shadowCache.size > 500) {
      shadowCache.clear();
    }
    shadowCache.set(cacheKey, result);
    return result;
  },

  /**
   * Resolves day-of-year and seasonal label metadata for a SolarSeasonPresetId.
   */
  getSeasonPreset(seasonId: SolarSeasonPresetId = 'midsummer'): SolarSeasonPreset {
    return SOLAR_SEASON_PRESETS.find((s) => s.id === seasonId) || SOLAR_SEASON_PRESETS[0];
  },

  /**
   * Classifies daily direct sunlight hours into horticultural exposure categories.
   */
  classifySunHours(sunHours: number): SunExposureCategory {
    if (sunHours >= 6.5) return 'full_sun';
    if (sunHours >= 4.5) return 'partial_sun';
    if (sunHours >= 2.5) return 'partial_shade';
    return 'deep_shade';
  },

  /**
   * Computes a deterministic 2D grid sun-exposure heatmap across the yard for a seasonal preset.
   * Integrates daylight hours at 30-minute intervals, accounting for north orientation,
   * latitude, obstacle height, rotation, circle/polygon geometry, and tree foliage opacity.
   */
  calculateSunExposureHeatmap(params: {
    yardWidthM: number;
    yardLengthM: number;
    northAngleDeg?: number;
    lat?: number;
    seasonId?: SolarSeasonPresetId;
    entities: SunShadowObstacle[];
    resolutionM?: number;
  }): SunExposureHeatmap {
    const yardWidthM = Math.max(2, params.yardWidthM || 20);
    const yardLengthM = Math.max(2, params.yardLengthM || 30);
    const northAngleDeg = params.northAngleDeg || 0;
    const lat = params.lat || 59.437;
    const season = this.getSeasonPreset(params.seasonId);

    // Keep grid cell count bounded for smooth rendering on very large cadastral plots
    let cellSizeM = params.resolutionM || 0.5;
    const estimatedCells = (yardWidthM / cellSizeM) * (yardLengthM / cellSizeM);
    if (estimatedCells > 3600) {
      cellSizeM = Math.max(cellSizeM, Math.ceil(Math.sqrt((yardWidthM * yardLengthM) / 2800) * 2) / 2);
    }

    const cols = Math.max(1, Math.ceil(yardWidthM / cellSizeM));
    const rows = Math.max(1, Math.ceil(yardLengthM / cellSizeM));

    const stepHours = 0.5;
    const activeSteps: Array<{
      unitDx: number;
      unitDy: number;
    }> = [];

    for (let hour = 3.5; hour <= 20.5; hour += stepHours) {
      const sun = this.calculateSunPosition(lat, season.dayOfYear, hour);
      if (!sun.isAboveHorizon || sun.altitudeDeg < 3.0) continue;

      const effAzimuth = (((sun.azimuthDeg - northAngleDeg) % 360) + 360) % 360;
      const shadowAngleRad = (((effAzimuth + 180) % 360) * Math.PI) / 180;
      const lenPerMeterHeight = 1 / Math.tan((Math.max(8.0, sun.altitudeDeg) * Math.PI) / 180);

      activeSteps.push({
        unitDx: Math.sin(shadowAngleRad) * lenPerMeterHeight,
        unitDy: -Math.cos(shadowAngleRad) * lenPerMeterHeight
      });
    }

    const maxPossibleHours = Math.round(activeSteps.length * stepHours * 10) / 10;
    const cellCount = cols * rows;
    const shadeAccumulator = new Float32Array(cellCount);
    const stepShade = new Float32Array(cellCount);

    const obstacles = params.entities.filter(
      (e) => !e.deletedAt && e.visible !== false && e.shadowCasting && (e.heightM || 0) > 0.1
    );

    for (const step of activeSteps) {
      stepShade.fill(0);
      for (const obs of obstacles) {
        const h = obs.heightM;
        const dx = step.unitDx * h;
        const dy = step.unitDy * h;
        const shadeFactor = obs.foliageOpacity !== undefined ? Math.max(0.25, Math.min(1, obs.foliageOpacity)) : 1.0;

        // Compute conservative bounding box of obstacle + projected shadow
        const pad = obs.rotation ? Math.hypot(obs.width, obs.length) * 0.25 : 0;
        const minX = Math.max(0, Math.min(obs.x, obs.x + dx) - pad);
        const maxX = Math.min(yardWidthM, Math.max(obs.x + obs.width, obs.x + obs.width + dx) + pad);
        const minY = Math.max(0, Math.min(obs.y, obs.y + dy) - pad);
        const maxY = Math.min(yardLengthM, Math.max(obs.y + obs.length, obs.y + obs.length + dy) + pad);

        const cStart = Math.max(0, Math.floor(minX / cellSizeM));
        const cEnd = Math.min(cols - 1, Math.floor(maxX / cellSizeM));
        const rStart = Math.max(0, Math.floor(minY / cellSizeM));
        const rEnd = Math.min(rows - 1, Math.floor(maxY / cellSizeM));

        for (let r = rStart; r <= rEnd; r++) {
          const py = Math.min(yardLengthM - 0.01, (r + 0.5) * cellSizeM);
          for (let c = cStart; c <= cEnd; c++) {
            const px = Math.min(yardWidthM - 0.01, (c + 0.5) * cellSizeM);
            if (isPointInObstacleShadow(px, py, obs, dx, dy)) {
              const idx = r * cols + c;
              if (shadeFactor > stepShade[idx]) {
                stepShade[idx] = shadeFactor;
              }
            }
          }
        }
      }

      for (let i = 0; i < cellCount; i++) {
        if (stepShade[i] > 0) {
          shadeAccumulator[i] += stepShade[i] * stepHours;
        }
      }
    }

    const cells: SunHeatmapCell[] = new Array(cellCount);
    let totalSunSum = 0;

    for (let r = 0; r < rows; r++) {
      const y = r * cellSizeM;
      const cellH = Math.min(cellSizeM, Math.max(0, yardLengthM - y));
      for (let c = 0; c < cols; c++) {
        const x = c * cellSizeM;
        const cellW = Math.min(cellSizeM, Math.max(0, yardWidthM - x));
        const idx = r * cols + c;
        const shadedHours = Math.min(maxPossibleHours, shadeAccumulator[idx]);
        const sunHours = Math.max(0, Math.round((maxPossibleHours - shadedHours) * 10) / 10);
        totalSunSum += sunHours;

        cells[idx] = {
          col: c,
          row: r,
          x,
          y,
          width: cellW,
          height: cellH,
          sunHours,
          category: this.classifySunHours(sunHours)
        };
      }
    }

    return {
      seasonId: season.id,
      dayOfYear: season.dayOfYear,
      cols,
      rows,
      cellSizeM,
      maxPossibleHours,
      averageYardSunHours: cells.length > 0 ? Math.round((totalSunSum / cells.length) * 10) / 10 : maxPossibleHours,
      cells
    };
  },

  /**
   * Calculates average daily sun hours across an entity's footprint from a precomputed heatmap.
   */
  getEntitySunExposure(
    entity: { x: number; y: number; width: number; length: number },
    heatmap: SunExposureHeatmap
  ): { averageHours: number; minHours: number; maxHours: number; category: SunExposureCategory } {
    const cStart = Math.max(0, Math.floor(entity.x / heatmap.cellSizeM));
    const cEnd = Math.min(heatmap.cols - 1, Math.floor((entity.x + entity.width) / heatmap.cellSizeM));
    const rStart = Math.max(0, Math.floor(entity.y / heatmap.cellSizeM));
    const rEnd = Math.min(heatmap.rows - 1, Math.floor((entity.y + entity.length) / heatmap.cellSizeM));

    let sum = 0;
    let count = 0;
    let minHours = Infinity;
    let maxHours = -Infinity;

    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        const cell = heatmap.cells[r * heatmap.cols + c];
        if (!cell) continue;
        sum += cell.sunHours;
        minHours = Math.min(minHours, cell.sunHours);
        maxHours = Math.max(maxHours, cell.sunHours);
        count++;
      }
    }

    const averageHours = count > 0 ? Math.round((sum / count) * 10) / 10 : heatmap.averageYardSunHours;
    return {
      averageHours,
      minHours: count > 0 ? minHours : averageHours,
      maxHours: count > 0 ? maxHours : averageHours,
      category: this.classifySunHours(averageHours)
    };
  }
};

export type SunExposureCategory = 'full_sun' | 'partial_sun' | 'partial_shade' | 'deep_shade';

export interface SunShadowObstacle {
  x: number;
  y: number;
  width: number;
  length: number;
  heightM: number;
  rotation?: number;
  shapeType?: 'rectangle' | 'circle' | 'polygon' | 'polyline';
  customPolygon?: { x: number; y: number }[];
  shadowCasting?: boolean;
  foliageOpacity?: number;
  visible?: boolean;
  deletedAt?: string | null;
}

export interface SunHeatmapCell {
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sunHours: number;
  category: SunExposureCategory;
}

export interface SunExposureHeatmap {
  seasonId: SolarSeasonPresetId;
  dayOfYear: number;
  cols: number;
  rows: number;
  cellSizeM: number;
  maxPossibleHours: number;
  averageYardSunHours: number;
  cells: SunHeatmapCell[];
}

function isPointInObstacleShadow(
  px: number,
  py: number,
  obs: SunShadowObstacle,
  dx: number,
  dy: number
): boolean {
  // Trace reverse ray from ground point (px, py) back toward the obstacle footprint:
  // A point is in shadow if segment (px, py) -> (px - dx, py - dy) intersects the obstacle's horizontal footprint,
  // excluding points strictly inside the obstacle itself? Wait: an entity's own footprint is shaded or sunlit
  // depending on whether we include t=0. For tall obstacles (houses/trees), t in [0, 1] shades the ground underneath & behind.
  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.length / 2;

  if (obs.shapeType === 'circle') {
    const r = Math.min(obs.width, obs.length) / 2;
    // Closest distance from circle center (cx, cy) to segment A(px, py) -> B(px - dx, py - dy)
    const segDx = -dx;
    const segDy = -dy;
    const lenSq = segDx * segDx + segDy * segDy;
    let t = 0;
    if (lenSq > 1e-6) {
      t = ((cx - px) * segDx + (cy - py) * segDy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }
    const nearX = px + t * segDx;
    const nearY = py + t * segDy;
    const distSq = (nearX - cx) * (nearX - cx) + (nearY - cy) * (nearY - cy);
    return distSq <= r * r;
  }

  // Transform segment into obstacle's local unrotated space centered at (0, 0)
  const rotRad = -((obs.rotation || 0) * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const ax0 = px - cx;
  const ay0 = py - cy;
  const bx0 = px - dx - cx;
  const by0 = py - dy - cy;

  const ax = ax0 * cosR - ay0 * sinR;
  const ay = ax0 * sinR + ay0 * cosR;
  const bx = bx0 * cosR - by0 * sinR;
  const by = bx0 * sinR + by0 * cosR;

  const halfW = obs.width / 2;
  const halfL = obs.length / 2;

  // Liang-Barsky segment vs axis-aligned box [-halfW, halfW] x [-halfL, halfL]
  let t0 = 0;
  let t1 = 1;
  const dSegX = bx - ax;
  const dSegY = by - ay;

  const p = [-dSegX, dSegX, -dSegY, dSegY];
  const q = [ax + halfW, halfW - ax, ay + halfL, halfL - ay];

  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }

  if (t0 > t1) return false;

  if (obs.shapeType === 'polygon' && obs.customPolygon && obs.customPolygon.length >= 3) {
    // Check midpoint of clipped segment inside polygon (in obstacle local top-left coords)
    const tMid = (t0 + t1) / 2;
    const localX = ax + tMid * dSegX + halfW;
    const localY = ay + tMid * dSegY + halfL;
    return isPointInPolygon(localX, localY, obs.customPolygon);
  }

  return true;
}

function isPointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const shadowCache = new Map<string, { dx: number; dy: number; length: number }>();
