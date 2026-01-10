# Vadiler Çiçek - AI Coding Agent Guide

## Project Overview

Next.js 16 (App Router) e-commerce platform for flower delivery in Istanbul. Uses Supabase PostgreSQL, Cloudinary CDN (zero transformation mode), and Context API for state management.

## Architecture & Data Flow

### Core Stack

- **Framework**: Next.js 16 App Router with TypeScript (strict mode disabled in tsconfig)
- **Database**: Supabase (PostgreSQL) with snake_case schema
- **State**: React Context API via `ClientRoot.tsx` wrapping hierarchy: `AnalyticsProvider` → `CustomerProvider` → `OrderProvider` → `CartProvider`
- **Images**: Cloudinary with custom loader that passes URLs unchanged (CSS handles sizing)
- **Styling**: Tailwind CSS 4 + Framer Motion + GSAP

### Database Convention

**Critical**: Supabase uses `snake_case` fields; Frontend uses `camelCase`. Always transform:

- **API responses**: Use `transformProduct()`, `toCamelCase()` from `src/lib/transformers.ts` and `src/lib/supabase/transformer.ts`
- **API requests**: Use `toSnakeCase()` before Supabase operations
- Products merge `categories[]`, `occasion_tags[]`, and primary `category` field via `transformProduct()`

### Supabase Clients

- **Client-side**: `src/lib/supabase/client.ts` - uses anon key, RLS enforced
- **Server-side admin**: `src/lib/supabase/admin.ts` - uses `SUPABASE_SERVICE_KEY`, bypasses RLS
- **Direct SQL**: `src/lib/supabase/server.ts` - postgres driver for raw queries

Use `supabaseAdmin` only in API routes (`src/app/api/**`) for admin operations.

## Development Workflow

### Running the App

```powershell
npm run dev            # Development server (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint check
npm run test:admin     # Playwright E2E tests
npm run test:unit      # Vitest unit tests
```

### Admin Access Pattern

Admin panel at `/yonetim` requires localStorage auth token:

```javascript
localStorage.setItem(
  "vadiler_user",
  JSON.stringify({
    email: "bilgi@vadiler.com",
    name: "Admin",
    role: "admin",
    loginTime: Date.now(),
  })
);
```

### Data Seeding

**First run**: Import products/categories via admin panel `/yonetim/bulk-import` or API:

```powershell
curl -X POST http://localhost:3000/api/admin/bulk-import-products
curl -X POST http://localhost:3000/api/admin/bulk-import-categories
```

## Key Patterns & Conventions

### State Management Access

Import context hooks:

```typescript
import { useCart } from "@/context/CartContext"; // Cart operations
import { useCustomer } from "@/context/CustomerContext"; // Auth, favorites
import { useOrder } from "@/context/OrderContext"; // Order flow
import { useAnalytics } from "@/context/AnalyticsContext"; // Tracking
```

### File Naming

- Exclude patterns in tsconfig: `**/*.supabase.ts`, `**/*.old.ts`, `**/*.backup.ts`
- Admin routes: `/yonetim/**` (Turkish for "management")
- API routes: `/api/**` return snake_case responses (transform before sending)

### Environment Variables

Required for development (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Testing Strategy

- **E2E**: Playwright tests in `tests/` (admin smoke tests, cart flows, routing)
- **Unit**: Vitest in `tests/unit/` (data transformers)
- Base URL: `http://localhost:3000` (override via `PLAYWRIGHT_BASE_URL`)

## Critical Implementation Notes

### Cloudinary Image Optimization

Custom loader in `src/lib/cloudinary-loader.ts` uses automatic transformations for optimal performance:
- `f_auto`: Automatic format selection (WebP/AVIF based on browser)
- `q_auto`: Automatic quality optimization  
- `w_{width}`: Responsive sizing based on viewport
- Saves ~70% file size vs original images
- **Required**: All `<Image>` components must include proper `sizes` attribute

### Video Loading Strategy

Videos use lazy loading to prevent loading 7.8 MB eagerly:
- `preload="none"` attribute on all `<video>` elements
- `poster` attribute with fallback (hoverImage or gallery[0])
- `useVideoLazyLoad` hook uses IntersectionObserver (50px rootMargin)
- Videos only load when entering viewport

### Third-Party Scripts

Facebook Pixel and Google Analytics use `strategy="lazyOnload"`:
- Scripts defer until page interactive
- Reduces initial bundle by ~49 KiB
- Located in `src/app/layout.tsx`

### TypeScript Configuration

`strict: false` in tsconfig - project trades type safety for development speed. Expect minimal type checking.

### Middleware Scope

`src/middleware.ts` adds `X-Robots-Tag: noindex` only to sensitive routes (`/api`, `/yonetim`, `/hesabim`, `/sepet`, `/payment`).

### Scheduled Tasks

`vercel.json` defines crons:

- Order automation: every minute (`/api/orders/automation`)
- Payment verification: every 5 minutes (`/api/cron/verify-payments`)

### Product Categories

Products auto-include `dogum-gunu-hediyeleri` (birthday gifts) secondary category via `transformProduct()`. Check `src/lib/transformers.ts` before modifying category logic.

## Common Tasks

**Add new API endpoint**: Create in `src/app/api/[name]/route.ts`, use `supabaseAdmin` for DB ops, transform results via `toCamelCase()`

**Add context state**: Modify relevant context in `src/context/`, ensure provider wraps children in `ClientRoot.tsx`

**New admin page**: Add to `src/app/yonetim/`, auth handled by layout's localStorage check

**Deploy**: Vercel auto-deployment from git. Ensure all env vars set, run bulk import post-deploy.
