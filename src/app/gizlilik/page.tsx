import { Header, Footer, MobileNavBar } from '@/components';

export default function GizlilikPolitikasi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Gizlilik Politikası</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Kişisel Verilerin Korunması</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, 
                  kişisel verilerinizin güvenliğine önem vermekteyiz. Bu politika, hangi kişisel verilerinizin 
                  toplandığını, nasıl kullanıldığını ve korunduğunu açıklamaktadır.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Toplanan Kişisel Veriler</h2>
                <p className="text-gray-700 mb-4">Aşağıdaki kişisel verileriniz toplanabilir:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Ad, soyad ve iletişim bilgileri (telefon, e-posta, adres)</li>
                  <li>Ödeme ve fatura bilgileri</li>
                  <li>Sipariş geçmişi ve tercihleri</li>
                  <li>IP adresi ve çerez bilgileri</li>
                  <li>Web sitesi kullanım verileri</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Verilerin Kullanım Amaçları</h2>
                <p className="text-gray-700 mb-4">Kişisel verileriniz şu amaçlarla kullanılır:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Siparişlerinizin işlenmesi ve teslimatı</li>
                  <li>Müşteri hizmetleri desteği sağlanması</li>
                  <li>Pazarlama ve bilgilendirme faaliyetleri</li>
                  <li>Web sitesi ve hizmetlerimizin iyileştirilmesi</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Veri Güvenliği</h2>
                <p className="text-gray-700 mb-4">
                  Kişisel verileriniz, yetkisiz erişim, kayıp veya değişikliğe karşı korunmak üzere 
                  güncel teknolojik ve idari tedbirlerle güvence altına alınmaktadır. Verileriniz 
                  şifreli bağlantılar üzerinden iletilir ve güvenli sunucularda saklanır.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Çerez Kullanımı</h2>
                <p className="text-gray-700 mb-4">
                  Web sitemizde kullanıcı deneyimini geliştirmek için çerezler kullanılmaktadır. 
                  Çerezleri tarayıcı ayarlarınızdan yönetebilirsiniz. Detaylı bilgi için 
                  Çerez Politikamızı inceleyebilirsiniz.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Üçüncü Taraflarla Paylaşım</h2>
                <p className="text-gray-700 mb-4">
                  Kişisel verileriniz, yalnızca hizmetlerimizi sunmak için gerekli olduğu durumlarda 
                  (kargo firmaları, ödeme kuruluşları gibi) güvenilir üçüncü taraflarla paylaşılabilir.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Haklarınız</h2>
                <p className="text-gray-700 mb-4">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse bilgi talep etme</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                  <li>Verilerin silinmesini veya yok edilmesini isteme</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. İletişim</h2>
                <p className="text-gray-700 mb-4">
                  Kişisel verilerinizle ilgili sorularınız için bizimle iletişime geçebilirsiniz:
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
