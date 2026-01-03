import { test, expect } from '@playwright/test';

function nextSundayLocalISO() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = (7 - day) % 7 || 7; // next Sunday
  now.setDate(now.getDate() + daysUntilSunday);
  now.setHours(0, 0, 0, 0);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

test('Cart UI blocks Sunday delivery selection', async ({ page, request }) => {
  // Add a product to cart
  const productsRes = await request.get('/api/products?limit=1&offset=0');
  const productsJson = await productsRes.json();
  const firstProduct = (productsJson?.products ?? [])[0];
  if (!firstProduct) test.skip();

  await page.goto(`/${firstProduct.category}/${firstProduct.slug}`, { waitUntil: 'networkidle' });
  // Add to cart
  const addBtn = page.getByRole('button', { name: /Sepete Ekle|Sepete Eklendi/i }).first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  // Go to cart
  await page.goto('/sepet', { waitUntil: 'networkidle' });

  // Proceed to recipient step
  const proceedBtn = page.getByRole('button', { name: 'İleri' }).first();
  await expect(proceedBtn).toBeVisible();
  await proceedBtn.click();

  // Wait for recipient step to load and find date input
  const dateInput = page.locator('#delivery-date');
  await expect(dateInput).toBeVisible();

  const sunday = nextSundayLocalISO();
  await dateInput.fill(sunday);
  // blur to trigger validation
  await dateInput.blur();

  // Error message should appear referencing Pazar
  const err = page.getByText(/Pazar günleri teslimat/);
  await expect(err).toBeVisible();

  // Trying to proceed should not advance to next step
  await proceedBtn.click();
  // Remain on recipient step: message header not visible
  const messageHeader = page.getByText('Sevdiklerinize Ne Söylemek İstersiniz?');
  await expect(messageHeader).not.toBeVisible();
});