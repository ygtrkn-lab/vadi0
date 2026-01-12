import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNavBar from '@/components/MobileNavBar';
import { COMPANY } from '@/data/company';

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
    name: COMPANY.brandName,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'İstanbul\'a online çiçek siparişi ve aynı gün teslimat hizmeti sunan e-ticaret platformu.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${COMPANY.address.line1} ${COMPANY.address.line2}`,
      addressLocality: COMPANY.address.district,
      addressRegion: COMPANY.address.city,
      postalCode: COMPANY.address.postalCode,
      addressCountry: COMPANY.address.countryCode,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: COMPANY.phoneE164,
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
      <Header />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="min-h-screen bg-gray-50 pt-28 lg:pt-36">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-12 lg:py-16">
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
      <section className="py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Şirket Bilgilerimiz</h2>
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4 text-gray-600 mb-8">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Ünvan</p>
                <p>{COMPANY.legalName}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Ticaret Sicil Numarası</p>
                <p>{COMPANY.tradeRegistryNumber}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Adres</p>
                <p>
                  {COMPANY.address.line1} {COMPANY.address.line2}
                  <br />
                  {COMPANY.address.district} / {COMPANY.address.city}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Vergi Dairesi / Vergi Numarası</p>
                <p>
                  {COMPANY.taxOffice} / {COMPANY.taxId}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">E-posta</p>
                <a href={`mailto:${COMPANY.email}`} className="text-primary-500 hover:underline">
                  {COMPANY.email}
                </a>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Çağrı Merkezi</p>
                <a href={`tel:${COMPANY.phoneE164}`} className="text-primary-500 hover:underline">
                  {COMPANY.phoneDisplay}
                </a>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">KEP Adresi</p>
                <p>{COMPANY.kepEmail}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Yer Sağlayıcı</p>
                <p>{COMPANY.hostingProvider}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Biz Kimiz?</h2>
            <p className="text-gray-600 mb-6">
              Vadiler Çiçek, İstanbul&apos;un güvenilir online çiçekçisi olarak yılların deneyimiyle 
              hizmet vermektedir. Müşteri memnuniyetini ve kaliteyi ön planda tutarak, İstanbul&apos;un 
              her ilçesine en taze çiçekleri aynı gün içinde ulaştırıyoruz. Profesyonel ekibimiz ve 
              titiz çalışma anlayışımızla her siparişte mükemmelliği hedefliyoruz.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Misyonumuz</h2>
            <p className="text-gray-600 mb-6">
              İstanbul&apos;da yaşayan müşterilerimizin özel anlarını en taze ve kaliteli çiçeklerle 
              anlamlı kılmak. Her siparişte güven, kalite ve zamanında teslimat standartlarımızdan 
              ödün vermeden, sevdiklerinize duygu dolu sürprizler yaşatmanıza aracılık etmek.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Neden Vadiler Çiçek?</h2>
            <ul className="text-gray-600 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                İstanbul&apos;un 39 ilçesine hızlı teslimat
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Günlük taze çiçek garantisi
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Aynı gün teslimat imkanı
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Profesyonel florist tasarımları
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                7/24 müşteri desteği
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                Güvenli online ödeme altyapısı
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-500 font-bold">✓</span>
                %100 müşteri memnuniyeti garantisi
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
    
    <Footer />
    <MobileNavBar />
    </>
  );
}