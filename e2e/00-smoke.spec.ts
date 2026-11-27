import { expect, test } from '@playwright/test';

// Smoke test of the API through the same origin the SPA uses (local preview or CloudFront).
test('api smoke: health, queue, clauses, findings coverage and the PDF', async ({ request }) => {
  const health = await request.get('/api/healthz');
  expect(health.ok()).toBeTruthy();

  const files = await (await request.get('/api/files')).json();
  expect(files).toHaveLength(25);

  const clauses = await (await request.get('/api/files/f01/clauses')).json();
  expect(clauses).toHaveLength(180);
  const withFinding = clauses.filter((c: { finding?: unknown }) => c.finding).length;
  expect(withFinding / clauses.length).toBeGreaterThanOrEqual(0.8);

  const pdf = await request.get('/api/files/f01/pdf'); // follows the presigned S3 redirect in the cloud
  expect(pdf.ok()).toBeTruthy();
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
