# Troubleshooting 404 Errors on Category and Product Pages

## Problem Statement

After deployment, category pages (e.g., `/aranjmanlar`) and product pages (e.g., `/aranjmanlar/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani`) return 404 errors in production, even though they work locally.

## Root Causes

### 1. Environment Variables Not Set

**Symptoms:**
- 404 on all category/product pages
- Console errors: "supabaseUrl is required"
- API endpoints return 500 errors

**Diagnosis:**
```bash
# Test API endpoint
curl https://your-domain.com/api/products

# Expected error response:
{"error": "supabaseUrl is required"}
```

**Fix:**
1. Add environment variables in your deployment platform (Vercel/Netlify/etc.)
2. Required variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_KEY=eyJxxx...
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
3. Redeploy the application

### 2. Empty Supabase Database

**Symptoms:**
- API endpoints return empty arrays: `{"products": []}`
- No errors in console
- Category pages show "No products found" or 404

**Diagnosis:**
```bash
# Test products API
curl https://your-domain.com/api/products

# Empty response:
{"products": [], "total": 0}

# Check categories API
curl https://your-domain.com/api/categories

# Empty response:
{"categories": [], "total": 0}
```

**Fix:**
Use the bulk import endpoints to populate the database:

```bash
# Method 1: Via Admin Panel
# 1. Go to https://your-domain.com/yonetim/bulk-import
# 2. Login with admin credentials
# 3. Click "Import Products" and "Import Categories"

# Method 2: Direct API Call
curl -X POST https://your-domain.com/api/admin/bulk-import-products
curl -X POST https://your-domain.com/api/admin/bulk-import-categories
```

### 3. Wrong NEXT_PUBLIC_SITE_URL

**Symptoms:**
- API calls fail with network errors
- Server-side rendering fails
- Inconsistent behavior between pages

**Diagnosis:**
```bash
# Check if site URL is set correctly
# In Next.js app, the pages use:
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
```

**Fix:**
1. Set `NEXT_PUBLIC_SITE_URL` to your actual domain
2. No trailing slash: `https://vadiler.com` (not `https://vadiler.com/`)
3. Use HTTPS in production
4. Redeploy after changing

### 4. Dynamic Routes Not Generated at Build Time

**Symptoms:**
- Some pages work, others show 404
- Static paths work, dynamic paths fail
- ISR (Incremental Static Regeneration) not working

**Diagnosis:**
Check build logs for:
```
Route (app)
├ ƒ /[category]           <- Dynamic route (force-dynamic)
├ ƒ /[category]/[slug]    <- Dynamic route (force-dynamic)
```

**Fix:**
The app uses `force-dynamic` for category and product pages, which is correct. No fix needed - this is by design to reduce build time with 1000+ products.

## Verification Checklist

After applying fixes, verify in this order:

### Step 1: Environment Variables
```bash
# On your deployment platform, ensure these are set:
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_KEY
✓ NEXT_PUBLIC_SITE_URL
```

### Step 2: API Endpoints
```bash
# Test categories endpoint
curl https://your-domain.com/api/categories
# Expected: {"categories": [...], "total": 18}

# Test products endpoint  
curl https://your-domain.com/api/products
# Expected: {"products": [...], "total": 1033}
```

### Step 3: Database Tables
1. Go to Supabase Dashboard > Table Editor
2. Check these tables have data:
   - `products` (should have 1033 rows)
   - `categories` (should have 18 rows)

### Step 4: Page Routes
```bash
# Test a category page
curl -I https://your-domain.com/aranjmanlar
# Expected: HTTP 200 OK

# Test a product page
curl -I https://your-domain.com/aranjmanlar/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani
# Expected: HTTP 200 OK
```

## Advanced Debugging

### Enable Debug Logging

Add to API routes for detailed logs:

```typescript
// src/app/api/products/route.ts
export async function GET(request: NextRequest) {
  console.log('🔍 API Request:', request.url);
  console.log('🔍 Environment:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
  });
  // ... rest of code
}
```

### Check Supabase Connection

```typescript
// Add test endpoint: src/app/api/test/route.ts
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    return Response.json({
      connected: !error,
      error: error?.message,
      hasData: !!data?.length,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
```

### Check Page Generation

```typescript
// src/app/[category]/page.tsx - Add logging
export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  
  console.log('📄 Rendering category page:', category);
  const { category: categoryData, products } = await getCategoryData(category);
  console.log('📊 Found products:', products.length);
  
  // ... rest of code
}
```

## Quick Fix Script

Create a verification script to test all components:

```bash
#!/bin/bash
# verify-deployment.sh

DOMAIN="https://your-domain.com"

echo "🔍 Testing Vadiler Deployment..."

# Test APIs
echo "\n1. Testing Products API..."
curl -s "$DOMAIN/api/products" | grep -q "products" && echo "✅ Products API works" || echo "❌ Products API failed"

echo "\n2. Testing Categories API..."
curl -s "$DOMAIN/api/categories" | grep -q "categories" && echo "✅ Categories API works" || echo "❌ Categories API failed"

# Test Pages
echo "\n3. Testing Category Page..."
curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/aranjmanlar" | grep -q "200" && echo "✅ Category page works" || echo "❌ Category page failed"

echo "\n4. Testing Product Page..."
curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/aranjmanlar/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani" | grep -q "200" && echo "✅ Product page works" || echo "❌ Product page failed"

echo "\n✨ Verification complete!"
```

## Emergency Rollback

If issues persist:

1. **Use Static Data (Temporary Fix)**
   - Revert API routes to read from JSON files
   - See `src/app/api/products/route.old.ts` for example
   
2. **Disable Dynamic Rendering**
   ```typescript
   // Change in category/product pages:
   export const dynamic = 'force-static'; // Instead of 'force-dynamic'
   ```

3. **Add Error Boundaries**
   ```typescript
   // Wrap pages with error boundary to show friendly message
   if (!products || products.length === 0) {
     return <ErrorPage message="Products temporarily unavailable" />;
   }
   ```

## Contact Support

If none of the above solutions work:

1. **Check Server Logs**
   - Vercel: Dashboard > Your Project > Logs
   - Other: Check application logs

2. **Supabase Logs**
   - Dashboard > Logs > API
   - Look for failed queries or connection issues

3. **Network Tab**
   - Open browser DevTools > Network
   - Check for failed API requests
   - Look at request/response details

4. **Verify DNS**
   - Ensure domain points to correct server
   - Check SSL certificate is valid
   - Test with `dig` or `nslookup`

## Success Indicators

Your deployment is successful when:

- ✅ All API endpoints return data
- ✅ Category pages load with products
- ✅ Product pages show details
- ✅ No console errors about Supabase
- ✅ Images load from Cloudinary CDN
- ✅ Server-side rendering works (view page source shows product data)
