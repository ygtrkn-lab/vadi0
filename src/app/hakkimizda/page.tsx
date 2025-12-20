import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export const metadata: Metadata = {
  title: 'Hakkımızda | Vadiler Çiçek - İstanbul Online Çiçekçi',
  description: 'Vadiler Çiçek, İstanbul\'un güvenilir online çiçekçisi. 1000+ çiçek çeşidi, aynı gün teslimat, %100 memnuniyet garantisi. Kaliteli çiçekler ve hızlı teslimat ile hizmetinizdeyiz.',
  keywords: ['vadiler çiçek', 'online çiçekçi', 'istanbul çiçek', 'çiçek siparişi', 'aynı gün teslimat'],
  alternates: {
    canonical: `${BASE_URL}/hakkimizda`,
  },
  openGraph: {
    title: 'Hakkımızda | Vadiler Çiçek',
    description: 'Vadiler Çiçek, İstanbul\'un güvenilir online çiçekçisi. Taze çiçekler, hızlı teslimat.',
    url: `${BASE_URL}/hakkimizda`,
    siteName: 'Vadiler Çiçek',
    locale: 'tr_TR',
    type: 'website',
  },
};

// Organization + AboutPage JSON-LD Schema
const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${BASE_URL}/hakkimizda`,
  name: 'Vadiler Çiçek Hakkında',
  description: 'Vadiler Çiçek, İstanbul\'un güvenilir online çiçekçisi.',
  url: `${BASE_URL}/hakkimizda`,
  mainEntity: {
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Vadiler Çiçek',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'İstanbul\'a online çiçek siparişi ve aynı gün teslimat hizmeti sunan e-ticaret platformu.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'İstanbul',
      addressCountry: 'TR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-850-307-4876',
      contactType: 'customer service',
      availableLanguage: 'Turkish',
      areaServed: 'TR',
    },
    sameAs: [
      'https://www.instagram.com/vadilercom',
      'https://www.facebook.com/vadilercom',
    ],
  },
};

// FAQ Schema
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Vadiler Çiçek aynı gün teslimat yapıyor mu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet, saat 16:00\'ya kadar verilen siparişler İstanbul\'un 39 ilçesine aynı gün içinde teslim edilir.',
      },
    },
    {
      '@type': 'Question',
      name: 'Vadiler Çiçek hangi bölgelere teslimat yapıyor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vadiler Çiçek, İstanbul\'un tüm ilçelerine teslimat yapmaktadır. Avrupa ve Anadolu yakasındaki 39 ilçeye hizmet veriyoruz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Vadiler Çiçek\'te kaç çeşit çiçek var?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vadiler Çiçek\'te 1000\'den fazla çiçek çeşidi bulunmaktadır. Güller, orkideler, lilyumlar, papatyalar, buketler ve aranjmanlar dahil geniş bir ürün yelpazesi sunuyoruz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Siparişimi nasıl takip edebilirim?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sipariş takip sayfasından sipariş numaranız veya e-posta adresiniz ile siparişinizi anlık olarak takip edebilirsiniz.',
      },
    },
    {
      '@type': 'Question',
      name: 'Vadiler Çiçek güvenli mi?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Evet, Vadiler Çiçek SSL sertifikalı güvenli bağlantı ve iyzico altyapısı ile güvenli ödeme imkanı sunmaktadır. %100 müşteri memnuniyeti garantisi veriyoruz.',
      },
    },
  ],
};

export default function HakkimizdaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Hakkımızda
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Vadiler Çiçek olarak, sevdiklerinize en taze ve kaliteli çiçekleri ulaştırmak için çalışıyoruz.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Biz Kimiz?</h2>
            <p className="text-gray-600 mb-6">
              Vadiler Çiçek, yılların deneyimiyle Türkiye&apos;nin dört bir yanına taze çiçekler ulaştıran 
              online çiçekçinizdir. Müşteri memnuniyetini ön planda tutarak, her siparişte en kaliteli 
              çiçekleri en hızlı şekilde sevdiklerinize ulaştırıyoruz.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Misyonumuz</h2>
            <p className="text-gray-600 mb-6">
              Her özel anınızda yanınızda olmak ve duygularınızı en güzel çiçeklerle ifade etmenize 
              yardımcı olmak. Kaliteden ödün vermeden, uygun fiyatlarla en taze çiçekleri kapınıza 
              kadar getiriyoruz.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Neden Vadiler Çiçek?</h2>
            <ul className="text-gray-600 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Günlük taze çiçek garantisi
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Türkiye&apos;nin her yerine hızlı teslimat
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                7/24 müşteri desteği
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Güvenli online ödeme
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                %100 müşteri memnuniyeti garantisi
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Şirket Bilgilerimiz</h2>
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4 text-gray-600">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Ünvan</p>
                <p>STR GRUP ANONİM ŞİRKETİ</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Ticaret Sicil Numarası</p>
                <p>702202</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Adres</p>
                <p>SOĞANLI MAH. GÖLÇE SOKAK NO: 1 İÇ KAPI NO: 4<br />BAHÇELİEVLER / İSTANBUL</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Vergi Dairesi / Vergi Numarası</p>
                <p>KOCASİNAN / 7810867621</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">E-posta</p>
                <a href="mailto:bilgi@vadiler.com" className="text-primary-500 hover:underline">
                  bilgi@vadiler.com
                </a>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Çağrı Merkezi</p>
                <a href="tel:08503074876" className="text-primary-500 hover:underline">
                  0850 307 4876
                </a>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">KEP Adresi</p>
                <p>strgrup@hs01.kep.tr</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Yer Sağlayıcı</p>
                <p>Vadiler İnternet Hizmetleri</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}