# Deployment Guide - Vadiler Çiçek E-commerce

## Overview
This guide covers deploying the Vadiler Çiçek e-commerce application to production, specifically addressing the 404 errors on category and product pages.

## Root Cause of 404 Errors

The 404 errors on production are caused by:

1. **Missing Supabase Configuration**: The application requires Supabase environment variables to fetch data
2. **Empty Database**: Even with configuration, the Supabase database needs to be populated with products and categories
3. **Missing Site URL**: The `NEXT_PUBLIC_SITE_URL` environment variable is required for server-side API calls

## Prerequisites

Before deployment, you need:

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Vercel Account** (recommended): For easy Next.js deployment
3. **Cloudinary Account** (optional): Images are already migrated to Cloudinary CDN

## Step-by-Step Setup

### 1. Supabase Database Setup

#### A. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Choose organization and enter project details
4. Wait for project to be created (takes ~2 minutes)

#### B. Get API Credentials

1. Go to Project Settings > API
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

#### C. Create Database Tables

Run the SQL scripts in the `supabase/migrations/` directory to create tables:

```sql
-- Execute in Supabase SQL Editor
-- Tables needed: products, categories, orders, customers, coupons
```

Alternatively, use the Supabase CLI:
```bash
npx supabase db push
```

### 2. Environment Variables Configuration

#### For Local Development

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# Required - From Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required - Your site URL (use http for local, https for production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional - Email & Cloudinary config
```

#### For Production (Vercel)

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add all variables from `.env.example`
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g., `https://vadiler.com`)
4. Click "Save"

### 3. Data Migration

⚠️ **Important Prerequisites:**
1. Supabase must be configured (environment variables set)
2. Database tables must be created first (see Step 1.C above)
3. Application must be deployed and accessible

Once Supabase is configured and database tables exist, populate the database with products and categories:

#### Option A: Using Admin Panel (Recommended)

1. Deploy the application first (even if it shows 404s)
2. Go to `https://your-domain.com/yonetim/bulk-import`
3. Login with admin credentials
4. Click "Import Products" and "Import Categories"
5. Wait for import to complete (~1000 products takes 30-60 seconds)

#### Option B: Using API Directly

```bash
# Import products
curl -X POST https://your-domain.com/api/admin/bulk-import-products

# Import categories
curl -X POST https://your-domain.com/api/admin/bulk-import-categories

# Import customers (if needed)
curl -X POST https://your-domain.com/api/admin/bulk-import-customers

# Import orders (if needed)
curl -X POST https://your-domain.com/api/admin/bulk-import-orders
```

### 4. Verify Deployment

After setup, verify these endpoints:

1. **Categories API**: `https://your-domain.com/api/categories`
   - Should return JSON with categories array
   
2. **Products API**: `https://your-domain.com/api/products`
   - Should return JSON with products array
   
3. **Category Page**: `https://your-domain.com/aranjmanlar`
   - Should show products in the "Aranjmanlar" category
   
4. **Product Page**: `https://your-domain.com/aranjmanlar/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani`
   - Should show product details

## Common Issues & Solutions

### Issue: "supabaseUrl is required" Error

**Cause**: Missing environment variables

**Solution**: 
1. Verify `.env.local` exists and has correct values
2. In Vercel, check Environment Variables are set
3. Redeploy after adding variables

### Issue: 404 on Category/Product Pages

**Cause**: Empty Supabase database

**Solution**:
1. Run bulk import (see Step 3)
2. Verify data exists: Check Supabase Dashboard > Table Editor
3. Check API endpoints return data

### Issue: API Calls Fail with CORS Errors

**Cause**: Wrong `NEXT_PUBLIC_SITE_URL`

**Solution**:
1. Set correct domain in environment variables
2. Don't include trailing slash
3. Use `https://` in production

### Issue: Build Fails in CI/CD

**Cause**: Missing environment variables during build

**Solution**:
1. Build-time variables need `NEXT_PUBLIC_` prefix
2. Add placeholder values for build if needed
3. Actual values used at runtime from environment

## Deployment Platforms

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo in Vercel dashboard
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t vadiler-app .
docker run -p 3000:3000 --env-file .env.local vadiler-app
```

### Traditional Server

```bash
# Build
npm run build

# Start
npm start

# Or use PM2
pm2 start npm --name "vadiler" -- start
```

## Database Backup & Sync

The application maintains dual data sources:
- **JSON files** (`src/data/*.json`) - Source of truth for bulk import
- **Supabase** - Runtime database

To sync JSON → Supabase:
```bash
# Visit admin panel
/yonetim/bulk-import

# Or use API
curl -X POST https://your-domain.com/api/admin/bulk-import-products
```

## Security Checklist

- [ ] `SUPABASE_SERVICE_KEY` is kept secret (not exposed to client)
- [ ] Supabase Row Level Security (RLS) policies enabled
- [ ] Admin routes protected with authentication
- [ ] HTTPS enabled in production
- [ ] Environment variables not committed to Git

## Performance Optimization

1. **Enable Supabase Connection Pooling**
   - Settings > Database > Connection pooling

2. **Configure CDN Caching**
   - Static assets cached at edge
   - API routes use `Cache-Control` headers

3. **Image Optimization**
   - Already using Cloudinary CDN
   - Automatic format conversion (WebP)

## Monitoring

1. **Supabase Dashboard**
   - Database performance
   - API usage
   - Error logs

2. **Vercel Analytics** (if using Vercel)
   - Page views
   - Web vitals
   - User metrics

3. **Application Logs**
   - Check console for errors
   - Monitor API response times

## Support

If issues persist:
1. Check Supabase logs: Dashboard > Logs > API
2. Check Vercel logs: Dashboard > Your Project > Logs
3. Verify environment variables are set correctly
4. Test API endpoints directly with curl/Postman

## Next Steps

After successful deployment:
1. Set up custom domain
2. Configure email notifications
3. Enable SSL certificate
4. Set up backups
5. Monitor performance
6. Add analytics tracking
