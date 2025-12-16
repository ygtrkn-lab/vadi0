import { Header, Footer, MobileNavBar } from '@/components';

export default function CerezPolitikasi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Çerez Politikası</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Çerez Nedir?</h2>
                <p className="text-gray-700 mb-4">
                  Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcılar aracılığıyla 
                  cihazınıza veya ağ sunucusuna depolanan küçük metin dosyalarıdır. Web sitemizi 
                  ziyaret ettiğinizde çerezler tarafından toplanan bilgiler, kullanıcı deneyiminizi 
                  iyileştirmek ve web sitemizin performansını artırmak için kullanılır.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Çerez Türleri</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">2.1. Zorunlu Çerezler</h3>
                  <p className="text-gray-700 mb-4">
                    Web sitemizin düzgün çalışması için gerekli olan çerezlerdir. Bu çerezler olmadan 
                    web sitemizin bazı bölümleri çalışmaz.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">2.2. Performans Çerezleri</h3>
                  <p className="text-gray-700 mb-4">
                    Ziyaretçilerin web sitesini nasıl kullandığına dair bilgi toplar. Bu bilgiler 
                    web sitemizi geliştirmek için kullanılır.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">2.3. Fonksiyonel Çerezler</h3>
                  <p className="text-gray-700 mb-4">
                    Kullanıcı tercihlerinizi hatırlamak ve gelişmiş özellikler sunmak için kullanılır.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">2.4. Hedefleme/Reklam Çerezleri</h3>
                  <p className="text-gray-700 mb-4">
                    Size ve ilgi alanlarınıza göre özelleştirilmiş reklamlar göstermek için kullanılır.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Kullanılan Çerezler</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Çerez Adı</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Türü</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Süresi</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Amacı</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">session_id</td>
                        <td className="border border-gray-300 px-4 py-2">Zorunlu</td>
                        <td className="border border-gray-300 px-4 py-2">Oturum</td>
                        <td className="border border-gray-300 px-4 py-2">Kullanıcı oturumunu yönetir</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">cart_items</td>
                        <td className="border border-gray-300 px-4 py-2">Fonksiyonel</td>
                        <td className="border border-gray-300 px-4 py-2">7 gün</td>
                        <td className="border border-gray-300 px-4 py-2">Sepet bilgilerini saklar</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">_ga</td>
                        <td className="border border-gray-300 px-4 py-2">Performans</td>
                        <td className="border border-gray-300 px-4 py-2">2 yıl</td>
                        <td className="border border-gray-300 px-4 py-2">Google Analytics - Ziyaretçi istatistikleri</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">_fbp</td>
                        <td className="border border-gray-300 px-4 py-2">Reklam</td>
                        <td className="border border-gray-300 px-4 py-2">3 ay</td>
                        <td className="border border-gray-300 px-4 py-2">Facebook piksel - Hedefli reklamlar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Çerezleri Yönetme</h2>
                <p className="text-gray-700 mb-4">
                  Tarayıcınızın ayarlarından çerezleri kontrol edebilir, silebilir veya engelleyebilirsiniz. 
                  Ancak çerezleri devre dışı bırakmanız durumunda web sitemizin bazı özellikleri 
                  düzgün çalışmayabilir.
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Chrome:</strong> Ayarlar &gt; Gizlilik ve güvenlik &gt; Çerezler</li>
                  <li><strong>Firefox:</strong> Seçenekler &gt; Gizlilik ve Güvenlik &gt; Çerezler</li>
                  <li><strong>Safari:</strong> Tercihler &gt; Gizlilik &gt; Çerezler</li>
                  <li><strong>Edge:</strong> Ayarlar &gt; Gizlilik &gt; Çerezler</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  Çerez politikamız hakkında sorularınız için:
                </p>
                <ul className="list-none text-gray-700 space-y-2">
                  <li><strong>Telefon:</strong> 0850 307 4876</li>
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
