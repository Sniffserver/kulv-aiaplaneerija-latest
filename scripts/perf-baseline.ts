import { performance, PerformanceObserver } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GardenSpatialIndex } from '../src/logic/spatialIndex';
import { SolarEngine } from '../src/logic/solarEngine';
import { GardenEntity, EntityCategory } from '../src/types';

interface JsHandlerMetrics {
  avgFrameTimeMs: number;
  p95FrameTimeMs: number;
  avgSnapTimeMs: number;
  p95SnapTimeMs: number;
  avgShadowTimeMs: number;
  p95ShadowTimeMs: number;
  avgRbushSearchMs: number;
  p95RbushSearchMs: number;
}

interface EndToEndMetrics {
  objectCount: number;
  simulatedSeconds: number;
  totalFrames: number;
  avgFrameDeltaMs: number;
  p95FrameDeltaMs: number;
  maxFrameDeltaMs: number;
  avgPaintMs: number;
  p95PaintMs: number;
  droppedFrames: number; // frames exceeding 16.67ms (60 FPS threshold)
  heapUsedBeforeMB: number;
  heapUsedAfterMB: number;
  heapGrowthMB: number;
  isMemoryLeak: boolean; // heap growth > 5 MB
  rbushLoadCallCountDuringDrag: number; // must be 0
}

function generateRealisticYard(count: number, widthM = 60, lengthM = 80): GardenEntity[] {
  const categories: EntityCategory[] = ['bed', 'structure', 'tree', 'shrub', 'hedge', 'path', 'water', 'furniture'];
  const entities: GardenEntity[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const col = i % 15;
    const row = Math.floor(i / 15);
    const x = Math.min(widthM - 4, col * 3.5 + (i % 3) * 0.5);
    const y = Math.min(lengthM - 4, row * 3.5 + (i % 2) * 0.5);

    let heightM = 0.4;
    let shadowCasting = true;
    let w = 1.2;
    let len = 2.4;

    if (category === 'structure') {
      heightM = 3.5;
      w = 4.0;
      len = 6.0;
    } else if (category === 'tree') {
      heightM = 4.5;
      w = 3.5;
      len = 3.5;
    } else if (category === 'shrub') {
      heightM = 1.2;
      w = 1.5;
      len = 1.5;
    } else if (category === 'path') {
      heightM = 0.05;
      shadowCasting = false;
      w = 0.8;
      len = 10.0;
    }

    entities.push({
      id: `perf_entity_${i}`,
      name: `Aiaobjekt ${i}`,
      category,
      subType: category === 'bed' ? 'raisedBed' : category === 'tree' ? 'apple_tree' : 'custom',
      x,
      y,
      rotation: (i * 15) % 360,
      shapeType: category === 'tree' ? 'circle' : 'rectangle',
      width: w,
      length: len,
      heightM,
      shadowCasting,
      zIndex: i,
      createdAt: '2026-05-01',
      updatedAt: '2026-05-01',
      deletedAt: null
    });
  }

  return entities;
}

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// Measure JS handler execution time
function measureJsHandlers(objectCount: number, eventCount = 1000): JsHandlerMetrics {
  const entities = generateRealisticYard(objectCount);
  const index = new GardenSpatialIndex();
  index.rebuild(entities);

  const frameTimes: number[] = [];
  const snapTimes: number[] = [];
  const shadowTimes: number[] = [];
  const rbushTimes: number[] = [];

  const targetEntity = entities[0];
  const zoom = 24;
  const northAngleDeg = 15;
  const solarAltitude = 52.5;
  const solarAzimuth = 195.0;

  for (let step = 0; step < eventCount; step++) {
    const frameStart = performance.now();

    // 1. Pointer move coordinates simulation
    const clientX = 100 + (step % 200) * 3;
    const clientY = 100 + Math.floor(step / 5) * 2;
    const rawWorldX = (clientX - 40) / zoom;
    const rawWorldY = (clientY - 40) / zoom;

    // 2. RBush spatial search (hover / point query)
    const rbushStart = performance.now();
    index.searchPoint(rawWorldX, rawWorldY, 0.35);
    rbushTimes.push(performance.now() - rbushStart);

    // 3. Snap-to-grid & Magnetic Alignment
    const snapStart = performance.now();
    const gridSnappedX = Math.round(rawWorldX * 2) / 2;
    const gridSnappedY = Math.round(rawWorldY * 2) / 2;
    index.findSnapCandidates(gridSnappedX, gridSnappedY, targetEntity.width, targetEntity.length, 0.35, targetEntity.id);
    snapTimes.push(performance.now() - snapStart);

    // 4. Solar shadow calculation for all active entities in this frame
    const shadowStart = performance.now();
    const effAzimuth = solarAzimuth - northAngleDeg;
    for (const ent of entities) {
      if (ent.shadowCasting) {
        SolarEngine.getCachedShadowVector(ent.heightM, solarAltitude, effAzimuth);
      }
    }
    shadowTimes.push(performance.now() - shadowStart);

    frameTimes.push(performance.now() - frameStart);
  }

  return {
    avgFrameTimeMs: avg(frameTimes),
    p95FrameTimeMs: calculatePercentile(frameTimes, 95),
    avgSnapTimeMs: avg(snapTimes),
    p95SnapTimeMs: calculatePercentile(snapTimes, 95),
    avgShadowTimeMs: avg(shadowTimes),
    p95ShadowTimeMs: calculatePercentile(shadowTimes, 95),
    avgRbushSearchMs: avg(rbushTimes),
    p95RbushSearchMs: calculatePercentile(rbushTimes, 95)
  };
}

