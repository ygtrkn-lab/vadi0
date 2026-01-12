import Link from 'next/link';

// İstanbul ilçeleri - SEO için
const ISTANBUL_ILCELERI = {
  avrupa: [
    { name: 'Arnavutköy', slug: 'arnavutkoy' },
    { name: 'Avcılar', slug: 'avcilar' },
    { name: 'Bağcılar', slug: 'bagcilar' },
    { name: 'Bahçelievler', slug: 'bahcelievler' },
    { name: 'Bakırköy', slug: 'bakirkoy' },
    { name: 'Başakşehir', slug: 'basaksehir' },
    { name: 'Bayrampaşa', slug: 'bayrampasa' },
    { name: 'Beşiktaş', slug: 'besiktas' },
    { name: 'Beylikdüzü', slug: 'beylikduzu' },
    { name: 'Beyoğlu', slug: 'beyoglu' },
    { name: 'Büyükçekmece', slug: 'buyukcekmece' },
    { name: 'Çatalca', slug: 'catalca' },
    { name: 'Esenler', slug: 'esenler' },
    { name: 'Esenyurt', slug: 'esenyurt' },
    { name: 'Eyüpsultan', slug: 'eyupsultan' },
    { name: 'Fatih', slug: 'fatih' },
    { name: 'Gaziosmanpaşa', slug: 'gaziosmanpasa' },
    { name: 'Güngören', slug: 'gungoren' },
    { name: 'Kağıthane', slug: 'kagithane' },
    { name: 'Küçükçekmece', slug: 'kucukcekmece' },
    { name: 'Sarıyer', slug: 'sariyer' },
    { name: 'Silivri', slug: 'silivri' },
    { name: 'Sultangazi', slug: 'sultangazi' },
    { name: 'Şişli', slug: 'sisli' },
    { name: 'Zeytinburnu', slug: 'zeytinburnu' },
  ],
  anadolu: [
    { name: 'Adalar', slug: 'adalar' },
    { name: 'Ataşehir', slug: 'atasehir' },
    { name: 'Beykoz', slug: 'beykoz' },
    { name: 'Çekmeköy', slug: 'cekmekoy' },
    { name: 'Kadıköy', slug: 'kadikoy' },
    { name: 'Kartal', slug: 'kartal' },
    { name: 'Maltepe', slug: 'maltepe' },
    { name: 'Pendik', slug: 'pendik' },
    { name: 'Sancaktepe', slug: 'sancaktepe' },
    { name: 'Sultanbeyli', slug: 'sultanbeyli' },
    { name: 'Şile', slug: 'sile' },
    { name: 'Tuzla', slug: 'tuzla' },
    { name: 'Ümraniye', slug: 'umraniye' },
    { name: 'Üsküdar', slug: 'uskudar' },
  ],
};

