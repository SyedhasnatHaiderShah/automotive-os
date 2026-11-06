import { test, expect } from '@playwright/test';

/**
 * Regressions found by the local production-scale QA pass (2026-10-31).
 * Public pages only; no sign-in needed.
 */
test.describe('Local QA regressions', () => {
  test('MK-20: Arabic toggle sets <html lang dir> and survives navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: /Toggle Arabic/i }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.goto('/cars', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Drop the persisted cookie so it does not leak into other specs; a fresh
    // load must come back in English.
    await page.context().clearCookies();
    await page.goto('/cars', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('MK-21: an out-of-range ?page= lands on the last page, not an empty grid', async ({ page }) => {
    await page.goto('/cars?page=999', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Page \d+ \/ \d+/)).toBeVisible({ timeout: 15000 });
    const label = await page.getByText(/Page \d+ \/ \d+/).textContent();
    const [, current, total] = label!.match(/Page (\d+) \/ (\d+)/)!;
    expect(current).toBe(total);
    expect(page.url()).not.toContain('page=999');
    await expect(page.locator('a[href^="/cars/"]').first()).toBeVisible();
  });

  test('QA-LOCAL-01: an unverified dealer has no public storefront', async ({ page }) => {
    const response = await page.goto('/dealers/uaq-family-motors', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(404);
  });
});
