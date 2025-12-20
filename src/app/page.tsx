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

export default function Home() {
  return (
    <>
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
