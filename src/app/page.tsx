import dynamic from 'next/dynamic';
import {
  Header,
  Marquee,
  SeoContentSection,
  Footer,
  MobileNavVisibilityGuard,
  FeaturedBannerGrid,
  QuickCategoryPills,
} from '@/components';
import FAQSchema from '@/components/FAQSchema';

// Lazy load ağır carousel bileşenleri - INP optimizasyonu
const ModernHeroSlider = dynamic(() => import('@/components/ModernHeroSlider'), {
  loading: () => <div className="h-screen max-h-[100svh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-pulse" />,
});

const CategoryCarousel = dynamic(() => import('@/components/CategoryCarousel'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
});

const faqs = [
  // Gül Sayıları ve Anlamları
  {
    question: '1 adet gül ne anlama gelir?',
    answer: '1 adet gül "Sen benim için tek ve biriciksin" anlamına gelir. İlk görüşte aşkı, yeni başlayan bir ilişkiyi veya "seni seviyorum" mesajını ifade eder. Özellikle tanışma ve flört döneminde tercih edilir.',
  },
  {
    question: '3 adet gül ne anlama gelir?',
    answer: '3 adet gül "Seni seviyorum" demektir. Klasik bir aşk itirafı olarak kabul edilir. Kırmızı 3 gül romantik ilişkilerde, beyaz 3 gül ise samimiyet ve dostlukta tercih edilir.',
  },
  {
    question: '5 adet gül ne anlama gelir?',
    answer: '5 adet gül "Sana hayranlık duyuyorum" mesajını verir. Beğeni, takdir ve saygının ifadesidir. Arkadaşlıktan aşka geçiş döneminde veya platonik sevgide tercih edilen bir sayıdır.',
  },
  {
    question: '7 adet gül ne anlama gelir?',
    answer: '7 adet gül "Seninle büyüleniyorum, sana tutkunum" anlamını taşır. Tutkulu aşkı, yoğun duyguları ve büyüleyici bir çekimi ifade eder. Romantik ilişkilerde sık tercih edilir.',
  },
  {
    question: '7 kırmızı gül ne anlama gelir?',
    answer: '7 kırmızı gül "Sana aşığım, seninle büyüleniyorum" mesajını verir. Kırmızı renk romantik aşkı, 7 sayısı ise tutkuyu simgeler. Sevgililer Günü, yıldönümü ve romantik sürprizlerde en çok tercih edilen kombinasyonlardan biridir.',
  },
  {
    question: '9 adet gül ne anlama gelir?',
    answer: '9 adet gül "Sonsuza dek seninle olmak istiyorum" demektir. Uzun vadeli bir ilişki vaadi, bağlılık ve sonsuz sevgi anlamını taşır. Evlilik yıldönümleri ve özel günlerde tercih edilir.',
  },
  {
    question: '10 adet gül ne anlama gelir?',
    answer: '10 adet gül "Sen kusursuz ve mükemmelsin" mesajını verir. Karşı tarafın eksiksiz olduğunu, onu her haliyle sevdiğinizi ifade eder. Sevgiliye veya eşe özel günlerde gönderilir.',
  },
  {
    question: '11 adet gül ne anlama gelir?',
    answer: '11 adet gül "Sen benim hazinem, en değerlimsin" anlamına gelir. Karşı tarafın hayatınızdaki en kıymetli varlık olduğunu gösterir. Derin aşk ve değer vermenin simgesidir.',
  },
  {
    question: '11 kırmızı gül ne anlama gelir?',
    answer: '11 kırmızı gül "Sen hayatımın en değerli hazinesisin, seni çok seviyorum" mesajını verir. Romantik aşk ve derin bağlılığın güçlü bir ifadesidir. Sevgiliye veya eşe doğum günü, yıldönümü gibi özel günlerde ideal bir tercihtir.',
  },
  {
    question: '12 adet gül ne anlama gelir?',
    answer: '12 adet gül (1 düzine) "Her ay, her gün, her an seninleyim" demektir. Yılın 12 ayı boyunca sürecek sevgiyi simgeler. Evlilik teklifleri ve yıldönümlerinde popüler bir seçimdir.',
  },
  {
    question: '15 adet gül ne anlama gelir?',
    answer: '15 adet gül "Affet beni, çok özür dilerim" anlamını taşır. Pişmanlık, özür ve barışma mesajı verir. İlişkide yaşanan sorunların ardından gönderilen güçlü bir barış eli simgesidir.',
  },
  {
    question: '21 adet gül ne anlama gelir? İstemede neden 21 gül?',
    answer: '21 adet gül "Sana adadım kendimi, sen benim için her şeysin" demektir. Türk kültüründe kız isteme geleneğinde 21 gül tercih edilir çünkü 21 sayısı "sonsuz bağlılık ve adanmışlık" anlamı taşır. Söz ve nişan törenlerinde en çok tercih edilen sayıdır.',
  },
  {
    question: '21 kırmızı gül ne anlama gelir?',
    answer: '21 kırmızı gül Türk kültüründe kız isteme ve söz kesme törenlerinin vazgeçilmez simgesidir. "Sana sonsuz bağlıyım, hayatımı seninle birleştirmek istiyorum" mesajını taşır. Evlilik teklifi, nişan ve söz törenlerinde en romantik jesttir.',
  },
  {
    question: '25 adet gül ne anlama gelir?',
    answer: '25 adet gül "Tebrikler, seninle gurur duyuyorum" mesajını verir. Başarı, mezuniyet, yeni iş veya terfi gibi kutlama anlarında tercih edilir. Takdir ve övgünün simgesidir.',
  },
  {
    question: '33 adet gül ne anlama gelir?',
    answer: '33 adet gül "Seninle geçirdiğim her an çok değerli" anlamını taşır. Derin ve köklü bir aşkı, yıllara meydan okuyan sevgiyi simgeler. Uzun süreli ilişkilerde özel günlerde tercih edilir.',
  },
  {
    question: '50 adet gül ne anlama gelir?',
    answer: '50 adet gül "Sınırsız ve koşulsuz sevgi" demektir. Büyük aşkı, tutkuyu ve karşı tarafa olan bağlılığı en yüksek seviyede ifade eder. Özel günlerde gösterişli bir jest olarak gönderilir.',
  },
  {
    question: '99 adet gül ne anlama gelir?',
    answer: '99 adet gül "Sonsuza dek, ölene kadar seveceğim" anlamını taşır. En güçlü aşk beyanı olarak kabul edilir. Evlilik teklifleri ve çok özel anlarda tercih edilen romantik bir jesttir.',
  },
  {
    question: '101 adet gül ne anlama gelir?',
    answer: '101 adet gül "Sen benim biricik aşkımsın, dünyada tek" demektir. Aşkın en yüce ifadesidir. Evlilik teklifleri, büyük yıldönümleri ve unutulmaz anlarda tercih edilir.',
  },
  {
    question: '101 kırmızı gül ne anlama gelir?',
    answer: '101 kırmızı gül aşkın en büyük ve en görkemli ifadesidir. "Sen dünyada tek ve biriciksin, seni sonsuza dek seveceğim" mesajını verir. Evlilik teklifleri, büyük sürprizler ve hayatın en özel anları için tercih edilen muhteşem bir jesttir.',
  },
  // Demet ve Düzine Bilgileri
  {
    question: '1 demet gül kaç tanedir?',
    answer: 'Türkiye\'de 1 demet gül genellikle 10-12 adet gül içerir. Ancak satıcıya ve bölgeye göre 7-15 arası değişebilir. Vadiler.com\'da demet içeriği ürün açıklamasında net olarak belirtilir.',
  },
  {
    question: '1 düzine gül kaç tanedir?',
    answer: '1 düzine gül 12 adettir. Düzine kelimesi Fransızca "douzaine" kelimesinden gelir ve tüm dünyada 12 adet anlamında kullanılır. Gül buketlerinde en klasik ve popüler sayıdır.',
  },
  // Gül Renkleri ve Anlamları
  {
    question: 'Kırmızı gül ne anlama gelir?',
    answer: 'Kırmızı gül romantik aşkın, tutkunun ve derin sevginin evrensel simgesidir. "Seni delicesine seviyorum" mesajını verir. Sevgililer Günü ve romantik özel günlerde en çok tercih edilen çiçektir.',
  },
  {
    question: 'Beyaz gül ne anlama gelir?',
    answer: 'Beyaz gül saflığı, masumiyeti, yeni başlangıçları ve derin saygıyı simgeler. Düğünlerde gelin buketlerinde, cenaze törenlerinde taziye için ve yeni bebek kutlamalarında tercih edilir.',
  },
  {
    question: 'Pembe gül ne anlama gelir?',
    answer: 'Pembe gül zarafeti, şükranı, takdiri ve nazik sevgiyi ifade eder. Anneye, arkadaşa veya minnettarlık duymak istediğiniz kişilere gönderilir. Anneler Günü\'nde en çok tercih edilen renklerdendir.',
  },
  {
    question: 'Sarı gül ne anlama gelir?',
    answer: 'Sarı gül dostluğu, neşeyi, mutluluğu ve yeni başlangıçları simgeler. Arkadaşlar arası kutlamalarda, moral vermek istediğiniz zamanlarda tercih edilir. Romantik ilişkilerde dikkatli kullanılmalıdır.',
  },
  {
    question: 'Turuncu gül ne anlama gelir?',
    answer: 'Turuncu gül enerji, coşku, hayranlık ve tutkulu arzuyu ifade eder. Yeni bir ilişkinin heyecanını veya birine duyulan güçlü çekimi göstermek için gönderilir.',
  },
  {
    question: 'Mor/Lila gül ne anlama gelir?',
    answer: 'Mor ve lila güller büyülenmeyi, görkemi ve ilk görüşte aşkı simgeler. Karşı tarafa "Senden çok etkilendim" mesajı vermek için tercih edilir. Zarif ve sofistike bir seçimdir.',
  },
  // Genel Çiçek Bilgileri
  {
    question: 'İstanbul içi çiçek gönderme nasıl yapılır?',
    answer: 'İstanbul içi çiçek gönderimi için Vadiler.com\'u kullanabilirsiniz. Teslimat adresini girin, beğendiğiniz çiçeği seçin ve ödemenizi tamamlayın. İstanbul\'un tüm ilçelerine aynı gün teslimat yapıyoruz. Saat 16:00\'a kadar verilen siparişler aynı gün teslim edilir.',
  },
  {
    question: 'Aynı gün teslimat çiçek İstanbul için nasıl sipariş verilir?',
    answer: 'İstanbul\'a aynı gün çiçek teslimatı için siparişinizi saat 16:00\'a kadar oluşturmanız yeterli. Vadiler.com\'da ürünü seçin, teslimat adresini girin ve ödemenizi yapın. Çiçeğiniz aynı gün sevdiklerinize ulaştırılır.',
  },
  {
    question: 'Online çiçek siparişi İstanbul için nasıl verilir?',
    answer: 'İstanbul\'a online çiçek siparişi vermek çok kolay! Vadiler.com\'a girin, beğendiğiniz çiçeği seçin, teslimat adresini yazın ve güvenli ödeme ile siparişinizi tamamlayın. Kredi kartı veya havale ile ödeme yapabilirsiniz.',
  },
  {
    question: 'Yıldönümü için hangi çiçekler tercih edilmeli?',
    answer: 'Yıldönümü için kırmızı güller en klasik ve romantik tercihtir. 11 veya 21 kırmızı gül buketi aşkı ve bağlılığı simgeler. Orkide zarif bir alternatif olarak tercih edilebilir. Yıldönümü özel aranjmanlarımız için koleksiyonumuzu inceleyebilirsiniz.',
  },
  {
    question: 'Yıldönümü çiçekleri nasıl seçilir?',
    answer: 'Yıldönümü çiçeği seçerken partnerinizin en sevdiği renk ve çiçek türünü düşünün. Kırmızı gül tutkuyu, pembe gül zarafeti, beyaz gül ise saf aşkı simgeler. Özel bir dokunuş için kişiselleştirilmiş kart notu ekleyebilirsiniz.',
  },
  {
    question: 'Online çiçek siparişi nasıl verilir?',
    answer: 'Vadiler.com üzerinden çiçek siparişi vermek çok kolay! İstediğiniz çiçeği seçin, teslimat adresini girin ve güvenli ödeme yöntemlerimizden biriyle siparişinizi tamamlayın. Kredi kartı veya banka havalesi ile ödeme yapabilirsiniz.',
  },
  {
    question: 'İstanbul içi aynı gün teslimat saat kaça kadar?',
    answer: 'İstanbul içi aynı gün teslimat için siparişinizi saat 16:00’ya kadar oluşturabilirsiniz. Yoğun günlerde bazı ilçelerde kesim saati farklılık gösterebilir; sepet aşamasında en yakın teslim saatini görebilirsiniz.',
  },
  {
    question: 'Orkide bakımı nasıl yapılır?',
    answer: 'Orkideyi dolaylı gün ışığı alan bir noktada konumlandırın, haftada 1 kez sulayın ve saksı içinde su birikmemesine dikkat edin. Oda sıcaklığında, esintiden uzak bir ortam orkidenin uzun süre sağlıklı kalmasını sağlar.',
  },
  {
    question: 'Anneler Günü için en çok tercih edilen çiçekler hangileri?',
    answer: 'Anneler Günü\'nde en çok tercih edilen çiçekler pembe gül, orkide ve lilyumdur. Zarif buketler ve özel aranjmanlar duyguyu en iyi şekilde ifade eder; seçim için Anneler Günü koleksiyonlarımızı inceleyebilirsiniz.',
  },
  {
    question: 'Sevgililer Günü için hangi çiçekler önerilir?',
    answer: 'Sevgililer Günü için kırmızı gül klasik ve güçlü bir tercihtir. 7, 11, 21 veya 101 adet kırmızı gül en romantik seçeneklerdir. Ayrıca lilyum, orkide ve romantik buket aranjmanları da sıkça tercih edilir.',
  },
  {
    question: 'Lilyum bakımı nasıl yapılır?',
    answer: 'Lilyumları serin ve aydınlık bir ortamda, doğrudan güneşten uzak konumlandırın. Vazosu içindeki suyu 2-3 günde bir yenileyin ve sap uçlarını kısaltın. Polenleri temizleyerek yaprak ve yüzeylerde leke oluşumunu önleyin.',
  },
  {
    question: 'Çiçek siparişi teslim süresi nedir?',
    answer: 'Teslim süresi ürün, hazırlık süresi ve teslimat adresine göre değişir. Sepet ve ödeme adımlarında en yakın teslim tarihi ve zaman aralığı gösterilir; bu bilgiyi onaydan önce görebilirsiniz.',
  },
  {
    question: 'İstanbul’un hangi ilçelerine teslimat yapılıyor?',
    answer: 'Kadıköy, Beşiktaş, Şişli, Bakırköy, Üsküdar, Beyoğlu, Ataşehir, Sarıyer, Fatih, Maltepe, Kartal, Pendik, Beylikdüzü, Kağıthane, Ümraniye ve diğer tüm İstanbul ilçelerine teslimat yapıyoruz.',
  },
  {    question: 'Maltepe çiçek siparişi nasıl verilir?',
    answer: 'Maltepe\'ye çiçek siparişi vermek için Vadiler.com\'u kullanabilirsiniz. Teslimat adresi olarak Maltepe\'deki adresi girin, beğendiğiniz çiçeği seçin ve siparişinizi tamamlayın. Maltepe\'ye aynı gün çiçek teslimatı yapıyoruz.',
  },
  {
    question: 'Kadıköy çiçek siparişi nasıl verilir?',
    answer: 'Kadıköy\'e çiçek göndermek için Vadiler.com\'dan sipariş verebilirsiniz. Kadıköy\'ün tüm mahallelerine aynı gün teslimat yapıyoruz. Saat 16:00\'a kadar verilen siparişler aynı gün teslim edilir.',
  },
  {
    question: 'Beşiktaş çiçek siparişi nasıl verilir?',
    answer: 'Beşiktaş\'a çiçek siparişi için Vadiler.com\'u tercih edebilirsiniz. Beşiktaş\'ın tüm semtlerine hızlı ve güvenilir teslimat sağlıyoruz. Aynı gün teslimat seçeneğimiz mevcuttur.',
  },
  {    question: 'Çiçekler ne kadar süre taze kalır?',
    answer: 'Taze kesim çiçeklerimiz doğrudan üreticilerden temin edilir. Düzenli su değişimi ve uygun bakımla 7-14 gün arası taze kalabilir. Her siparişle birlikte çiçek bakım rehberi gönderiyoruz.',
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

      {/* Hidden SEO Content - Screen readers & crawlers only */}
      <div className="sr-only" aria-hidden="false">
        <h2>İstanbul Çiçek Siparişi - Vadiler Çiçekçilik</h2>
        <p>
          İstanbul çiçek siparişi için Türkiye&apos;nin en güvenilir online çiçekçisi Vadiler Çiçek&apos;e hoş geldiniz. 
          İstanbul içi çiçek siparişi verin, aynı gün kapınıza teslim edelim. Güvenilir çiçek siparişi garantisi ile 
          İstanbul&apos;un tüm ilçelerine hızlı ve ücretsiz teslimat yapıyoruz.
        </p>
        <h3>İstanbul Avrupa Yakası Çiçek Siparişi</h3>
        <p>
          Avrupa yakası çiçek siparişi için Vadiler Çiçek yanınızda. Beylikdüzü, Esenyurt, Avcılar, Küçükçekmece, 
          Bakırköy, Bahçelievler, Bağcılar, Esenler, Güngören, Zeytinburnu, Fatih, Beyoğlu, Şişli, Beşiktaş, 
          Sarıyer, Eyüpsultan, Gaziosmanpaşa, Sultangazi, Başakşehir, Arnavutköy, Büyükçekmece, Çatalca, Silivri 
          ilçelerine aynı gün çiçek gönderimi.
        </p>
        <h3>İstanbul Anadolu Yakası Çiçek Siparişi</h3>
        <p>
          Anadolu yakası çiçek siparişi hizmeti. Kadıköy, Üsküdar, Ataşehir, Maltepe, Kartal, Pendik, Tuzla, 
          Sultanbeyli, Sancaktepe, Ümraniye, Çekmeköy, Beykoz, Şile, Adalar ilçelerine online çiçek siparişi. 
          İstanbul Anadolu yakası çiçek gönder, sevdiklerini mutlu et.
        </p>
        <h3>Online Çiçek Siparişi - Güvenli Alışveriş</h3>
        <p>
          Online çiçek siparişi ile 7/24 sipariş verin. Güvenilir ödeme, SSL sertifikalı alışveriş, iyzico 3D Secure 
          ile güvenli ödeme. İstanbul çiçekçi, İstanbul online çiçekçi, internetten çiçek sipariş et. 
          Doğum günü çiçekleri, sevgiliye çiçek, anneler günü çiçekleri, evlilik yıldönümü çiçekleri.
        </p>
        <h3>Aynı Gün Çiçek Teslimatı İstanbul</h3>
        <p>
          Aynı gün teslimat garantisi ile İstanbul&apos;a çiçek gönder. Bugün sipariş ver, bugün teslim alalım. 
          İstanbul çiçek gönder, İstanbul&apos;a çiçek yolla, İstanbul çiçek siparişi online. 
          Taze çiçekler, kaliteli buketler, uygun fiyatlı çiçek siparişi.
        </p>
        <h3>Özel Günler İçin Çiçek Siparişi</h3>
        <p>
          Sevgililer günü çiçekleri, anneler günü çiçekleri, doğum günü çiçekleri, mezuniyet çiçekleri, 
          söz nişan çiçekleri, düğün çiçekleri, cenaze çiçekleri, açılış çiçekleri, tebrik çiçekleri. 
          Her özel gün için İstanbul çiçek siparişi Vadiler Çiçek&apos;te.
        </p>
        <h3>Çiçek Çeşitleri</h3>
        <p>
          Kırmızı güller, beyaz güller, pembe güller, orkideler, lilyumlar, papatyalar, ayçiçekleri, 
          gerbera, karanfil, lale, kasımpatı. Buket çiçekler, aranjmanlar, kutuda çiçekler, sepette çiçekler. 
          Romantik çiçekler, sevgi çiçekleri, aşk çiçekleri.
        </p>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        {/* Modern Hero Slider with Product Carousel */}
        <ModernHeroSlider id="hero-section" />

        {/* Kampanyalı Ürünler Band - Daha kompakt secondary slider */}
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
