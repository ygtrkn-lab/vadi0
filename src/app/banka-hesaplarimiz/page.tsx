import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankAccountCard from '@/components/BankAccountCard';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export const metadata: Metadata = {
  title: 'Banka Hesaplarımız | Vadiler Çiçek',
  description: 'Vadiler Çiçek banka hesap bilgileri: Garanti BBVA IBAN ve hesap adı.',
  alternates: {
    canonical: `${BASE_URL}/banka-hesaplarimiz`,
  },
  openGraph: {
    title: 'Banka Hesaplarımız | Vadiler Çiçek',
    description: 'Vadiler Çiçek banka hesap bilgileri ve IBAN.',
    url: `${BASE_URL}/banka-hesaplarimiz`,
    siteName: 'Vadiler Çiçek',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function BankAccountsPage() {
  const iban = 'TR12 0006 2000 7520 0006 2942 76';
  const bankName = 'Garanti Bankası';
  const accountName = 'STR GRUP A.Ş';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-28 lg:pt-36">
        {/* Hero */}
        <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Banka Hesaplarımız</h1>
            <p className="text-gray-600">Havale/EFT işlemleriniz için aşağıdaki hesap bilgilerini kullanabilirsiniz.</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 lg:py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <BankAccountCard
              iban={iban}
              bankName={bankName}
              accountName={accountName}
              logoSrc="/TR/garanti.svg"
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
