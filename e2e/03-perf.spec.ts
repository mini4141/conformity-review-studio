import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.env.PROOF_LOGS_DIR ?? '../proof/phase1-local/logs';

// 180 rows, virtualized: scroll the matrix for a few seconds and measure frame pacing with requestAnimationFrame.
test('matrix scroll stays at >= 55 fps on average', async ({ page }) => {
  await page.goto('/files/f01/matrix');
  const grid = page.getByTestId('matrix-scroll');
  await expect(grid).toBeVisible();
  await expect(page.getByText('Quality policy').first()).toBeVisible();

  // Three 2.5 s scroll runs (after a warm-up); the median average is asserted and every run is logged.
  const run = () =>
    grid.evaluate(async (el) => {
      const frames: number[] = [];
      const start = performance.now();
      let last = start;
      let dir = 1;
      await new Promise<void>((done) => {
        const tick = (t: number) => {
          frames.push(t - last);
          last = t;
          const max = el.scrollHeight - el.clientHeight;
          el.scrollTop += dir * 14;
          if (el.scrollTop >= max) dir = -1;
          if (el.scrollTop <= 0) dir = 1;
          if (t - start < 2500) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      });
      const timed = frames.slice(1);
      const total = timed.reduce((a, b) => a + b, 0);
      return { frames: timed.length, seconds: +(total / 1000).toFixed(2), avgFps: +(timed.length / (total / 1000)).toFixed(1), worstFrameMs: +Math.max(...timed).toFixed(1) };
    });
  await run(); // warm-up
  const runs = [await run(), await run(), await run()];
  const median = [...runs].sort((a, b) => a.avgFps - b.avgFps)[1]!;
  const result = { rows: await grid.getAttribute('aria-rowcount'), runs, medianAvgFps: median.avgFps };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/perf-matrix-scroll.json`, JSON.stringify({ test: 'matrix-scroll', viewport: '1440x900', build: 'production (vite preview)', ...result }, null, 2));
  expect(result.medianAvgFps).toBeGreaterThanOrEqual(55);
});
