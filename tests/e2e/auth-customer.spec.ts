import { test, expect } from '@playwright/test';

test.describe('Customer Authentication & Lifecycle E2E Suite', () => {
  test('Customer Portal (/auth) renders Obsidian Studio Glass layout and tab switching', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    // Verify title and branding in header
    await expect(page.locator('header').getByText('AUTOMOTIVE', { exact: false })).toBeVisible();

    // Verify Tab buttons
    const signInTab = page.getByRole('button', { name: 'Sign In', exact: true });
    const registerTab = page.getByRole('button', { name: /Customer Signup/i });

    await expect(signInTab).toBeVisible();
    await expect(registerTab).toBeVisible();

    // Switch to Register
    await registerTab.click();
    await expect(page.getByText(/UAE Federal Decree-Law No\. 45\/2021/i)).toBeVisible();

    // Switch back to Login
    await signInTab.click();
    await expect(page.getByPlaceholder('user@autonexa.ae')).toBeVisible();
  });

  test('Registration requires mandatory PDPL checkbox agreement', async ({ page }) => {
    await page.goto('/auth?tab=register', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Customer Signup/i }).click();

    await page.fill('input[placeholder="e.g. Sultan Al Qasimi"]', 'Test Buyer Consent');
    await page.fill('input[placeholder="client@domain.ae"]', `consent_${Date.now()}@autonexa.ae`);
    await page.fill('input[placeholder="••••••••••••"]', 'StrongPass123!@#');

    // Submit button should be disabled without PDPL consent
    const submitBtn = page.getByRole('button', { name: /Complete Registration/i });
    await expect(submitBtn).toBeDisabled();

    // Check the PDPL agreement checkbox
    await page.check('input[type="checkbox"]');
    await expect(submitBtn).toBeEnabled();
  });

  test('Password checklist indicates complexity requirements', async ({ page }) => {
    await page.goto('/auth?tab=register', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Customer Signup/i }).click();

    const passwordInput = page.getByPlaceholder('••••••••••••');
    await passwordInput.fill('short');

    // Verify complexity checklist items are rendered
    await expect(page.getByText('10+ Characters')).toBeVisible();
    await expect(page.getByText('Uppercase Letter')).toBeVisible();
    await expect(page.getByText('Lowercase Letter')).toBeVisible();
    await expect(page.getByText('Number & Special Symbol')).toBeVisible();

    // Fill valid password
    await passwordInput.fill('ValidStrongPass123!@#');
    const submitBtn = page.getByRole('button', { name: /Complete Registration/i });
    // Still disabled because PDPL not checked
    await expect(submitBtn).toBeDisabled();
  });

  test('/auth/verify-email displays token verification and resend states', async ({ page }) => {
    // Navigate with invalid/missing token
    await page.goto('/auth/verify-email', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Email Verification/i })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your registered email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Verification Link/i })).toBeVisible();

    // Navigate with fake token
    await page.goto('/auth/verify-email?token=invalid_test_token_99999', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Verification Unsuccessful/i })).toBeVisible();
  });

  test('Post-auth /dashboard resolver redirects unauthenticated users to /auth', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth/, { timeout: 10000 });
    expect(page.url()).toContain('/auth');
  });

  test('Arabic RTL localization renders correctly', async ({ page }) => {
    await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });

    const langToggle = page.getByRole('button', { name: /العربية/i });
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await expect(page.locator('div[dir="rtl"]')).toBeVisible();
      await expect(page.getByText('تسجيل الدخول الموحد')).toBeVisible();
    }
  });
});
