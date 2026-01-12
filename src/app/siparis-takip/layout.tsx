import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export const metadata: Metadata = {
  title: 'Siparişimi Takip Et | Vadiler Çiçek',
  description: 'Vadiler Çiçek siparişinizi takip edin. Sipariş durumunu, teslimat bilgilerini ve kargo takibini gerçek zamanlı olarak kontrol edin.',
  alternates: {
    canonical: `${BASE_URL}/siparis-takip`,
  },
  openGraph: {
    title: 'Siparişimi Takip Et',
    description: 'Vadiler Çiçek siparişinizi takip edin',
    url: `${BASE_URL}/siparis-takip`,
    type: 'website',
  },
};

export default function SiparisTakipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
