import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export const metadata: Metadata = {
  title: 'Yasal Bilgiler | Vadiler Çiçek',
  description: 'Vadiler Çiçek yasal belgeleri: Kullanım koşulları, gizlilik, çerez, KVKK, mesafeli satış sözleşmesi ve iade politikası.',
  alternates: { canonical: `${BASE_URL}/yasal` },
  openGraph: {
    title: 'Yasal Bilgiler | Vadiler Çiçek',
    description: 'Kullanım koşulları, gizlilik, çerez, KVKK, mesafeli satış ve iade politikası',
    url: `${BASE_URL}/yasal`,
    siteName: 'Vadiler Çiçek',
    locale: 'tr_TR',
    type: 'website',
  },
};

const LINKS = [
  { title: 'Kullanım Koşulları', href: '/kullanim-kosullari', desc: 'Site kullanım şartları ve sorumluluklar.' },
  { title: 'Gizlilik Politikası', href: '/gizlilik', desc: 'Kişisel verilerin korunması ve gizlilik ilkeleri.' },
  { title: 'Çerez Politikası', href: '/cerez-politikasi', desc: 'Çerez kullanımı ve tercihlerin yönetimi.' },
  { title: 'KVKK Aydınlatma Metni', href: '/kvkk', desc: '6698 sayılı KVKK kapsamındaki bilgilendirme.' },
  { title: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis', desc: 'Mesafeli satışa ilişkin sözleşme hükümleri.' },
  { title: 'İade ve İptal Politikası', href: '/iade-politikasi', desc: 'İptal, iade ve değişim koşulları.' },
];

export default function LegalIndexPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-28 lg:pt-36">
        <section className="bg-gradient-to-r from-primary-50 to-secondary-50 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Yasal Bilgiler</h1>
            <p className="text-gray-600">Tüm yasal belgelerimize aşağıdan ulaşabilirsiniz.</p>
          </div>
        </section>
        <section className="py-8 lg:py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 hover:border-primary-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition"
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-100/20 blur-2xl group-hover:bg-primary-100/30 transition" />
                  <h2 className="relative text-lg sm:text-xl font-semibold text-gray-900 mb-1">{item.title}</h2>
                  <p className="relative text-sm text-gray-600">{item.desc}</p>
                  <span className="relative mt-3 inline-block text-sm font-medium text-primary-600 group-hover:translate-x-0.5 transition">Görüntüle →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
