/**
 * Kategori Bazlı FAQ'lar
 * Google Zengin Sonuçlar için FAQ Schema
 */

export interface CategoryFAQ {
  question: string;
  answer: string;
}

export const CATEGORY_FAQS: Record<string, CategoryFAQ[]> = {
  'guller': [
    {
      question: 'Gül buketi ne kadar dayanır?',
      answer: 'Taze kesim gül buketi uygun bakım koşullarında (temiz su, serin ortam, direkt güneş ışığından koruma) 7-14 gün dayanır. Vadiler Çiçek\'ten aldığınız güller aynı gün kesilmiş taze çiçeklerdir.',
    },
    {
      question: 'Kaç adet gül almalıyım?',
      answer: 'Gül sayısının anlamı vardır: 1 gül "sen benim için teksin", 7 gül "sana aşığım", 11 gül "en değerlimsin", 21 gül "kız isteme" anlamı taşır. Sevgililer Günü için 11 veya 21 gül önerilir.',
    },
    {
      question: 'Kırmızı gül fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te kırmızı gül buketi fiyatları 789 TL\'den başlar. 7\'li, 11\'li, 21\'li ve 101\'li buket seçenekleri mevcuttur. Tüm siparişlere İstanbul içi ücretsiz kargo dahildir.',
    },
    {
      question: 'Gül siparişi aynı gün teslim edilir mi?',
      answer: 'Evet! Saat 16:00\'a kadar verilen tüm gül siparişleri İstanbul\'un tüm ilçelerine aynı gün teslim edilir. Vadiler Çiçek güvencesiyle taze ve özenle paketlenmiş çiçekler kapınıza gelir.',
    },
  ],
  'orkideler': [
    {
      question: 'Orkide bakımı nasıl yapılır?',
      answer: 'Orkide haftada 1-2 kez su verilmeli, direkt güneş ışığından korunmalı ve 18-25°C sıcaklıkta tutulmalıdır. Yaprakları nemli bezle silinmeli, solmuş çiçekler kesilmelidir.',
    },
    {
      question: 'Orkide ne kadar süre çiçek açar?',
      answer: 'Phalaenopsis (kelebek) orkideler uygun bakımla 2-3 ay çiçekli kalır. Yılda 2-3 kez çiçek açabilirler. Vadiler Çiçek\'ten aldığınız orkideler çiçeklenme döneminin başında gönderilir.',
    },
    {
      question: 'Tek dal orkide mi çift dal orkide mi almalıyım?',
      answer: 'Tek dal orkide zarif ve şık bir seçimdir, ev ve ofis için idealdir. Çift dal orkide daha gösterişlidir, özel günler ve hediye için tercih edilir. Üç ve dört dallı orkideler kurumsal hediyeler için uygundur.',
    },
    {
      question: 'Orkide fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te orkide fiyatları tek dal için 1.299 TL\'den, çift dal için 1.899 TL\'den başlar. Premium ve özel tasarım orkide aranjmanları da mevcuttur.',
    },
  ],
  'buketler': [
    {
      question: 'Buket çiçek ne kadar dayanır?',
      answer: 'Karışık buketler ortalama 5-10 gün dayanır. Her gün su değiştirilmeli, saplar eğik kesilmeli ve serin ortamda tutulmalıdır. Vadiler Çiçek buketleri profesyonelce hazırlanır.',
    },
    {
      question: 'Hangi buket daha uzun ömürlü?',
      answer: 'Gül ve karanfil içeren buketler en uzun ömürlüdür (10-14 gün). Lilyum ve gerbera orta ömürlü (7-10 gün), papatya ve lisyantus kısa ömürlüdür (5-7 gün).',
    },
    {
      question: 'Buket siparişi nasıl verilir?',
      answer: 'Vadiler.com\'dan beğendiğiniz buketi seçin, teslimat adresini girin ve ödemenizi tamamlayın. İstanbul içi ücretsiz kargo ile aynı gün teslimat yapılır.',
    },
    {
      question: 'Buket fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te buket fiyatları 599 TL\'den başlar. Karışık mevsim buketi, gül buketi, lilyum buketi ve özel tasarım buket seçenekleri mevcuttur.',
    },
  ],
  'aranjmanlar': [
    {
      question: 'Aranjman ile buket arasındaki fark nedir?',
      answer: 'Buket el ile tutulabilir şekilde sarılı çiçeklerdir. Aranjman ise sünger veya köpük üzerine yerleştirilmiş, vazo veya kutu içinde hazır sunum çiçekleridir. Aranjmanlar daha uzun ömürlü ve bakımı kolaydır.',
    },
    {
      question: 'Çiçek aranjmanı ne kadar dayanır?',
      answer: 'Çiçek aranjmanları sünger nemli tutulduğunda 7-14 gün dayanır. Günlük su eklenmeli, serin ortamda ve direkt güneşten uzak tutulmalıdır.',
    },
    {
      question: 'Aranjman siparişi aynı gün teslim edilir mi?',
      answer: 'Evet, saat 16:00\'a kadar verilen aranjman siparişleri İstanbul\'un tüm ilçelerine aynı gün teslim edilir. Özel tasarım aranjmanlar için 1 gün önceden sipariş önerilir.',
    },
    {
      question: 'En popüler çiçek aranjmanları hangileri?',
      answer: 'Kırmızı gül aranjmanları, orkide aranjmanları, ferforje aranjmanlar ve kutuda çiçek aranjmanları en çok tercih edilenlerdir. Vadiler Çiçek\'te 100\'den fazla aranjman seçeneği mevcuttur.',
    },
  ],
  'kutuda-cicekler': [
    {
      question: 'Kutuda çiçek ne kadar dayanır?',
      answer: 'Kutuda çiçekler özel sünger sayesinde 10-14 gün taze kalır. Günlük su eklenmeli ve serin ortamda tutulmalıdır. Vadiler kutulu çiçekler premium ambalajla gönderilir.',
    },
    {
      question: 'Kutuda çiçek hediye olarak uygun mu?',
      answer: 'Kutuda çiçek en şık hediye seçeneklerinden biridir. Özel kutu tasarımı, zarif sunum ve taşıma kolaylığı ile öne çıkar. Sevgililer Günü, doğum günü ve yıldönümü için idealdir.',
    },
    {
      question: 'Kutuda gül fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te kutuda gül fiyatları 899 TL\'den başlar. Kalp kutu, yuvarlak kutu ve kare kutu seçenekleri mevcuttur. Premium ve forever rose seçenekleri de bulunur.',
    },
  ],
  'sepet-cicekleri': [
    {
      question: 'Sepet çiçeği ne zaman gönderilir?',
      answer: 'Sepet çiçekleri genellikle açılış, geçmiş olsun, tebrik ve taziye için tercih edilir. Gösterişli sunumu ve taşıma kolaylığı ile kurumsal hediyeler için idealdir.',
    },
    {
      question: 'Sepet çiçeği bakımı nasıl yapılır?',
      answer: 'Sepet içindeki sünger her gün sulanmalı, direkt güneşten korunmalı ve serin ortamda tutulmalıdır. Solmuş çiçekler temizlenerek ömrü uzatılabilir.',
    },
    {
      question: 'Sepet çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te sepet çiçeği fiyatları 1.099 TL\'den başlar. Küçük, orta ve büyük boy sepet seçenekleri mevcuttur.',
    },
  ],
  'lilyumlar': [
    {
      question: 'Lilyum çiçeği ne anlama gelir?',
      answer: 'Lilyum saflığı, zarafeti ve yeniden doğuşu simgeler. Beyaz lilyum düğün ve cenaze törenlerinde, pembe lilyum sevgi ve şefkati, sarı lilyum neşe ve mutluluğu ifade eder.',
    },
    {
      question: 'Lilyum çiçeği ne kadar dayanır?',
      answer: 'Lilyum çiçekleri 7-14 gün taze kalır. Tomurcuklu gönderildiğinde açılarak daha uzun süre güzelliğini korur. Su düzenli değiştirilmeli ve serin ortamda tutulmalıdır.',
    },
    {
      question: 'Lilyum alerjik mi?',
      answer: 'Lilyumların polenleri leke bırakabilir ve bazı kişilerde hafif alerjik reaksiyonlara neden olabilir. Polen torbalarını çiçek açar açmaz nazikçe çıkarmak önerilir.',
    },
  ],
  'papatyalar': [
    {
      question: 'Papatya çiçeği ne anlama gelir?',
      answer: 'Papatya masumiyeti, saflığı ve sadık sevgiyi simgeler. "Seni seviyorum" mesajının en saf halidir. Arkadaşlık, dostluk ve temiz duygular için tercih edilir.',
    },
    {
      question: 'Papatya buketi ne kadar dayanır?',
      answer: 'Papatya buketi uygun bakımla 5-7 gün dayanır. Her gün su değiştirilmeli, saplar temiz kesilmeli ve serin ortamda tutulmalıdır.',
    },
    {
      question: 'Papatya çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te papatya buketi fiyatları 499 TL\'den başlar. Saksıda papatya, aranjman ve karışık buket seçenekleri mevcuttur.',
    },
  ],
  'gerberalar': [
    {
      question: 'Gerbera çiçeği ne anlama gelir?',
      answer: 'Gerbera neşeyi, mutluluğu ve pozitif enerjiyi simgeler. Rengarenk çeşitleriyle moral vermek, kutlamak ve neşe dağıtmak için idealdir.',
    },
    {
      question: 'Gerbera çiçeği ne kadar dayanır?',
      answer: 'Gerbera çiçekleri 7-12 gün taze kalır. Sapları uzun ve ince olduğu için destek teli ile gönderilir. Su düzenli değiştirilmelidir.',
    },
    {
      question: 'Gerbera buketi fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te gerbera buketi fiyatları 599 TL\'den başlar. Tek renk ve karışık renk seçenekleri mevcuttur.',
    },
  ],
  'saksi-cicekleri': [
    {
      question: 'Saksı çiçeği bakımı nasıl yapılır?',
      answer: 'Saksı çiçekleri türüne göre haftada 1-3 kez sulanmalı, dolaylı ışık almalı ve 18-24°C sıcaklıkta tutulmalıdır. Toprak kurudukça su verilmelidir.',
    },
    {
      question: 'Saksı çiçeği hediye olarak uygun mu?',
      answer: 'Saksı çiçekleri uzun ömürlü oldukları için mükemmel bir hediyedir. Anneler Günü, yeni ev, ofis açılışı için idealdir. Kesme çiçeklerin aksine yıllarca yaşayabilir.',
    },
    {
      question: 'Saksı çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te saksı çiçeği fiyatları 299 TL\'den başlar. Mini bitkilerden büyük boy saksı çiçeklerine kadar geniş seçenek mevcuttur.',
    },
  ],
  'bonsai': [
    {
      question: 'Bonsai bakımı nasıl yapılır?',
      answer: 'Bonsai toprağı nemli tutulmalı ama su içinde bırakılmamalıdır. Dolaylı güneş ışığı almalı, 2-3 haftada bir gübre verilmeli ve düzenli budanmalıdır.',
    },
    {
      question: 'Bonsai ne kadar yaşar?',
      answer: 'Bonsai uygun bakımla 100 yıl ve üzeri yaşayabilir. Japonya\'da 500 yaşın üzerinde bonsai ağaçları mevcuttur. Sabır ve özen gerektiren zarif bir canlıdır.',
    },
    {
      question: 'Bonsai hediye olarak uygun mu?',
      answer: 'Bonsai çok özel ve anlamlı bir hediyedir. Uzun ömür, sabır ve özen simgesi olarak yeni ev, ofis, emeklilik ve özel günler için idealdir.',
    },
    {
      question: 'Bonsai fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te bonsai fiyatları 399 TL\'den başlar. Mini bonsai, orta boy ve premium koleksiyon bonsailer mevcuttur.',
    },
  ],
  'ayicikli-cicekler': [
    {
      question: 'Ayıcıklı çiçek kimlere gönderilir?',
      answer: 'Ayıcıklı çiçekler sevgili, eş ve çocuklara gönderilir. Sevgililer Günü, doğum günü ve sürprizler için idealdir. Romantik ve sevimli bir hediye seçeneğidir.',
    },
    {
      question: 'Ayıcıklı çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te ayıcıklı çiçek fiyatları 699 TL\'den başlar. Mini, orta ve büyük boy ayıcık seçenekleri mevcuttur.',
    },
  ],
  'balonlu-cicekler': [
    {
      question: 'Balonlu çiçek ne zaman tercih edilir?',
      answer: 'Balonlu çiçekler doğum günü, yeni bebek, kutlama ve sürprizler için tercih edilir. Neşeli ve eğlenceli bir sunum sağlar.',
    },
    {
      question: 'Balonlar ne kadar dayanır?',
      answer: 'Helyum balonlar 12-48 saat havada kalır. Folyo balonlar daha uzun süre (3-5 gün) dayanır. Vadiler Çiçek kaliteli helyum balonlar kullanır.',
    },
    {
      question: 'Balonlu çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te balonlu çiçek fiyatları 799 TL\'den başlar. Tek balon ve çoklu balon seçenekleri mevcuttur.',
    },
  ],
  'hediye': [
    {
      question: 'Çiçek yanında hangi hediyeler gönderilebilir?',
      answer: 'Vadiler Çiçek\'te çiçek yanına çikolata, parfüm, takı, peluş ayıcık, balon ve kişiye özel ürünler eklenebilir. Hediye seti olarak kombine paketler de mevcuttur.',
    },
    {
      question: 'Hediye ürünleri aynı gün teslim edilir mi?',
      answer: 'Evet, çiçek ile birlikte sipariş edilen hediye ürünleri de aynı gün teslim edilir. Saat 16:00\'a kadar verilen siparişler için geçerlidir.',
    },
  ],
  'dogum-gunu': [
    {
      question: 'Doğum günü için hangi çiçekler tercih edilmeli?',
      answer: 'Doğum günü için renkli gerberalar, balonlu buketler, ayıcıklı aranjmanlar ve özel tasarım kutulu çiçekler tercih edilir. Kişinin favori renk ve çiçeği biliniyorsa ona göre seçim yapılmalıdır.',
    },
    {
      question: 'Doğum günü çiçeği sürpriz olarak gönderilebilir mi?',
      answer: 'Evet! Vadiler Çiçek ile sevdiklerinize sürpriz çiçek gönderebilirsiniz. Sipariş notuna mesajınızı yazın, belirttiğiniz saatte teslim edilsin.',
    },
    {
      question: 'Doğum günü çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te doğum günü çiçeği fiyatları 599 TL\'den başlar. Balonlu, ayıcıklı ve özel tasarım seçenekler mevcuttur.',
    },
  ],
  'sevgililer-gunu': [
    {
      question: 'Sevgililer Günü için hangi çiçekler tercih edilmeli?',
      answer: 'Sevgililer Günü için kırmızı güller klasik ve en romantik tercihtir. 7, 11, 21 veya 101 kırmızı gül buketi önerilir. Kalp şeklinde aranjmanlar ve kutulu güller de çok tercih edilir.',
    },
    {
      question: 'Sevgililer Günü çiçeği ne zaman sipariş verilmeli?',
      answer: '14 Şubat öncesi yoğunluk yaşanır, 1-2 gün önceden sipariş vermeniz önerilir. Aynı gün teslimat için saat 14:00\'a kadar sipariş verilebilir.',
    },
    {
      question: 'Sevgililer Günü çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te Sevgililer Günü çiçekleri 789 TL\'den başlar. Özel tasarım, kalp kutu ve premium buket seçenekleri mevcuttur.',
    },
  ],
  'anneler-gunu': [
    {
      question: 'Anneler Günü için hangi çiçekler tercih edilmeli?',
      answer: 'Anneler Günü için orkideler, pembe güller, lilyumlar ve renkli aranjmanlar tercih edilir. Saksı çiçekleri uzun ömürlü oldukları için anneye güzel bir hediyedir.',
    },
    {
      question: 'Anneler Günü çiçeği ne zaman gönderilmeli?',
      answer: 'Anneler Günü Mayıs ayının ikinci pazarı kutlanır. 1-2 gün önceden sipariş vermeniz önerilir. Pazar günü teslimat için önceden planlama yapılmalıdır.',
    },
    {
      question: 'Anneler Günü çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te Anneler Günü çiçekleri 699 TL\'den başlar. Orkide, aranjman ve saksı çiçeği seçenekleri mevcuttur.',
    },
  ],
};

