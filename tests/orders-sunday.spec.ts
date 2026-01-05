import { test, expect } from '@playwright/test';

function nextSundayISO() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = (7 - day) % 7 || 7; // next Sunday (not today)
  now.setDate(now.getDate() + daysUntilSunday);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

test('API rejects orders with Sunday delivery date', async ({ request }) => {
  // Fetch one product to include in order
  const productsRes = await request.get('/api/products?limit=1&offset=0');
  const productsJson = await productsRes.json();
  const firstProduct = (productsJson?.products ?? [])[0];
  if (!firstProduct) test.skip();

  const sundayIso = nextSundayISO();

  const orderPayload = {
    products: [{ id: firstProduct.id, quantity: 1 }],
    delivery: {
      deliveryDate: sundayIso,
      deliveryTimeSlot: '11:00-17:00',
      fullAddress: 'Test adres',
      district: firstProduct.category || 'Test',
      recipientName: 'Test Alıcı',
      recipientPhone: '5550000000'
    },
    payment: { method: 'credit_card', status: 'pending' },
  };

  const res = await request.post('/api/orders', { data: orderPayload });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/Pazar/);
});