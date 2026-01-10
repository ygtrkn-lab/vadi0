import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import "./globals.css";
import ClientRoot from "./ClientRoot";

// Using system fonts instead of Google Fonts to avoid build issues
// in sandboxed environments where external font requests may fail.
// The globals.css already defines Inter and system-ui as fallback fonts.

// Safely construct metadata base URL with fallback
function getMetadataBaseUrl(): URL {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      return new URL(siteUrl);
    }
  } catch {
    console.warn('Invalid NEXT_PUBLIC_SITE_URL, using default');
  }
  return new URL('https://vadiler.com');
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-QJGKTZH60L';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

// Organization JSON-LD Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'Vadiler Çiçek',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/logo.png`,
    width: 200,
    height: 60,
  },
  description: 'İstanbul\'un güvenilir çiçekçisi Vadiler Çiçek. Taze çiçekler, gül, orkide ve buketler aynı gün teslim. Kadıköy, Beşiktaş, Şişli ve tüm İstanbul\'a hızlı teslimat.',
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
  },
  sameAs: [
    'https://www.instagram.com/vadilercom',
    'https://www.facebook.com/vadilercom',
    'https://twitter.com/vadilercom',
  ],
};

// WebSite JSON-LD Schema with SearchAction
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  name: 'Vadiler Çiçek',
  url: BASE_URL,
  description: 'İstanbul\'da online çiçek siparişi ve aynı gün teslimat. Güvenilir çiçekçi, taze çiçekler.',
  publisher: {
    '@id': `${BASE_URL}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/kategoriler?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'tr-TR',
};

// LocalBusiness JSON-LD Schema
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  '@id': `${BASE_URL}/#localbusiness`,
  name: 'Vadiler Çiçek',
  url: BASE_URL,
  telephone: '+90-850-307-4876',
  priceRange: '₺₺',
  image: `${BASE_URL}/og-image.jpg`,
  description: 'İstanbul\'un en güvenilir online çiçekçisi. Taze çiçekler, aynı gün teslimat.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'İstanbul',
    addressRegion: 'İstanbul',
    addressCountry: 'TR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.0082,
    longitude: 28.9784,
  },
  areaServed: [
    { '@type': 'City', name: 'İstanbul' },
    'Kadıköy', 'Beşiktaş', 'Şişli', 'Bakırköy', 'Üsküdar', 'Beyoğlu', 'Ataşehir', 'Sarıyer', 'Fatih', 'Maltepe', 'Kartal', 'Pendik', 'Beylikdüzü', 'Kağıthane', 'Ümraniye', 'Zeytinburnu'
  ],
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '22:00',
  },
  paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
  currenciesAccepted: 'TRY',
  hasMerchantReturnPolicy: {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'TR',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 2,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnShippingFees',
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'İade Politikası',
      value: `${BASE_URL}/iade-politikasi`
    }
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: {
    default: "İstanbul Çiçek Siparişi | Vadiler Çiçek - Güvenilir Çiçekçi, Aynı Gün Teslimat",
    template: "%s | Vadiler Çiçek İstanbul"
  },
  description: "İstanbul çiçek siparişi için güvenilir adres Vadiler Çiçek! Taze gül, orkide, buket ve aranjmanlar aynı gün teslim. Kadıköy, Beşiktaş, Şişli ve tüm İstanbul'a teslimat. ☎️ 0850 307 4876",
  keywords: [
    "çiçek siparişi",
    "online çiçek siparişi",
    "çiçek gönder",
    "istanbul çiçek siparişi",
    "çiçekçi istanbul",
    "istanbul çiçekçi",
    "güvenilir çiçek gönderme siteleri",
    "istanbul çiçek gönder",
    "aynı gün çiçek teslimat",
    "gül buketi",
    "orkide",
    "çiçek aranjmanı",
    "doğum günü çiçeği",
    "sevgiliye çiçek",
    "anneler günü çiçek",
    "düğün çiçeği",
    "cenaze çiçeği",
    "kadıköy çiçekçi",
    "beşiktaş çiçekçi",
    "beyoğlu çiçekçi",
    "bakırköy çiçekçi",
    "şişli çiçekçi",
    "üsküdar çiçekçi",
    "ucuz çiçek",
    "taze çiçek",
    "vadiler çiçek",
    "vadiler.com",
    "vadiler",
    "vadilercom",
  ],
  verification: {
    google: 'NdD2A097rf0YcV2o0TULpp__uSTaNmzMvRBhIrZVB2s',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/logo.png', color: '#ec4899' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: "https://vadiler.com/",
    languages: {
      'tr-TR': 'https://vadiler.com/',
      'x-default': 'https://vadiler.com/',
    },
  },
  openGraph: {
    title: "İstanbul Çiçek Siparişi | Vadiler Çiçek - Güvenilir Çiçekçi, Aynı Gün Teslimat",
    description: "İstanbul'da online çiçek siparişi için güvenilir adres! Taze gül, orkide, buket ve aranjmanlar. Kadıköy, Beşiktaş, Şişli ve tüm İstanbul'a aynı gün teslimat. ☎️ 0850 307 4876",
    url: "https://vadiler.com/",
    siteName: "Vadiler Çiçek",
    images: [
      {
        url: "https://vadiler.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vadiler Çiçek - İstanbul Online Çiçek Siparişi"
      }
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "İstanbul Çiçek Siparişi | Vadiler Çiçek - Güvenilir, Aynı Gün Teslimat",
    description: "İstanbul'da güvenilir çiçek siparişi! Taze gül, orkide, buket. Kadıköy, Beşiktaş, Şişli'ye aynı gün teslimat. ☎️ 0850 307 4876",
    site: "@vadilercom",
    images: ["https://vadiler.com/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Preconnect to primary origin and analytics for faster LCP/INP */}
        <link rel="preconnect" href={BASE_URL} />
        <link rel="dns-prefetch" href={BASE_URL} />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

        {/* Google tag (gtag.js) - lazyOnload ile INP optimizasyonu */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              'send_page_view': false
            });
            // Sayfa yüklendikten sonra pageview gönder
            gtag('event', 'page_view');
          `}
        </Script>

        {/* Meta Pixel (Facebook Pixel) - lazyOnload ile INP optimizasyonu */}
        {META_PIXEL_ID && (
          <>
            <Script id="fb-pixel" strategy="lazyOnload">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img 
                height="1" 
                width="1" 
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* LocalBusiness Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body
        className="antialiased overflow-x-hidden swipe-guard"
      >
        <ClientRoot>
          <div className="overflow-x-hidden">
            {children}
          </div>
        </ClientRoot>
      </body>
    </html>
  );
}
