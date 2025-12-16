import { Header, Footer, MobileNavBar } from '@/components';

export default function KullanimKosullari() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Kullanım Koşulları</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Genel Hükümler</h2>
                <p className="text-gray-700 mb-4">
                  Bu web sitesine erişerek veya kullanarak, aşağıdaki kullanım koşullarını kabul 
                  etmiş sayılırsınız. Bu koşulları kabul etmiyorsanız, lütfen siteyi kullanmayınız.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Hizmet Tanımı</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek, online çiçek sipariş ve teslimat hizmeti sunmaktadır. 
                  Web sitemiz üzerinden çiçek, bitki ve hediye ürünleri satın alabilir, 
                  sevdiklerinize gönderebilirsiniz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Kullanıcı Yükümlülükleri</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Hesap oluştururken doğru ve güncel bilgiler sağlamak</li>
                  <li>Hesap bilgilerinin güvenliğini sağlamak</li>
                  <li>Yasal olmayan amaçlarla siteyi kullanmamak</li>
                  <li>Başkalarının haklarını ihlal edecek şekilde davranmamak</li>
                  <li>Siteye zarar verebilecek yazılım veya kod yüklememek</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Sipariş ve Ödeme</h2>
                <p className="text-gray-700 mb-4">
                  Sipariş verdiğinizde, ürün bilgileri ve fiyatları ile ilgili bir sözleşme yapılmış olur. 
                  Ödeme, kredi kartı, banka kartı veya diğer kabul edilen yöntemlerle yapılabilir.
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Tüm fiyatlar TL cinsindendir ve KDV dahildir</li>
                  <li>Ödeme onayı alınmadan sipariş işleme alınmaz</li>
                  <li>Stok durumuna göre sipariş iptal edilebilir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Teslimat</h2>
                <p className="text-gray-700 mb-4">
                  Teslimat süreleri ve koşulları, sipariş sırasında belirtilir. 
                  Tahmini teslimat süreleri garanti değildir ve değişiklik gösterebilir.
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Hızlı teslimat için sipariş saati önemlidir</li>
                  <li>Teslimat adresi doğru ve eksiksiz olmalıdır</li>
                  <li>Alıcının ulaşılabilir olması gerekmektedir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. İptal ve İade</h2>
                <p className="text-gray-700 mb-4">
                  Taze ürün özelliği taşıyan çiçekler için cayma hakkı sınırlıdır. 
                  Detaylı bilgi için "Mesafeli Satış Sözleşmesi" sayfasını inceleyiniz.
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Teslimat öncesi iptal talebi iletişim kanallarından yapılabilir</li>
                  <li>Hatalı veya hasarlı ürünler için 48 saat içinde bildirim yapılmalıdır</li>
                  <li>İade koşulları ürün tipine göre değişiklik gösterebilir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Fikri Mülkiyet Hakları</h2>
                <p className="text-gray-700 mb-4">
                  Web sitesindeki tüm içerik, tasarım, logo, görsel, metin ve diğer materyaller 
                  Vadiler Çiçek'in mülkiyetindedir ve telif hakları ile korunmaktadır. 
                  İzinsiz kullanımı yasaktır.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Sorumluluk Sınırlaması</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek, hizmetlerin kesintisiz ve hatasız olacağını garanti etmez. 
                  Teknik sorunlar veya öngörülemeyen durumlar nedeniyle oluşabilecek 
                  zararlardan sorumlu tutulamaz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Değişiklikler</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek, bu kullanım koşullarını önceden haber vermeksizin değiştirme 
                  hakkını saklı tutar. Değişiklikler yayınlandığı anda yürürlüğe girer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
                <p className="text-gray-700 mb-4">
                  Bu sözleşme Türkiye Cumhuriyeti yasalarına tabidir. 
                  Uyuşmazlık durumunda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  Kullanım koşulları hakkında sorularınız için:
                </p>
                <ul className="list-none text-gray-700 space-y-2">
                  <li><strong>Telefon:</strong> 0850 307 4876</li>
                  <li><strong>Adres:</strong> İstanbul, Türkiye</li>
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
