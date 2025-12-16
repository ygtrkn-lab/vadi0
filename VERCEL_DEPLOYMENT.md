# Vercel Deployment Guide

## 🚀 Hızlı Deployment

### 1. Environment Variables (Zorunlu)
Vercel Dashboard → Settings → Environment Variables'a ekle:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key

# iyzico Payment
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://api.iyzipay.com

# App
NEXT_PUBLIC_APP_URL=https://www.vadiler.com

# Cloudinary (if using)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dgdl1vdao
```

### 2. Vercel Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x

### 3. Deploy Commands

#### Option A: GitHub Integration (Önerilen)
```bash
# Push to main branch
git add .
git commit -m "fix: Payment completion 405 error"
git push origin main

# Vercel otomatik deploy edecek
```

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### 4. Domain Configuration
Vercel Dashboard'da:
1. **Domains** → Add `www.vadiler.com`
2. DNS kayıtlarını ekle:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. SSL otomatik oluşturulacak

---

## ✅ Post-Deployment Checklist

### Hemen Test Et
```bash
# 1. Health check
curl https://www.vadiler.com/api/health

# 2. Payment initialization test
curl -X POST https://www.vadiler.com/api/payment/initialize \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "orderId": "test-123"}'

# 3. GET handler test
curl "https://www.vadiler.com/api/payment/complete?token=test-token"
```

### Recovery Script Çalıştır
```bash
# Local'den Vercel production DB'ye bağlan
node scripts/recover-stuck-orders.mjs --check
node scripts/recover-stuck-orders.mjs --recover
```

### Monitoring
Vercel Dashboard'da:
- **Functions** → `/api/payment/complete` log'larını kontrol et
- **Analytics** → 405 error rate'ini izle (sıfır olmalı)
- **Deployments** → Build log'ları kontrol et

---

## 🔧 Vercel Configuration

### vercel.json (Zaten mevcut)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://www.vadiler.com"
  }
}
```

### next.config.ts (Zaten ayarlanmış)
```typescript
const nextConfig = {
  output: 'standalone', // Vercel serverless için optimize
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ]
  }
}
```

---

## 🐛 Troubleshooting

### "Build failed" hatası alıyorsanız:
```bash
# Local'de build test et
npm run build

# Type errors varsa:
npm run lint
```

### "Environment variable not found" hatası:
1. Vercel Dashboard → Settings → Environment Variables
2. Tüm değişkenleri ekle
3. Redeploy: Deployments → ... → Redeploy

### "Function timeout" hatası:
Vercel free plan: 10 saniye timeout
Hobby/Pro plan: 60 saniye timeout

iyzico API bazen yavaş olabilir, Pro plan gerekebilir.

### SSL/HTTPS sorunları:
- Vercel otomatik SSL sağlar
- DNS propagation 24 saat sürebilir
- Geçici: `vercel-url.vercel.app` kullan

---

## 📊 Performance Optimization

### Edge Functions (Opsiyonel)
İstersen payment API'lerini edge'e taşıyabilirsin:

```typescript
// src/app/api/payment/complete/route.ts
export const runtime = 'edge'; // Ekle

export async function GET(request: NextRequest) {
  // Existing code...
}
```

**Avantajları:**
- ⚡ Daha hızlı (global edge network)
- 💰 Daha ucuz (free plan'de daha fazla request)

**Dezavantajları:**
- ⚠️ Node.js API'leri sınırlı
- ⚠️ Bazı kütüphaneler çalışmayabilir

---

## 💡 Best Practices

### 1. Branch Deployment Strategy
```bash
main branch → Production (www.vadiler.com)
staging branch → Preview (vadiler-staging.vercel.app)
feature/* → Preview URLs
```

### 2. Environment Variables per Environment
```
Production → Production keys
Preview → Staging keys
Development → Local .env.local
```

### 3. Monitoring & Alerts
Vercel'de:
- **Notifications** → Error alerts aktif et
- **Integrations** → Slack/Discord webhook ekle
- **Analytics** → Core Web Vitals izle

### 4. Backup Strategy
```bash
# Database backup (Supabase otomatik yaptırıyor)
# Code backup (GitHub'da)

# Manual backup:
git tag -a v1.0.0 -m "Payment fix deployment"
git push origin v1.0.0
```

---

## 🚨 Emergency Rollback

Eğer deployment'ta sorun çıkarsa:

### Hızlı Rollback (Vercel Dashboard)
1. **Deployments** → Önceki başarılı deployment'ı bul
2. **...** → **Promote to Production**
3. Instant rollback (~30 saniye)

### Git Rollback
```bash
# Son commit'i geri al
git revert HEAD
git push origin main

# Ya da belirli bir commit'e dön
git reset --hard <commit-hash>
git push --force origin main
```

---

## 📞 Support

**Vercel Sorunları:**
- Documentation: https://vercel.com/docs
- Support: Dashboard → Help → Contact Support

**Payment Sorunları:**
- Recovery script çalıştır
- iyzico dashboard kontrol et
- Admin panel'den manuel update

---

## ✅ Deployment Checklist

Deployment öncesi kontrol:
- [ ] Tüm environment variables eklendi
- [ ] Local'de build başarılı (`npm run build`)
- [ ] Tests passed (varsa)
- [ ] Git committed ve pushed
- [ ] Domain configured
- [ ] SSL certificate ready

Deployment sonrası kontrol:
- [ ] Site açılıyor (www.vadiler.com)
- [ ] Payment flow test edildi
- [ ] Recovery script çalıştırıldı
- [ ] 405 errors yok (Analytics'te)
- [ ] Customer notifications sent (eğer stuck orders varsa)

---

**Deployment Date**: December 14, 2025  
**Version**: 2.0.0 (Payment Fix)  
**Status**: ✅ Ready for Production
