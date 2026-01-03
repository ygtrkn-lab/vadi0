import { test, expect } from '@playwright/test';

async function gotoAndAssertOk(page: any, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `No response for ${path}`).toBeTruthy();
  expect(response!.ok(), `Non-OK HTTP status for ${path}: ${response!.status()}`).toBeTruthy();

  // Avoid false positives on Next.js error overlays / 404 pages.
  await expect(page.getByText('Unhandled Runtime Error')).toHaveCount(0);
  await expect(page.getByText('Application error: a client-side exception has occurred')).toHaveCount(0);
  await expect(page.getByText('This page could not be found')).toHaveCount(0);
  await expect(page.getByText(/^404$/)).toHaveCount(0);

  // Some pages/components may not wrap content in <main>.
  const main = page.locator('main');
  if (await main.count()) {
    await expect(main.first()).toBeVisible();
  } else {
    await expect(page.locator('body')).toBeVisible();
  }
}

test('public & SEO routes load (smoke)', async ({ page, request, baseURL }) => {
  // Fetch a real category slug from the running app (Supabase-backed)
  const categoriesRes = await request.get('/api/categories?all=true');
  expect(categoriesRes.ok(), 'GET /api/categories?all=true must succeed').toBeTruthy();
  const categoriesJson: any = await categoriesRes.json();
  const firstCategorySlug = (categoriesJson?.categories ?? [])
    .map((c: any) => c?.slug)
    .find((slug: any) => typeof slug === 'string' && slug.length > 0);

  expect(firstCategorySlug, 'At least one category slug must exist').toBeTruthy();

  // Use a known occasion slug (from src/data/special-days.ts)
  const occasion = 'sevgililer-gunu';
  const category = firstCategorySlug as string;

  // Fetch a real product to validate product detail route: /[category]/[slug]
  const productsRes = await request.get('/api/products?limit=1&offset=0');
  expect(productsRes.ok(), 'GET /api/products?limit=1 must succeed').toBeTruthy();
  const productsJson: any = await productsRes.json();
  const firstProduct = (productsJson?.products ?? [])[0];
  const productCategory = typeof firstProduct?.category === 'string' ? firstProduct.category : category;
  const productSlug = typeof firstProduct?.slug === 'string' ? firstProduct.slug : undefined;

  const routes = [
    '/',
    '/kategoriler',
    `/${category}`,

    '/ozel-gun',
    `/ozel-gun/${occasion}`,
    `/ozel-gun/${occasion}/${category}`,

    '/sehir/istanbul',
    `/sehir/istanbul/${occasion}`,

    '/rehber',
    '/rehber/cicek-siparisi-ipuclari',

    '/sepet',
    '/siparis-takip',
  ];

  if (productSlug) {
    routes.splice(3, 0, `/${productCategory}/${productSlug}`);
  }

  for (const path of routes) {
    // Make it easy to pinpoint the failing route in Playwright output.
    test.info().annotations.push({ type: 'route', description: `${baseURL ?? ''}${path}` });
    await gotoAndAssertOk(page, path);
  }
});
