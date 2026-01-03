import { Metadata } from 'next';
import { Suspense } from 'react';
import KategorilerClient from './KategorilerClient';

export const metadata: Metadata = {
  title: 'Tüm Kategoriler | Vadiler Çiçek',
  description: 'Vadiler Çiçek\'te tüm çiçek kategorilerini keşfedin. Güller, orkideler, lilyumlar, papatyalar ve daha fazlası.',
  openGraph: {
    title: 'Tüm Kategoriler | Vadiler Çiçek',
    description: 'Vadiler Çiçek\'te tüm çiçek kategorilerini keşfedin.',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Vadiler Çiçek',
  },
};

export default function KategorilerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    }>
      <KategorilerClient />
    </Suspense>
  );
}