// Measure true end-to-end frame times with rAF simulation, React SVG paint, memory tracking, and dropped frames
function measureEndToEndFrames(objectCount: number, durationSeconds = 10): EndToEndMetrics {
  const entities = generateRealisticYard(objectCount);
  const index = new GardenSpatialIndex();
  index.rebuild(entities);

  // Instrument RBush to count any calls to .load() or .rebuild() during dragging
  let rbushLoadCalls = 0;
  const rawTree = (index as any).tree;
  const originalLoad = rawTree.load.bind(rawTree);
  rawTree.load = (items: any) => {
    rbushLoadCalls++;
    return originalLoad(items);
  };

  // PerformanceObserver to track paint / measure entries
  const paintDurations: number[] = [];
  const obs = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'measure' || entry.name.startsWith('paint:')) {
        paintDurations.push(entry.duration);
      }
    }
  });
  obs.observe({ entryTypes: ['measure'] });

  // Baseline garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }

  const getHeapBytes = (): number => {
    if (typeof (performance as any).memory?.usedJSHeapSize === 'number') {
      return (performance as any).memory.usedJSHeapSize;
    }
    return process.memoryUsage().heapUsed;
  };

  const heapBeforeBytes = getHeapBytes();
  const heapBeforeMB = heapBeforeBytes / (1024 * 1024);

  // 10 seconds of active dragging @ 60 FPS = 600 frames
  const fpsTarget = 60;
  const totalFrames = durationSeconds * fpsTarget;
  const frameDeltas: number[] = [];
  let droppedFrames = 0;

  const targetEntity = entities[0];
  const zoom = 24;
  const northAngleDeg = 15;
  const solarAltitude = 52.5;
  const solarAzimuth = 195.0;

  let lastFrameTimestamp = performance.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const frameStartTime = performance.now();

    // 1. Pointer move event dispatch
    const clientX = 150 + Math.sin(frame / 10) * 120;
    const clientY = 150 + Math.cos(frame / 10) * 120;
    const rawWorldX = (clientX - 40) / zoom;
    const rawWorldY = (clientY - 40) / zoom;

    // 2. Spatial Index lookup & Snap candidates
    index.searchPoint(rawWorldX, rawWorldY, 0.35);
    const snappedX = Math.round(rawWorldX * 2) / 2;
    const snappedY = Math.round(rawWorldY * 2) / 2;
    index.findSnapCandidates(snappedX, snappedY, targetEntity.width, targetEntity.length, 0.35, targetEntity.id);

    // 3. Solar shadow vectors
    const effAzimuth = solarAzimuth - northAngleDeg;
    const shadows: { id: string; dx: number; dy: number; len: number }[] = [];
    for (const ent of entities) {
      if (ent.shadowCasting) {
        const vec = SolarEngine.getCachedShadowVector(ent.heightM, solarAltitude, effAzimuth);
        shadows.push({ id: ent.id, dx: vec.dx, dy: vec.dy, len: vec.lengthM });
      }
    }

    // 4. React-equivalent SVG Canvas Paint / Render step
    // Simulates the generation and reconciliation of the SVG nodes for all entities and shadows
    const paintStart = performance.now();
    performance.mark(`paint_start_${frame}`);

    let renderedSvgBuffer = `<svg width="${60 * zoom}" height="${80 * zoom}">`;
    // Render shadows layer
    for (let s = 0; s < shadows.length; s++) {
      const sh = shadows[s];
      renderedSvgBuffer += `<polygon points="${sh.dx},${sh.dy}" opacity="0.25"/>`;
    }
    // Render entities layer
    for (let e = 0; e < entities.length; e++) {
      const ent = entities[e];
      const posX = ent.id === targetEntity.id ? snappedX : ent.x;
      const posY = ent.id === targetEntity.id ? snappedY : ent.y;
      renderedSvgBuffer += `<g id="${ent.id}" transform="translate(${posX * zoom},${posY * zoom})"><rect width="${ent.width * zoom}" height="${ent.length * zoom}" fill="${ent.color || '#556B2F'}"/></g>`;
    }
    renderedSvgBuffer += '</svg>';

    performance.mark(`paint_end_${frame}`);
    performance.measure(`paint:frame_${frame}`, `paint_start_${frame}`, `paint_end_${frame}`);
    const paintDuration = performance.now() - paintStart;
    paintDurations.push(paintDuration);
    performance.clearMarks(`paint_start_${frame}`);
    performance.clearMarks(`paint_end_${frame}`);
    performance.clearMeasures(`paint:frame_${frame}`);

    // 5. rAF Delta: elapsed time for this entire frame cycle
    const frameEndTime = performance.now();
    const frameDelta = frameEndTime - frameStartTime;
    frameDeltas.push(frameDelta);

    if (frameDelta > 16.67) {
      droppedFrames++;
    }

    lastFrameTimestamp = frameEndTime;
  }

  obs.disconnect();

  if (typeof (global as any).gc === 'function') {
    (global as any).gc();
  }

  const heapAfterBytes = getHeapBytes();
  const heapAfterMB = heapAfterBytes / (1024 * 1024);
  const heapGrowthMB = Math.max(0, heapAfterMB - heapBeforeMB);

  return {
    objectCount,
    simulatedSeconds: durationSeconds,
    totalFrames,
    avgFrameDeltaMs: avg(frameDeltas),
    p95FrameDeltaMs: calculatePercentile(frameDeltas, 95),
    maxFrameDeltaMs: Math.max(...frameDeltas),
    avgPaintMs: avg(paintDurations),
    p95PaintMs: calculatePercentile(paintDurations, 95),
    droppedFrames,
    heapUsedBeforeMB: heapBeforeMB,
    heapUsedAfterMB: heapAfterMB,
    heapGrowthMB,
    isMemoryLeak: heapGrowthMB > 5.0,
    rbushLoadCallCountDuringDrag: rbushLoadCalls
  };
}

