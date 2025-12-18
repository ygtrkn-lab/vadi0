/**
 * Özel Günler - SEO ve Kategori Sayfaları için
 * Vadiler Çiçekçilik özel gün koleksiyonları
 */

export interface SpecialDay {
  id: number;
  name: string;
  slug: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  image: string;
  relatedTags: string[];
  date?: string; // Sabit tarihi olan günler için (örn: 14 Şubat)
  seasonalMonth?: number; // Mevsimsel günler için (1-12)
}

export const SPECIAL_DAYS: SpecialDay[] = [
  {
    id: 1,
    name: "Sevgililer Günü",
    slug: "sevgililer-gunu",
    title: "Sevgililer Günü Çiçekleri",
    description: "14 Şubat Sevgililer Günü'nde aşkınızı en güzel çiçeklerle ifade edin. Kırmızı güller, romantik buketler ve özel aranjmanlarla sevgilinizi mutlu edin. Vadiler Çiçek ile aynı gün teslimat garantisi.",
    metaTitle: "Sevgililer Günü Çiçekleri 2025 | 14 Şubat Özel | Vadiler Çiçek",
    metaDescription: "Sevgililer Günü için en romantik çiçekler! Kırmızı güller, kalp buketler, özel aranjmanlar. İstanbul'a aynı gün teslimat. ❤️ Vadiler Çiçek",
    keywords: ["sevgililer günü çiçekleri", "14 şubat çiçek", "sevgiliye çiçek", "romantik buket", "kırmızı gül buketi", "aşk çiçekleri"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg",
    relatedTags: ["romantik", "kırmızı", "gül", "aşk", "sevgili", "kalp"],
    date: "14 Şubat"
  },
  {
    id: 2,
    name: "Anneler Günü",
    slug: "anneler-gunu",
    title: "Anneler Günü Çiçekleri",
    description: "Anneler Günü'nde annenize en güzel sürprizi yapın. Özenle hazırlanmış orkideler, rengarenk buketler ve zarif aranjmanlarla annenizi mutlu edin. Her anneye özel çiçek seçenekleri.",
    metaTitle: "Anneler Günü Çiçekleri 2025 | Anneye Özel | Vadiler Çiçek",
    metaDescription: "Anneler Günü için en güzel çiçekler! Orkideler, pastel buketler, özel aranjmanlar. Annenizi mutlu edin. 💐 Vadiler Çiçek ile hızlı teslimat.",
    keywords: ["anneler günü çiçekleri", "anneye çiçek", "anne hediyesi", "orkide", "pastel buket", "anne günü"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg",
    relatedTags: ["anne", "orkide", "pastel", "zarif", "şık", "özel"],
    seasonalMonth: 5 // Mayıs
  },
  {
    id: 3,
    name: "Doğum Günü",
    slug: "dogum-gunu",
    title: "Doğum Günü Çiçekleri",
    description: "Doğum günlerini unutulmaz kılın! Renkli buketler, balonlu çiçekler ve neşeli aranjmanlarla sevdiklerinizin yüzünü güldürün. Her yaşa ve zevke uygun doğum günü çiçekleri.",
    metaTitle: "Doğum Günü Çiçekleri | Balonlu & Renkli Buketler | Vadiler Çiçek",
    metaDescription: "Doğum günü için en renkli çiçekler! Balonlu buketler, neşeli aranjmanlar, özel tasarımlar. 🎂 Vadiler Çiçek ile sürpriz yapın!",
    keywords: ["doğum günü çiçekleri", "doğum günü buketi", "balonlu çiçek", "doğum günü hediyesi", "renkli buket", "kutlama çiçeği"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225910/vadiler/products/vadiler-teraryum-i-yi-ki-dogdun-canim-arkadasim-mor.jpg",
    relatedTags: ["doğum günü", "kutlama", "balon", "renkli", "neşeli", "parti"],
  },
  {
    id: 4,
    name: "Yıldönümü",
    slug: "yildonumu",
    title: "Yıldönümü Çiçekleri",
    description: "Evlilik yıldönümü veya özel günlerinizi şık çiçeklerle kutlayın. Romantik güller, zarif orkideler ve özel aranjmanlarla yıldönümünüzü unutulmaz kılın.",
    metaTitle: "Yıldönümü Çiçekleri | Evlilik & Özel Günler | Vadiler Çiçek",
    metaDescription: "Yıldönümü için en romantik çiçekler! Şık güller, zarif orkideler, özel tasarımlar. 💍 Vadiler Çiçek ile kutlayın!",
    keywords: ["yıldönümü çiçekleri", "evlilik yıldönümü", "yıldönümü hediyesi", "romantik çiçek", "özel gün çiçeği"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225138/vadiler/products/vadiler-sensiz-olmaz-25-beyaz-guller.jpg",
    relatedTags: ["yıldönümü", "romantik", "şık", "zarif", "özel", "kutlama"],
  },
  {
    id: 5,
    name: "Geçmiş Olsun",
    slug: "gecmis-olsun",
    title: "Geçmiş Olsun Çiçekleri",
    description: "Sevdiklerinize şifa dileklerinizi en güzel çiçeklerle iletin. Hastane ziyaretleri ve geçmiş olsun dilekleri için uygun, ferah ve pozitif enerji veren çiçek aranjmanları.",
    metaTitle: "Geçmiş Olsun Çiçekleri | Hastaneye Çiçek | Vadiler Çiçek",
    metaDescription: "Geçmiş olsun dileklerinizi çiçeklerle iletin. Hastaneye uygun, ferah buketler ve aranjmanlar. 🌸 Vadiler Çiçek ile şifa dileyin!",
    keywords: ["geçmiş olsun çiçekleri", "hastaneye çiçek", "şifa çiçeği", "geçmiş olsun buketi", "hastane çiçeği"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225079/vadiler/products/vadiler-renkli-papatya-ve-gerberalarin-bulusmasi.jpg",
    relatedTags: ["geçmiş olsun", "şifa", "hastane", "ferah", "pozitif", "papatya"],
  },
  {
    id: 6,
    name: "Tebrikler",
    slug: "tebrikler",
    title: "Tebrik Çiçekleri",
    description: "Başarıları kutlamak için en şık çiçekler! Mezuniyet, terfi, yeni iş ve her türlü başarı için görkemli buketler ve aranjmanlarla tebriklerinizi iletin.",
    metaTitle: "Tebrik Çiçekleri | Mezuniyet & Başarı | Vadiler Çiçek",
    metaDescription: "Başarıları kutlayın! Mezuniyet, terfi, yeni iş için görkemli çiçekler. 🎓 Vadiler Çiçek ile tebriklerinizi iletin!",
    keywords: ["tebrik çiçekleri", "mezuniyet çiçeği", "başarı buketi", "terfi hediyesi", "kutlama çiçeği"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224474/vadiler/products/vadiler-harmony-of-carnations.jpg",
    relatedTags: ["tebrik", "kutlama", "başarı", "mezuniyet", "terfi", "şık"],
  },
  {
    id: 7,
    name: "Yeni Bebek",
    slug: "yeni-bebek",
    title: "Yeni Bebek Çiçekleri",
    description: "Yeni doğan bebekleri ve mutlu aileleri en tatlı çiçeklerle kutlayın. Pembe ve mavi tonlarda özel aranjmanlar, ayıcıklı buketler ve bebek hediyeleri.",
    metaTitle: "Yeni Bebek Çiçekleri | Hoş Geldin Bebek | Vadiler Çiçek",
    metaDescription: "Yeni doğan bebekler için en tatlı çiçekler! Pembe & mavi buketler, ayıcıklı aranjmanlar. 👶 Vadiler Çiçek ile kutlayın!",
    keywords: ["yeni bebek çiçekleri", "bebek buketi", "doğum hediyesi", "hoş geldin bebek", "ayıcıklı çiçek", "bebek aranjmanı"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765223533/vadiler/products/vadiler-102-papyonlu-buyuk-ayicik-100-yerli-kahve.jpg",
    relatedTags: ["bebek", "doğum", "ayıcık", "pembe", "mavi", "tatlı"],
  },
  {
    id: 8,
    name: "Taziye",
    slug: "taziye",
    title: "Taziye Çiçekleri",
    description: "Kaybedilen sevdiklerin anısına saygıyla hazırlanan taziye çiçekleri. Cenaze çelenkleri, taziye aranjmanları ve başsağlığı çiçekleri ile duygularınızı ifade edin.",
    metaTitle: "Taziye Çiçekleri | Cenaze Çelengi | Vadiler Çiçek",
    metaDescription: "Taziye ve başsağlığı çiçekleri. Cenaze çelenkleri, taziye aranjmanları. Saygıyla hazırlanır. 🕊️ Vadiler Çiçek",
    keywords: ["taziye çiçekleri", "cenaze çelengi", "başsağlığı çiçeği", "taziye aranjmanı", "cenaze çiçeği"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765223946/vadiler/products/vadiler-beyaz-kirmizi-gerberalarla-cenaze-celengi.jpg",
    relatedTags: ["taziye", "cenaze", "başsağlığı", "beyaz", "çelenk", "saygı"],
  },
  {
    id: 9,
    name: "Açılış & Kutlama",
    slug: "acilis-kutlama",
    title: "Açılış ve Kutlama Çiçekleri",
    description: "İş yeri açılışları, mağaza açılışları ve kurumsal kutlamalar için görkemli çiçek aranjmanları. Ayaklı sepetler, dev buketler ve özel tasarımlarla açılışınızı şenlendirin.",
    metaTitle: "Açılış Çiçekleri | Kurumsal & İş Yeri | Vadiler Çiçek",
    metaDescription: "İş yeri ve mağaza açılışları için görkemli çiçekler! Ayaklı sepetler, dev aranjmanlar. 🏢 Vadiler Çiçek ile açılışınızı kutlayın!",
    keywords: ["açılış çiçekleri", "iş yeri açılış", "mağaza açılış", "kurumsal çiçek", "ayaklı sepet", "açılış aranjmanı"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224876/vadiler/products/vadiler-mutlu-dusler-renkli-lisyantus-cicek-sepeti.jpg",
    relatedTags: ["açılış", "kurumsal", "iş", "sepet", "görkemli", "büyük"],
  },
  {
    id: 10,
    name: "Teşekkür",
    slug: "tesekkur",
    title: "Teşekkür Çiçekleri",
    description: "Minnettarlığınızı en güzel çiçeklerle ifade edin. Öğretmenler günü, yardımsever dostlar ve her türlü teşekkür için zarif buketler ve aranjmanlar.",
    metaTitle: "Teşekkür Çiçekleri | Minnettarlık Buketi | Vadiler Çiçek",
    metaDescription: "Teşekkürlerinizi çiçeklerle iletin! Zarif buketler, özel aranjmanlar. 🙏 Vadiler Çiçek ile minnettarlığınızı gösterin!",
    keywords: ["teşekkür çiçekleri", "minnettarlık buketi", "öğretmenler günü", "teşekkür hediyesi", "zarif buket"],
    image: "https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224690/vadiler/products/vadiler-kokulu-beyaz-lilyum-tasarim-aranjmani.jpg",
    relatedTags: ["teşekkür", "minnettarlık", "zarif", "öğretmen", "hediye", "şükran"],
  },
];

// Slug'dan özel gün bilgisi getir
export function getSpecialDayBySlug(slug: string): SpecialDay | undefined {
  return SPECIAL_DAYS.find(day => day.slug === slug);
}

// Tüm özel gün slug'larını getir
export function getAllSpecialDaySlugs(): string[] {
  return SPECIAL_DAYS.map(day => day.slug);
}

// Ürün tag'lerine göre eşleşen özel günleri getir
export function getMatchingSpecialDays(tags: string[]): SpecialDay[] {
  return SPECIAL_DAYS.filter(day => 
    day.relatedTags.some(tag => 
      tags.some(productTag => 
        productTag.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(productTag.toLowerCase())
      )
    )
  );
}

export default {
  SPECIAL_DAYS,
  getSpecialDayBySlug,
  getAllSpecialDaySlugs,
  getMatchingSpecialDays,
};
