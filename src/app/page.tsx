import {
  Header,
  HeroSlider,
  BannerGrid,
  Marquee,
  ProductsGrid,
  Footer,
  MobileNavBar,
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
        <HeroSlider />

        {/* Story-style Category Carousel (like Çiçeksepeti) */}
        <StoryBannerCarousel />

        {/* Marquee - Scrolling Text */}
        <Marquee />

        {/* Featured Banner Grid - 8 Popüler Kategoriler */}
        <FeaturedBannerGrid />

        {/* Category: Güller */}
        <ProductsGrid 
          categorySlug="guller" 
          title="🌹 Güller" 
          subtitle="En güzel gül çeşitleri"
          limit={12}
          showCategoryImage
        />

        {/* Category: Orkideler */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            categorySlug="orkideler" 
            title="🌸 Orkideler" 
            subtitle="Zarif orkide seçenekleri"
            limit={12}
            showCategoryImage
          />
        </div>

        {/* Category: Buketler */}
        <ProductsGrid 
          categorySlug="buketler" 
          title="💐 Buketler" 
          subtitle="Özel tasarım buketler"
          limit={12}
          showCategoryImage
        />

        {/* Second Marquee */}
        <Marquee 
          text="✦ Ücretsiz Kargo  ★  ✦ Hızlı Teslimat  ★  ✦ Taze Çiçekler  ★  ✦ Güvenli Ödeme  ★" 
          variant="secondary" 
        />

        {/* Category: Ayıcıklı Çiçekler */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            categorySlug="ayicikli-cicekler" 
            title="🧸 Ayıcıklı Çiçekler" 
            subtitle="Sevimli ayıcıklı aranjmanlar"
            limit={12}
            showCategoryImage
          />
        </div>

        {/* Category: Balonlu Çiçekler */}
        <ProductsGrid 
          categorySlug="balonlu-cicekler" 
          title="🎈 Balonlu Çiçekler" 
          subtitle="Balonlarla süslü çiçekler"
          limit={12}
          showCategoryImage
        />

        {/* Banner Grid - 3 Promotional Banners */}
        <BannerGrid />

        {/* Category: Saksı Çiçekleri */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            categorySlug="saksi-cicekleri" 
            title="🪴 Saksı Çiçekleri" 
            subtitle="Uzun ömürlü saksı bitkileri"
            limit={12}
            showCategoryImage
          />
        </div>

        {/* Category: Aranjmanlar */}
        <ProductsGrid 
          categorySlug="aranjmanlar" 
          title="🎀 Aranjmanlar" 
          subtitle="Şık çiçek aranjmanları"
          limit={12}
          showCategoryImage
        />

        {/* Quick Category Pills - Kategori Kısayolları */}
        <QuickCategoryPills />

        {/* Category: Kutuda Çiçekler */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            categorySlug="kutuda-cicekler" 
            title="🎁 Kutuda Çiçekler" 
            subtitle="Özel kutularda çiçekler"
            limit={12}
            showCategoryImage
          />
        </div>

        {/* Category: Lilyumlar */}
        <ProductsGrid 
          categorySlug="lilyumlar" 
          title="🌺 Lilyumlar" 
          subtitle="Zarif lilyum çeşitleri"
          limit={12}
          showCategoryImage
        />

        {/* Third Marquee */}
        <Marquee 
          text="✿ %30 İndirim  ✿  ✿ Taze Çiçekler  ✿  ✿ Hızlı Teslimat  ✿  ✿ Güvenli Ödeme  ✿" 
          variant="primary" 
        />

        {/* Category: Papatyalar */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            categorySlug="papatyalar" 
            title="🌼 Papatyalar" 
            subtitle="Neşeli papatya buketleri"
            limit={12}
            showCategoryImage
          />
        </div>

        {/* Category: Hediyeler */}
        <ProductsGrid 
          categorySlug="hediye" 
          title="🎊 Hediyeler" 
          subtitle="Özel hediye seçenekleri"
          limit={12}
          showCategoryImage
        />

        {/* Category: Çiçek Çeşitleri */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            categorySlug="cicek-cesitleri" 
            title="💮 Çiçek Çeşitleri" 
            subtitle="Tüm çiçek çeşitleri"
            limit={12}
            showCategoryImage
          />
        </div>

        {/* Products Grid - Best Sellers */}
        <ProductsGrid 
          title="⭐ Çok Satanlar" 
          subtitle="En beğenilen çiçeklerimiz"
          limit={12}
        />

        {/* Products Grid - New Arrivals */}
        <div className="bg-gray-50/50">
          <ProductsGrid 
            title="🆕 Yeni Gelenler" 
            subtitle="En son eklenen çiçeklerimiz"
            limit={12}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar />
    </>
  );
}
