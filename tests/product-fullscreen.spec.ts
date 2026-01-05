import { test, expect } from '@playwright/test';

test('product image enters fullscreen or opens modal when Tam ekran clicked', async ({ page, request }) => {
  // Ensure desktop viewport so desktop gallery is visible
  await page.setViewportSize({ width: 1280, height: 800 });

  // Fetch one product to navigate to
  const productsRes = await request.get('/api/products?limit=1&offset=0');
  const productsJson = await productsRes.json();
  const firstProduct = (productsJson?.products ?? [])[0];
  if (!firstProduct) {
    test.skip();
    return;
  }

  const url = `/${firstProduct.category}/${firstProduct.slug}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for gallery Tam ekran button
  const fsButton = page.getByRole('button', { name: /Tam ekran/i }).first();
  await expect(fsButton).toBeVisible();

  // Click the button (user gesture) and then check fullscreen or modal fallback
  await fsButton.click();

  // Give the browser a moment to enter fullscreen or open modal
  await page.waitForTimeout(300);

  const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
  if (!isFullscreen) {
    // Fallback check: modal overlay should be visible
    const modal = page.locator('.fixed.inset-0.z-\[120\].bg-black\/90');
    await expect(modal).toBeVisible();
  } else {
    expect(isFullscreen).toBeTruthy();
  }
});