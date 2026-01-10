import { Header, Footer, MobileNavBar } from '@/components';
import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

export const metadata: Metadata = {
  title: 'Kişisel Verilerin Korunması Politikası | Vadiler Çiçek',
  description: 'Vadiler Çiçek KVKK Kişisel Verilerin Korunması Politikası. Kişisel verilerinizin güvenliği ve korunması hakkında bilgi.',
  alternates: {
    canonical: `${BASE_URL}/kvkk`,
  },
  openGraph: {
    title: 'Kişisel Verilerin Korunması Politikası',
    description: 'Vadiler Çiçek KVKK Kişisel Verilerin Korunması Politikası',
    url: `${BASE_URL}/kvkk`,
    type: 'website',
  },
};

export default function KVKKPolitikasi() {
  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Kişisel Verilerin Korunması ve Gizlilik Politikası</h1>
            <p className="text-lg text-gray-600 mb-8">Vadiler Çiçek</p>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-8">
                Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>

              {/* İçindekiler */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">İçindekiler</h2>
                <ul className="list-none space-y-2 text-gray-700">
                  <li><a href="#hakkinda" className="text-[#e05a4c] hover:underline">Şirketimiz ve Politika Hakkında</a></li>
                  <li><a href="#tanimlar" className="text-[#e05a4c] hover:underline">A. Politikada Yer Verilen Tanımlar</a></li>
                  <li><a href="#ilkeler" className="text-[#e05a4c] hover:underline">B. Kişisel Veri İşleme İlkeleri</a></li>
                  <li><a href="#sartlar" className="text-[#e05a4c] hover:underline">C. Kişisel Verilerin İşlenme Şartları</a></li>
                  <li><a href="#aktarim" className="text-[#e05a4c] hover:underline">D. Kişisel Verilerin Aktarılması</a></li>
                  <li><a href="#guvenlik" className="text-[#e05a4c] hover:underline">E. Kişisel Verilerin Güvenliği İçin Alınan Tedbirler</a></li>
                  <li><a href="#surecler" className="text-[#e05a4c] hover:underline">F. Kişisel Veri İşleme Süreçleri</a></li>
                  <li><a href="#haklar" className="text-[#e05a4c] hover:underline">G. İlgili Kişilerin Hakları</a></li>
                  <li><a href="#guncelleme" className="text-[#e05a4c] hover:underline">H. Politikanın Güncellenmesi</a></li>
                  <li><a href="#sorular" className="text-[#e05a4c] hover:underline">İ. Politika İle İlgili Sorular</a></li>
                </ul>
              </div>

              {/* Şirketimiz ve Politika Hakkında */}
              <section id="hakkinda" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Şirketimiz ve Politika Hakkında</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek (&quot;Vadiler Çiçek&quot; veya &quot;Şirket&quot;) olarak kişisel verilerin korunmasına büyük önem veriyoruz. 
                  6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;Kanun&quot;), ikincil düzenlemeler ile Kişisel Verileri 
                  Koruma Kurulu&apos;nun (&quot;Kurul&quot;) kararları doğrultusunda yer alan yükümlülüklerimiz çerçevesinde tüm kişisel 
                  veri işleme faaliyetlerimizi mevzuata uygun şekilde gerçekleştirmeyi önceliğimiz olarak ele alıyoruz.
                </p>
                <p className="text-gray-700 mb-4">
                  Bu Kişisel Verilerin Korunması ve Gizlilik Politikası (&quot;Politika&quot;) ile Vadiler Çiçek olarak kişisel 
                  verileri nasıl işlediğimizi ve koruduğumuzu açıklamayı amaçlıyoruz. Politika içeriğinde mevzuat 
                  uyarınca uyduğumuz usul ve prensipler ile kişisel veri işleme süreçlerimize yer verilmiştir.
                </p>
                <p className="text-gray-700">
                  Kişisel verilerinizin korunması ve işlenmesine ilişkin her türlü sorunuz için 0850 307 4876 numarasından bizimle iletişime geçebilirsiniz.
                </p>
              </section>

              {/* Tanımlar */}
              <section id="tanimlar" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">A. Politikada Yer Verilen Tanımlar</h2>
                <p className="text-gray-700 mb-4">Politikada kullandığımız terimler ve bunların açıklamaları aşağıdaki gibidir:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-3">
                  <li><strong>Açık Rıza:</strong> Belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle açıklanan rıza.</li>
                  <li><strong>İlgili Kişi/Veri Sahibi:</strong> Kişisel verisi işlenen gerçek kişi veya kişiler.</li>
                  <li><strong>İnternet Sitesi:</strong> www.vadiler.com adresinden ulaşılabilen internet sitesi.</li>
                  <li><strong>Dijital Mecra:</strong> Vadiler Çiçek internet sitesi ile mobil uygulaması.</li>
                  <li><strong>Kullanıcı:</strong> Şirketimizin internet sitesi veya mobil uygulaması üzerinden ürün ve hizmetlerimize yönelik inceleme yapan ve/veya alışveriş yapan kişiler.</li>
                  <li><strong>Kayıt Ortamı:</strong> Tamamen veya kısmen otomatik olan ya da herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla işlenen kişisel verilerin bulunduğu her türlü ortam.</li>
                  <li><strong>Kişisel Veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi.</li>
                  <li><strong>Kişisel Verilerin İşlenmesi:</strong> Kişisel verilerin tamamen veya kısmen otomatik olan ya da herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla elde edilmesi, kaydedilmesi, depolanması, saklanması, değiştirilmesi, yeniden düzenlenmesi, açıklanması, aktarılması, devralınması, elde edilebilir hale getirilmesi, sınıflandırılması ya da kullanılmasının engellenmesi gibi veriler üzerinde gerçekleştirilen her türlü işlem.</li>
                  <li><strong>Kurum:</strong> Kişisel Verileri Koruma Kurumu.</li>
                  <li><strong>Kurul:</strong> Kişisel Verileri Koruması Kurulu.</li>
                  <li><strong>Üye Müşteri:</strong> Şirketimizin internet sitesi/mobil uygulamasını kullanarak üyelik hesabı oluşturmuş ve alışverişlerini üyelik hesabı üzerinden gerçekleştiren müşterilerimiz.</li>
                  <li><strong>Veri Kayıt Sistemi:</strong> Kişisel verilerin belirli kriterlere göre yapılandırılarak işlendiği kayıt sistemi.</li>
                  <li><strong>Veri İşleyen:</strong> Veri sorumlusunun verdiği yetkiye dayanarak veri sorumlusu adına kişisel verileri işleyen gerçek veya tüzel kişi.</li>
                  <li><strong>Veri Sorumlusu:</strong> Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu olan gerçek veya tüzel kişi.</li>
                </ul>
              </section>

              {/* Kişisel Veri İşleme İlkeleri */}
              <section id="ilkeler" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">B. Kişisel Veri İşleme İlkeleri</h2>
                <p className="text-gray-700 mb-4">
                  Kanun&apos;un 4. maddesinde kişisel veri işleme ilkeleri yer almaktadır. Şirketimiz kişisel verileri 
                  işlerken Kanun&apos;da sayılan veri işleme ilkelerine uygun hareket etmektedir.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Hukuka ve Dürüstlük Kurallarına Uygun Olma</h3>
                    <p className="text-gray-700 text-sm">Veri işleme faaliyetlerimizi mevzuat düzenlemelerine ve iyi niyet ilkelerine uygun şekilde yürütüyoruz.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Doğru ve Gerektiğinde Güncel Olma</h3>
                    <p className="text-gray-700 text-sm">Kişisel verilerinizin doğru ve güncel olmasını temin edecek kanalları her zaman açık tutuyoruz.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Belirli, Açık ve Meşru Amaçlar İçin İşlenme</h3>
                    <p className="text-gray-700 text-sm">Kişisel verilerin hangi amaçlarla işleneceğini belirliyor ve bu amaçları şeffaf ve anlaşılır bir biçimde bilginize sunuyoruz.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">İşleme Amaçlarıyla Bağlantılı, Sınırlı ve Ölçülü Olma</h3>
                    <p className="text-gray-700 text-sm">Amacın gerçekleştirilmesiyle ilgili olmayan veya ihtiyaç duyulmayan kişisel verileri işlemiyoruz.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Gerekli Süre Kadar Muhafaza Edilme</h3>
                    <p className="text-gray-700 text-sm">Kişisel verilerin saklanması için mevzuatta öngörülmüş bir süre varsa bu süreye uygunluk sağlıyor; eğer böyle bir süre öngörülmemişse kişisel verileri sadece işleme amaçları için gereken süre boyunca saklıyoruz.</p>
                  </div>
                </div>
              </section>

              {/* Kişisel Verilerin İşlenme Şartları */}
              <section id="sartlar" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">C. Kişisel Verilerin İşlenme Şartları</h2>
                <p className="text-gray-700 mb-4">
                  Kanun&apos;un 5. ve 6. maddelerinde kişisel verilerin işlenme şartları yer almaktadır. Bu işleme şartları, 
                  kişisel veri işleme faaliyetinin hukuki sebebini ifade etmektedir. Vadiler Çiçek olarak, kişisel 
                  verileri işlerken bu veri işleme şartlarına uygun hareket ediyoruz.
                </p>
                <p className="text-gray-700 mb-4">Kanun&apos;un 5. maddesinde yer alan ve Şirketimizin kişisel verileri işlerken dayandığı veri işleme şartları:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>İlgili kişinin açık rızasının bulunması</li>
                  <li>Kanunlarda açıkça öngörülmesi</li>
                  <li>Kişisel verinin işlenmesi ilgili kişi veya başkasının hayatı veya beden bütünlüğünün korunması için zorunlu olması</li>
                  <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması</li>
                  <li>Bir hakkın tesisi, kullanılması veya korunması için işlenmesi</li>
                  <li>Şirketimizin hukuki yükümlülüklerini yerine getirmesi için kişisel veri işlemenin zorunlu olması</li>
                  <li>Kişisel verilerin, kişisel veri sahibi tarafından alenileştirilmiş olması</li>
                  <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, Şirketimizin meşru menfaatleri için veri işlenmesinin zorunlu olması</li>
                </ul>
              </section>

              {/* Kişisel Verilerin Aktarılması */}
              <section id="aktarim" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">D. Kişisel Verilerin Aktarılması</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek olarak belirli durumlarda, elde ettiğimiz kişisel verileri yukarıda belirtilen kişisel 
                  veri işleme amaçları doğrultusunda üçüncü kişilere aktarabiliyoruz. Gerçekleştirdiğimiz veri aktarımları 
                  her bir kişisel veri işleme faaliyetine göre farklılık gösterebiliyor.
                </p>
                <p className="text-gray-700 mb-4">
                  Şirketimiz kişisel verilerin aktarılması süreçlerinde, kişisel verilerinizi kişisel verinin niteliğine 
                  uygun gerekli güvenlik önlemlerini alarak aktarmaktadır.
                </p>
                <p className="text-gray-700 mb-4">Yurt içindeki üçüncü taraflara yapılacak kişisel verileri aktarımlarını, aşağıdaki hukuki sebeplerden birine dayanarak gerçekleştiriyoruz:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>İlgili kişinin açık rızasının bulunması</li>
                  <li>Kanunlarda açıkça öngörülmesi</li>
                  <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması</li>
                  <li>Bir hakkın tesisi, kullanılması veya korunması için işlenmesi</li>
                  <li>Şirketimizin hukuki yükümlülüklerini yerine getirmesi için zorunlu olması</li>
                  <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, meşru menfaatlerimiz için zorunlu olması</li>
                </ul>
              </section>

              {/* Güvenlik Tedbirleri */}
              <section id="guvenlik" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">E. Kişisel Verilerin Güvenliği İçin Alınan Teknik ve İdari Tedbirler</h2>
                <p className="text-gray-700 mb-4">
                  Vadiler Çiçek olarak, kişisel verilerinizin güvenliğini sağlamayı önemsiyoruz. Bu kapsamda kişisel 
                  verilerin güvenliği için belirli teknik ve idari tedbirler alıyoruz.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Teknik Tedbirler</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                      <li>Güvenlik duvarları kullanılmaktadır</li>
                      <li>Ağ güvenliği ve uygulama güvenliği sağlanmaktadır</li>
                      <li>Güncel anti-virüs sistemleri kullanılmaktadır</li>
                      <li>Kişisel veriler şifrelenerek saklanmaktadır</li>
                      <li>Erişim logları düzenli olarak tutulmaktadır</li>
                      <li>Sızma testi uygulanmaktadır</li>
                      <li>Siber güvenlik önlemleri alınmıştır</li>
                      <li>SSL sertifikası ile güvenli bağlantı sağlanmaktadır</li>
                      <li>Kullanıcı hesap yönetimi ve yetki kontrol sistemi uygulanmaktadır</li>
                      <li>Düzenli yedekleme yapılmaktadır</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">İdari Tedbirler</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 text-sm">
                      <li>Kişisel veri güvenliği politika ve prosedürleri belirlenmiştir</li>
                      <li>Çalışanlara veri güvenliği eğitimleri verilmektedir</li>
                      <li>İmzalanan sözleşmeler veri güvenliği hükümleri içermektedir</li>
                      <li>Kişisel veri işleme envanteri hazırlanmıştır</li>
                      <li>Gizlilik taahhütnameleri yapılmaktadır</li>
                      <li>Görev değişikliği olan çalışanların erişim yetkileri kaldırılmaktadır</li>
                      <li>Kişisel veri içeren fiziksel ortamların güvenliği sağlanmaktadır</li>
                      <li>Veri ihlali durumunda uygulanacak prosedürler belirlenmiştir</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Kişisel Veri İşleme Süreçleri */}
              <section id="surecler" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">F. Kişisel Veri İşleme Süreçleri</h2>
                
                {/* Sipariş Süreci */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">1. Sipariş Süreci</h3>
                  <p className="text-gray-700 mb-3">
                    Vadiler Çiçek dijital mecralarından verdiğiniz siparişler kapsamında belirli kişisel verilerinizi işliyoruz.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2"><strong>İşlenen Kişisel Veriler:</strong> Kimlik, İletişim, Müşteri İşlem, Finans, Hukuki İşlem</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>Amaçlar:</strong> Siparişinizin alınması ve yönetilmesi, teslimat, sipariş takibi, ödeme işlemleri, fatura düzenlenmesi</p>
                    <p className="text-sm text-gray-700"><strong>Hukuki Sebep:</strong> Sözleşmenin kurulması veya ifası, meşru menfaat</p>
                  </div>
                </div>

                {/* Üyelik Süreçleri */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">2. Üyelik Süreçleri</h3>
                  <p className="text-gray-700 mb-3">
                    Vadiler Çiçek dijital mecralarında üyelik oluşturmanız halinde belirli kişisel verilerinizi işliyoruz.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2"><strong>İşlenen Kişisel Veriler:</strong> Kimlik, İletişim, İşlem Güvenliği</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>Amaçlar:</strong> Kimlik ve iletişim bilgilerinin doğrulanması, üyelik oluşturulması, hesaba giriş imkanı sağlanması</p>
                    <p className="text-sm text-gray-700"><strong>Hukuki Sebep:</strong> Sözleşmenin kurulması veya ifası</p>
                  </div>
                </div>

                {/* Hediye Gönderim Süreçleri */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">3. Hediye Gönderim Süreçleri</h3>
                  <p className="text-gray-700 mb-3">
                    Sunduğumuz ürün ve hizmetlerin müşterilerimiz tarafından hediye olarak gönderilmesine ilişkin faaliyetler yürütüyoruz.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2"><strong>İşlenen Kişisel Veriler:</strong> Kimlik, İletişim, İşlem Bilgileri</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>Amaçlar:</strong> Hediye/ürün teslimatı, iletişime geçilmesi, şikâyet ve taleplerin sonuçlandırılması</p>
                    <p className="text-sm text-gray-700"><strong>Hukuki Sebep:</strong> Meşru menfaat</p>
                  </div>
                </div>

                {/* Müşteri Hizmetleri */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">4. Canlı Destek ve Müşteri Hizmetleri Süreçleri</h3>
                  <p className="text-gray-700 mb-3">
                    Şirketimizin müşteri hizmetleri ve canlı destek kanallarını kullanarak bize ulaşan kişilerin belirli kişisel verilerini işliyoruz.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2"><strong>İşlenen Kişisel Veriler:</strong> Kimlik, İletişim, Talep/Şikâyet Bilgileri, Müşteri İşlem</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>Amaçlar:</strong> Soru ve taleplerin yanıtlanması, şikâyetlerin çözümlenmesi</p>
                    <p className="text-sm text-gray-700"><strong>Hukuki Sebep:</strong> Meşru menfaat</p>
                  </div>
                </div>
              </section>

              {/* İlgili Kişilerin Hakları */}
              <section id="haklar" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">G. İlgili Kişilerin Hakları</h2>
                <p className="text-gray-700 mb-4">
                  Kanun&apos;un 11. maddesi &quot;ilgili kişi haklarını&quot; düzenlemektedir. Kişisel verisi Vadiler Çiçek tarafından 
                  işlenen tüm gerçek kişiler, Kanun uyarınca Şirketimize başvurma ve Kanun&apos;da sayılmış yasal haklarını 
                  kullanma hakkına sahiptir.
                </p>
                <p className="text-gray-700 mb-4">Kanun&apos;un 11. maddesinde sayılan haklara aşağıda yer verilmiştir:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Vadiler Çiçek tarafından kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>Kişisel verileriniz işlenmiş ise hakkında bilgi talep etme</li>
                  <li>Kişisel verilerinizin işleme amaçları ve kişisel verileri amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Kişisel verilerinizin yurt içi ve yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
                  <li>Eksik veya yanlış işlenmiş kişisel verilerin düzeltilmesini ve bu işlemin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                  <li>Kişisel verilerinizin işlenmesini gerektiren sebeplerin ortadan kalkması hâlinde verilerinizin silinmesini veya yok edilmesini isteme</li>
                  <li>İşlenilen kişisel verilerinizin, münhasıran otomatik sistemler vasıtasıyla analiz edilmesi aleyhinize bir sonuç ortaya çıkarmış ise itiraz etme</li>
                  <li>Kişisel verilerinizin Kanun&apos;a aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                </ul>
                
                <div className="bg-[#e05a4c]/10 rounded-xl p-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Başvuru Yöntemleri</h3>
                  <p className="text-gray-700 mb-4">Haklarınızı kullanmak üzere Şirketimize başvururken, aşağıda belirtilen yöntemlerden birini tercih edebilirsiniz:</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Sistemlerimizde kayıtlı bulunan e-posta adresinizi kullanarak, <strong>kvkk@vadiler.com</strong> e-posta adresine taleplerinizi içeren bir e-posta gönderebilirsiniz.</li>
                    <li>Posta yoluyla, Şirketimizin <strong>İstanbul, Türkiye</strong> adresine iletebilirsiniz.</li>
                  </ul>
                </div>
              </section>

              {/* Politikanın Güncellenmesi */}
              <section id="guncelleme" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">H. Politikanın Güncellenmesi</h2>
                <p className="text-gray-700 mb-4">
                  İşbu Politika, Vadiler Çiçek tarafından ihtiyaç duyuldukça gözden geçirilir ve gerektiğinde güncellenir.
                </p>
                <p className="text-gray-700">
                  Bunun dışında başta Kanun ve ikincil düzenlemeler ile Kurul kararları olmak üzere ilgili mevzuatta 
                  yapılan değişiklikler nedeniyle Politika güncellenmemiş olsa bile, ilgili mevzuatta meydana gelen 
                  değişiklikler derhal uygulanacaktır.
                </p>
              </section>

              {/* İletişim */}
              <section id="sorular" className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">İ. Politika İle İlgili Sorular</h2>
                <p className="text-gray-700 mb-4">
                  Bu Politikaya ve kişisel verilerin işlenmesine ilişkin tüm sorularınız için aşağıdaki iletişim 
                  bilgilerinden bize ulaşabilirsiniz:
                </p>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Vadiler Çiçek</h3>
                  <ul className="list-none text-gray-700 space-y-2">
                    <li><strong>Adres:</strong> İstanbul, Türkiye</li>
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