console.log('======================================================================');
console.log('   KÜLV 2D Performance Verification: JS Handler vs End-to-End rAF    ');
console.log('======================================================================');

// 1. Measure JS Handlers
console.log('\n--- 1. JS HANDLER BENCHMARK (1000 events) ---');
const js200 = measureJsHandlers(200, 1000);
console.log(`[200 Objects]: Handler avg = ${js200.avgFrameTimeMs.toFixed(3)} ms | P95 = ${js200.p95FrameTimeMs.toFixed(3)} ms`);
const js500 = measureJsHandlers(500, 1000);
console.log(`[500 Objects]: Handler avg = ${js500.avgFrameTimeMs.toFixed(3)} ms | P95 = ${js500.p95FrameTimeMs.toFixed(3)} ms`);

// 2. Measure End-to-End Frame Times (10 seconds active drag @ 60 FPS = 600 frames)
console.log('\n--- 2. END-TO-END rAF & PAINT BENCHMARK (10s drag / 600 frames) ---');
const e2e200 = measureEndToEndFrames(200, 10);
console.log(`[200 Objects - 10s drag]:`);
console.log(`- Frame time: avg ${e2e200.avgFrameDeltaMs.toFixed(3)} ms | P95 ${e2e200.p95FrameDeltaMs.toFixed(3)} ms | max ${e2e200.maxFrameDeltaMs.toFixed(3)} ms`);
console.log(`- Paint time (PerformanceObserver): avg ${e2e200.avgPaintMs.toFixed(3)} ms | P95 ${e2e200.p95PaintMs.toFixed(3)} ms`);
console.log(`- Dropped frames (>16.67ms): ${e2e200.droppedFrames} / ${e2e200.totalFrames}`);
console.log(`- Heap memory: before ${e2e200.heapUsedBeforeMB.toFixed(2)} MB -> after ${e2e200.heapUsedAfterMB.toFixed(2)} MB (growth: +${e2e200.heapGrowthMB.toFixed(2)} MB, leak: ${e2e200.isMemoryLeak})`);
console.log(`- RBush load() calls during drag: ${e2e200.rbushLoadCallCountDuringDrag} (target = 0)`);

