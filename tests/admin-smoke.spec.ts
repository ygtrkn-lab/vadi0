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

test('admin pages load (smoke)', async ({ page }) => {
  await page.goto('/yonetim');
  await expect(page).toHaveURL(/\/yonetim(\/)?$/);

  const sidebarNav = page.getByRole('navigation');

  // Sidebar menu items from admin layout
  await expect(sidebarNav.getByRole('link', { name: 'Ürünler' })).toBeVisible();
  await expect(sidebarNav.getByRole('link', { name: 'Kategoriler' })).toBeVisible();
  await expect(sidebarNav.getByRole('link', { name: 'Siparişler' })).toBeVisible();
  await expect(sidebarNav.getByRole('link', { name: 'Müşteriler' })).toBeVisible();
  await expect(sidebarNav.getByRole('link', { name: 'Ayarlar' })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/yonetim\/urunler(\/)?$/, { timeout: 30_000 }),
    sidebarNav.getByRole('link', { name: 'Ürünler' }).click({ force: true }),
  ]);
  await expect(page.getByRole('heading', { name: 'Ürünler' })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/yonetim\/kategoriler(\/)?$/, { timeout: 30_000 }),
    sidebarNav.getByRole('link', { name: 'Kategoriler' }).click({ force: true }),
  ]);
  await expect(page.getByRole('heading', { name: 'Kategoriler' })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/yonetim\/siparisler(\/)?$/, { timeout: 30_000 }),
    sidebarNav.getByRole('link', { name: 'Siparişler' }).click({ force: true }),
  ]);
  await expect(page.getByRole('heading', { name: 'Siparişler' })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/yonetim\/musteriler(\/)?$/, { timeout: 30_000 }),
    sidebarNav.getByRole('link', { name: 'Müşteriler' }).click({ force: true }),
  ]);
  await expect(page.getByRole('heading', { name: /Müşteriler/ })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/yonetim\/ayarlar(\/)?$/, { timeout: 60_000 }),
    sidebarNav.getByRole('link', { name: 'Ayarlar' }).click({ force: true }),
  ]);
  await expect(page.getByRole('heading', { name: 'Ayarlar' })).toBeVisible({ timeout: 60_000 });
});
