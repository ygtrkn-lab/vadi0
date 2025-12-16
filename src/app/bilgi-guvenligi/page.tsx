import { Header, Footer, MobileNavBar } from '@/components';

export default function BilgiGuvenligi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Bilgi Güvenliği Politikası</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Amaç ve Kapsam</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek olarak, müşterilerimizin ve çalışanlarımızın bilgi güvenliğini 
                  sağlamak en önemli önceliğimizdir. Bu politika, bilgi varlıklarının gizlilik, 
                  bütünlük ve erişilebilirliğini korumak için uyguladığımız standartları belirler.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Bilgi Güvenliği İlkeleri</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.1. Gizlilik</h3>
                    <p className="text-gray-700">
                      Bilgiye sadece yetkili kişilerin erişebilmesini sağlamak
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.2. Bütünlük</h3>
                    <p className="text-gray-700">
                      Bilginin doğruluğunu ve eksiksizliğini korumak
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.3. Erişilebilirlik</h3>
                    <p className="text-gray-700">
                      Bilginin yetkili kullanıcılar tarafından gerektiğinde erişilebilir olmasını sağlamak
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Güvenlik Önlemleri</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Şifreleme:</strong> Tüm hassas veriler şifrelenerek saklanır ve iletilir</li>
                  <li><strong>Erişim Kontrolü:</strong> Rol tabanlı erişim yönetimi uygulanır</li>
                  <li><strong>Güvenlik Duvarı:</strong> Ağ trafiği sürekli izlenir ve korunur</li>
                  <li><strong>SSL Sertifikası:</strong> Web sitesi güvenli bağlantı ile korunur</li>
                  <li><strong>Düzenli Yedekleme:</strong> Veriler düzenli olarak yedeklenir</li>
                  <li><strong>Güvenlik Güncellemeleri:</strong> Sistemler güncel tutulur</li>
                  <li><strong>İzleme ve Kayıt:</strong> Sistem aktiviteleri izlenir ve kaydedilir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Kullanıcı Sorumlulukları</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Güçlü ve benzersiz şifreler kullanmak</li>
                  <li>Şifreleri başkalarıyla paylaşmamak</li>
                  <li>Şüpheli aktiviteleri derhal bildirmek</li>
                  <li>Hesaptan çıkış yapmayı unutmamak</li>
                  <li>Kişisel bilgileri güvenli tutmak</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Veri Koruma</h2>
                <p className="text-gray-700 mb-4">
                  Müşteri verileri:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>PCI-DSS standartlarına uygun işlenir</li>
                  <li>Üçüncü taraflarla güvenli protokollerle paylaşılır</li>
                  <li>Düzenli güvenlik denetimlerinden geçer</li>
                  <li>Yasal saklama süreleri sonunda imha edilir</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Olay Müdahalesi</h2>
                <p className="text-gray-700 mb-4">
                  Güvenlik ihlali durumunda:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Olay derhal tespit edilir ve izole edilir</li>
                  <li>Etkilenen kullanıcılar bilgilendirilir</li>
                  <li>Yasal mercilere gerekli bildirimler yapılır</li>
                  <li>Kök neden analizi yapılır ve önlemler alınır</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Eğitim ve Farkındalık</h2>
                <p className="text-gray-700 mb-4">
                  Çalışanlarımıza düzenli bilgi güvenliği eğitimleri verilir ve 
                  güvenlik farkındalığı sürekli artırılır.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Sürekli İyileştirme</h2>
                <p className="text-gray-700 mb-4">
                  Bilgi güvenliği politikamız düzenli olarak gözden geçirilir, 
                  güncel tehditler ve teknolojiler doğrultusunda güncellenir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  Bilgi güvenliği ile ilgili sorular veya şüpheli durumlar için:
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
