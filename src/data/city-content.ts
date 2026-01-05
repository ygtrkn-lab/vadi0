/**
 * Şehir ve İlçe SEO İçerikleri
 * Her ilçe için özgün 250-400 kelime açıklama
 */

export interface CityContent {
  slug: string;
  name: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  content: string; // 250-400 kelime özgün içerik
  deliveryInfo: string;
  popularAreas?: string[];
}

// İstanbul Ana Sayfa İçeriği
export const ISTANBUL_CONTENT: CityContent = {
  slug: "istanbul",
  name: "İstanbul",
  title: "İstanbul Çiçek Siparişi",
  description: "İstanbul'un tüm ilçelerine çiçek teslimatı. Online sipariş verin, taze çiçekler kapınıza gelsin.",
  metaTitle: "İstanbul Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
  metaDescription: "İstanbul'a online çiçek siparişi! 39 ilçeye hızlı ve özenli teslimat, taze çiçekler, uygun fiyatlar. Vadiler Çiçek ile İstanbul'a çiçek gönderin!",
  keywords: ["istanbul çiçek siparişi", "istanbul çiçekçi", "istanbul çiçek gönder", "istanbul online çiçek", "istanbul hızlı teslimat"],
  content: `İstanbul, Türkiye'nin kalbi ve en kalabalık şehri olarak milyonlarca insana ev sahipliği yapıyor. Boğaziçi'nin eşsiz güzelliği, tarihi yarımadasının büyüsü ve modern yaşam alanlarıyla İstanbul, her köşesinde farklı bir hikaye barındırıyor.

Vadiler Çiçek olarak, bu muhteşem şehrin her köşesine taze çiçekler ulaştırıyoruz. Avrupa yakasından Anadolu yakasına, merkezi ilçelerden uzak semtlere kadar İstanbul'un 39 ilçesine hızlı ve özenli teslimat sağlıyoruz.

İstanbul'da Çiçek Siparişi Neden Vadiler?

Uzman çiçekçi ağımız sayesinde siparişleriniz en taze çiçeklerle hazırlanıyor. Günlük kesim çiçekler, özenli paketleme ve profesyonel teslimat ekibimizle sevdiklerinize en güzel sürprizi yapmanızı sağlıyoruz.

Teslimat Bilgisi

Teslimat planlaması bölge ve yoğunluğa göre değişebilir. Hafta sonu ve resmi tatillerde hizmet durumunu sipariş sırasında görüntüleyebilirsiniz.

Geniş Ürün Yelpazesi

Kırmızı güller, orkideler, lilyumlar, papatyalar ve mevsim çiçekleriyle her bütçeye uygun seçenekler sunuyoruz. Doğum günü, sevgililer günü, anneler günü ve tüm özel günleriniz için en uygun çiçeği bulabilirsiniz.

Güvenli Ödeme ve Teslimat

Kredi kartı, havale ve kapıda ödeme seçenekleriyle güvenli alışveriş yapabilirsiniz. Her siparişiniz sigortalıdır ve teslimat fotoğrafı ile bilgilendirilirsiniz.`,
  deliveryInfo: "İstanbul'un tüm ilçelerine hızlı ve özenli teslimat. Teslimat süresi bölge ve yoğunluğa göre değişebilir.",
  popularAreas: ["Kadıköy", "Beşiktaş", "Şişli", "Ataşehir", "Bakırköy", "Üsküdar", "Maltepe", "Fatih"]
};

