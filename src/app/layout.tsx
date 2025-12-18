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
  description: 'Vadiler Çiçek ile taze çiçekleri hızlı ve güvenli şekilde İstanbul\'a gönderin. Online çiçek siparişi, hızlı teslimat, uygun fiyatlar.',
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
  description: 'Online çiçek siparişi ve hızlı teslimat',
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
  areaServed: {
    '@type': 'City',
    name: 'İstanbul',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '22:00',
  },
  paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
  currenciesAccepted: 'TRY',
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
  title: "Vadiler Çiçek - Online Çiçek Siparişi | Taze Çiçekler, Hızlı Teslimat",
  description: "Vadiler Çiçek ile taze çiçekleri hızlı ve güvenli şekilde İstanbul'a gönderin. Online çiçek siparişi, hızlı teslimat, uygun fiyatlar.",
  keywords: [
    "çiçek siparişi", "online çiçek", "çiçek gönder", "çiçekçi", "hediye çiçek", "hızlı teslimat", "Vadiler Çiçek", "İstanbul çiçek"
  ],
  verification: {
    google: 'NdD2A097rf0YcV2o0TULpp__uSTaNmzMvRBhIrZVB2s',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
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
  },
  openGraph: {
    title: "Vadiler Çiçek - Online Çiçek Siparişi",
    description: "Vadiler Çiçek ile taze çiçekleri hızlı ve güvenli şekilde İstanbul'a gönderin.",
    url: "https://vadiler.com/",
    siteName: "Vadiler Çiçek",
    images: [
      {
        url: "https://vadiler.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vadiler Çiçek - Online Çiçek Siparişi"
      }
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vadiler Çiçek - Online Çiçek Siparişi",
    description: "Vadiler Çiçek ile taze çiçekleri hızlı ve güvenli şekilde İstanbul'a gönderin.",
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
        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

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
        className="antialiased overflow-x-hidden"
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
