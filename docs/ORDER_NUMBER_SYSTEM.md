testsiparis@gmail.com/**
 * 6 Haneli Sipariş Numarası Sistemi - Test Rehberi
 * ================================================
 * 
 * Yeni sipariş numaraları: 100001, 100002, 100003, ...
 * Format: 6 haneli sayı
 * Counter başlangıcı: 100001
 * Counter artış: +1 her yeni sipariş
 */

// ============================================
// 1. SIPARIŞ OLUŞTURMA (POST /api/orders)
// ============================================

/**
 * Test Senaryosu: Yeni sipariş oluştur
 * 
 * Beklenen Davranış:
 * - Birinci sipariş: orderNumber = 100001
 * - İkinci sipariş: orderNumber = 100002
 * - Üçüncü sipariş: orderNumber = 100003
 * 
 * CURL Örneği:
 */
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_new_user",
    "status": "pending",
    "products": [
      {
        "productId": 1,
        "name": "Ürün Adı",
        "price": 150,
        "quantity": 2,
        "image": "/products/image.jpg"
      }
    ],
    "subtotal": 300,
    "total": 300,
    "delivery": {
      "recipientName": "Ali Kaya",
      "recipientPhone": "+90 850 307 4876",
      "province": "İstanbul",
      "district": "Kadıköy",
      "fullAddress": "Test Cad. No:1"
    },
    "paymentMethod": "credit_card"
  }'

// Beklenen Cevap:
// {
//   "id": "ord_100001",
//   "orderNumber": 100001,
//   "status": "pending",
//   "createdAt": "2025-12-06T10:30:00Z",
//   ...
// }

// ============================================
// 2. SIPARIŞ TAKIBI (POST /api/orders/track)
// ============================================

/**
 * Test Senaryosu 1: Sipariş No + Telefon ile Takip
 * 
 * Giriş:
 * - orderNumber: 100001 (veya "100001" string olarak)
 * - verificationType: "phone"
 * - verificationValue: "05358503074876" veya "+90 850 307 4876"
 * 
 * Beklenen Sonuç: ✅ Başarılı (Sipariş bilgileri döner)
 */
curl -X POST http://localhost:3000/api/orders/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 100001,
    "verificationType": "phone",
    "verificationValue": "05358503074876"
  }'

// Cevap:
// {
//   "id": "ord_100001",
//   "orderNumber": 100001,
//   "status": "pending",
//   "recipientName": "Ali Kaya",
//   "recipientPhone": "085 030 ** **",
//   "items": [...],
//   "total": 300,
//   ...
// }

/**
 * Test Senaryosu 2: Sipariş No + E-posta ile Takip
 * 
 * Giriş:
 * - orderNumber: 100001
 * - verificationType: "email"
 * - verificationValue: "ahmet@email.com"
 * 
 * Beklenen Sonuç: ✅ Başarılı (müşteri e-postası eşleşirse)
 */
curl -X POST http://localhost:3000/api/orders/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 100001,
    "verificationType": "email",
    "verificationValue": "ahmet@email.com"
  }'

/**
 * Test Senaryosu 3: Hatalı Doğrulama
 * 
 * Giriş:
 * - orderNumber: 100001
 * - verificationType: "phone"
 * - verificationValue: "05359999999" (yanlış telefon)
 * 
 * Beklenen Sonuç: ❌ Hata (403 Forbidden)
 */
curl -X POST http://localhost:3000/api/orders/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 100001,
    "verificationType": "phone",
    "verificationValue": "05359999999"
  }'

// Cevap:
// {
//   "error": "Doğrulama bilgileri sipariş ile eşleşmiyor."
// }

/**
 * Test Senaryosu 4: Geçersiz Sipariş Numarası
 * 
 * Giriş:
 * - orderNumber: 99999 (6 haneli değil)
 * 
 * Beklenen Sonuç: ❌ Hata (400 Bad Request)
 */
curl -X POST http://localhost:3000/api/orders/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 99999,
    "verificationType": "phone",
    "verificationValue": "05358503074876"
  }'

// Cevap:
// {
//   "error": "Geçersiz sipariş numarası formatı."
// }

/**
 * Test Senaryosu 5: Sipariş Bulunamadı
 * 
 * Giriş:
 * - orderNumber: 999999 (6 haneli ama veritabanında yok)
 * 
 * Beklenen Sonuç: ❌ Hata (404 Not Found)
 */
