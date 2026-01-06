import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'vadiler_user',
      JSON.stringify({
        email: 'bilgi@vadiler.com',
        name: 'Admin',
        role: 'admin',
        loginTime: Date.now(),
      })
    );
  });
});

test('admin order detail: open modal and trigger PDF download', async ({ page, context }) => {
  await page.goto('/yonetim/siparisler');
  await expect(page.getByRole('heading', { name: 'Siparişler' })).toBeVisible();

  // Open first order detail (depends on test data)
  const firstOrderRow = page.locator('button:has-text("Detay")').first();
  if (await firstOrderRow.count() === 0) {
    // fallback: click first .order-card or row
    const firstRowFallback = page.locator('[data-test="order-row"]').first();
    await firstRowFallback.click({ force: true });
  } else {
    await firstOrderRow.click({ force: true });
  }

  // Wait for the modal to appear
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  // Try to click PDF button and assert a download is triggered
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    modal.locator('button[title="PDF indir"]').click({ force: true })
  ]);

  const path = await download.path();
  expect(path).toBeTruthy();
});