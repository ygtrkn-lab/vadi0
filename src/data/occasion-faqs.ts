/**
 * Özel Gün Bazlı FAQ'lar
 * Google Zengin Sonuçlar için FAQ Schema
 */

export interface OccasionFAQ {
  question: string;
  answer: string;
}

export const OCCASION_FAQS: Record<string, OccasionFAQ[]> = {
  'sevgililer-gunu': [
    {
      question: 'Sevgililer Günü için hangi çiçek gönderilmeli?',
      answer: 'Sevgililer Günü için kırmızı güller en klasik ve romantik tercihtir. 7 gül "sana aşığım", 11 gül "sen en değerlimsin", 21 gül "sana adadım kendimi" anlamı taşır. Kalp şeklinde aranjmanlar ve kutulu güller de çok tercih edilir.',
    },
    {
      question: 'Sevgililer Günü çiçeği ne zaman sipariş verilmeli?',
      answer: '14 Şubat öncesi yoğunluk yaşandığı için 1-2 gün önceden sipariş vermeniz önerilir. Vadiler Çiçek ile aynı gün teslimat için saat 14:00\'a kadar sipariş verebilirsiniz.',
    },
    {
      question: '14 Şubat Sevgililer Günü çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te Sevgililer Günü çiçekleri 789 TL\'den başlar. 7\'li gül buketi, 11\'li gül buketi, kalp kutu güller ve premium tasarımlar mevcuttur.',
    },
    {
      question: 'Sevgililer Günü\'nde sürpriz çiçek gönderilebilir mi?',
      answer: 'Evet! Vadiler Çiçek ile sevgilinize sürpriz çiçek gönderebilirsiniz. Sipariş notuna mesajınızı yazın, istediğiniz saatte teslim edilsin. Gizlilik garantisi ile gönderim yapılır.',
    },
  ],
  'anneler-gunu': [
    {
      question: 'Anneler Günü için hangi çiçekler tercih edilmeli?',
      answer: 'Anneler Günü için orkideler, pembe güller, lilyumlar ve renkli aranjmanlar tercih edilir. Saksı çiçekleri uzun ömürlü oldukları için anneye özel güzel bir hediyedir.',
    },
    {
      question: 'Anneler Günü ne zaman kutlanır?',
      answer: 'Türkiye\'de Anneler Günü her yılın Mayıs ayının ikinci pazarı kutlanır. 2025 yılında 11 Mayıs Pazar günü kutlanacaktır.',
    },
    {
      question: 'Anneler Günü çiçeği ne zaman gönderilmeli?',
      answer: 'Anneler Günü çiçeği Pazar günü teslim için Cumartesi veya Pazar sabahı sipariş verilebilir. Yoğunluk nedeniyle 1 gün önceden sipariş vermeniz önerilir.',
    },
    {
      question: 'Anneler Günü çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te Anneler Günü çiçekleri 699 TL\'den başlar. Orkide, aranjman, saksı çiçeği ve özel tasarım seçenekleri mevcuttur.',
    },
  ],
  'dogum-gunu': [
    {
      question: 'Doğum günü için hangi çiçekler gönderilmeli?',
      answer: 'Doğum günü için renkli gerberalar, balonlu buketler, ayıcıklı aranjmanlar tercih edilir. Kişinin favori renk ve çiçeği biliniyorsa ona göre seçim yapılmalıdır.',
    },
    {
      question: 'Doğum günü çiçeği sürpriz olarak gönderilebilir mi?',
      answer: 'Evet! Vadiler Çiçek ile sevdiklerinize sürpriz doğum günü çiçeği gönderebilirsiniz. Belirli saat teslimatı seçebilir ve kişiye özel mesaj kartı ekleyebilirsiniz.',
    },
    {
      question: 'Doğum günü çiçeğine balon eklenebilir mi?',
      answer: 'Evet, tüm çiçeklere helyum balon eklenebilir. Doğum günü yazılı folyo balonlar veya renkli balonlar sipariş sırasında seçilebilir.',
    },
    {
      question: 'Doğum günü çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te doğum günü çiçekleri 599 TL\'den başlar. Balonlu, ayıcıklı ve özel tasarım seçenekler ile hediye paketleri mevcuttur.',
    },
  ],
  'yildonumu': [
    {
      question: 'Yıldönümü için hangi çiçekler gönderilmeli?',
      answer: 'Evlilik yıldönümü için kırmızı güller en romantik tercihtir. 11 veya 21 kırmızı gül buketi aşkı ve bağlılığı simgeler. Orkide ve premium aranjmanlar da şık alternatiflerdir.',
    },
    {
      question: 'Kaçıncı yıldönümü için ne renk çiçek gönderilmeli?',
      answer: '1. yıl: Kağıt (beyaz çiçek), 5. yıl: Ahşap (turuncu), 10. yıl: Kalay (gümüş tonları), 25. yıl: Gümüş (beyaz), 50. yıl: Altın (sarı güller) geleneksel olarak tercih edilir.',
    },
    {
      question: 'Yıldönümü çiçeği nasıl gönderilir?',
      answer: 'Vadiler.com\'dan yıldönümü çiçeği seçin, teslimat adresini girin ve ödemeyi tamamlayın. Özel mesaj kartı ekleyerek sürpriz yapabilirsiniz.',
    },
    {
      question: 'Yıldönümü çiçek fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te yıldönümü çiçekleri 899 TL\'den başlar. Premium gül buketleri, kutulu güller ve özel tasarımlar mevcuttur.',
    },
  ],
  'gecmis-olsun': [
    {
      question: 'Hastaneye çiçek gönderilebilir mi?',
      answer: 'Evet, hastaneye çiçek gönderilebilir. Ancak yoğun bakım ve steril ortamlarda çiçek kabul edilmeyebilir. Hastane kurallarını önceden kontrol etmeniz önerilir.',
    },
    {
      question: 'Geçmiş olsun için hangi çiçekler tercih edilmeli?',
      answer: 'Geçmiş olsun için hafif kokulu veya kokusuz çiçekler tercih edilmelidir. Papatyalar, gerberalar ve pastel tonlarda aranjmanlar pozitif enerji verir.',
    },
    {
      question: 'Hastaneye gönderilecek çiçek nasıl olmalı?',
      answer: 'Hastane odasına uygun küçük-orta boy, hafif kokulu veya kokusuz, ferah renkli çiçekler tercih edilmelidir. Saksı çiçekleri uzun ömürlü olduğu için iyi bir seçenektir.',
    },
    {
      question: 'Geçmiş olsun çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te geçmiş olsun çiçekleri 599 TL\'den başlar. Hastaneye uygun boyut ve tasarımda seçenekler mevcuttur.',
    },
  ],
  'tebrikler': [
    {
      question: 'Mezuniyet için hangi çiçekler gönderilmeli?',
      answer: 'Mezuniyet için gösterişli buketler, renkli gerberalar ve neşeli aranjmanlar tercih edilir. Sarı çiçekler başarı ve mutluluğu, beyaz çiçekler yeni başlangıçları simgeler.',
    },
    {
      question: 'Terfi için çiçek göndermek uygun mu?',
      answer: 'Evet, terfi ve iş başarıları için çiçek göndermek çok uygun ve takdir gören bir jesttir. Profesyonel görünümlü aranjmanlar ve orkideler tercih edilir.',
    },
    {
      question: 'Tebrik çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te tebrik çiçekleri 699 TL\'den başlar. Mezuniyet, terfi ve başarı için özel tasarımlar mevcuttur.',
    },
  ],
  'yeni-bebek': [
    {
      question: 'Yeni doğan bebek için hangi çiçekler gönderilmeli?',
      answer: 'Yeni bebek için kız bebekler için pembe, erkek bebekler için mavi tonlarda çiçekler tercih edilir. Balon ve ayıcık eklenmiş aranjmanlar çok sevilir.',
    },
    {
      question: 'Hastaneye bebek çiçeği gönderilebilir mi?',
      answer: 'Evet, hastaneye bebek çiçeği gönderilebilir. Kokusuz veya hafif kokulu çiçekler tercih edilmeli, bebek servisi kurallarına dikkat edilmelidir.',
    },
    {
      question: 'Yeni bebek çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te yeni bebek çiçekleri 799 TL\'den başlar. Pembe ve mavi tonlarda ayıcıklı, balonlu seçenekler mevcuttur.',
    },
  ],
  'acilis-cicegi': [
    {
      question: 'Açılış çiçeği nasıl olmalı?',
      answer: 'Açılış çiçekleri gösterişli, büyük boy ve dikkat çekici olmalıdır. Ferforje aranjmanlar, ayaklı sepetler ve kurdeleli tasarımlar tercih edilir.',
    },
    {
      question: 'Açılış çiçeği ne zaman gönderilmeli?',
      answer: 'Açılış çiçeği açılış günü sabahı veya bir gün öncesi gönderilmelidir. Törenin saatine göre teslimat planlanmalıdır.',
    },
    {
      question: 'Açılış çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te açılış çiçekleri 1.499 TL\'den başlar. Ferforje, ayaklı sepet ve kurumsal aranjman seçenekleri mevcuttur.',
    },
  ],
  'taziye': [
    {
      question: 'Cenaze için hangi çiçekler gönderilmeli?',
      answer: 'Taziye için beyaz lilyumlar, beyaz güller, krizantemler ve beyaz karanfiller tercih edilir. Sade ve zarif tasarımlar uygundur.',
    },
    {
      question: 'Taziye çiçeği nereye gönderilmeli?',
      answer: 'Taziye çiçeği cenaze evine, camiye veya mezarlığa gönderilebilir. Teslimat yerini sipariş sırasında belirtmeniz gerekir.',
    },
    {
      question: 'Taziye çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te taziye çiçekleri 999 TL\'den başlar. Cenaze çelengi, taziye aranjmanı ve buket seçenekleri mevcuttur.',
    },
  ],
  'nisan': [
    {
      question: 'Nişan için hangi çiçekler tercih edilmeli?',
      answer: 'Nişan için kırmızı ve beyaz güller, orkideler ve romantik aranjmanlar tercih edilir. 21 kırmızı gül nişan ve söz için geleneksel bir seçimdir.',
    },
    {
      question: 'Nişan çiçeği ne zaman gönderilmeli?',
      answer: 'Nişan çiçeği törenin olduğu gün sabahı veya bir gün öncesi gönderilmelidir. Sürpriz için törenin saatine göre planlanabilir.',
    },
    {
      question: 'Nişan çiçeği fiyatları ne kadar?',
      answer: 'Vadiler Çiçek\'te nişan çiçekleri 1.299 TL\'den başlar. 21\'li gül buketi, orkide ve özel tasarım seçenekleri mevcuttur.',
    },
  ],
};

