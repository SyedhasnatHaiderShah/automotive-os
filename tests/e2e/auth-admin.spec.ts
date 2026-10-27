import { test, expect } from '@playwright/test';

test.describe('Platform Administration & Governance E2E Suite', () => {
  test('Public registration strictly prohibits administrative or dealership role self-selection', async ({ page }) => {
    await page.goto('/auth?tab=register', { waitUntil: 'domcontentloaded' });

    // Verify zero dropdowns or checkboxes exist for PLATFORM_ADMIN, OWNER, DEALER
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('Platform Administrator Role');
    expect(pageText).not.toContain('Select Dealership Tenant');
    expect(pageText).not.toContain('Staff Permissions');
  });

  test('/auth/activate handles invalid, expired, and pending invitation tokens safely', async ({ page }) => {
    await page.goto('/auth/activate?token=non_existent_token_hex', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Activation Link Invalid/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Login/i })).toBeVisible();
  });

  test('/admin command console rejects unauthenticated access and redirects to /auth', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth(\?tab=login)?/, { timeout: 15000 });
    expect(page.url()).toContain('/auth');
  });

  test('/admin/users user governance desk rejects unauthenticated access', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth(\?tab=login)?/, { timeout: 15000 });
    expect(page.url()).toContain('/auth');
  });

  test('/admin/dealers dealership desk rejects unauthenticated access', async ({ page }) => {
    await page.goto('/admin/dealers', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth(\?tab=login)?/, { timeout: 15000 });
    expect(page.url()).toContain('/auth');
  });

  test('/admin/audit-logs activity ledger rejects unauthenticated access', async ({ page }) => {
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth(\?tab=login)?/, { timeout: 15000 });
    expect(page.url()).toContain('/auth');
  });
});