const SeoContentSection = () => {
  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Trust Badges */}
          <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-white border border-primary-100">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                <span className="text-2xl">🚚</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm text-center">Aynı Gün Teslimat</h4>
              <p className="text-xs text-gray-500 text-center mt-1">İstanbul içi ücretsiz</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm text-center">Güvenilir Sipariş</h4>
              <p className="text-xs text-gray-500 text-center mt-1">3D Secure ödeme</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <span className="text-2xl">🌸</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm text-center">Taze Çiçekler</h4>
              <p className="text-xs text-gray-500 text-center mt-1">Günlük kesim</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <span className="text-2xl">💯</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm text-center">Memnuniyet</h4>
              <p className="text-xs text-gray-500 text-center mt-1">Garantisi</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Vadiler Çiçek ile İstanbul'a Çiçek Gönder</h2>
            <p>
              Hayatın yoğun temposu içinde bazen sözcükler yeterli olmaz. İşte tam da o anlarda, duygularımızı ifade etmenin en zarif ve etkili yolu çiçeklerdir. Sevdiklerinize "Seni düşünüyorum" demek, özel günlerde onları mutlu etmek ya da sıradan bir günü unutulmaz kılmak için çiçek göndermek ideal bir seçenektir.
            </p>
            <p>
              Vadiler Çiçek, İstanbul'un güvenilir çiçekçisi olarak hızlı, güvenilir ve özenli bir online çiçek siparişi deneyimi sunarak duygularınızı en güzel şekilde aktarmanıza yardımcı olur. Doğum günü, yıldönümü, kutlama ya da içten bir teşekkür için dilediğiniz an çiçek gönderebilir, sevdiklerinize zarif bir sürpriz yapabilirsiniz.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900">İstanbul Online Çiçek Siparişi: Tek Tıkla Güvenilir Teslimat</h3>
            <p>Modern yaşamın hızına uyum sağlayan online çiçek siparişi sistemi sayesinde İstanbul'a çiçek göndermek artık sadece birkaç adımda mümkün:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Beğendiğiniz çiçeği seçin.</li>
              <li>İstanbul'daki teslimat adresini ve zamanı belirleyin.</li>
              <li>Güvenli ödeme seçeneklerinden birini kullanarak siparişinizi tamamlayın.</li>
            </ol>
            <p>
              Klasik gül buketlerinden özgün tasarımlı aranjmanlara, iç mekanlara şıklık katacak orkidelerden mis kokulu lavantalara kadar geniş ürün yelpazesi ile her zevke ve her duyguya uygun seçenek sunuyoruz. Üstelik mobil uyumlu sitemiz sayesinde dilediğiniz an, dilediğiniz yerden İstanbul çiçek siparişi verebilirsiniz.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900">İstanbul'da Aynı Gün Çiçek Teslimatı</h3>
            <p>
              Bazı anlar vardır, ertelenemez. İşte bu anlarda aynı gün teslimat hizmetimiz devreye girer. İstanbul'un tüm ilçelerinde - Kadıköy, Beşiktaş, Şişli, Bakırköy, Üsküdar, Beyoğlu, Sarıyer, Fatih ve daha fazlasında - hızlı ve güvenilir çiçek gönderim ağı sayesinde seçtiğiniz çiçekler taptaze hazırlanır ve zamanında teslim edilir.
            </p>
            <p>
              Son dakika sürprizleri ya da anlık kutlamalar için Vadiler Çiçek'in aynı gün çiçek gönderme avantajı sayesinde hiçbir özel an kaçmaz. İstanbul çiçek siparişi için güvenilir adresiniz olan Vadiler Çiçek ile "Bugün içinde yetişir mi?" kaygısı yaşamadan, güvenle sipariş verebilirsiniz.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900">İstanbul'un Güvenilir Çiçek Gönderme Sitesi</h3>
            <p>
              "Güvenilir çiçek gönderme siteleri" arıyorsanız, Vadiler Çiçek tam size göre! Geleneksel çiçekçi arayışına son. İstanbul'un her köşesinde - Anadolu ve Avrupa yakası - güvenilir çiçek teslimatı sağlıyoruz.
            </p>
            <p>
              Kadıköy'den Beşiktaş'a, Şişli'den Bakırköy'e, Üsküdar'dan Beyoğlu'na, Ataşehir'den Sarıyer'e kadar İstanbul'un tüm ilçelerine hızlı teslimat imkânı sunuyoruz. "İstanbul çiçekçi", "istanbul çiçek siparişi" ya da "güvenilir çiçek gönderme siteleri" arıyorsanız, Vadiler Çiçek güvenli ve hızlı çözümü ile yanınızda.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900">Kaliteli Çiçekçi Hizmeti, Güvenli Alışveriş</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Gül, lilyum, orkide, ayçiçeği ve daha birçok çiçek türü profesyonel çiçekçiler tarafından özenle hazırlanır.</li>
              <li>Sipariş anında taze çiçeklerden yapılan aranjmanlar, görselde gördüğünüz şekilde İstanbul'daki alıcısına teslim edilir.</li>
              <li>Güvenli ödeme altyapısı ve müşteri odaklı hizmet anlayışı ile her aşamada yanınızdayız.</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900">Neden Vadiler Çiçek'i Tercih Etmelisiniz?</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>İstanbul'un Her Köşesine Teslimat:</strong> Kadıköy, Beşiktaş, Şişli, Bakırköy, Üsküdar, Beyoğlu başta olmak üzere tüm ilçelere aynı gün çiçek teslimatı.</li>
              <li><strong>Geniş Ürün Yelpazesi:</strong> Klasik buketlerden modern tasarım aranjmanlara kadar her zevke uygun koleksiyon. Gül, orkide, lilyum, çelenk, lavanta ve daha fazlası.</li>
              <li><strong>Güvenilir Çiçek Gönderme:</strong> Binlerce mutlu müşteri ve yüksek memnuniyet oranı ile İstanbul'un güvenilir çiçekçisi.</li>
              <li><strong>Kolay Sipariş Süreci:</strong> Kullanıcı dostu web sitesi ve mobil deneyim. Sadece birkaç tıkla güvenli sipariş.</li>
              <li><strong>Kalite ve Tazelik Garantisi:</strong> Her sipariş anında hazırlanan taze çiçeklerden oluşur. Fotoğrafta gördüğünüz gibi, özenle hazırlanıp teslim edilir.</li>
              <li><strong>Müşteri Memnuniyeti Odaklı Hizmet:</strong> Sipariş öncesi ve sonrası destek. Memnuniyet garantisi ve hızlı çözüm.</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900">Sıradanlıktan Uzak, Etkileyici Çiçek Tasarımları</h3>
            <p>
              Her çiçek bir duyguyu temsil eder. Vadiler Çiçek'in özel tasarım çiçek aranjmanları ile İstanbul'daki sevdiklerinize sadece çiçek göndermiyorsunuz, aynı zamanda unutulmaz anılar yaratıyorsunuz. Doğum gününden yıldönümüne, yeni iş tebrikinden içten bir teşekkür mesajına kadar her özel an için özgün çiçek tasarımlarımız yanınızda.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900">İlk Çiçek Siparişine Özel Fırsatlar</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>İlk siparişe özel indirim fırsatları</li>
              <li>Dönemsel kampanyalı ürünler</li>
              <li>İstanbul'a uygun fiyatlı çiçek gönderim seçenekleri</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900">En İyi Çiçek Gönderme Sitesi: Vadiler Çiçek</h3>
            <p>
              Kaliteli çiçek aranjmanları, hızlı teslimat hizmeti, güvenli alışveriş süreci ve müşteri odaklı yaklaşımıyla Vadiler Çiçek, İstanbul'un en güvenilir çiçek gönderme sitesi olma yolunda ilerliyor. Kadıköy, Beşiktaş, Şişli, Bakırköy ve İstanbul'un her köşesindeki sevdiklerinizi mutlu etmek için daha fazla beklemeyin. Vadiler Çiçek ile hemen çiçek gönderin ve zarafeti hissettirin.
            </p>

            {/* Internal links for topical relevance */}
            <div className="not-prose mt-8">
              {/* Kategori Linkleri */}
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Popüler Çiçek Kategorileri</h4>
              <div className="flex flex-wrap gap-2 mb-8">
                <Link href="/guller" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-rose-700 border border-rose-200 transition">🌹 Güller</Link>
                <Link href="/aranjmanlar" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 text-purple-700 border border-purple-200 transition">💐 Aranjmanlar</Link>
                <Link href="/orkideler" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-fuchsia-50 to-pink-50 hover:from-fuchsia-100 hover:to-pink-100 text-fuchsia-700 border border-fuchsia-200 transition">🪻 Orkideler</Link>
                <Link href="/kutuda-cicekler" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 border border-amber-200 transition">🎁 Kutuda Çiçekler</Link>
                <Link href="/buketler" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 border border-emerald-200 transition">💮 Buketler</Link>
                <Link href="/dogum-gunu-ozel-hediyeler-cicekler" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 border border-blue-200 transition">🎂 Doğum Günü</Link>
                <Link href="/sevgiliye-cicekler" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-700 border border-red-200 transition">❤️ Sevgiliye Çiçekler</Link>
                <Link href="/haftanin-cicek-kampanyalari-vadiler-com" className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-green-50 to-lime-50 hover:from-green-100 hover:to-lime-100 text-green-700 border border-green-200 transition">🔥 Kampanyalı</Link>
              </div>

              {/* İstanbul Avrupa Yakası */}
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🌉 İstanbul Avrupa Yakası Çiçek Siparişi</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-6">
                {ISTANBUL_ILCELERI.avrupa.map((ilce) => (
                  <Link
                    key={ilce.slug}
                    href={`/sehir/istanbul/${ilce.slug}`}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition shadow-sm hover:shadow"
                  >
                    {ilce.name}
                  </Link>
                ))}
              </div>

              {/* İstanbul Anadolu Yakası */}
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🌊 İstanbul Anadolu Yakası Çiçek Siparişi</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-6">
                {ISTANBUL_ILCELERI.anadolu.map((ilce) => (
                  <Link
                    key={ilce.slug}
                    href={`/sehir/istanbul/${ilce.slug}`}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm bg-white border border-gray-200 hover:border-secondary-300 hover:bg-secondary-50 text-gray-700 hover:text-secondary-700 transition shadow-sm hover:shadow"
                  >
                    {ilce.name}
                  </Link>
                ))}
              </div>

              {/* SEO Arama Terimleri */}
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🔍 İstanbul Çiçek Siparişi Hizmetlerimiz</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'İstanbul çiçek siparişi',
                    'İstanbul içi çiçek siparişi',
                    'Güvenilir çiçek siparişi',
                    'Online çiçek siparişi',
                    'Aynı gün çiçek teslimatı',
                    'İstanbul çiçek gönder',
                    'İstanbul\'a çiçek yolla',
                    'Ucuz çiçek siparişi',
                    'Kaliteli çiçek siparişi',
                    'Hızlı çiçek teslimatı',
                    'Avrupa yakası çiçekçi',
                    'Anadolu yakası çiçekçi',
                    'İnternetten çiçek sipariş',
                    'En iyi çiçekçi İstanbul',
                    'Güvenilir çiçekçi',
                  ].map((term) => (
                    <span
                      key={term}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white text-gray-600 border border-gray-200"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoContentSection;
