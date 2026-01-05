import { test, expect } from '@playwright/test';

async function expectJson(response: any, label: string) {
  expect(response, `${label}: no response`).toBeTruthy();
  expect(response.ok(), `${label}: HTTP ${response.status()}`).toBeTruthy();
  const contentType = response.headers()['content-type'] || '';
  expect(contentType.includes('application/json'), `${label}: expected JSON content-type, got ${contentType}`).toBeTruthy();
  return response.json();
}

test('API smoke (products, categories, reviews, auth/otp) does not 500', async ({ request }) => {
  // Categories
  const categories = await expectJson(await request.get('/api/categories?all=true'), 'GET /api/categories?all=true');
  expect(Array.isArray(categories?.categories), 'categories.categories must be an array').toBeTruthy();

  // Products
  const products = await expectJson(await request.get('/api/products?limit=5&offset=0'), 'GET /api/products?limit=5');
  expect(Array.isArray(products?.products), 'products.products must be an array').toBeTruthy();

  const firstProduct = (products?.products ?? [])[0];
  if (firstProduct?.id != null) {
    // Product by id
    await expectJson(await request.get(`/api/products/${firstProduct.id}`), 'GET /api/products/:id');

    // Review stats for product (should succeed even if 0 reviews)
    await expectJson(await request.get(`/api/reviews/stats/${firstProduct.id}`), 'GET /api/reviews/stats/:productId');
  }

  // Reviews list
  const reviews = await expectJson(await request.get('/api/reviews?limit=5&offset=0'), 'GET /api/reviews');
  const firstReview = (reviews?.data ?? reviews?.reviews ?? [])[0];
  if (firstReview?.id != null) {
    await expectJson(await request.get(`/api/reviews/${firstReview.id}`), 'GET /api/reviews/:reviewId');
  }

  // Settings (public)
  await expectJson(await request.get('/api/settings'), 'GET /api/settings');

  // Auth session (should be 200 even if anonymous)
  await expectJson(await request.get('/api/auth/session'), 'GET /api/auth/session');

  // Customer OTP endpoints: only negative tests (no email send / no DB mutation expected)
  // verify endpoints should respond 400/401 for non-existent OTP, but never 500.
  const bogusEmail = `smoke-${Date.now()}@example.com`;
  const bogusCode = '000000';

  const otpVerifyEndpoints = [
    '/api/customers/login/verify',
    '/api/customers/register/verify',
    '/api/customers/password-reset/validate-otp',
    '/api/customers/password-reset/verify',
  ];

  for (const url of otpVerifyEndpoints) {
    const res = await request.post(url, { data: { email: bogusEmail, code: bogusCode } });
    expect([200, 400, 401, 403].includes(res.status()), `${url}: unexpected status ${res.status()}`).toBeTruthy();
  }

  // Legacy auth endpoints (email/password) — negative check only
  {
    const res = await request.post('/api/auth/login', { data: { email: bogusEmail, password: 'wrong' } });
    expect([200, 400, 401, 403].includes(res.status()), `/api/auth/login: unexpected status ${res.status()}`).toBeTruthy();
  }
});
