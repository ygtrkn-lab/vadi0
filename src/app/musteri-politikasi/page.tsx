import { Header, Footer, MobileNavBar } from '@/components';

export default function MusteriPolitikasi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Müşteri Politikası</h1>
            <p className="text-xl text-gray-600 mb-8">Vadiler Çiçek</p>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-8">
                Vadiler Çiçek olarak daima müşterilerimizin memnuniyetine önem verir, 
                kusursuz bir deneyim yaratmak için çalışırız.
              </p>

              {/* Ana Özellikler */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#e05a4c]/10 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">🚚</div>
                  <h3 className="text-xl font-bold mb-2">Zamanında Teslimat</h3>
                  <p className="text-gray-600 text-sm">
                    Farklı teslimat seçenekleriyle daima zamanında teslimat yapmayı taahhüt ederiz.
                  </p>
                </div>
                <div className="bg-[#e05a4c]/10 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">↩️</div>
                  <h3 className="text-xl font-bold mb-2">Kolay İade</h3>
                  <p className="text-gray-600 text-sm">
                    Tüketici mevzuatında imkan tanınması halinde, satın almış olduğunuz ürünlerinizi 
                    cayma hakkınızı kullanarak 14 gün içinde iade edebilirsiniz.
                  </p>
                </div>
                <div className="bg-[#e05a4c]/10 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">⭐</div>
                  <h3 className="text-xl font-bold mb-2">Yüksek Memnuniyet</h3>
                  <p className="text-gray-600 text-sm">
                    Müşteri Hizmetlerimiz ile taleplerinizi titizlikle ele alıp en geç 2 iş günü 
                    içerisinde aksiyon alırız.
                  </p>
                </div>
              </div>

              {/* Zamanında Teslimat */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Zamanında Teslimat</h2>
                <p className="text-gray-700 mb-4">
                  Zamanında teslimatın sizler için ne kadar önemli olduğunun farkındayız ve bunun için 
                  var gücümüzle çalışmaktayız. Eğer ürününüzün size zamanında ulaşmadığını ya da 
                  yanlış kişiye ulaştığını düşünüyorsanız bizimle iletişime geçmeniz halinde talebinizi 
                  en kısa sürede sonuçlandırırız.
                </p>
                <p className="text-gray-700">
                  Vadiler Çiçek&apos;ten almış olduğunuz ürünler, politikalarımız ile korunmaktadır.
                </p>
              </section>

              {/* Kolay İade */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Kolay İade</h2>
                <p className="text-gray-700 mb-6">
                  Kolay iadeyi, tüketici mevzuatına uygun olması halinde teslim aldıktan sonraki 14 gün 
                  içerisinde internet sitemizden ya da mobil uygulamamızdan ücretsiz bir şekilde yapabilirsiniz.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="w-10 h-10 bg-[#e05a4c] text-white rounded-full flex items-center justify-center font-bold mb-4">1</div>
                    <h3 className="font-semibold mb-2">İade Talebinizi Başlatın</h3>
                    <p className="text-gray-600 text-sm">
                      &quot;Siparişlerim&quot; sayfasından, iade etmek istediğiniz siparişin yanındaki 
                      &quot;Ürünü İade Et&quot; butonundan talebinizi iletebilirsiniz.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="w-10 h-10 bg-[#e05a4c] text-white rounded-full flex items-center justify-center font-bold mb-4">2</div>
                    <h3 className="font-semibold mb-2">Ürünlerinizi Teslim Edin</h3>
                    <p className="text-gray-600 text-sm">
                      İade kodu ile birlikte ilgili kargo firmasına giderek iade etmek istediğiniz ürünü; 
                      tüm aksesuarları, orijinal kutusu, faturası ya da irsaliyesiyle birlikte ücretsiz 
                      olarak gönderebilirsiniz.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="w-10 h-10 bg-[#e05a4c] text-white rounded-full flex items-center justify-center font-bold mb-4">3</div>
                    <h3 className="font-semibold mb-2">Ücret İadenizi Alın</h3>
                    <p className="text-gray-600 text-sm">
                      İade süreciniz, ürün satıcımıza ulaşmasının ardından 2 iş günü içerisinde 
                      değerlendirilecek olup ücret iadesi, iadeniz onaylandıktan sonraki 1-10 iş günü 
                      içerisinde yapılacaktır.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <p className="text-gray-700">
                    Satın aldığınız üründen memnun kalmayan müşterilerimiz, paketi bozulmamış ve 
                    kullanılmamış ürünleri 14 gün içerisinde ücretsiz olarak iade edebilirler. 
                    Diğer müşterilerimizin haklarını da gözeterek bazı ürünlerde iade alamadığımızı 
                    üzülerek belirtmek isteriz.
                  </p>
                </div>

                <p className="text-gray-700 mt-4">
                  Ürünlerimizin arkasındayız ve sitemizde satılan hiçbir ürün ile bir problem 
                  yaşamanızı istemeyiz. Ürünler size çeşitli sebeplerle olması gerekenden farklı 
                  bir şekilde ulaşırsa ortalama 2 iş günü içerisinde talebinizle ilgili aksiyon alırız.
                </p>
              </section>

              {/* Yüksek Müşteri Memnuniyeti */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Yüksek Müşteri Memnuniyeti</h2>
                <p className="text-gray-700 mb-4">
                  Müşterilerimiz bize çeşitli kanallardan ulaşarak taleplerini diledikleri zaman ve 
                  saatte ulaştırabilirler. Müşterilerimizden gelen öneri, teşekkür ve şikayetleri 
                  dikkatle inceler, süreçlerimizi geliştirerek kusursuz bir müşteri deneyimi yaratmak 
                  için kullanırız.
                </p>
                <p className="text-gray-700">
                  Siparişiniz öncesi ve sonrasında talepleriniz ile ilgili canlı yardım üzerinden 
                  yardımcı olmaktan memnuniyet duyarız.
                </p>
              </section>

              {/* İletişim */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Bize Ulaşın</h2>
                <div className="bg-[#e05a4c]/10 rounded-xl p-6">
                  <p className="text-gray-700 mb-4">
                    Aklınıza takılan her konuda bize ulaşabilirsiniz! Sipariş durumunu sorgulamak, 
                    şikayet iletmek ve aklınıza takılan soruları sormak için bizimle iletişime geçebilirsiniz.
                  </p>
                  <ul className="list-none text-gray-700 space-y-2">
                    <li><strong>Telefon:</strong> 0850 307 4876</li>
                  </ul>
                </div>
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
