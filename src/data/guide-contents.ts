/**
 * Blog/Rehber İçerik Yapısı
 * SEO için bilgilendirici içerikler
 */

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface GuideContent {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  category: 'selection' | 'care' | 'meanings' | 'occasions' | 'delivery' | 'tips';
  categoryName: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  publishDate: string;
  readTime: number; // dakika
  relatedGuides?: string[]; // slug'lar
  faqItems?: {
    question: string;
    answer: string;
  }[];
  // HowTo Schema için adımlar (bakım rehberleri için)
  howToSteps?: HowToStep[];
}

export const GUIDE_CONTENTS: GuideContent[] = [
  {
    slug: 'cicek-secim-rehberi',
    title: 'Çiçek Seçim Rehberi: Hangi Çiçek Hangi Özel Gün İçin?',
    metaTitle: 'Çiçek Seçim Rehberi 2025 | Hangi Çiçek Hangi Özel Gün İçin? | Vadiler Çiçek',
    metaDescription: 'Sevgililer günü, doğum günü, anneler günü ve tüm özel günler için en uygun çiçeği nasıl seçersiniz? Uzman çiçekçilerden ipuçları!',
    keywords: ['çiçek seçimi', 'çiçek rehberi', 'hangi çiçek', 'özel gün çiçeği', 'çiçek önerileri'],
    category: 'selection',
    categoryName: 'Çiçek Seçimi',
    excerpt: 'Her özel gün için doğru çiçeği seçmek önemli! Bu rehberde sevgililer günü, anneler günü, doğum günü ve daha fazlası için çiçek seçim ipuçları.',
    image: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    author: 'Vadiler Çiçek Uzmanları',
    publishDate: '2025-01-15',
    readTime: 8,
    content: `
Her özel gün, farklı duygular ve mesajlar taşır. Çiçek seçerken sadece güzelliğe değil, taşıdığı anlama da dikkat etmek önemli. Bu rehberde, en popüler özel günler için ideal çiçek seçimlerini uzman çiçekçilerimizin görüşleriyle derledik.

## Sevgililer Günü İçin Çiçek Seçimi

**En İdeal: Kırmızı Güller**
14 Şubat Sevgililer Günü'nün klasik tercihidir kırmızı güller. Tutku, aşk ve bağlılığı simgeler.

**Alternatifler:**
- **Pembe Güller:** Romantik ve zarif bir seçenek
- **Beyaz Güller:** Saf ve temiz aşk mesajı
- **Karışık Güller:** Farklı tonlar birleşerek zengin bir buket oluşturur
- **Orkideler:** Modern ve şık tercih edenler için

**İpucu:** Gül sayısı da önemli! 12 gül "sen benim her şeyimsin", 24 gül "seni her an düşünüyorum", 50 gül "sonsuz aşk" mesajı verir.

## Anneler Günü İçin Çiçek Seçimi

**En İdeal: Orkideler ve Papatyalar**
Anneler günü için zarif ve uzun ömürlü çiçekler tercih edilir.

**Öneriler:**
- **Mor Orkide:** Zarafet ve asalet simgesi
- **Beyaz Papatyalar:** Saflık ve temiz sevgi
- **Pembe Lilyumlar:** Şefkat ve sevgi dolu
- **Karışık Aranjmanlar:** Renkli ve neşeli

**İpucu:** Saksı çiçekleri uzun süre yaşadığı için annelere özel güzel bir hediye!

## Doğum Günü İçin Çiçek Seçimi

**Kişiye Özel Olmalı**
Doğum günlerinde kişinin sevdiği renkler ve çiçekler tercih edilmeli.

**Popüler Seçenekler:**
- **Renkli Gerberalar:** Neşe ve enerji dolu
- **Lilyumlar:** Hoş kokulu ve etkileyici
- **Karışık Buketler:** Her yaşa uygun
- **Orkideler:** Zarif ve modern

**Yaşa Göre İpuçları:**
- **Gençler:** Renkli, enerjik buketler
- **Orta yaş:** Zarif aranjmanlar ve orkideler
- **Yaşlılar:** Klasik güller veya papatyalar

## Yıldönümü İçin Çiçek Seçimi

**En İdeal: Kırmızı veya Pembe Güller**
Yıldönümleri romantizm ve bağlılık sembolüdür.

**Özel Fikirler:**
- **Aynı yıl sayısı kadar gül:** 5. yıl = 5 gül
- **Karışık romantik buket:** Güller + lilyumlar
- **Premium aranjmanlar:** Özel tasarım kutulu çiçekler

## Mezuniyet İçin Çiçek Seçimi

**Başarı ve Yeni Başlangıç**
- **Beyaz Güller:** Yeni başlangıç
- **Sarı Çiçekler:** Başarı ve mutluluk
- **Karışık Buketler:** Renkli ve enerjik

## Geçmiş Olsun İçin Çiçek Seçimi

**Dikkat Edilmesi Gerekenler:**
- **Pastel tonlar tercih edin:** Pembe, beyaz, açık mor
- **Güçlü kokulardan kaçının:** Hastalar hassas olabilir
- **Uzun ömürlü çiçekler:** Orkide, antoryum

**Uygunsuz Çiçekler:**
- Kırmızı güller (romantik anlam taşır)
- Çok kokulu lilyumlar
- Karanlık renkler

## Açılış ve Kutlama İçin Çiçek Seçimi

**Gösterişli ve Uzun Ömürlü**
- **Büyük Aranjmanlar:** Dikkat çekici
- **Orkide Sepetleri:** 3-4 hafta yaşar
- **Saksı Bitkileri:** Sürekli hatırlatıcı

## Renk Psikolojisi ve Çiçek Seçimi

**Kırmızı:** Tutku, aşk, enerji
**Pembe:** Romantizm, zarafet, şefkat
**Beyaz:** Saflık, temizlik, barış
**Sarı:** Mutluluk, arkadaşlık, enerji
**Mor:** Asalet, zarafet, gizemlilik
**Turuncu:** Neşe, coşku, sıcaklık

## Bütçeye Göre Çiçek Seçimi

**Ekonomik (200-400 TL):**
- 5-7 dal gül buketi
- Papatya buketleri
- Tek dal orkide

**Orta Segment (400-800 TL):**
- 12-24 gül buketleri
- Karışık aranjmanlar
- 2 dal orkide

**Premium (800+ TL):**
- 50+ gül buketleri
- Özel tasarım aranjmanlar
- Kutu çiçekler
- 3-5 dal orkide sepetleri

## Mevsime Göre Çiçek Seçimi

**İlkbahar:** Laleler, sümbüller, nergisler
**Yaz:** Güller, gerberalar, ayçiçeği
**Sonbahar:** Kasımpatı, dalyalar
**Kış:** Güller, orkideler, amarillis

## Sipariş Verirken Dikkat Edilecekler

1. **Teslimat Zamanı:** Siparişleriniz en kısa sürede hazırlanır ve teslimat için yola çıkar
2. **Mesaj Kartı:** Duygularınızı yazdığınız özel mesaj ekleyin
3. **Teslimat Adresi:** Tam ve doğru adres bilgisi verin
4. **Alıcının Durumu:** Evde olup olmayacağını kontrol edin
5. **Özel Talepler:** Özel isteklerinizi belirtin

## Sonuç

Çiçek seçimi, vermek istediğiniz mesaj kadar önemlidir. Bu rehberdeki ipuçlarıyla her özel gün için doğru çiçeği seçebilir, sevdiklerinize unutulmaz sürprizler yapabilirsiniz.

Vadiler Çiçek olarak, her özel gününüzde yanınızdayız. İstanbul'un tüm ilçelerine hızlı ve güvenli teslimat ile taze çiçekler sunuyoruz.
    `,
    relatedGuides: ['cicek-bakim-rehberi', 'cicek-renk-anlamlari', 'istanbul-hizli-teslimat-rehberi'],
    faqItems: [
      {
        question: 'Sevgililer günü için kaç gül almalıyım?',
        answer: '12 gül klasik bir seçimdir ve "her ay seni seviyorum" anlamına gelir. 24 gül "seni her an düşünüyorum", 50 gül ise "sonsuz aşk" mesajı verir.',
      },
      {
        question: 'Anneler günü için en uygun çiçek hangisi?',
        answer: 'Orkideler ve papatyalar anneler günü için ideal seçeneklerdir. Zarif, uzun ömürlü ve annelik sevgisini simgelerler.',
      },
      {
        question: 'Hastaya çiçek gönderirken nelere dikkat etmeliyim?',
        answer: 'Pastel tonları tercih edin, güçlü kokulardan kaçının ve uzun ömürlü çiçekler seçin. Kırmızı güller ve çok kokulu lilyumlardan kaçının.',
      },
    ],
  },
  {
    slug: 'cicek-bakim-rehberi',
    title: 'Çiçek Bakım Rehberi: Çiçekler Nasıl Uzun Süre Taze Kalır?',
    metaTitle: 'Çiçek Bakım Rehberi 2025 | Çiçekler Nasıl Uzun Süre Taze Kalır? | Vadiler',
    metaDescription: 'Kesme çiçeklerin ve saksı çiçeklerinin bakımı nasıl yapılır? Çiçeklerinizin daha uzun süre taze kalması için uzman ipuçları!',
    keywords: ['çiçek bakımı', 'çiçek taze kalması', 'gül bakımı', 'orkide bakımı', 'çiçek suyu'],
    category: 'care',
    categoryName: 'Çiçek Bakımı',
    excerpt: 'Çiçeklerinizin daha uzun süre taze ve güzel kalması için pratik bakım ipuçları. Kesme çiçek ve saksı çiçekleri bakım rehberi.',
    image: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    author: 'Vadiler Çiçek Uzmanları',
    publishDate: '2025-01-10',
    readTime: 10,
    content: `
Aldığınız veya hediye ettiğiniz çiçeklerin uzun süre taze kalmasını ister misiniz? Doğru bakım teknikleriyle kesme çiçekler 7-10 gün, orkideler ise aylarca canlılığını koruyabilir. İşte uzman çiçekçilerimizden bakım ipuçları:

## Kesme Çiçek Bakımı (Güller, Lilyumlar, Gerberalar)

### İlk Hazırlık

**1. Vazo Temizliği**
Vazoyu sabun ve suyla iyice yıkayın. Bakteriler çiçeklerin ömrünü kısaltır.

**2. Sapların Kesilmesi**
- Keskin bir bıçak veya makas kullanın
- Sapları 45 derece açıyla kesin
- Su altında kesmek en iyisidir
- Her 2-3 günde bir tekrarlayın

**3. Yaprak Temizliği**
Su seviyesinin altında kalacak tüm yaprakları temizleyin. Suda çürüyen yapraklar bakteri üretir.

**4. Su Hazırlığı**
- Oda sıcaklığında temiz su kullanın
- Çiçek besini ekleyin (varsa)
- Yoksa: 1 litre suya 1 çay kaşığı şeker + birkaç damla sirke

### Günlük Bakım

**Su Değişimi:**
- İdeal: Her gün
- Minimum: 2 günde bir
- Su bulanıklaştığında mutlaka değiştirin

**Ortam Koşulları:**
- Sıcaklık: 18-22°C ideal
- Direkt güneş ışığından uzak
- Meyvelerden uzak tutun (etilen gazı salar)
- Klima ve kaloriferin önünde durmayın

**Gözle Kontrol:**
- Solmuş çiçekleri çıkarın
- Sararan yaprakları temizleyin
- Su seviyesini kontrol edin

### Çiçek Türüne Göre Özel Bakım

**GÜLLER:**
- Her 2 günde bir sap kesin
- Dış yaprakları çıkarabilirsiniz
- Ömür: 5-7 gün

**LİLYUMLAR:**
- Polen keselerini çıkarın (leke yapar)
- Bol su seven çiçekler
- Ömür: 7-10 gün

**GERBERALAR:**
- Sapları kısa tutun
- Sık su değişimi
- Ömür: 7-10 gün

**PAPATYALAR:**
- Az su yeterli
- Sık sap kesimi gerekli
- Ömür: 5-7 gün

## Orkide Bakımı (Phalaenopsis)

### Sulama

**Sıklık:** Haftada bir kez
**Miktar:** 3-4 yemek kaşığı su (saksı büyüklüğüne göre)
**Yöntem:** 
- Kökler gümüşi yeşile döndüğünde sulayın
- Fazla su kökleri çürütür
- Suyu yapraklara değil köklere verin

### Işık İhtiyacı

- Parlak ama dolaylı ışık
- Doğu veya batı yönlü pencere ideal
- Direkt güneş yaprakları yakar

### Sıcaklık ve Nem

- Gündüz: 20-25°C
- Gece: 16-18°C
- Nem: %50-70 (püskürtme yapabilirsiniz)

### Çiçeklenme Sonrası

- Sararıp kuruyan dalı kökten kesin
- Yeşil kalan dalı 1cm üzerinden kesin (tekrar çiçek açabilir)
- Gübre verin (özel orkide gübresi)

### Yaygın Hatalar

❌ Fazla sulama (en yaygın hata)
❌ Direkt güneş ışığı
❌ Soğuk hava cereyanı
❌ Meyve yanında durmak

## Saksı Çiçekleri Genel Bakım

### Antoryum Bakımı

- Haftada 1-2 kez sulama
- Yüksek nem sever
- Parlak dolaylı ışık
- Ömür: Yıllarca (düzenli bakımla)

### Spathiphyllum (Barış Çiçeği)

- Toprak kuruduğunda sulama
- Gölgeye dayanıklı
- Hava temizleyici özelliği var
- Yaprak püskürtmesi sever

### Saksı Değiştirme

**Ne Zaman?**
- Kökler saksıyı doldurduğunda
- Bahar aylarında ideal
- 1-2 yılda bir

**Nasıl?**
- 2-3 cm daha büyük saksı
- Kaliteli toprak karışımı
- Drenaj deliği şart
- İlk günler gölgede bekletin

## Çiçek Ömrünü Uzatan İpuçları

### Ev Yapımı Çiçek Besini

**Tarif 1:**
- 1 litre su
- 1 çay kaşığı şeker
- 5-6 damla sirke veya limon suyu
- 1/4 çay kaşığı çamaşır suyu (bakterileri öldürür)

**Tarif 2:**
- 1 litre su
- 1 aspirin tablet (bakterileri engeller)
- 1 çay kaşığı şeker

### Sıcaklık Hileleri

**Yazın:**
- Buzdolabına sürün (geceleyin)
- Buz küpleri ekleyin vazo suyuna
- Serin yerde tutun

**Kışın:**
- Soğuktan koruyun
- Cam kenarında bırakmayın
- Kalorifere yaklaştırmayın

### Ulaşım ve Taşıma

- Yatay değil dik taşıyın
- Soğuk havada gazeteyle sarın
- Sıcak havada serin tutun
- Arabada klima açık
- Bagajda tutmayın

## Çiçek Türlerine Göre Ömür Tablosu

| Çiçek Türü | Ortalama Ömür | Bakım Seviyesi |
|------------|---------------|----------------|
| Güller | 5-7 gün | Orta |
| Lilyumlar | 7-10 gün | Kolay |
| Gerberalar | 7-10 gün | Orta |
| Papatyalar | 5-7 gün | Kolay |
| Orkideler | 4-12 hafta | Kolay |
| Antoryum | Aylarca | Kolay |
| Kasımpatı | 10-14 gün | Kolay |
| Sümbül | 5-7 gün | Kolay |

## Yaygın Sorunlar ve Çözümleri

**Çiçekler hemen soldu:**
- Su değişimi yapılmamış
- Saplar doğru kesilmemiş
- Ortam çok sıcak

**Yapraklar sarardı:**
- Fazla veya az su
- Yetersiz ışık
- Doğal yaşlanma

**Orkide çiçek açmıyor:**
- Yetersiz ışık
- Sıcaklık farkı yok (gece/gündüz)
- Aşırı sulama

**Su bulanık ve kötü kokulu:**
- Bakteriler çoğalmış
- Vazoyu temizle
- Suyu değiştir
- Sap yeniden kes

## Profesyonel İpuçları

1. **Sabah Sulaması:** Çiçekler sabah saatlerinde daha iyi su alır
2. **Nem Kontrolü:** Yazın püskürtme yapın, kışın kaloriferin yanına su kabı koyun
3. **Steril Araçlar:** Makas ve vazoyu her kullanımdan önce temizleyin
4. **Gözlem:** Çiçeklerinizi günlük kontrol edin, erken müdahale önemli

## Sonuç

Doğru bakım teknikleriyle çiçekleriniz hem daha uzun süre taze kalır hem de daha güzel görünür. Her çiçek türünün özel ihtiyaçları vardır, bu rehberdeki ipuçlarını uygulayarak en iyi sonuçları alabilirsiniz.

Vadiler Çiçek olarak, size ulaşan her çiçeğin en taze haliyle gelmesi için özen gösteriyoruz. Bakım kartları ve ücretsiz danışmanlık hizmeti ile çiçeklerinizin uzun ömürlü olmasını sağlıyoruz.
    `,
    relatedGuides: ['cicek-secim-rehberi', 'istanbul-hizli-teslimat-rehberi', 'cicek-renk-anlamlari'],
    faqItems: [
      {
        question: 'Çiçek suyuna ne eklemeliyim?',
        answer: '1 litre suya 1 çay kaşığı şeker ve birkaç damla sirke ekleyebilirsiniz. Hazır çiçek besini varsa onu kullanın.',
      },
      {
        question: 'Orkideleri ne sıklıkla sulamalıyım?',
        answer: 'Haftada bir kez yeterlidir. Kökler gümüşi yeşile döndüğünde sulama zamanı gelmiştir. Fazla su kökleri çürütür.',
      },
      {
        question: 'Kesme çiçekler neden çabuk soluyor?',
        answer: 'Sapların düzgün kesilmemesi, su değişiminin yapılmaması, ortamın çok sıcak olması veya bakterili su en yaygın nedenlerdir.',
      },
    ],
    // HowTo Schema için adımlar
    howToSteps: [
      {
        name: 'Vazoyu Temizleyin',
        text: 'Vazoyu sabun ve ılık suyla iyice yıkayın. Bakteriler çiçeklerin ömrünü kısaltır, temiz vazo şarttır.',
      },
      {
        name: 'Sapları 45 Derece Kesin',
        text: 'Keskin bir bıçak veya makasla sapları 45 derece açıyla kesin. Su altında kesmek en iyisidir, her 2-3 günde tekrarlayın.',
      },
      {
        name: 'Alt Yaprakları Temizleyin',
        text: 'Su seviyesinin altında kalacak tüm yaprakları temizleyin. Suda çürüyen yapraklar bakteri üretir ve çiçeklerin ömrünü kısaltır.',
      },
      {
        name: 'Oda Sıcaklığında Su Koyun',
        text: '1 litre oda sıcaklığında temiz suya 1 çay kaşığı şeker ve birkaç damla sirke ekleyin. Varsa çiçek besini kullanın.',
      },
      {
        name: 'Doğru Konuma Yerleştirin',
        text: 'Çiçekleri direkt güneş ışığından uzak, 18-22°C sıcaklıkta, meyvelerden ve klimadan uzak bir yere koyun.',
      },
      {
        name: 'Günlük Bakım Yapın',
        text: 'Her gün veya en az 2 günde bir suyu değiştirin. Solmuş çiçekleri ve sararan yaprakları temizleyin.',
      },
    ],
  },
  {
    slug: 'istanbul-hizli-teslimat-rehberi',
    title: 'İstanbul Hızlı Çiçek Teslimat Rehberi',
    metaTitle: 'İstanbul Çiçek Teslimat | Hızlı Teslimat Rehberi 2025',
    metaDescription: 'İstanbul\'da çiçek teslimatı nasıl çalışır? Hangi saatlerde sipariş vermeliyim? 39 ilçeye hızlı teslimat rehberi!',
    keywords: ['istanbul hızlı teslimat', 'hızlı çiçek teslimatı', 'istanbul çiçek gönder', 'çiçek siparişi'],
    category: 'delivery',
    categoryName: 'Teslimat Bilgisi',
    excerpt: 'İstanbul\'da çiçek teslimatı nasıl çalışır? Hangi ilçelere teslimat yapılıyor? Sipariş süreci hakkında tüm detaylar!',
    image: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225138/vadiler/products/vadiler-sensiz-olmaz-25-beyaz-guller.jpg',
    author: 'Vadiler Çiçek Teslimat Ekibi',
    publishDate: '2025-01-05',
    readTime: 7,
    content: `
İstanbul'da sevdiklerinize çiçek göndermek artık çok daha kolay ve hızlı! Vadiler Çiçek olarak İstanbul'un 39 ilçesine hızlı ve güvenli teslimat sunuyoruz. Bu rehberde teslimat sürecimiz ve dikkat etmeniz gereken noktalar hakkında detaylı bilgi bulacaksınız.

## Hızlı Teslimat Nasıl Çalışır?

### Sipariş Saatleri

Siparişleriniz en kısa sürede hazırlanır ve teslimat için yola çıkar.

**Zaman Dilimleri:**
- **09:00 - 13:00:** Sabah siparişleri (Öğleden sonra teslim)
- **13:00 - 18:00:** Öğleden sonra siparişleri (Akşam teslim)
- **18:00 sonrası:** Ertesi gün teslimat

### Teslimat Süreci

1. **Sipariş Alımı:** Online veya telefonla sipariş verin
2. **Onay ve Hazırlık:** Siparişiniz 30 dakika içinde onaylanır
3. **Çiçek Hazırlama:** Uzman çiçekçilerimiz taze çiçeklerle hazırlar (1-2 saat)
4. **Kurye Çıkışı:** Profesyonel kurye ekibimiz yola çıkar
5. **Teslimat:** Alıcıya elden teslim edilir
6. **Fotoğraf:** Teslimat fotoğrafı size gönderilir

## İstanbul İlçelerine Göre Teslimat

### Avrupa Yakası (Hızlı Teslimat Bölgeleri)

**Merkezi İlçeler (2-4 saat):**
- Beşiktaş, Şişli, Kadıköy, Bakırköy
- Fatih, Beyoğlu, Kağıthane, Sarıyer

**Diğer İlçeler (3-6 saat):**
- Avcılar, Başakşehir, Bağcılar, Bahçelievler
- Bayrampaşa, Esenler, Esenyurt, Eyüpsultan
- Gaziosmanpaşa, Güngören, Küçükçekmece
- Sultangazi, Zeytinburnu, Çatalca, Silivri, Arnavutköy

### Anadolu Yakası (Hızlı Teslimat Bölgeleri)

**Merkezi İlçeler (2-4 saat):**
- Kadıköy, Üsküdar, Ataşehir, Maltepe
- Kartal, Pendik

**Diğer İlçeler (3-6 saat):**
- Adalar, Beykoz, Çekmeköy, Sancaktepe
- Sultanbeyli, Şile, Tuzla, Ümraniye

## Özel Gün ve Dönemlerde Teslimat

### Yoğun Dönemler

**Sevgililer Günü (14 Şubat):**
- 3 gün öncesinden sipariş verin
- Sabah saatlerinde teslimat yoğunluğu
- Fiyatlar normal seviyelerde kalır

**Anneler Günü (Mayıs):**
- 2 gün öncesinden sipariş önerilir
- Öğleden sonra teslimatlar tercih edilebilir

**Diğer Özel Günler:**
- Yılbaşı, 8 Mart, doğum günleri
- Normal teslimat süreleri geçerli

### Hafta Sonu ve Tatil Günleri

✅ **Cumartesi - Pazar:** Tam kapasite teslimat
✅ **Resmi Tatiller:** Kesintisiz hizmet
✅ **Bayram Günleri:** Özel çalışma saatleri (önceden duyurulur)

## Teslimat Adresi ve Bilgileri

### Doğru Adres Verme

**Mutlaka Belirtin:**
- İlçe, mahalle, sokak adı ve bina numarası
- Daire numarası
- Varsa bina veya site adı
- Yakın landmark (hastane, okul, AVM vb.)

**İletişim Bilgileri:**
- Alıcının cep telefonu (zorunlu)
- Alternatif telefon (önerilir)
- Özel talimatlar (kapıcıya bırakın, komşuya verin vb.)

### Alıcı Evde Değilse Ne Olur?

1. **İletişim Denemesi:** Kurye 2-3 kez arar
2. **Komşu/Kapıcı:** Güvenli birine bırakılabilir (önceden belirtilirse)
3. **Yeniden Teslimat:** Uygun bir zamanda tekrar denenir
4. **Size İletişim:** Durum size bildirilir, talimat alınır

## Teslimat Ücretleri

### İstanbul İçi

**Merkezi İlçeler:** ÜCRETSIZ (500 TL üzeri siparişlerde)
**Diğer İlçeler:** 50-100 TL (mesafeye göre)
**Uzak İlçeler:** 150 TL (Şile, Çatalca, Silivri)

### Acil Teslimat

**Öncelikli Teslimat (Hızlandırılmış):**
- Ekstra ücret karşılığı
- Sadece merkezi ilçelerde
- Özel koordinasyon gerektirir
- Saat 18:00'ye kadar

## Teslimat Güvencesi

### Taahhütlerimiz

✅ **Taze Çiçek Garantisi:** Günlük kesim çiçekler
✅ **Zamanında Teslimat:** Belirtilen saat diliminde
✅ **Fotoğraf Kanıtı:** Her teslimat fotoğraflanır
✅ **Sigortalı Kargo:** Hasar durumunda yenisi gönderilir
✅ **7/24 Müşteri Desteği:** Sorun yaşarsanız anında çözüm

### Sorun Durumunda

- **Geç Teslimat:** İndirim kuponu
- **Hasarlı Ürün:** Ücretsiz yenisi
- **Yanlış Ürün:** Anında değişim
- **İptal:** %100 iade (hazırlanmadan önce)

## Özel Teslimat Talepleri

### Sürpriz Teslimat

- **Sabah Sürprizi:** Erken saatte teslimat (08:00-09:00)
- **Gece Sürprizi:** Geç saatte teslimat (20:00-22:00)
- **İş Yeri Teslimatı:** Mesai saatlerinde

### Mesaj Kartı

- **Ücretsiz:** Her siparişe dahil
- **El Yazısı:** Özel istekle
- **Anonim:** İsim belirtilmeden gönderilebilir

### Ek Hediyeler

- **Balon:** +100-200 TL
- **Çikolata:** +150-300 TL
- **Oyuncak:** +200-400 TL
- **Mum:** +100-150 TL

## Sipariş İptali ve Değişiklik

### İptal Politikası

**Hazırlanmadan Önce:** %100 iade
**Hazırlandıktan Sonra:** İptal edilemez
**Yolda İken:** İptal edilemez, adres değişikliği yapılabilir

### Değişiklik

- **Adres değişikliği:** Kurye yola çıkmadan önce
- **Ürün değişikliği:** Hazırlanmadan önce
- **Saat değişikliği:** Teslimat saatinden 2 saat önce

## Sıkça Sorulan Sorular

**S: Cumartesi günü sipariş verebilir miyim?**
C: Evet, hafta sonu tam kapasite çalışıyoruz.

**S: Gece teslimat yapılıyor mu?**
C: Normal teslimatlar 21:00'e kadar. Özel talep için iletişime geçin.

**S: Alıcıya ismim gözükmeyecek mi?**
C: Anonim teslimat yapılabilir, mesaj kartında isim belirtmezsiniz.

**S: Teslimat fotoğrafı gönderiliyor mu?**
C: Evet, her teslimat sonrası fotoğraf WhatsApp veya SMS ile gönderilir.

**S: İlçe dışı teslimat var mı?**
C: İstanbul 39 ilçesinin tamamına teslimat yapıyoruz.

## İletişim ve Sipariş

**Online Sipariş:** www.vadiler.com
**Telefon:** +90 555 123 4567
**WhatsApp:** +90 555 123 4567
**E-posta:** info@vadiler.com

**Müşteri Hizmetleri:**
Hafta içi: 09:00 - 22:00
Hafta sonu: 09:00 - 21:00

## Sonuç

İstanbul'da çiçek teslimatı, doğru adres bilgisi ve zamanında sipariş ile sorunsuz gerçekleşir. Vadiler Çiçek olarak, sevdiklerinize en taze çiçekleri zamanında ulaştırmak için profesyonel ekibimiz ile çalışıyoruz.

Hızlı ve güvenli teslimat için online sipariş verin!
    `,
    relatedGuides: ['cicek-secim-rehberi', 'cicek-siparisi-ipuclari', 'cicek-renk-anlamlari'],
    faqItems: [
      {
        question: 'Hangi saatlerde sipariş verebilirim?',
        answer: 'Online sipariş sistemi 7/24 açıktır. Siparişleriniz çalışma saatleri içinde hazırlanır ve teslimata çıkar.',
      },
      {
        question: 'Hangi ilçelere teslimat yapılıyor?',
        answer: 'İstanbul\'un 39 ilçesinin tamamına hızlı teslimat yapıyoruz. Merkezi ilçelere öncelikli teslimat sağlanır.',
      },
      {
        question: 'Alıcı evde yoksa ne olur?',
        answer: 'Kurye önce telefonla iletişim kurar. Evde yoksa komşu/kapıcıya bırakılabilir veya size danışılarak yeniden teslimat ayarlanır.',
      },
    ],
  },
  {
    slug: 'cicek-renk-anlamlari',
    title: 'Çiçek Renkleri ve Anlamları: Hangi Renk Ne İfade Eder?',
    metaTitle: 'Çiçek Renkleri ve Anlamları 2025 | Gül Renkleri Rehberi | Vadiler',
    metaDescription: 'Kırmızı, pembe, beyaz, sarı güller ne anlam ifade eder? Çiçek renklerinin psikolojisi ve verdiği mesajlar hakkında rehber!',
    keywords: ['çiçek renkleri', 'gül renkleri', 'çiçek anlamları', 'kırmızı gül anlamı', 'pembe gül anlamı'],
    category: 'meanings',
    categoryName: 'Çiçek Anlamları',
    excerpt: 'Her çiçek rengi farklı bir duygu ve mesaj taşır. Kırmızı, pembe, beyaz, sarı ve diğer renklerin anlamlarını öğrenin!',
    image: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    author: 'Vadiler Çiçek Uzmanları',
    publishDate: '2025-01-12',
    readTime: 9,
    content: `
Çiçekler sadece güzellikleriyle değil, taşıdıkları anlamlarla da özel mesajlar verir. Her renk, farklı bir duygu ve niyeti simgeler. Bu rehberde, çiçek renklerinin anlamlarını ve hangi durumlarda kullanılması gerektiğini detaylıca inceleyeceğiz.

## Kırmızı Çiçeklerin Anlamı

### Kırmızı Güller

**Simgelediği Duygular:**
- Tutkulu aşk
- Romantizm
- Arzu ve istek
- Saygı ve hayranlık

**Hangi Durumlarda?**
- Sevgililer Günü
- Evlilik teklifi
- Yıldönümü
- Romantik jestler

**Mesaj:** "Seni tutkuyla seviyorum"

### Kırmızı Gerbera

- Canlılık ve enerji
- Güçlü duygular
- Neşe ve coşku

## Pembe Çiçeklerin Anlamı

### Pembe Güller

**Açık Pembe:**
- Zarafet ve incelik
- Nazik sevgi
- Hayranlık
- Şefkat

**Koyu Pembe:**
- Minnet ve teşekkür
- Mutluluk
- Takdir

**Hangi Durumlarda?**
- İlk buluşma
- Anneler Günü
- Arkadaşa hediye
- Teşekkür mesajı

**Mesaj:** "Sen çok özelsin ve seni takdir ediyorum"

### Pembe Lilyum

- Kadınsılık
- Güzellik
- Masumiyet

## Beyaz Çiçeklerin Anlamı

### Beyaz Güller

**Simgelediği Duygular:**
- Saflık ve masumiyet
- Yeni başlangıçlar
- Gerçek aşk
- Saygı

**Hangi Durumlarda?**
- Düğünler
- Nikah törenleri
- Mezuniyet
- Taziye

**Mesaj:** "Saf ve temiz duygularım seninle"

### Beyaz Lilyum

- Arınma
- Bağlılık
- Huzur

### Beyaz Orkide

- Zarif güzellik
- İnce düşünce
- Saflık

## Sarı Çiçeklerin Anlamı

### Sarı Güller

**Simgelediği Duygular:**
- Arkadaşlık
- Neşe ve mutluluk
- Sevinç
- Yeni başlangıçlar

**DİKKAT:** Romantik ilişkilerde dikkatli kullanın (arkadaşlık anlamı taşır)

**Hangi Durumlarda?**
- Arkadaşa hediye
- Geçmiş olsun
- Başarı kutlaması
- Yeni iş

**Mesaj:** "Mutluluğunu paylaşıyorum"

### Sarı Gerbera

- Enerjik mutluluk
- Güneş gibi sıcaklık
- İyimserlik

## Turuncu Çiçeklerin Anlamı

### Turuncu Güller

**Simgelediği Duygular:**
- Coşku ve heyecan
- Tutku (kırmızıdan daha ılımlı)
- Hayranlık
- İstek

**Hangi Durumlarda?**
- Heyecanlı haberler
- Başarı kutlaması
- Arkadaştan sevgiliye geçiş
- Minnettarlık

**Mesaj:** "Seninle olmaktan çok mutluyum"

### Turuncu Gerbera

- Neşe patlaması
- Güneş enerjisi
- Sıcak duygular

## Mor ve Lila Çiçeklerin Anlamı

### Mor Orkide

**Simgelediği Duygular:**
- Asalet ve zarafet
- Hayranlık ve saygı
- Manevi bağ
- Gizemlilik

**Hangi Durumlarda?**
- Özel birine hediye
- Teşekkür
- Anneler Günü
- İş dünyası hediyeleri

**Mesaj:** "Sana derin saygım var"

### Lila Çiçekler

- İlk aşk
- Masumiyet
- Genç sevgi

## Mavi Çiçeklerin Anlamı

### Mavi Güller (Boyalı)

**Simgelediği Duygular:**
- Gizemlilik
- Ulaşılmazlık
- İmkansız aşk
- Rüya

**DİKKAT:** Doğal mavi gül yoktur, boyalı veya genetik modifiye edilmiştir.

**Hangi Durumlarda?**
- Farklı olmak isteyenler için
- Hayal ve rüya temaları
- Özel ve nadir jestler

**Mesaj:** "Sen benim rüyamsın"

## Karışık Renk Buketlerin Anlamı

### Renkli Buketler

**Ne Zaman Kullanılır?**
- Kesin renk anlamı vermek istemediğinizde
- Neşeli ve enerjik mesaj
- Dostluk ve arkadaşlık
- Genel kutlamalar

**Mesaj:** "Hayat renkli ve güzel"

## Çiçek Sayısı ve Anlamları

### Gül Sayıları

**1 Gül:** İlk görüşte aşk
**3 Gül:** Seni seviyorum (geçmiş, şimdi, gelecek)
**5 Gül:** Seni çok seviyorum
**6 Gül:** Sana tutkunum
**9 Gül:** Sonsuz aşk
**10 Gül:** Mükemmelsin
**11 Gül:** Benim tek aşkımsın
**12 Gül:** Benimle evlenir misin? / Seni her ay seviyorum
**24 Gül:** Seni 24 saat düşünüyorum
**50 Gül:** Sonsuz aşk
**99 Gül:** Ömür boyu seninle
**101 Gül:** Sen benim her şeyimsin

## Özel Günlere Göre Renk Seçimi

### Sevgililer Günü
**En İyi:** Kırmızı, pembe
**Alternatif:** Mor orkide, karışık romantik

### Anneler Günü
**En İyi:** Pembe, mor, beyaz
**Alternatif:** Karışık pastel tonlar

### Doğum Günü
**En İyi:** Kişinin sevdiği renk
**Genel:** Sarı, turuncu, karışık

### Geçmiş Olsun
**En İyi:** Pembe, beyaz, açık tonlar
**KAÇININ:** Kırmızı (romantik anlam taşır)

### Yıldönümü
**En İyi:** Kırmızı, pembe
**Özel:** İlk buluşmada verdiğiniz renk

### Taziye
**En İyi:** Beyaz
**Alternatif:** Açık tonlar, tek renk

### İş Dünyası
**En İyi:** Beyaz, mor orkide
**KAÇININ:** Kırmızı (çok kişisel)

## Renk Psikolojisi ve Etkileri

### Sıcak Renkler (Kırmızı, Turuncu, Sarı)

**Psikolojik Etki:**
- Enerji ve heyecan artışı
- Dikkat çekme
- Sıcaklık hissi
- İştah açma

**Kullanım Alanları:**
- Romantik jestler
- Enerji verici hediyeler
- Mutluluk mesajları

### Soğuk Renkler (Mavi, Mor, Beyaz)

**Psikolojik Etki:**
- Huzur ve sakinlik
- Güven verme
- Ferahlık
- Asalet hissi

**Kullanım Alanları:**
- Resmi hediyeler
- Saygı göstergesi
- Huzur mesajları

## Kültürel Farklılıklar

### Türkiye'de

- **Sarı:** Genelde pozitif (dikkat: bazıları ayrılık simgesi sayar)
- **Beyaz:** Saflık, düğünler
- **Kırmızı:** Aşk ve tutku

### Batı Kültüründe

- **Sarı:** Arkadaşlık, kıskançlık
- **Beyaz:** Saflık, taziye
- **Kırmızı:** Aşk ve tutku

### Doğu Kültüründe

- **Sarı:** Mutluluk, refah
- **Beyaz:** Yas ve taziye
- **Kırmızı:** Şans ve bereket

## Yanlış Renk Seçimi Örnekleri

❌ **Sevgiliye Sarı Gül:** Arkadaşlık anlamı verebilir
❌ **İş Arkadaşına Kırmızı Gül:** Çok kişisel
❌ **Hastaya Beyaz Lilyum:** Bazıları cenaze çiçeği sayar
❌ **İlk Buluşmada 50 Kırmızı Gül:** Çok ağır gelebilir

## Renkleri Doğru Birleştirme

### Uyumlu Kombinasyonlar

**Kırmızı + Beyaz:**
- Klasik romantizm
- Saflık ve tutku

**Pembe + Beyaz:**
- Zarif ve yumuşak
- Anneler Günü için ideal

**Sarı + Turuncu:**
- Enerjik ve neşeli
- Doğum günleri için

**Mor + Beyaz:**
- Asil ve zarif
- İş hediyeleri için

## Sonuç

Çiçek renkleri, verdiğiniz mesajı güçlendirir veya tamamen değiştirir. Doğru renk seçimi, duygu ve niyetinizi en iyi şekilde ifade etmenizi sağlar.

Vadiler Çiçek olarak, size özel renk kombinasyonları öneriyoruz. Her özel gününüz için doğru renkte, taze çiçekler hazırlıyoruz. Renk seçiminde kararsız kaldığınızda, uzman ekibimiz size yardımcı olmaktan mutluluk duyar.

**Unutmayın:** Çiçeklerin dili evrenseldir, ama mesajınız kalbinizden geliyorsa en doğrusu odur!
    `,
    relatedGuides: ['cicek-secim-rehberi', 'cicek-bakim-rehberi', 'gul-sayilari-anlamlari'],
    faqItems: [
      {
        question: 'Sarı gül sevgiliye verilir mi?',
        answer: 'Sarı güller genelde arkadaşlık simgesidir. Romantik ilişkilerde kırmızı veya pembe güller tercih edilmelidir.',
      },
      {
        question: 'Beyaz çiçekler sadece cenaze için mi?',
        answer: 'Hayır, beyaz çiçekler saflık, yeni başlangıç ve düğünleri de simgeler. Beyaz güller ve orkideler hediye olarak da verilebilir.',
      },
      {
        question: 'Kaç gül vermek en iyisidir?',
        answer: '12 gül klasik ve en popüler seçimdir. 24 gül özel günler için, 50 gül ise sonsuz aşk mesajı vermek isteyenler için idealdir.',
      },
    ],
  },

  {
    slug: 'cicek-siparisi-ipuclari',
    title: 'Çiçek Siparişi Vermeden Önce: Adres, Mesaj Kartı ve Teslimat İçin 10 İpucu',
    metaTitle: 'Çiçek Siparişi İpuçları | Adres, Not ve Teslimat Rehberi | Vadiler',
    metaDescription:
      'Çiçek siparişinde en sık yapılan hataları önleyin: doğru adres, alıcı iletişimi, mesaj kartı ve teslimat notları için pratik ipuçları.',
    keywords: [
      'çiçek siparişi ipuçları',
      'mesaj kartı',
      'çiçek notu',
      'teslimat notu',
      'adres bilgisi',
      'çiçek gönder',
    ],
    category: 'tips',
    categoryName: 'İpuçları',
    excerpt:
      'En önemli 3 şey: doğru adres, alıcı iletişimi ve kısa/temiz bir not. Bu rehber, siparişin sorunsuz ilerlemesi için pratik kontrol listesi sunar.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225138/vadiler/products/vadiler-sensiz-olmaz-25-beyaz-guller.jpg',
    author: 'Vadiler Çiçek Uzmanları',
    publishDate: '2025-12-18',
    readTime: 6,
    content: `
Çiçek siparişi verirken ürün seçimi kadar **adres, alıcı bilgileri ve not** da önemlidir. Aşağıdaki ipuçları siparişin sorunsuz ilerlemesine yardımcı olur.

## 1) Adresi net yazın

- İlçe / mahalle / sokak / bina no / daire no
- Site adı, blok ve giriş bilgisi
- Mümkünse kısa bir tarif ("X eczanesinin yanı")

## 2) Alıcı telefonu mutlaka doğru olsun

Teslimat sırasında alıcıya ulaşılamaması en sık gecikme nedenidir. Alternatif bir numara da eklemek faydalı olur.

## 3) İş yeri teslimatlarında birim/kat bilgisi ekleyin

"Plaza adı + kat + departman" yazmak, teslimatı hızlandırır.

## 4) Mesaj kartını kısa ve net tutun

Uzun notlar kartta taşabilir. 1–2 cümle yeter.

Örnekler:
- "İyi ki varsın. Seni çok seviyorum."
- "Yeni yaşın kutlu olsun, hep gülümse."
- "Geçmiş olsun. Yanındayım."

## 5) Gönderen adını doğru girin

Sürprizse, gönderen adını gizli tutmak isteyebilirsiniz. Bu bilgiyi not kısmında netleştirin.

## 6) Özel talep varsa tek cümleyle belirtin

Örn: "Kırmızı ton ağırlıklı olsun" veya "Kokusu hafif bir seçenek olsun" gibi.

## 7) Alıcı evde değilse ne yapılsın?

Sipariş notuna şunu ekleyebilirsiniz:
- "Kapıcıya teslim edilebilir"
- "Komşuya bırakılabilir (Daire 3)"
- "Bana haber verin"

## 8) Doğru kategori ile başlayın

Kararsızsanız rehberlerden ve kategorilerden ilerlemek seçim işini kolaylaştırır.

## 9) Özel günlerde daha erken planlayın

Özel günlerde yoğunluk artar; adres/iletişim bilgilerinin eksiksiz olması daha da önemlidir.

## 10) Sorunuz varsa destek alın

Sipariş öncesi ürün/teslimat sorularında destek ekibimiz yönlendirme yapabilir.
    `,
    relatedGuides: ['cicek-secim-rehberi', 'istanbul-hizli-teslimat-rehberi', 'cicek-renk-anlamlari'],
    faqItems: [
      {
        question: 'Mesaj kartına ne yazmalıyım?',
        answer:
          'Kısa ve net bir not en iyisidir. 1–2 cümle; duygu, kutlama veya destek mesajı vermeniz yeterli olur.',
      },
      {
        question: 'Adres eksik olursa ne olur?',
        answer:
          'Eksik veya hatalı adres, teslimatın gecikmesine neden olabilir. İlçe/mahalle/sokak ve daire bilgisi mutlaka yazılmalıdır.',
      },
      {
        question: 'Alıcı evde değilse ne yapılır?',
        answer:
          'Kurye alıcıyla iletişime geçer. Notta belirtilmişse kapıcı/komşuya bırakılabilir ya da sizin yönlendirmeniz alınır.',
      },
    ],
  },
];

// Kategori bazlı filtreleme fonksiyonları
export const getGuidesByCategory = (category: GuideContent['category']) => {
  return GUIDE_CONTENTS.filter(guide => guide.category === category);
};

export const getGuideBySlug = (slug: string) => {
  return GUIDE_CONTENTS.find(guide => guide.slug === slug);
};

export const getRelatedGuides = (currentSlug: string) => {
  const currentGuide = GUIDE_CONTENTS.find(g => g.slug === currentSlug);
  if (!currentGuide || !currentGuide.relatedGuides) return [];
  
  return GUIDE_CONTENTS.filter(g => 
    currentGuide.relatedGuides?.includes(g.slug)
  );
};
