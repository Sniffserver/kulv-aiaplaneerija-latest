import { readFileSync } from 'node:fs';

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  throw new Error('Usage: node scripts/compare-garden-canvas-performance.mjs <before.json> <after.json>');
}

const before = JSON.parse(readFileSync(beforePath, 'utf8'));
const after = JSON.parse(readFileSync(afterPath, 'utf8'));
for (const report of [before, after]) {
  if (
    report.itemCount !== 120 ||
    report.frameSamples < 12 ||
    report.pointerMoves < 30 ||
    report.commitFrameSamples < 3
  ) {
    throw new Error(`Invalid/incomplete GardenCanvas probe report: ${JSON.stringify({
      itemCount: report.itemCount,
      dragFrameSamples: report.frameSamples,
      pointerMoves: report.pointerMoves,
      commitFrameSamples: report.commitFrameSamples,
    })}`);
  }
}

const pctChange = (baseline, optimized) =>
  baseline > 0 ? ((baseline - optimized) / baseline) * 100 : 0;
const percentagePointChange = (value) => value >= 0
  ? `${value.toFixed(1)} pp fewer`
  : `${Math.abs(value).toFixed(1)} pp more`;

console.log('');
console.log('=== GardenCanvas real-browser frame comparison ===');
console.log('Scenario: 120 persisted garden objects, Chromium production build, Desktop 1280×800');
console.log('');
console.log('ACTIVE DRAG (pointer held; pointer-up excluded)');
console.log(`Frame p50:       ${before.p50FrameMs.toFixed(2).padStart(7)} ms   ${after.p50FrameMs.toFixed(2).padStart(7)} ms   ${pctChange(before.p50FrameMs, after.p50FrameMs).toFixed(1)}%`);
console.log(`Frame p95:       ${before.p95FrameMs.toFixed(2).padStart(7)} ms   ${after.p95FrameMs.toFixed(2).padStart(7)} ms   ${pctChange(before.p95FrameMs, after.p95FrameMs).toFixed(1)}%`);
console.log(`Frame p99:       ${before.p99FrameMs.toFixed(2).padStart(7)} ms   ${after.p99FrameMs.toFixed(2).padStart(7)} ms   ${pctChange(before.p99FrameMs, after.p99FrameMs).toFixed(1)}%`);
console.log(`Frames >16.7ms:  ${before.pctFramesOver16_7Ms.toFixed(1).padStart(7)}%    ${after.pctFramesOver16_7Ms.toFixed(1).padStart(7)}%    ${percentagePointChange(before.pctFramesOver16_7Ms - after.pctFramesOver16_7Ms)}`);
console.log(`Frames >25ms:    ${before.pctFramesOver25Ms.toFixed(1).padStart(7)}%    ${after.pctFramesOver25Ms.toFixed(1).padStart(7)}%    ${percentagePointChange(before.pctFramesOver25Ms - after.pctFramesOver25Ms)}`);
console.log(`Drag long tasks: ${before.longTaskCount} vs ${after.longTaskCount}; duration ${before.longTaskDurationMs.toFixed(1)} vs ${after.longTaskDurationMs.toFixed(1)} ms`);
console.log(`Drag wall time:  ${before.dragDurationMs.toFixed(1)} vs ${after.dragDurationMs.toFixed(1)} ms; frames ${before.frameSamples} vs ${after.frameSamples}; pointer events ${before.pointerMoves} vs ${after.pointerMoves}`);

console.log('');
console.log('POINTER-UP / COMMIT (separate phase)');
console.log(`Commit p95:      ${before.commitP95FrameMs.toFixed(2).padStart(7)} ms   ${after.commitP95FrameMs.toFixed(2).padStart(7)} ms   ${pctChange(before.commitP95FrameMs, after.commitP95FrameMs).toFixed(1)}%`);
console.log(`Commit p99:      ${before.commitP99FrameMs.toFixed(2).padStart(7)} ms   ${after.commitP99FrameMs.toFixed(2).padStart(7)} ms   ${pctChange(before.commitP99FrameMs, after.commitP99FrameMs).toFixed(1)}%`);
console.log(`Commit >50ms:    ${before.commitFramesOver50Ms} vs ${after.commitFramesOver50Ms}; long tasks ${before.commitLongTaskCount} vs ${after.commitLongTaskCount}`);
console.log(`Commit task ms:  ${before.commitLongTaskDurationMs.toFixed(1)} vs ${after.commitLongTaskDurationMs.toFixed(1)}; observed commit phase ${before.commitDurationMs.toFixed(1)} vs ${after.commitDurationMs.toFixed(1)} ms`);
console.log('Note: hosted CI is a comparative Chromium diagnostic, not a hardware-independent FPS guarantee.');