// Varsayılan özel gün FAQ'ları
export const DEFAULT_OCCASION_FAQS: OccasionFAQ[] = [
  {
    question: 'Özel gün çiçeği nasıl sipariş verilir?',
    answer: 'Vadiler.com\'dan özel gün koleksiyonunu seçin, beğendiğiniz çiçeği sepete ekleyin, teslimat adresini girin ve ödemenizi tamamlayın. İstanbul içi ücretsiz kargo ile aynı gün teslimat yapılır.',
  },
  {
    question: 'Çiçekler özel günde aynı gün teslim edilir mi?',
    answer: 'Evet! Saat 16:00\'a kadar verilen siparişler İstanbul\'un tüm ilçelerine aynı gün teslim edilir. Özel günlerde yoğunluk olabileceğinden erken sipariş önerilir.',
  },
  {
    question: 'Çiçeğe kart mesajı eklenebilir mi?',
    answer: 'Evet, tüm çiçeklere ücretsiz kişiye özel mesaj kartı eklenebilir. Sipariş sırasında mesajınızı yazabilirsiniz.',
  },
];

/**
 * Özel gün slug'ına göre FAQ'ları getir
 */
export function getOccasionFAQs(occasionSlug: string): OccasionFAQ[] {
  return OCCASION_FAQS[occasionSlug] || DEFAULT_OCCASION_FAQS;
}
