import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'vadiler_user',
      JSON.stringify({
        email: 'admin@vadiler.com',
        name: 'Admin',
        role: 'admin',
        loginTime: Date.now(),
      })
    );
  });
});

test('admin pages load (smoke)', async ({ page }) => {
  await page.goto('/yonetim');
  await expect(page).toHaveURL(/\/yonetim(\/)?$/);

  // Sidebar menu items from admin layout
  await expect(page.getByRole('link', { name: 'Ürünler' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kategoriler' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Siparişler' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Müşteriler' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ayarlar' })).toBeVisible();

  await page.goto('/yonetim/urunler');
  await expect(page.getByRole('heading', { name: 'Ürünler' })).toBeVisible();

  await page.goto('/yonetim/kategoriler');
  await expect(page.getByRole('heading', { name: 'Kategoriler' })).toBeVisible();

  await page.goto('/yonetim/siparisler');
  await expect(page.getByRole('heading', { name: 'Siparişler' })).toBeVisible();

  await page.goto('/yonetim/musteriler');
  await expect(page.getByRole('heading', { name: /Müşteriler/ })).toBeVisible();

  await page.goto('/yonetim/ayarlar');
  await expect(page.getByRole('heading', { name: 'Ayarlar' })).toBeVisible();
});
