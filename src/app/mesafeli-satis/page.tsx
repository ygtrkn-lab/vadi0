import { Header, Footer, MobileNavBar } from '@/components';
import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi | Vadiler Çiçek',
  description: 'Vadiler Çiçek Mesafeli Satış Sözleşmesi. Online alışveriş şartları, iade politikası ve müşteri haklarınız hakkında bilgi.',
  alternates: {
    canonical: `${BASE_URL}/mesafeli-satis`,
  },
  openGraph: {
    title: 'Mesafeli Satış Sözleşmesi',
    description: 'Vadiler Çiçek Mesafeli Satış Sözleşmesi',
    url: `${BASE_URL}/mesafeli-satis`,
    type: 'website',
  },
};

export default function MesafeliSatisSozlesmesi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Mesafeli Satış Sözleşmesi</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Taraflar</h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">1.1. SATICI</h3>
                  <ul className="list-none text-gray-700 space-y-1">
                    <li><strong>Ünvanı:</strong> Vadiler Çiçek</li>
                    <li><strong>Adres:</strong> İstanbul, Türkiye</li>
                    <li><strong>Telefon:</strong> 0850 307 4876</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">1.2. ALICI</h3>
                  <p className="text-gray-700">
                    Sipariş formunda belirtilen bilgiler ile kayıtlı müşteri
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Sözleşme Konusu</h2>
                <p className="text-gray-700 mb-4">
                  İşbu sözleşme, ALICI'nın SATICI'ya ait www.vadiler.com internet sitesinden 
                  elektronik ortamda siparişini yaptığı ürünün satışı ve teslimi ile ilgili olarak 
                  6502 sayılı Tüketicinin Korunması Hakkındaki Kanun ve Mesafeli Sözleşmelere Dair 
                  Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Sözleşme Konusu Ürün/Hizmet Bilgileri</h2>
                <p className="text-gray-700 mb-4">
                  Satışa konu ürünün/hizmetin temel özellikleri, satış fiyatı ve ödeme şekli ile 
                  teslimat bilgileri sipariş formunda belirtilmiştir. ALICI, sipariş öncesinde bu 
                  bilgileri okuyup bilgi sahibi olduğunu kabul eder.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Genel Hükümler</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Sözleşme konusu ürün/hizmetin KDV dahil satış fiyatı sipariş formunda gösterilmiştir</li>
                  <li>Ürün fiyatına kargo ücreti dahil değildir</li>
                  <li>Ödeme, kredi kartı veya banka kartı ile yapılabilir</li>
                  <li>ALICI, sipariş esnasında doğru ve eksiksiz bilgi vermekle yükümlüdür</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Teslimat Şartları</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Ürün, ALICI'nın sipariş formunda belirttiği adrese teslim edilir</li>
                  <li>Teslimat süresi sipariş onayından sonra başlar</li>
                  <li>Teslimat için belirtilen saatlere uyulmalıdır</li>
                  <li>Teslimat esnasında ALICI veya temsilcisinin bulunması gerekmektedir</li>
                  <li>Mücbir sebeplerle teslimat gecikmesi durumunda ALICI bilgilendirilir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Cayma Hakkı</h2>
                <p className="text-gray-700 mb-4">
                  6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği 
                  uyarınca, taze çiçek ve bitki ürünleri Yönetmeliğin 15. maddesinin (g) bendi gereğince 
                  cayma hakkı kapsamı dışındadır. Çünkü bu ürünler:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünlerdir</li>
                  <li>Teslimattan sonra ambalajı açılmış ve kullanılmış ürünlerdir</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  <strong>Ancak;</strong> Ürün hatalı, eksik veya sipariş edilenden farklı ise, 
                  teslim tarihinden itibaren 48 saat içinde SATICI'ya bildirerek iade veya değişim 
                  talebinde bulunabilirsiniz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. İptal ve İade Koşulları</h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">7.1. Teslimat Öncesi İptal</h3>
                  <p className="text-gray-700 mb-2">
                    ALICI, ürün hazırlık aşamasına girmeden önce siparişini iptal edebilir. 
                    İptal durumunda ödenen tutar 7-14 iş günü içinde iade edilir.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">7.2. Hatalı/Hasarlı Ürün</h3>
                  <p className="text-gray-700">
                    Teslim edilen ürün hatalı, hasarlı veya siparişe uygun değilse, teslimat 
                    tarihinden itibaren 48 saat içinde fotoğraf ile birlikte bildirilmelidir.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Temerrüt ve Hukuki Sonuçları</h2>
                <p className="text-gray-700 mb-4">
                  ALICI, ödeme işlemlerinde kullandığı kredi kartının kendisine ait olduğunu, 
                  yetkisiz kullanım durumunda doğabilecek tüm zararlardan sorumlu olduğunu kabul eder.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Uyuşmazlıkların Çözümü</h2>
                <p className="text-gray-700 mb-4">
                  İşbu sözleşmeden doğabilecek ihtilaflarda; Sanayi ve Ticaret Bakanlığınca 
                  her yıl Aralık ayında belirlenen parasal sınırlar dahilinde tüketicinin yerleşim 
                  yerinin bulunduğu veya tüketici işleminin yapıldığı yerdeki Tüketici Hakem Heyetleri 
                  ile İlçe/İl Tüketici Mahkemeleri yetkilidir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Yürürlük</h2>
                <p className="text-gray-700 mb-4">
                  ALICI, işbu sözleşmeyi elektronik ortamda onayladığı takdirde, siparişe konu 
                  ürünün/hizmetin temel nitelikleri, ürünün KDV dahil fiyatı, ödeme şekli ve 
                  teslimat koşulları hakkında ön bilgilendirildiğini ve bu hususlara ilişkin 
                  tüm bilgileri okuyup bilgi sahibi olduğunu kabul ve beyan eder.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  Sözleşme ile ilgili sorularınız için:
                </p>
                <ul className="list-none text-gray-700 space-y-2">
                  <li><strong>Telefon:</strong> 0850 307 4876</li>
                  <li><strong>Adres:</strong> İstanbul, Türkiye</li>
                  <li><strong>Müşteri Hizmetleri:</strong> Hafta içi 09:00 - 18:00</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </>
  );
}
