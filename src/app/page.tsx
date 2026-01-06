import {
  Header,
  HeroSlider,
  CategoryCarousel,
  Marquee,
  SeoContentSection,
  Footer,
  MobileNavVisibilityGuard,
  StoryBannerCarousel,
  FeaturedBannerGrid,
  QuickCategoryPills,
} from '@/components';
import FAQSchema from '@/components/FAQSchema';

const faqs = [
  {
    question: 'Online çiçek siparişi nasıl verilir?',
    answer: 'Vadiler.com üzerinden çiçek siparişi vermek çok kolay! İstediğiniz çiçeği seçin, teslimat adresini girin ve güvenli ödeme yöntemlerimizden biriyle siparişinizi tamamlayın. Kredi kartı veya banka havalesi ile ödeme yapabilirsiniz.',
  },
  {
    question: 'Gül buketi fiyatları nedir?',
    answer: 'Gül buketi fiyatları gül sayısı, buket boyutu ve aranjman tasarımına göre değişir. En güncel fiyatları Güller kategorisindeki ürün sayfalarında görebilir ve dilediğiniz kombinasyonu seçebilirsiniz.',
  },
  {
    question: 'Orkide bakımı nasıl yapılır?',
    answer: 'Orkideyi dolaylı gün ışığı alan bir noktada konumlandırın, haftada 1 kez sulayın ve saksı içinde su birikmemesine dikkat edin. Oda sıcaklığında, esintiden uzak bir ortam orkidenin uzun süre sağlıklı kalmasını sağlar.',
  },
  {
    question: 'Anneler Günü için en çok tercih edilen çiçekler hangileri?',
    answer: 'Anneler Günü\'nde en çok tercih edilen çiçekler gül, orkide ve lilyumdur. Zarif buketler ve özel aranjmanlar duyguyu en iyi şekilde ifade eder; seçim için Anneler Günü koleksiyonlarımızı inceleyebilirsiniz.',
  },
  {
    question: 'Sevgililer Günü için hangi çiçekler önerilir?',
    answer: 'Sevgililer Günü için kırmızı gül klasik ve güçlü bir tercihtir. Ayrıca lilyum, orkide ve romantik buket aranjmanları da sıkça tercih edilir. Özel tasarım seçeneklerimizi Sevgililer Günü koleksiyonunda bulabilirsiniz.',
  },
  {
    question: 'Çiçek fiyatları nasıl belirlenir?',
    answer: 'Çiçek fiyatları tür, mevsim, aranjman tasarımı ve kullanılan ek materyallere göre değişir. Ürün sayfalarında güncel fiyat, stok, teslim alanı ve opsiyonlar yer alır.',
  },
  {
    question: 'Lilyum bakımı nasıl yapılır?',
    answer: 'Lilyumları serin ve aydınlık bir ortamda, doğrudan güneşten uzak konumlandırın. Vazosu içindeki suyu 2-3 günde bir yenileyin ve sap uçlarını kısaltın. Polenleri temizleyerek yaprak ve yüzeylerde leke oluşumunu önleyin.',
  },
  {
    question: 'Gül renkleri neyi ifade eder?',
    answer: 'Kırmızı gül aşkı, beyaz gül masumiyeti ve saflığı, pembe gül zarafet ve şükranı, sarı gül ise dostluk ve neşeyi simgeler. Mesajınıza uygun rengi seçerek duygunuzu net iletebilirsiniz.',
  },
  {
    question: 'Çiçek siparişi teslim süresi nedir?',
    answer: 'Teslim süresi ürün, hazırlık süresi ve teslimat adresine göre değişir. Sepet ve ödeme adımlarında en yakın teslim tarihi ve zaman aralığı gösterilir; bu bilgiyi onaydan önce görebilirsiniz.',
  },
  {
    question: 'Çiçekler ne kadar süre taze kalır?',
    answer: 'Taze kesim çiçeklerimiz doğrudan üreticilerden temin edilir. Düzenli su değişimi ve uygun bakımla 7-14 gün arası taze kalabilir. Her siparişle birlikte çiçek bakım rehberi gönderiyoruz.',
  },
  {
    question: 'Hangi semtlere teslimat yapıyorsunuz?',
    answer: 'İstanbul\'un tüm ilçelerine teslimat yapıyoruz: Kadıköy, Beşiktaş, Şişli, Bakırköy, Üsküdar, Beyoğlu ve diğer tüm semtler. Teslimat ücretleri bölgeye göre değişiklik gösterebilir.',
  },
  {
    question: 'Ödeme yöntemleriniz nelerdir?',
    answer: 'Güvenli 3D Secure kredi kartı ödemesi veya banka havalesi/EFT ile ödeme yapabilirsiniz. Tüm ödemeleriniz SSL sertifikası ile korunmaktadır.',
  },
  {
    question: 'İptal ve iade koşullarınız nedir?',
    answer: 'Çiçek ürünlerimiz için sipariş verdikten sonra 2 saat içinde ücretsiz iptal hakkınız vardır. Ürün teslimatında herhangi bir sorun olması durumunda 24 saat içinde iletişime geçerek değişim veya iade talebinde bulunabilirsiniz.',
  },
];

export default function Home() {
  return (
    <>
      {/* FAQ Schema for SEO */}
      <FAQSchema faqs={faqs} />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        {/* Hero Slider */}
        <HeroSlider id="hero-section" />

        {/* Story-style Category Carousel (like Çiçeksepeti) */}
        <StoryBannerCarousel />

        {/* Kampanyalı Ürünler Slider - only under circle categories */}
        <CategoryCarousel />

        {/* Marquee - Scrolling Text */}
        <Marquee />

        {/* Featured Banner Grid - 8 Popüler Kategoriler */}
        <FeaturedBannerGrid />

        {/* Second Marquee */}
        <Marquee 
          text="✦ Ücretsiz Kargo  ★  ✦ Hızlı Teslimat  ★  ✦ Taze Çiçekler  ★  ✦ Güvenli Ödeme  ★" 
          variant="secondary" 
        />

        {/* Quick Category Pills - Kategori Kısayolları */}
        <QuickCategoryPills />

        {/* Third Marquee */}
        <Marquee 
          text="✿ %30 İndirim  ✿  ✿ Taze Çiçekler  ✿  ✿ Hızlı Teslimat  ✿  ✿ Güvenli Ödeme  ✿"
          variant="primary"
        />
        {/* SEO content block */}
        <SeoContentSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavVisibilityGuard />
    </>
  );
}
