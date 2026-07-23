import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR =
  'C:\\Users\\user\\AppData\\Local\\Temp\\claude\\C--Users-user-Desktop-ko-z\\e71fd394-e8e5-4b2e-bed4-f6750213acb5\\scratchpad\\admin-e2e-screens';
const WAVE2_SCREENSHOT_DIR =
  'C:\\Users\\user\\AppData\\Local\\Temp\\claude\\C--Users-user-Desktop-ko-z\\e71fd394-e8e5-4b2e-bed4-f6750213acb5\\scratchpad\\wave2-admin-screens';

async function login(page: Page) {
  await page.goto('/login');
  const emailInput = page.locator('input[type="email"]');
  // Vite's dev server compiles the route lazily on first hit; the very
  // first navigation in a cold `npm run dev` can take a while.
  await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
  await emailInput.fill('admin@platform.io');
  await page.locator('input[type="password"]').fill('Admin123!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

test.describe('Admin panel smoke suite', () => {
  test('login lands on dashboard with stat content visible', async ({ page }) => {
    await login(page);

    // Welcome banner + stat grid should be present.
    await expect(page.locator('h1')).toBeVisible();

    // Stat tiles render a bold numeric/string value inside the grid cards.
    const statValues = page.locator('h3.text-3xl.font-extrabold');
    await expect(statValues.first()).toBeVisible();
    const count = await statValues.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Give all four stat queries a moment to resolve past their "—"
    // placeholder so the screenshot captures real data, not loading state.
    await expect
      .poll(
        async () => {
          const texts = await statValues.allInnerTexts();
          return texts.every((t) => t.trim() !== '—');
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'dashboard.png'),
      fullPage: true,
    });
  });

  test('users page renders real seeded user rows', async ({ page }) => {
    await login(page);

    await page.goto('/users');
    await page.waitForURL('**/users');

    // Real data rows carry the `table-row-hover` class; the loading /
    // empty-state placeholder row does not, so this only resolves once
    // the query has actually returned seeded users (avoids a false
    // positive against the "loading identities…" placeholder row).
    const rows = page.locator('table tbody tr.table-row-hover');
    await expect
      .poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);

    const rowCount = await rows.count();
    const bodyText = await page.locator('table tbody').innerText();

    // Seeded admin/analyst users should appear somewhere in the table.
    expect(bodyText.toLowerCase()).toMatch(/admin|analyst/);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('surveillance page renders sensor table rows', async ({ page }) => {
    await login(page);

    await page.goto('/surveillance');
    await page.waitForURL('**/surveillance');

    const rows = page.locator('table tbody tr.table-row-hover');
    await expect
      .poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);
  });

  test('monitoring page renders charts', async ({ page }) => {
    await login(page);

    await page.goto('/monitoring');
    await page.waitForURL('**/monitoring');

    // Recharts renders an <svg> per ResponsiveContainer/chart.
    const svgs = page.locator('svg.recharts-surface');
    await expect
      .poll(async () => svgs.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'monitoring.png'),
      fullPage: true,
    });
  });

  test('alert center: alerts tab renders seeded + evaluator-generated rows', async ({ page }) => {
    await login(page);

    await page.goto('/alert-center');
    await page.waitForURL('**/alert-center');

    const rows = page.locator('table tbody tr.table-row-hover');
    await expect
      .poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(3);

    // Seed guarantees a mix of severities — the uppercase severity badge
    // text (critical/high/medium/low) is locale-independent, unlike the
    // rest of the row chrome which is translated (default locale is uz).
    const bodyText = await page.locator('table tbody').innerText();
    expect(bodyText.toLowerCase()).toMatch(/critical|high|medium|low/);

    await page.screenshot({
      path: path.join(WAVE2_SCREENSHOT_DIR, 'alert-center-alerts.png'),
      fullPage: true,
    });
  });

  test('alert center: rules tab shows the 3 seeded alert rules', async ({ page }) => {
    await login(page);

    await page.goto('/alert-center');
    await page.waitForURL('**/alert-center');
    await page.getByTestId('alert-center-tab-rules').click();

    const rows = page.locator('table tbody tr.table-row-hover');
    await expect
      .poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(3);

    const bodyText = await page.locator('table tbody').innerText();
    expect(bodyText).toMatch(/Watchlist Sensor Hit/i);
    expect(bodyText).toMatch(/Hostile Threat Classification/i);
    expect(bodyText).toMatch(/High Risk Entity/i);

    await page.screenshot({
      path: path.join(WAVE2_SCREENSHOT_DIR, 'alert-center-rules.png'),
      fullPage: true,
    });
  });

  test('alert center: watchlist tab shows the 2 seeded entries', async ({ page }) => {
    await login(page);

    await page.goto('/alert-center');
    await page.waitForURL('**/alert-center');
    await page.getByTestId('alert-center-tab-watchlist').click();

    const rows = page.locator('table tbody tr.table-row-hover');
    await expect
      .poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2);
  });

  test('AI patterns page renders at least one detected pattern', async ({ page }) => {
    await login(page);

    await page.goto('/patterns');
    await page.waitForURL('**/patterns');

    // Pattern cards carry the shared card-hover class used across the admin UI.
    const cards = page.locator('.card-hover');
    await expect
      .poll(async () => cards.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: path.join(WAVE2_SCREENSHOT_DIR, 'patterns.png'),
      fullPage: true,
    });
  });
});
