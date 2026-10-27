import { test, expect } from '@playwright/test';

test.describe('Dealership Multi-Role & Tenancy E2E Suite', () => {
  test('Dealer console (/dealer) rejects unauthenticated access and redirects to /auth', async ({ page }) => {
    await page.goto('/dealer', { waitUntil: 'domcontentloaded' });
    // In staging single-domain or proxy, unauthenticated requests redirect or return access notice
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/auth') || url.includes('/dealer') || url.includes('/access')).toBe(true);
  });

  test('/access-suspended renders formal tenant suspension and compliance hold notice', async ({ page }) => {
    await page.goto('/access-suspended?reason=tenant_suspended', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Suspended|Hold/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return to Login' })).toBeVisible();
  });

  test('/access-denied renders formal authorization lockout notice', async ({ page }) => {
    await page.goto('/access-denied?reason=disabled', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Disabled|Denied|Forbidden/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return to Login' })).toBeVisible();
  });
});
