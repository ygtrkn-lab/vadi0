require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// SEO optimized data based on Google SERP analysis
const seoData = {
  name: 'Beyaz Papatya Buketi | İstanbul Aynı Gün Teslimat',
  description: 'Beyaz papatya buketi online sipariş. Taze kesim beyaz papatyalar ile hazırlanan el yapımı buket. İstanbul içi aynı gün teslimat. Doğum günü, sevgiliye, anneler günü hediyesi. Beyaz papatya fiyatları ve çeşitleri Vadiler Çiçek\'te.',
  long_description: `<h2>Beyaz Papatya Buketi - Online Sipariş</h2>
<p>Beyaz papatya buketi arıyorsanız doğru yerdesiniz! Taze kesim beyaz papatyalardan oluşan el yapımı buketimiz, sevdiklerinize saflığın ve masumiyetin simgesi olan bu özel çiçekleri hediye etmenin en güzel yoludur.</p>

<h3>Beyaz Papatya Ne Anlama Gelir?</h3>
<p>Beyaz papatya, saflık, masumiyet ve sadakati simgeler. Aynı zamanda yeni başlangıçları ve temiz kalbi ifade eder. Sevgilinize, annenize veya arkadaşlarınıza gönderebileceğiniz en anlamlı çiçeklerden biridir.</p>

<h3>Papatya Buketi Özellikleri</h3>
<ul>
  <li>Taze kesim beyaz papatyalar</li>
  <li>Profesyonel el yapımı hazırlık</li>
  <li>Zarif yeşil yaprak dekorasyonu</li>
  <li>Şık kraft kağıt ambalaj</li>
  <li>Özel mesaj kartı hediye</li>
</ul>

<h3>Papatya Çiçeği Bakımı</h3>
<p>Papatya çiçeklerinizin uzun süre taze kalması için vazo suyunu 2 günde bir değiştirin, sapları çapraz kesin ve direkt güneş ışığından uzak tutun. Doğru bakımla 7-10 gün tazeliğini korur.</p>

<h3>İstanbul'a Beyaz Papatya Gönder</h3>
<p>İstanbul'un tüm ilçelerine aynı gün papatya buketi teslimatı. Saat 16:00'a kadar verilen siparişler aynı gün teslim edilir. Kadıköy, Beşiktaş, Şişli, Bakırköy, Ataşehir, Üsküdar ve diğer tüm ilçelere hızlı teslimat.</p>

<h3>Papatya Fiyatları 2026</h3>
<p>En uygun papatya buketi fiyatları Vadiler Çiçek'te. Online sipariş avantajlarından yararlanın, kapıda ödeme seçeneği ile güvenle alışveriş yapın.</p>`,
  tags: ['beyaz papatya', 'papatya buketi', 'beyaz papatya buketi', 'papatya çiçeği', 'papatya fiyatları', 'online papatya siparişi', 'istanbul papatya', 'taze papatya', 'papatya gönder', 'ucuz papatya', 'papatya aranjmanı', 'doğum günü papatya'],
  features: ['Taze Kesim Beyaz Papatyalar', 'El Yapımı Profesyonel Buket', 'Şık Kraft Ambalaj', 'Aynı Gün Teslimat', 'Mesaj Kartı Hediye', '7-10 Gün Tazelik Garantisi'],
  delivery_info: 'İstanbul içi aynı gün teslimat. Saat 16:00 öncesi siparişlerde geçerlidir. Tüm ilçelere ücretsiz kargo.',
  care_tips: 'Vazo suyunu 2 günde bir değiştirin. Sapları çapraz keserek 2-3 cm kısaltın. Direkt güneş ışığından ve meyve kaselerinden uzak tutun. Serin ortamda 7-10 gün taze kalır.',
  color_tags: ['beyaz', 'yeşil', 'krem']
};

async function updateProduct() {
  const { data, error } = await supabase
    .from('products')
    .update(seoData)
    .eq('slug', 'beyaz-papatyalar')
    .select();

  if (error) {
    console.error('Hata:', error);
  } else {
    console.log('✅ Ürün SEO güncellendi:', data[0].name);
    console.log('');
    console.log('📝 Meta Description:');
    console.log(data[0].description);
    console.log('');
    console.log('🏷️  Tags:', data[0].tags.join(', '));
    console.log('');
    console.log('⭐ Features:', data[0].features.join(' | '));
  }
}

updateProduct();
