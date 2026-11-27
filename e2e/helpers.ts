import type { Page } from '@playwright/test';

/** Freeze the clock so relative due dates ("in 2 days") are stable. */
export async function freezeClock(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-28T09:00:00Z'));
}

export async function setPrefs(page: Page, theme: 'light' | 'dark', density: 'comfortable' | 'compact' = 'comfortable') {
  await page.addInitScript(([t, d]) => localStorage.setItem('crs-ui', JSON.stringify({ state: { theme: t, density: d, layouts: {} }, version: 0 })), [theme, density]);
}
