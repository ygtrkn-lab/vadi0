import { Header, Footer, MobileNavBar } from '@/components';

export default function UrunGuvenligi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Ürün Güvenliği</h1>
            <p className="text-xl text-gray-600 mb-8">Vadiler Çiçek</p>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-8">
                Uzaktan İletişim Araçları Yoluyla Piyasaya Arz Edilen Ürünlerin Piyasa Gözetimi ve 
                Denetimi Yönetmeliği uyarınca, aracı hizmet sağlayıcıların uygunsuzluğu sebebiyle 
                geri çağrıldığını öğrendiği ürünlere ilişkin olarak çevrim içi arayüzlerinden 
                bilgilendirme yapması gerekmektedir.
              </p>

              {/* Bilgilendirme Kutusu */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-800">Önemli Bilgilendirme</h2>
                <p className="text-gray-700">
                  Bu kapsamda, Şirketimize geri çağrıldığı bildirilen ürünlere ilişkin bilgilendirmeleri 
                  bu sayfadan takip edebilirsiniz.
                </p>
              </div>

              {/* Geri Çağrılan Ürünler */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Geri Çağrılan Ürünler</h2>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 text-center py-8">
                    Şu anda geri çağrılan ürün bulunmamaktadır.
                  </p>
                </div>
              </section>

              {/* Ürün Güvenliği Politikamız */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Ürün Güvenliği Politikamız</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek olarak, müşterilerimize sunduğumuz tüm ürünlerin güvenliğini en üst 
                  düzeyde tutmayı taahhüt ediyoruz. Ürün güvenliği konusunda aşağıdaki ilkeleri benimsiyoruz:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Tüm ürünlerimiz ilgili yasal düzenlemelere ve standartlara uygun olarak sunulmaktadır.</li>
                  <li>Tedarikçilerimizle güvenlik standartları konusunda sürekli iş birliği yapılmaktadır.</li>
                  <li>Ürün güvenliği ile ilgili şikayetler öncelikli olarak değerlendirilmektedir.</li>
                  <li>Güvenlik riski tespit edilen ürünler derhal satıştan kaldırılmaktadır.</li>
                  <li>Müşterilerimize ürün güvenliği hakkında şeffaf bilgilendirme yapılmaktadır.</li>
                </ul>
              </section>

              {/* Bildirim Süreci */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Ürün Güvenliği Bildirimi</h2>
                <p className="text-gray-700 mb-4">
                  Satın aldığınız bir ürünle ilgili güvenlik endişeniz varsa veya bir güvenlik sorunu 
                  tespit ettiyseniz, lütfen bizimle iletişime geçin. Bildirimlerinizi ciddiyetle 
                  değerlendirip gerekli aksiyonları en kısa sürede alacağız.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-3">Ürün Güvenliği Temas Noktası</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Ürün güvenliğine ilişkin konularda aşağıdaki iletişim kanallarından bizimle 
                      iletişime geçebilirsiniz:
                    </p>
                    <ul className="list-none text-gray-700 space-y-2 text-sm">
                      <li><strong>Telefon:</strong> 0850 307 4876</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-3">Genel İletişim</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Diğer tüm sorularınız için müşteri hizmetlerimize ulaşabilirsiniz:
                    </p>
                    <ul className="list-none text-gray-700 space-y-2 text-sm">
                      <li><strong>Telefon:</strong> 0850 307 4876</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Yasal Dayanak */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Yasal Dayanak</h2>
                <p className="text-gray-700">
                  Bu sayfa, &quot;Uzaktan İletişim Araçları Yoluyla Piyasaya Arz Edilen Ürünlerin Piyasa 
                  Gözetimi ve Denetimi Yönetmeliği&quot; kapsamındaki yükümlülüklerimiz doğrultusunda 
                  hazırlanmıştır.
                </p>
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