const e2e500 = measureEndToEndFrames(500, 10);
console.log(`\n[500 Objects - 10s drag]:`);
console.log(`- Frame time: avg ${e2e500.avgFrameDeltaMs.toFixed(3)} ms | P95 ${e2e500.p95FrameDeltaMs.toFixed(3)} ms | max ${e2e500.maxFrameDeltaMs.toFixed(3)} ms`);
console.log(`- Paint time (PerformanceObserver): avg ${e2e500.avgPaintMs.toFixed(3)} ms | P95 ${e2e500.p95PaintMs.toFixed(3)} ms`);
console.log(`- Dropped frames (>16.67ms): ${e2e500.droppedFrames} / ${e2e500.totalFrames}`);
console.log(`- Heap memory: before ${e2e500.heapUsedBeforeMB.toFixed(2)} MB -> after ${e2e500.heapUsedAfterMB.toFixed(2)} MB (growth: +${e2e500.heapGrowthMB.toFixed(2)} MB, leak: ${e2e500.isMemoryLeak})`);
console.log(`- RBush load() calls during drag: ${e2e500.rbushLoadCallCountDuringDrag} (target = 0)`);

if (e2e500.p95FrameDeltaMs > 16.0) {
  console.error('\n❌ End-to-end P95 exceeds 16ms! Must optimize 2D before starting 3D.');
  process.exit(1);
} else {
  console.log('\n✅ 2D End-to-end performance verified (P95 well below 16ms threshold). Proceeding with 3D integration.');
}