curl -X POST http://localhost:3000/api/orders/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": 999999,
    "verificationType": "phone",
    "verificationValue": "05358503074876"
  }'

// Cevap:
// {
//   "error": "Bu sipariş numarasına ait sipariş bulunamadı."
// }

// ============================================
// 3. COUNTER BİLGİSİ (GET /api/admin/order-counter)
// ============================================

/**
 * Admin Panel: Counter durumunu kontrol et
 */
curl -X GET http://localhost:3000/api/admin/order-counter

// Cevap:
// {
//   "success": true,
//   "counter": {
//     "nextOrderNumber": 100004,
//     "lastGeneratedAt": "2025-12-06T11:45:00Z",
//     "totalOrders": 3
//   },
//   "nextOrderNumber": 100004,
//   "totalOrders": 3
// }

/**
 * Admin Panel: Counter'ı sıfırla
 */
curl -X POST http://localhost:3000/api/admin/order-counter \
  -H "Content-Type: application/json" \
  -d '{
    "startNumber": 200001
  }'

// Cevap:
// {
//   "success": true,
//   "message": "Counter sıfırlandı.",
//   "counter": {
//     "nextOrderNumber": 200001,
//     "lastGeneratedAt": "2025-12-06T12:00:00Z",
//     "totalOrders": 0
//   }
// }

// ============================================
// 4. FRONTEND ENTEGRASYONU (Sipariş Takip Sayfası)
// ============================================

/**
 * Kullanıcı Akışı:
 * 
 * 1. Sipariş Sayfasına Git: /siparis-takip
 * 2. Sipariş No Gir: 100001
 * 3. Telefon Gir: 05358503074876
 * 4. "Sorgula" Butonuna Tıkla
 * 5. Sipariş durumunu ve detaylarını gör
 * 
 * Telefon Formatları (Hepsi Çalışır):
 * - 05358503074876
 * - 053-585-030-7-4876
 * - +90-850-307-4876
 * - +90 850 307 4876
 * - 8503074876
 * 
 * Beklenen Sonuçlar:
 * ✅ Doğru Telefon: Sipariş bilgileri gösterilir
 * ❌ Yanlış Telefon: "Doğrulama bilgileri eşleşmiyor" mesajı
 * ❌ Geçersiz No: "Sipariş bulunamadı" mesajı
 */

// ============================================
// 5. DINAMIK YAPININ AVANTAJLARI
// ============================================

/**
 * ✅ Avantajlar:
 * 
 * 1. SEKÜENSİYEL NUMARALANDIRMA
 *    - Her sipariş sırayla 1 artar
 *    - Hiçbir boşluk veya atlama yok
 *    - Kolay takip
 * 
 * 2. 6 HANELI FORMAT
 *    - Standart ve profesyonel görünüm
 *    - Başlangıç: 100001
 *    - Bitiş: 999999 (900.000 sipariş kapasitesi)
 * 
 * 3. GÜVENLI DOĞRULAMA
 *    - Üye olmayan kullanıcılar güvenli şekilde takip yapabilir
 *    - Telefon numarası maskelenerek döner
 *    - SQL injection/hacking'e karşı korumlu
 * 
 * 4. SKALABILIR TASARIM
 *    - Counter dosyası ile hızlı access
 *    - İçinde API cache'lenebilir
 *    - Veritabanına ihtiyaç yok (JSON dosya yeterli)
 * 
 * 5. ADMIN KONTROL
 *    - Counter durumunu görülebilir
 *    - İstenirse sıfırlanabilir (yıl başında vb.)
 *    - Toplam sipariş sayısı izlenebilir
 */

// ============================================
// 6. UYUMSUZLUK KONTROL YAPILACAK YERLER
// ============================================

/**
 * Güncellenmiş Dosyalar:
 * ✅ src/lib/orderNumberGenerator.ts - Generator fonksiyonları
 * ✅ src/app/api/orders/route.ts - POST sipariş oluşturma
 * ✅ src/app/api/orders/track/route.ts - POST takip sorgusu
 * ✅ src/app/api/admin/order-counter/route.ts - Counter yönetimi
 * ✅ src/data/orderCounter.json - Counter durum dosyası
 * ✅ src/app/siparis-takip/page.tsx - Frontend takip sayfası
 * 
 * Kontrol Edilecek:
 * - OrderContext.tsx (eğer sipariş oluşturma kullanıyorsa)
 * - Checkout/Cart bileşenleri (sipariş submit'i)
 * - Admin panel sipariş listesi
 */