// Varsayılan FAQ'lar (kategori bulunamazsa)
export const DEFAULT_CATEGORY_FAQS: CategoryFAQ[] = [
  {
    question: 'Çiçek siparişi nasıl verilir?',
    answer: 'Vadiler.com\'dan beğendiğiniz çiçeği seçin, teslimat adresini girin ve güvenli ödeme ile siparişinizi tamamlayın. İstanbul içi ücretsiz kargo ile aynı gün teslimat yapılır.',
  },
  {
    question: 'Çiçekler aynı gün teslim edilir mi?',
    answer: 'Evet! Saat 16:00\'a kadar verilen siparişler İstanbul\'un tüm ilçelerine aynı gün teslim edilir. Vadiler Çiçek güvencesiyle taze çiçekler kapınıza gelir.',
  },
  {
    question: 'Çiçek teslimatı ücretsiz mi?',
    answer: 'İstanbul içi tüm teslimatlar ücretsizdir. Sipariş tutarından bağımsız olarak kargo ücreti alınmaz.',
  },
  {
    question: 'Ödeme seçenekleri nelerdir?',
    answer: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Tüm ödemeler iyzico güvencesiyle 256-bit SSL şifreleme ile korunur.',
  },
];

/**
 * Kategori slug'ına göre FAQ'ları getir
 */
export function getCategoryFAQs(categorySlug: string): CategoryFAQ[] {
  return CATEGORY_FAQS[categorySlug] || DEFAULT_CATEGORY_FAQS;
}
