# Vadiler Çiçek - Modern E-Ticaret Platformu

Vadiler Çiçek için geliştirilmiş modern, yüksek performanslı e-ticaret platformu.

## 🚀 Özellikler

- ⚡️ Next.js 16 (App Router) ile yüksek performans
- 🎨 Tailwind CSS 4 ile modern ve responsive tasarım
- 🎭 Framer Motion ile akıcı animasyonlar
- 🖼️ Cloudinary entegrasyonu ile optimize edilmiş görsel yönetimi
- 🗄️ Supabase ile güvenli veritabanı yönetimi
- 📱 Mobil öncelikli tasarım
- 🔍 SEO optimizasyonu
- 🛒 Gelişmiş sepet ve ödeme sistemi
- 📦 1000+ ürün desteği
- 🏷️ Dinamik kategori sistemi

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı (veritabanı için)
- Cloudinary hesabı (opsiyonel - görseller için)

## 🛠️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone [repository-url]
cd vad1
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin ve aşağıdaki değerleri doldurun:

```env
# Supabase (Gerekli)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Site URL (Gerekli)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Supabase Kurulumu:**
1. [supabase.com](https://supabase.com) adresinde ücretsiz hesap oluşturun
2. Yeni proje oluşturun
3. Settings > API'den gerekli anahtarları kopyalayın
4. SQL Editor'de `supabase/migrations/` klasöründeki SQL'leri çalıştırın

### 4. Veritabanını Doldurun

Geliştirme sunucusunu başlattıktan sonra:

```bash
npm run dev
```

Admin paneline gidin: [http://localhost:3000/yonetim/bulk-import](http://localhost:3000/yonetim/bulk-import)

Veya API'yi doğrudan çağırın:

```bash
curl -X POST http://localhost:3000/api/admin/bulk-import-products
curl -X POST http://localhost:3000/api/admin/bulk-import-categories
```

### 5. Siteyi Ziyaret Edin

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📁 Proje Yapısı

```
vadiler-app/
├── src/
│   ├── app/              # Next.js App Router sayfaları
│   │   ├── [category]/   # Dinamik kategori sayfaları
│   │   ├── api/          # API routes
│   │   └── yonetim/      # Admin paneli
│   ├── components/       # React bileşenleri
│   ├── context/          # Context API (Cart, Customer, Order)
│   ├── data/             # JSON veri dosyaları (1000+ ürün)
│   ├── hooks/            # Custom hooks
│   └── lib/              # Yardımcı fonksiyonlar & Supabase
├── public/               # Statik dosyalar
├── supabase/            # Supabase migrations
└── docs/                # Dokümantasyon
    ├── DEPLOYMENT.md           # Detaylı deployment rehberi
    └── TROUBLESHOOTING_404.md  # 404 hata çözümleri
```

## 🔧 Kullanılabilir Scriptler

```bash
npm run dev      # Geliştirme sunucusunu başlat
npm run build    # Production için build al
npm start        # Production sunucusunu başlat
npm run lint     # Kod kalitesi kontrolü
```

## 📚 Teknolojiler

- **Framework:** Next.js 16
- **Stil:** Tailwind CSS 4
- **Animasyon:** Framer Motion, GSAP
- **Veritabanı:** Supabase (PostgreSQL)
- **Görseller:** Cloudinary CDN
- **İkonlar:** Lucide React
- **State Yönetimi:** React Context API
- **TypeScript:** Full type safety

## 🚀 Production Deployment

### Vercel'e Deploy (Önerilen)

1. GitHub repository'sini Vercel'e bağlayın
2. Environment Variables'ı ekleyin (`.env.example`'daki tüm değişkenler)
3. **Önemli:** `NEXT_PUBLIC_SITE_URL` değerini production domain'iniz olarak ayarlayın
4. Deploy edin
5. Bulk import'u çalıştırın: `https://your-domain.com/yonetim/bulk-import`

```bash
# Veya CLI ile:
npm install -g vercel
vercel --prod
```

### Diğer Platformlar

Detaylı deployment talimatları için [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) dosyasına bakın.

## 🐛 Sorun Giderme

### "404 Not Found" Hataları (Kategori/Ürün Sayfaları)

Eğer production'da kategori veya ürün sayfaları 404 veriyorsa:

**Sebep:** Supabase environment variables eksik veya veritabanı boş

**Çözüm:**
1. Environment variables'ların doğru ayarlandığından emin olun
2. Bulk import'u çalıştırın (admin paneli veya API)
3. Detaylar için: [`docs/TROUBLESHOOTING_404.md`](./docs/TROUBLESHOOTING_404.md)

### Build Hataları

```bash
# Bağımlılıkları temizle ve yeniden yükle
rm -rf node_modules .next
npm install
npm run build
```

### API Bağlantı Sorunları

```bash
# API'leri test edin
curl http://localhost:3000/api/products
curl http://localhost:3000/api/categories
```

Daha fazla sorun giderme için dokümantasyona bakın.

## 📖 Dokümantasyon

- [Deployment Rehberi](./docs/DEPLOYMENT.md) - Detaylı kurulum ve deployment
- [404 Sorun Giderme](./docs/TROUBLESHOOTING_404.md) - Kategori/ürün 404 hataları
- [Copilot Instructions](./.github/copilot-instructions.md) - Geliştirici notları

## 🔐 Güvenlik

- Supabase Row Level Security (RLS) aktif
- Admin rotaları authentication ile korunmuş
- Service key'ler sadece sunucu tarafında kullanılıyor
- HTTPS zorunlu (production)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📝 Lisans

Tüm hakları saklıdır - Vadiler Çiçek © 2024

## 💬 İletişim

Sorularınız için: [GitHub Issues](https://github.com/ygtrkn-lab/vad1/issues)
