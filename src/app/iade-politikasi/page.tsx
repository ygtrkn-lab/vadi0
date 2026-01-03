import { Header, Footer, MobileNavBar } from '@/components';

export default function IadePolitikasiPage() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />

      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">İade Politikası</h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Kapsam</h2>
                <p className="text-gray-700 mb-4">
                  Bu İade Politikası, Vadiler Online Çiçekçilik üzerinden Türkiye içinde verilen siparişler için geçerlidir.
                  Yalnızca yeni ürünler için iade ve değişim talepleri kabul edilir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. İade ve Değişim Koşulları</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>
                    <strong>İade kabulü:</strong> Hem kusurlu hem de kusurlu olmayan ürünler için iade taleplerini kabul ederiz.
                  </li>
                  <li>
                    <strong>Değişim kabulü:</strong> Uygun durumlarda ürün değişimi (borsa) talebinizi de kabul ederiz.
                  </li>
                  <li>
                    <strong>Ürün durumu:</strong> Yalnızca yeni (kullanılmamış) ürünler için geçerlidir.
                  </li>
                  <li>
                    <strong>Başvuru süresi:</strong> İade/değişim talebinizi teslimattan itibaren <strong>2 gün</strong> içinde iletmelisiniz.
                  </li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Not: Çiçek ve benzeri ürünler doğası gereği hızlı bozulabilen ürünler olabilir. Bu nedenle değerlendirme ve çözüm sürecini
                  hızlandırmak için talebinizi mümkün olan en kısa sürede (tercihen teslimat günü) iletmeniz önemlidir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. İade Yöntemi ve Ücretler</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>
                    <strong>Yöntem:</strong> Posta/kargo ile iade.
                  </li>
                  <li>
                    <strong>İade etiketi:</strong> İade kargo etiketi ücretsizdir ve pakete dahil edilir. Etiketin kaybolması durumunda ücretsiz
                    olarak yeniden paylaşılır.
                  </li>
                  <li>
                    <strong>Stok tamamlama ücreti:</strong> Maliyet yok (restocking fee uygulanmaz).
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Geri Ödeme Süresi</h2>
                <p className="text-gray-700 mb-4">
                  İade edilen ürün tarafımıza ulaştıktan ve kontrol süreci tamamlandıktan sonra, geri ödeme işlemleri <strong>14 gün</strong>
                  içerisinde gerçekleştirilir. Banka ve ödeme kuruluşlarının süreçlerine bağlı olarak hesabınıza yansıma süresi değişebilir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. İade/Değişim Talebi Nasıl Oluşturulur?</h2>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                  <li>Teslimat tarihinden itibaren 2 gün içinde bizimle iletişime geçin.</li>
                  <li>Sipariş numaranızı ve talebinizi (iade veya değişim) paylaşın.</li>
                  <li>Gerekli durumlarda ürüne ilişkin fotoğraf/video isteyebiliriz (özellikle hasarlı/kusurlu ürün bildirimlerinde).</li>
                  <li>İade kargo etiketiyle ürünü anlaşmalı kargo ile gönderin.</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  İade ve değişim talepleriniz için bizimle iletişime geçebilirsiniz:
                </p>
                <ul className="list-none text-gray-700 space-y-2">
                  <li>
                    <strong>Telefon:</strong> 0850 307 4876
                  </li>
                  <li>
                    <strong>Adres:</strong> İstanbul, Türkiye
                  </li>
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
