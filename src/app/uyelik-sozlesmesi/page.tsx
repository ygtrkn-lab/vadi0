import { Header, Footer, MobileNavBar } from '@/components';

export default function UyelikSozlesmesi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Üyelik Sözleşmesi</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Taraflar</h2>
                <p className="text-gray-700 mb-4">
                  İşbu sözleşme, www.vadiler.com internet sitesinin sahibi <strong>Vadiler Çiçek</strong> 
                  ile siteye üye olan gerçek veya tüzel kişiler arasında elektronik ortamda akdedilmiştir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Sözleşmenin Konusu</h2>
                <p className="text-gray-700 mb-4">
                  İşbu sözleşme, ÜYE'nin Vadiler Çiçek internet sitesinden yararlanma şartlarını ve 
                  tarafların hak ve yükümlülüklerini düzenlemektedir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Üyelik Koşulları</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Üyelik başvurusu 18 yaşını doldurmuş gerçek kişiler veya tüzel kişiler tarafından yapılabilir</li>
                  <li>Üye, üyelik formunda istenen tüm bilgileri doğru ve eksiksiz doldurmakla yükümlüdür</li>
                  <li>Üyelik için gerekli bilgiler: Ad, soyad, e-posta, telefon, adres</li>
                  <li>Her üye sadece bir hesap oluşturabilir</li>
                  <li>Sahte veya yanıltıcı bilgi veren üyelikler iptal edilir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Üye Hakları</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Web sitesindeki tüm özelliklere erişim hakkı</li>
                  <li>Sipariş verme ve takip etme hakkı</li>
                  <li>Kampanya ve duyurulardan haberdar olma hakkı</li>
                  <li>Favorilere ürün ekleme hakkı</li>
                  <li>Sipariş geçmişini görüntüleme hakkı</li>
                  <li>Kişisel bilgilerini güncelleme hakkı</li>
                  <li>Üyeliği istediği zaman sonlandırma hakkı</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Üye Yükümlülükleri</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Doğru ve güncel bilgi sağlamak</li>
                  <li>Kullanıcı adı ve şifresini güvenli tutmak</li>
                  <li>Hesabından yapılan işlemlerden sorumlu olmak</li>
                  <li>Yasalara ve ahlak kurallarına uymak</li>
                  <li>Başka üyelerin haklarına saygı göstermek</li>
                  <li>Siteye zarar verecek eylemlerden kaçınmak</li>
                  <li>Fikri mülkiyet haklarına saygı göstermek</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Şifre Güvenliği</h2>
                <p className="text-gray-700 mb-4">
                  ÜYE, belirlediği şifrenin güvenliğinden kendisi sorumludur. Şifrenin başkaları 
                  tarafından kullanıldığının tespiti halinde derhal Vadiler Çiçek'e bildirilmelidir.
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Şifreler güçlü ve tahmin edilemez olmalıdır</li>
                  <li>Şifreler başkalarıyla paylaşılmamalıdır</li>
                  <li>Düzenli olarak değiştirilmelidir</li>
                  <li>Farklı platformlarda aynı şifre kullanılmamalıdır</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Kişisel Verilerin Korunması</h2>
                <p className="text-gray-700 mb-4">
                  ÜYE'nin kişisel verileri, KVKK kapsamında işlenir ve korunur. 
                  Detaylı bilgi için "Gizlilik Politikası" sayfasını inceleyebilirsiniz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Yasaklanan Davranışlar</h2>
                <p className="text-gray-700 mb-4">
                  Aşağıdaki davranışlar kesinlikle yasaktır:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Başkalarının hesaplarını kullanmak veya ele geçirmeye çalışmak</li>
                  <li>Sahte hesap oluşturmak</li>
                  <li>Spam veya zararlı içerik göndermek</li>
                  <li>Siteye virüs veya zararlı yazılım yüklemek</li>
                  <li>Otomatik sistemlerle site verilerini toplamak</li>
                  <li>Telif haklarını ihlal etmek</li>
                  <li>Yanıltıcı bilgi vermek</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Üyeliğin Askıya Alınması veya İptali</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek, aşağıdaki durumlarda üyeliği askıya alabilir veya iptal edebilir:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Sözleşme şartlarının ihlali</li>
                  <li>Yasalara aykırı davranışlar</li>
                  <li>Sahte veya yanıltıcı bilgi kullanımı</li>
                  <li>Diğer üyelere veya siteye zarar verici eylemler</li>
                  <li>Uzun süre aktif olmayan hesaplar (1 yıl)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Üyelikten Çıkma</h2>
                <p className="text-gray-700 mb-4">
                  ÜYE, istediği zaman üyeliğini sonlandırabilir. Üyelik iptali için:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Hesap ayarlarından "Üyeliği Sonlandır" seçeneğini kullanabilir</li>
                  <li>Müşteri hizmetlerine e-posta veya telefon ile başvurabilir</li>
                  <li>İptal sonrası kişisel veriler yasal saklama süreleri dikkate alınarak silinir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Sorumluluk Sınırlaması</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek, teknik arızalar, sistem bakımı veya öngörülemeyen durumlar nedeniyle 
                  hizmetin kesintiye uğraması durumunda sorumlu tutulamaz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Sözleşme Değişiklikleri</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek, bu sözleşmeyi dilediği zaman değiştirme hakkını saklı tutar. 
                  Değişiklikler sitede yayınlandığı tarihte yürürlüğe girer. ÜYE'nin siteyi 
                  kullanmaya devam etmesi değişiklikleri kabul ettiği anlamına gelir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Uyuşmazlıkların Çözümü</h2>
                <p className="text-gray-700 mb-4">
                  İşbu sözleşmeden doğabilecek ihtilaflarda İstanbul Mahkemeleri ve İcra Daireleri 
                  yetkilidir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Yürürlük</h2>
                <p className="text-gray-700 mb-4">
                  ÜYE, üyelik formunu doldurarak işbu sözleşmeyi elektronik ortamda onaylamış ve 
                  kabul etmiş sayılır. Sözleşme, onay tarihinden itibaren yürürlüğe girer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">15. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  Üyelik sözleşmesi hakkında sorularınız için:
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