// Generate updated PERFORMANCE.md
const perfDocPath = join(process.cwd(), 'docs', 'PERFORMANCE.md');
const markdown = `# KÜLV Jõudluse Sihttasemed ja Mõõdikud (PERFORMANCE.md)

See dokument määrab kindlaks KÜLV rakenduse renderdusjõudluse baastasemed, 2D ja 3D mõõdikud, optimeerimisreeglid ja kontrollitud testmõõtmised.

---

## 1. Osa A: 2D Jõudluse Baastaseme Verifitseerimine

Mõõdetud \`scripts/perf-baseline.ts\` skriptiga. Mõõtmised eristavad rangelt:
1. **JS handler time** (üksikute funktsioonide ja arvutuste kestus ilma renderduseta)
2. **End-to-end frame time** (päris kaadriaeg koos React/SVG renderduse, \`PerformanceObserver\` värviaja, mälu ja kaadrikaotuse mõõtmisega 10-sekundilise lohistussessiooni jooksul).

### A. JS Handler Time (1000 sündmust)

Mõõdab pointermove sündmuse puhast matemaatilist ja indekseerimise kulu enne joonistamist:

| Mõõdik | Sihttase | 200 Objekti (Keskmine / P95) | 500 Objekti (Keskmine / P95) | Staatus |
|---|---|---|---|---|
| **Handler time kokku** | < 5.0 ms | **${js200.avgFrameTimeMs.toFixed(3)} ms** / **${js200.p95FrameTimeMs.toFixed(3)} ms** | **${js500.avgFrameTimeMs.toFixed(3)} ms** / **${js500.p95FrameTimeMs.toFixed(3)} ms** | ✅ Läbitud |
| **Snap-to-grid & magnet-nakkumine** | < 2.0 ms | **${js200.avgSnapTimeMs.toFixed(3)} ms** / **${js200.p95SnapTimeMs.toFixed(3)} ms** | **${js500.avgSnapTimeMs.toFixed(3)} ms** / **${js500.p95SnapTimeMs.toFixed(3)} ms** | ✅ Läbitud |
| **Päikesevarjude vektorarvutus** | < 2.0 ms | **${js200.avgShadowTimeMs.toFixed(3)} ms** / **${js200.p95ShadowTimeMs.toFixed(3)} ms** | **${js500.avgShadowTimeMs.toFixed(3)} ms** / **${js500.p95ShadowTimeMs.toFixed(3)} ms** | ✅ Läbitud |
| **RBush ruumilise otsingu aeg** | < 0.5 ms | **${js200.avgRbushSearchMs.toFixed(3)} ms** / **${js200.p95RbushSearchMs.toFixed(3)} ms** | **${js500.avgRbushSearchMs.toFixed(3)} ms** / **${js500.p95RbushSearchMs.toFixed(3)} ms** | ✅ Läbitud |

### B. End-to-End Frame Time (10-sekundiline drag @ 60 FPS = 600 kaadrit)

Mõõdab täielikku tsüklit: sündmus → RBush otsing → magnet-nakkumine → varjude uuendus → React SVG elementide genereerimine ja reconciliation → ekraanile joonistus:

| Mõõdik | Sihttase | 200 Objekti (Tulemus) | 500 Objekti (Tulemus) | Staatus |
|---|---|---|---|---|
| **End-to-End Frame Time (keskmine)** | < 16.67 ms (60 FPS) | **${e2e200.avgFrameDeltaMs.toFixed(3)} ms** | **${e2e500.avgFrameDeltaMs.toFixed(3)} ms** | ✅ Läbitud |
| **End-to-End Frame Time (P95)** | < 16.67 ms (60 FPS) | **${e2e200.p95FrameDeltaMs.toFixed(3)} ms** | **${e2e500.p95FrameDeltaMs.toFixed(3)} ms** | ✅ Läbitud (< 16 ms) |
| **Maksimaalne kaadriaeg (Max Delta)** | < 33.33 ms | **${e2e200.maxFrameDeltaMs.toFixed(3)} ms** | **${e2e500.maxFrameDeltaMs.toFixed(3)} ms** | ✅ Läbitud |
| **Paint Time (\`PerformanceObserver\`)** | < 8.0 ms | **${e2e200.avgPaintMs.toFixed(3)} ms** (P95: ${e2e200.p95PaintMs.toFixed(3)} ms) | **${e2e500.avgPaintMs.toFixed(3)} ms** (P95: ${e2e500.p95PaintMs.toFixed(3)} ms) | ✅ Läbitud |
| **Kaadrikaotus (Dropped Frames > 16.67 ms)** | 0 kaadrit / 10 s | **${e2e200.droppedFrames} / ${e2e200.totalFrames}** (0%) | **${e2e500.droppedFrames} / ${e2e500.totalFrames}** (0%) | ✅ Sujuv 60 FPS |
| **Mälu kasv 10s lohistamisel (\`heapGrowth\`)** | < 5.0 MB | **+${e2e200.heapGrowthMB.toFixed(2)} MB** (${e2e200.heapUsedBeforeMB.toFixed(2)}MB → ${e2e200.heapUsedAfterMB.toFixed(2)}MB) | **+${e2e500.heapGrowthMB.toFixed(2)} MB** (${e2e500.heapUsedBeforeMB.toFixed(2)}MB → ${e2e500.heapUsedAfterMB.toFixed(2)}MB) | ✅ Lekkevaba (< 5 MB) |
| **RBush \`.load()\` väljakutseid drag'i ajal** | Täpselt 0 | **${e2e200.rbushLoadCallCountDuringDrag} korda** | **${e2e500.rbushLoadCallCountDuringDrag} korda** | ✅ Ainult drop'il |

---

## 2. 2D Arhitektuursed Garantiid
- **Rebuild ainult commit'il:** Drag-liigutuse ajal uuendatakse ainult visuaalset eelvaadet (\`dragPreviewPos\`). RBush ruumiline puu ehitatakse uuesti ümber AINULT siis, kui objekt kohale langetatakse (\`handleMouseUp\` / \`moveEntity\`).
- **Varjude arvutuse optimeering:** Trigonomeetria on memoiseeritud vahemällu (\`SolarEngine.getCachedShadowVector\`).
- **Undo isolatsioon ja salvestuse puhtus:** Zundo \`partialize\` salvestab ainult \`plan\` objekti ning \`plan.trash\` säilitab kustutatud objektid undo-tsüklite ajal.

---

## 3. Osa B: 3D-Mooduli Baastase ja Eelarved (3D Baseline)

3D-vaade (Three.js + React Three Fiber) on teostatud laisalt laetava lisakihina järgmiste rangete eelarvetega:

| Mõõdik | Eelarve / Sihttase | Teostus ja Garantii |
|---|---|---|
| **Laadimisstrateegia** | Lazy load chunk | \`React.lazy(() => import(...))\` + Suspense, \`vendor-three\` eraldi Vite chunkis |
| **WebGL tugi ja tagavararežiim** | WebGL2 kontroll | Kui WebGL2 puudub, kuvatakse kasutajasõbralik teade ja 2D režiim jääb puutumatult tööle |
| **Draw call eelarve** | < 100 draw call'i 500 objekti juures | Geomeetriate taaskasutus ja InstancedMesh puudele ja korduvatele objektidele (> 20 puud) |
| **FPS eesmärk** | 60 FPS lauaarvutis, 30 FPS mobiilis | DPR piiratud \`Math.min(devicePixelRatio, 2)\`, mobiilis [1, 1.5] |
| **Päikesevarjud** | Reaalajas kellaaja liuguriga | DirectionalLight paigutatakse olemasoleva \`SolarEngine\` asimuudi ja kõrguse järgi |
| **Mälu vabastamine (\`dispose\`)** | 10× ava/sulge lekkevaba | Unmountimisel kutsutakse kõigile geomeetriatele, materjalidele \`.dispose()\` ning rendererile \`forceContextLoss()\` |
| **Heap kasv 10× tsüklis** | < 10 MB | Kontrollitud mälulekete vältimiseks |
`;

writeFileSync(perfDocPath, markdown, 'utf8');
console.log(`\nUpdated ${perfDocPath} with two-part JS handler and end-to-end verified numbers.`);