// İlçe bazlı içerikler
export const DISTRICT_CONTENTS: CityContent[] = [
  {
    slug: "kadikoy",
    name: "Kadıköy",
    title: "Kadıköy Çiçek Siparişi",
    description: "Kadıköy'e online çiçek siparişi. Moda, Bağdat Caddesi ve tüm Kadıköy'e hızlı ve özenli teslimat.",
    metaTitle: "Kadıköy Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Kadıköy'e çiçek gönderin! Moda, Bağdat Caddesi, Fenerbahçe ve tüm Kadıköy'e hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["kadıköy çiçek", "kadıköy çiçekçi", "moda çiçek", "bağdat caddesi çiçek", "kadıköy çiçek siparişi"],
    content: `Kadıköy, İstanbul'un Anadolu yakasının en hareketli ve kültürel açıdan en zengin ilçesidir. Tarihi çarşısı, Moda sahili, Bağdat Caddesi ve canlı sokak kültürüyle Kadıköy, her gün binlerce ziyaretçiye ev sahipliği yapıyor.

Vadiler Çiçek olarak Kadıköy'ün her köşesine taze çiçekler ulaştırıyoruz. Moda'nın romantik sokaklarından Fenerbahçe sahiline, Caferağa'nın keyifli kafelerinden Bağdat Caddesi'nin şık mekanlarına kadar tüm Kadıköy'e hızlı ve özenli teslimat yapıyoruz.

Kadıköy'de En Çok Tercih Edilen Çiçekler

Moda ve Fenerbahçe gibi romantik semtlerde kırmızı güller ve orkideler öne çıkarken, Bağdat Caddesi'ndeki iş yerlerine açılış çiçekleri ve kurumsal aranjmanlar sıkça gönderiliyor. Caferağa ve Osmanağa gibi genç nüfusun yoğun olduğu bölgelerde renkli buketler ve balonlu çiçekler tercih ediliyor.

Hızlı Teslimat Avantajı

Kadıköy merkezine yakın depomuz sayesinde siparişleriniz mümkün olan en kısa sürede hazırlanıp teslim ediliyor. Acil siparişler için öncelikli teslimat seçeneklerimiz mevcuttur.`,
  deliveryInfo: "Kadıköy ve tüm mahallelerine hızlı ve özenli teslimat. Öncelikli teslimat seçenekleri mevcut.",
    popularAreas: ["Moda", "Fenerbahçe", "Bağdat Caddesi", "Caferağa", "Osmanağa", "Kozyatağı", "Göztepe"]
  },
  {
    slug: "besiktas",
    name: "Beşiktaş",
    title: "Beşiktaş Çiçek Siparişi",
    description: "Beşiktaş'a online çiçek siparişi. Levent, Etiler, Bebek ve tüm Beşiktaş'a hızlı ve özenli teslimat.",
    metaTitle: "Beşiktaş Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Beşiktaş'a çiçek gönderin! Levent, Etiler, Bebek, Ortaköy ve tüm Beşiktaş'a hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["beşiktaş çiçek", "beşiktaş çiçekçi", "levent çiçek", "etiler çiçek", "bebek çiçek siparişi"],
    content: `Beşiktaş, İstanbul'un en prestijli ve dinamik ilçelerinden biridir. Boğaz kıyısındaki eşsiz konumu, lüks yaşam alanları ve canlı ticaret merkezleriyle dikkat çeker. Levent'in gökdelenleri, Etiler'in şık villaları, Bebek'in romantik sahili ve Ortaköy'ün tarihi dokusu Beşiktaş'ı benzersiz kılar.

Vadiler Çiçek olarak Beşiktaş'ın her noktasına premium kalitede çiçekler ulaştırıyoruz. İş dünyasının kalbi Levent'e kurumsal aranjmanlar, Etiler ve Ulus'a şık tasarım buketler, Bebek ve Arnavutköy'e romantik çiçekler gönderiyoruz.

Beşiktaş'ta Kurumsal Çiçek Hizmetleri

Levent ve Maslak'taki iş merkezlerine düzenli çiçek servisi sunuyoruz. Toplantı odası aranjmanları, resepsiyon çiçekleri ve VIP karşılama buketleri için özel kurumsal çözümlerimiz mevcuttur.

Premium Teslimat Deneyimi

Beşiktaş bölgesinde premium paketleme ve özel teslimat seçeneği sunuyoruz. Şık sunum kutuları ve zarif ambalajlarla çiçekleriniz ekstra özel görünür.`,
    deliveryInfo: "Beşiktaş ve tüm mahallelerine hızlı ve özenli teslimat. Premium teslimat seçeneği mevcut.",
    popularAreas: ["Levent", "Etiler", "Bebek", "Ortaköy", "Arnavutköy", "Ulus", "Akatlar"]
  },
  {
    slug: "sisli",
    name: "Şişli",
    title: "Şişli Çiçek Siparişi",
    description: "Şişli'ye online çiçek siparişi. Nişantaşı, Mecidiyeköy ve tüm Şişli'ye hızlı ve özenli teslimat.",
    metaTitle: "Şişli Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Şişli'ye çiçek gönderin! Nişantaşı, Mecidiyeköy, Fulya ve tüm Şişli'ye hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["şişli çiçek", "şişli çiçekçi", "nişantaşı çiçek", "mecidiyeköy çiçek", "şişli çiçek siparişi"],
    content: `Şişli, İstanbul'un en merkezi ve kozmopolit ilçelerinden biridir. Nişantaşı'nın lüks butikleri, Mecidiyeköy'ün iş merkezleri ve Osmanbey'in canlı alışveriş sokakları ile şehrin nabzının attığı bir bölgedir.

Vadiler Çiçek olarak Şişli'nin dinamik yapısına uygun hızlı ve kaliteli çiçek teslimatı sağlıyoruz. Nişantaşı'ndaki şık mağazalara premium aranjmanlar, Mecidiyeköy'deki iş kulelerine kurumsal çiçekler, Fulya ve Esentepe'deki konutlara ev aranjmanları ulaştırıyoruz.

Nişantaşı Özel Koleksiyonu

Nişantaşı'nın sofistike tarzına uygun özel tasarım buketler hazırlıyoruz. İthal çiçekler, lüks vazolar ve premium ambalajlarla şık bir sunum garantisi veriyoruz.

Merkezi Konum Avantajı

Şişli'nin merkezi konumu sayesinde İstanbul'un her noktasından gelen siparişleri hızlıca bu bölgeye ulaştırabiliyoruz. Ekspres teslimat seçeneğiyle acil siparişleriniz 1.5 saat içinde teslim edilir.`,
    deliveryInfo: "Şişli ve tüm mahallelerine hızlı ve özenli teslimat. Öncelikli teslimat seçenekleri mevcut.",
    popularAreas: ["Nişantaşı", "Mecidiyeköy", "Fulya", "Esentepe", "Osmanbey", "Bomonti"]
  },
  {
    slug: "atasehir",
    name: "Ataşehir",
    title: "Ataşehir Çiçek Siparişi",
    description: "Ataşehir'e online çiçek siparişi. Finans Merkezi, Batı Ataşehir ve tüm Ataşehir'e hızlı ve özenli teslimat.",
    metaTitle: "Ataşehir Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Ataşehir'e çiçek gönderin! Finans Merkezi, Batı Ataşehir ve tüm Ataşehir'e hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["ataşehir çiçek", "ataşehir çiçekçi", "finans merkezi çiçek", "batı ataşehir çiçek"],
    content: `Ataşehir, İstanbul'un en hızlı gelişen ve modern ilçelerinden biridir. İstanbul Finans Merkezi, modern konut projeleri ve yeşil alanlarıyla dikkat çeken Ataşehir, genç profesyonellerin ve ailelerin tercih ettiği bir yaşam alanıdır.

Vadiler Çiçek olarak Ataşehir'in modern yapısına uygun çağdaş tasarımlarla hizmet veriyoruz. Finans Merkezi'ndeki ofislere kurumsal aranjmanlar, Batı Ataşehir'deki rezidanslara şık ev çiçekleri, Barbaros ve İçerenköy'deki konutlara sıcak buketler ulaştırıyoruz.

Finans Merkezi Kurumsal Servisi

İstanbul Finans Merkezi'ndeki şirketlere özel kurumsal çiçek programları sunuyoruz. Haftalık ofis çiçekleri, toplantı aranjmanları ve özel gün çiçekleri için anlaşmalı hizmetlerimiz mevcuttur.

Yeni Nesil Teslimat

Ataşehir'in modern altyapısına uygun dijital teslimat takibi sunuyoruz. Siparişinizin durumunu anlık olarak takip edebilir, teslimat fotoğrafını anında alabilirsiniz.`,
    deliveryInfo: "Ataşehir ve tüm mahallelerine hızlı ve özenli teslimat. Dijital teslimat takibi mevcut.",
    popularAreas: ["Finans Merkezi", "Batı Ataşehir", "Barbaros", "İçerenköy", "Küçükbakkalköy"]
  },
  {
    slug: "bakirkoy",
    name: "Bakırköy",
    title: "Bakırköy Çiçek Siparişi",
    description: "Bakırköy'e online çiçek siparişi. Ataköy, Yeşilköy ve tüm Bakırköy'e hızlı ve özenli teslimat.",
    metaTitle: "Bakırköy Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Bakırköy'e çiçek gönderin! Ataköy, Yeşilköy, Florya ve tüm Bakırköy'e hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["bakırköy çiçek", "bakırköy çiçekçi", "ataköy çiçek", "yeşilköy çiçek", "florya çiçek"],
    content: `Bakırköy, İstanbul'un Avrupa yakasının en köklü ve sevilen ilçelerinden biridir. Sahil şeridi, alışveriş merkezleri, hastaneleri ve yeşil alanlarıyla yaşam kalitesi yüksek bir bölgedir. Ataköy'ün modern yaşam alanları, Yeşilköy ve Florya'nın sakin atmosferi Bakırköy'ü özel kılar.

Vadiler Çiçek olarak Bakırköy'ün her köşesine kaliteli çiçekler ulaştırıyoruz. Ataköy Marina'daki etkinliklere özel aranjmanlar, Yeşilköy'deki villalara zarif buketler, Florya'daki restoranlara masa çiçekleri gönderiyoruz.

Bakırköy Hastane Teslimatı

Bakırköy'deki büyük hastanelere özel geçmiş olsun çiçekleri servisi sunuyoruz. Hastane kurallarına uygun, ferah ve pozitif enerji veren aranjmanlarla sevdiklerinize şifa dileklerinizi iletin.

Sahil Romantizmi

Ataköy sahili ve Florya plajı gibi romantik mekanlara özel sürpriz teslimat hizmetimiz mevcuttur. Sahilde evlilik teklifi veya özel kutlamalar için çiçek organizasyonu yapıyoruz.`,
    deliveryInfo: "Bakırköy ve tüm mahallelerine hızlı ve özenli teslimat. Hastane teslimatı mevcut.",
    popularAreas: ["Ataköy", "Yeşilköy", "Florya", "Zeytinlik", "Osmaniye", "Kartaltepe"]
  },
  {
    slug: "uskudar",
    name: "Üsküdar",
    title: "Üsküdar Çiçek Siparişi",
    description: "Üsküdar'a online çiçek siparişi. Çengelköy, Kuzguncuk ve tüm Üsküdar'a hızlı ve özenli teslimat.",
    metaTitle: "Üsküdar Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Üsküdar'a çiçek gönderin! Çengelköy, Kuzguncuk, Beylerbeyi ve tüm Üsküdar'a hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["üsküdar çiçek", "üsküdar çiçekçi", "çengelköy çiçek", "kuzguncuk çiçek"],
    content: `Üsküdar, İstanbul'un tarihi ve kültürel zenginliklerle dolu ilçelerinden biridir. Boğaz kıyısındaki yalıları, tarihi camileri, Kız Kulesi manzarası ve nostaljik sokakları ile şehrin en romantik bölgelerinden birini oluşturur.

Vadiler Çiçek olarak Üsküdar'ın tarihi dokusuna saygılı, zarif ve şık çiçekler sunuyoruz. Çengelköy ve Kuzguncuk'un nostaljik sokaklarına vintage tarzı buketler, Beylerbeyi ve Kandilli'deki yalılara görkemli aranjmanlar, Altunizade'nin modern binalarına çağdaş tasarımlar ulaştırıyoruz.

Boğaz Manzaralı Sürprizler

Üsküdar'ın Boğaz kıyısındaki restoranlar ve kafeler için özel sürpriz teslimat hizmetimiz var. Sevgilinize veya ailenize Kız Kulesi manzarası eşliğinde unutulmaz bir çiçek sürprizi yapabilirsiniz.

Tarihi Mekanlar İçin Özel Servis

Üsküdar'daki nikah salonları, tarihi mekanlar ve düğün alanları için özel çiçek organizasyonu hizmeti sunuyoruz.`,
    deliveryInfo: "Üsküdar ve tüm mahallelerine hızlı ve özenli teslimat. Sürpriz teslimat hizmeti mevcut.",
    popularAreas: ["Çengelköy", "Kuzguncuk", "Beylerbeyi", "Kandilli", "Altunizade", "Acıbadem"]
  },
  {
    slug: "maltepe",
    name: "Maltepe",
    title: "Maltepe Çiçek Siparişi",
    description: "Maltepe'ye online çiçek siparişi. Sahil, Cevizli ve tüm Maltepe'ye hızlı ve özenli teslimat.",
    metaTitle: "Maltepe Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Maltepe'ye çiçek gönderin! Sahil, Cevizli, Küçükyalı ve tüm Maltepe'ye hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["maltepe çiçek", "maltepe çiçekçi", "maltepe sahil çiçek", "cevizli çiçek"],
    content: `Maltepe, İstanbul Anadolu yakasının sahil ilçelerinden biri olarak hem deniz hem de yeşil alanlarıyla öne çıkar. Maltepe Sahili, parkları ve gelişen konut projeleriyle aileler için ideal bir yaşam alanı sunar.

Vadiler Çiçek olarak Maltepe'nin ferah atmosferine uygun taze ve canlı çiçekler ulaştırıyoruz. Sahil bölgesindeki kafelere dekoratif aranjmanlar, Cevizli ve Küçükyalı'daki konutlara ev çiçekleri, Dragos'taki villalara premium buketler gönderiyoruz.

Maltepe Sahil Teslimatı

Maltepe Sahili'ndeki piknik alanları ve açık hava etkinlikleri için özel çiçek teslimat hizmetimiz mevcuttur. Sahilde romantik bir sürpriz planlayanlar için koordineli teslimat sağlıyoruz.

Aile Dostu Çiçekler

Maltepe'nin aile odaklı yapısına uygun, çocuklu ailelere özel sevimli aranjmanlar ve ayıcıklı buketler sunuyoruz.`,
    deliveryInfo: "Maltepe ve tüm mahallelerine hızlı ve özenli teslimat. Sahil teslimatı mevcut.",
    popularAreas: ["Maltepe Sahil", "Cevizli", "Küçükyalı", "Dragos", "Başıbüyük"]
  },
  {
    slug: "fatih",
    name: "Fatih",
    title: "Fatih Çiçek Siparişi",
    description: "Fatih'e online çiçek siparişi. Sultanahmet, Aksaray ve tüm Fatih'e hızlı ve özenli teslimat.",
    metaTitle: "Fatih Çiçek Siparişi | Hızlı Teslimat | Vadiler Çiçek",
    metaDescription: "Fatih'e çiçek gönderin! Sultanahmet, Aksaray, Laleli ve tüm Fatih'e hızlı ve özenli teslimat. Vadiler Çiçek",
    keywords: ["fatih çiçek", "fatih çiçekçi", "sultanahmet çiçek", "aksaray çiçek", "laleli çiçek"],
    content: `Fatih, İstanbul'un tarihi yarımadasında yer alan ve şehrin en köklü ilçesidir. Sultanahmet Camii, Ayasofya, Kapalıçarşı ve Topkapı Sarayı gibi dünya miraslarına ev sahipliği yapan Fatih, her yıl milyonlarca turisti ağırlar.

Vadiler Çiçek olarak Fatih'in tarihi dokusuna uygun özenli çiçek teslimatı sağlıyoruz. Sultanahmet'teki otellere karşılama çiçekleri, Laleli ve Aksaray'daki iş yerlerine açılış aranjmanları, Çarşamba ve Balat'ın renkli sokaklarına neşeli buketler ulaştırıyoruz.

Tarihi Yarımada Özel Servisi

Fatih'in dar sokakları ve tarihi yapıları için özel teslimat ekibimiz mevcuttur. Sultanahmet ve Eminönü bölgesine yaya teslimat seçeneği sunuyoruz.

Otel ve Turist Servisi

Fatih'teki oteller için özel anlaşmalarımız mevcuttur. Misafirlerinize hoş geldin çiçekleri ve özel gün sürprizleri için otel resepsiyonuna teslimat yapıyoruz.`,
    deliveryInfo: "Fatih ve tüm mahallelerine hızlı ve özenli teslimat. Tarihi bölgelere yaya teslimat mevcut.",
    popularAreas: ["Sultanahmet", "Aksaray", "Laleli", "Eminönü", "Balat", "Çarşamba", "Vefa"]
  },
];

// Slug'dan ilçe içeriği getir
export function getDistrictContentBySlug(slug: string): CityContent | undefined {
  if (slug === 'istanbul') return ISTANBUL_CONTENT;
  return DISTRICT_CONTENTS.find(d => d.slug === slug);
}

// Tüm ilçe slug'larını getir
export function getAllDistrictSlugs(): string[] {
  return ['istanbul', ...DISTRICT_CONTENTS.map(d => d.slug)];
}

// Slug'u Türkçe karakterlerden arındır
export function createCitySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default {
  ISTANBUL_CONTENT,
  DISTRICT_CONTENTS,
  getDistrictContentBySlug,
  getAllDistrictSlugs,
  createCitySlug,
};
