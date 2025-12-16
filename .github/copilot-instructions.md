# Vadiler Çiçek E-commerce - AI Development Guide

## Architecture Overview

**Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Cloudinary  
**Database**: File-based JSON storage in `/src/data/` (products.json, orders.json, customers.json)  
**State Management**: React Context (CartContext, CustomerContext, OrderContext, PreloaderContext)

## Critical Data Patterns

### Product Structure
- **Main files**: `src/data/products.ts` (37k+ lines, 1033+ products) & `products.json` (sync'd copy)
- **Images**: All migrated to Cloudinary (`res.cloudinary.com/dgdl1vdao/`) - **never use local `/public/products/` paths**
- **API Sync**: API routes read/write JSON, TypeScript file is the source of truth but JSON is operational

### Order Number System
- **Format**: 6-digit sequential (100001, 100002, etc.) 
- **Counter**: `src/data/orderCounter.json` - increment on new orders
- **API**: `POST /api/orders` auto-generates numbers

## Development Workflows

### Local Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build  
npm run lint         # ESLint check
```

### Data Migration Scripts (`/scripts/`)
- `migrate-to-cloudinary.js` - Image uploads (already completed)
- `update-data-with-cloudinary.js` - URL replacement in JSON files
- `add-order-numbers.js` - Retrofit order numbering system
- `convert-to-vadiler.js` - External data import and transformation

## Component Conventions

### Context Usage Pattern
```tsx
// Always wrap components needing cart/customer state
const { state, addToCart } = useCart();
const { currentCustomer, addToFavorites } = useCustomer();
```

### Image Handling
- **Product images**: Use Cloudinary URLs from product data
- **Next.js Image**: Configure `remotePatterns` in `next.config.ts` for external domains
- **Error handling**: Components have `imageError` state for fallbacks

### Animation Patterns
- **Framer Motion**: Stagger animations with `index * 0.1` delays
- **Preloader**: Complex logo animation system with position registration
- **GSAP**: Used for advanced animations (registered via `@gsap/react`)

## File-Based Database Rules

### Reading Data
- **API routes**: Import from JSON files for runtime operations
- **Components**: Import from TypeScript files for type safety
- **Sync**: JSON and TS files must stay synchronized

### Writing Data
```tsx
// API pattern for data updates
const jsonPath = path.join(process.cwd(), 'src', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
// ... modify products
fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
```

## Admin Area (`/src/app/yonetim/`)
- **Authentication**: File-based with `AuthContext`
- **Theme**: Dark/light toggle via `ThemeContext` 
- **Layout**: Responsive sidebar with role-based navigation
- **Data Management**: Direct file manipulation through API routes

## Turkish E-commerce Specifics
- **Delivery zones**: Istanbul districts in `istanbul-districts.ts`
- **Locale**: Turkish (tr_TR) with SEO optimization
- **Payment**: iyzico integration placeholders
- **Address system**: Province > District > Neighborhood hierarchy

## Performance Notes
- **Image optimization**: Cloudinary automatic optimization
- **Data loading**: 1000+ products require pagination/virtualization consideration
- **Context splitting**: Separate contexts prevent unnecessary re-renders
- **Standalone build**: Next.js configured for containerized deployment

## Integration Points
- **Cloudinary**: Image CDN and transformation service
- **External data sources**: Scripts handle import from various e-commerce platforms
- **API structure**: RESTful endpoints in `/src/app/api/` mirror data file structure