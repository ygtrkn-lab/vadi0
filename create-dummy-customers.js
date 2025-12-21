const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vtwogsixprzgchuypilh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d29nc2l4cHJ6Z2NodXlwaWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM4ODQ2NiwiZXhwIjoyMDgwOTY0NDY2fQ.u0BNDLfCHOtE_DOa6z8IqUtkPc-etCkXxrE04ZDH6jU',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 450+ gerçek Türkçe isimler
const REAL_NAMES = [
  'Ahmet Yılmaz','Mehmet Demir','Ayşe Kaya','Fatma Çelik','Zeynep Şahin',
  'Elif Yıldız','Emre Aydın','Can Özkan','Mert Aksoy','Ece Güneş',
  'Deniz Arslan','Selin Koç','Burak Erdoğan','Berk Yurt','Cem Doğan',
  'Sena Öztürk','Gökhan Polat','Pelin Kılıç','Hakan Şimşek','Buse Avcı',
  'Onur Turan','Derya Korkmaz','Ozan Özer','Gizem Kaplan','Tuna Sezer',
  'Dilara Aktaş','Naz Çakır','Kerem Güler','Ceyda Altun','Yasin Kurt',
  'Berna Ekinci','Sibel Tekin','Nisa Yavuz','Berke Ünal','Kaan Demirci',
  'Efe Özdemir','Öykü Taş','Yaren Acar','Umut Aslan','Sarp Bulut',
  'Merve Koçak','Kübra Şen','Tuğçe Öz','Sude Çiçek','Hale Yüksel',
  'İclal Eren','Selma Erdem','Aslı Bozkurt','Barış Önal','Kuzey Durmaz',
  'Ali Kara','Mustafa Ay','Hüseyin Karaca','Veli Çetin','Yusuf Yaman',
  'İbrahim Er','Ömer Özkan','Ramazan Tan','İsmail Bal','Abdullah Kozan',
  'Süleyman Baş','Hasan Şeker','Recep Aydoğan','Salih Özgür','Bekir Kartal',
  'Mahmut Çetinkaya','Murat Kayhan','Halil Özkul','Kadir Sarı','Fadime Toprak',
  'Hatice Özbek','Emine Yörük','Hanife Taşkın','Şerife Yalçın','Meryem Çam',
  'Sultan Gül','Havva Duman','Hacer Işık','Nuriye Dal','Zeliha Soylu',
  'Semra Uysal','Aysel Çolak','Filiz Akbaş','Gülay Yıldırım','Hülya Keskin',
  'Neriman Tunç','Sevim Bayraktar','Türkan Özen','Yıldız Karaman','Cemil Aslan',
  'Celal Kocaman','Cengiz Uçar','Cemal Işıl','Durmuş Şener','Dursun Kır',
  'Ekrem Özkan','Engin Çağlar','Ercan Mutlu','Erdal Akarsu','Erhan Güven',
  'Erkan Uyar','Ersin Çakıcı','Fikret İnan','Gürsel Dinç','Hayati Parlak',
  'İlhan Bayram','İsmet Soysal','Kemal Küçük','Necati Başaran','Orhan Tok',
  'Osman Korkut','Özcan Ergin','Remzi Özmen','Rıza Sevim','Saim Çevik',
  'Sedat Oral','Şahin Güngör','Şükrü Batur','Tahsin Atalay','Turgut Bayar',
  'Uğur Sert','Vedat Yener','Yakup Sönmez','Yavuz Karabulut','Zeki Peker',
  'Adnan Güzel','Aydın Koçer','Aziz Çalışkan','Bayram Tekir','Beril Kara',
  'Betül Yağmur','Birsen Şimşek','Burcu Bozdoğan','Canan Dinçer','Cansu Ertuğrul',
  'Çiğdem Küçükay','Damla Sezgin','Duygu Parlayan','Ebru Moral','Esra Yıldırım',
  'Fulya Başer','Gamze Eroğlu','Gülşen Özkan','Gülten İpek','Hayriye Çelik',
  'Işık Demirel','İpek Sarıkaya','İrem Candan','Lale Sümer','Melike Güçlü',
  'Meltem Şentürk','Mine Tüzün','Müge Bilgin','Nalan Ayhan','Nesrin Çınar',
  'Nevin Yılmazer','Nilgün Özdemir','Nimet Erkan','Nuray Turhan','Nurcan Değer',
  'Nurhan Sevinç','Özge Erdal','Özlem Çiftçi','Pembe Yurt','Perihan Dağlı',
  'Rabia Gök','Reyhan Sami','Rukiye Çelen','Seher Korkmaz','Serpil Altay',
  'Sevgi Erol','Sevil Gündüz','Songül Uzun','Şenay Temel','Şule Kırımlı',
  'Tülay Berk','Ülkü Çetin','Ümit Karayel','Vesile Özcan','Volkan Savaş',
  'Yaşar Kızıl','Yılmaz Bora','Zülfikar Akman','Abdurrahman Acar','Adil Baysal',
  'Ayla Bostan','Ayten Coşkun','Aynur Özkan','Bahar Eker','Bilal Özkan',
  'Büşra Kaymak','Çağlar Güneş','Dilan Özdemir','Dilek Aygün','Ecem Özkan',
  'Eda Arslan','Edanur Güven','Emrah Şahin','Erdoğan Kılıç','Eren Özkan',
  'Ergün Çelik','Erol Demir','Esma Öztürk','Eylem Güler','Faik Arslan',
  'Faruk Özkan','Fatih Demirci','Fazıl Kurt','Feray Özkan','Ferdi Erdoğan',
  'Ferhat Yıldız','Feyza Doğan','Fikri Aslan','Figen Özkan','Furkan Çelik',
  'Gaye Demir','Gonca Yılmaz','Gözde Aydın','Gözde Sarı','Gönül Taş',
  'Göktürk Özkan','Görkem Demirci','Gül Yılmaz','Gülay Çetin','Gülder Kaya',
  'Gülhan Yücel','Gülizar Tekir','Güllü Aydın','Gülnaz Erdem','Gülsevin Tekin',
  'Gültaç Yılmaz','Gülyüz Karaca','Güner Demir','Güneş Kaya','Günther Özkan',
  'Güray Yıldırım','Gürdal Acar','Gürol Demirci','Gürsel Kılıç','Gürsoy Taş',
  'Güven Yücel','Güvercin Çelik','Güzin Tüzün','Güzide Aydın','Güzin Karaca'
];

(async () => {
  try {
    // Dummy customers oluştur (gerçek isimlerle)
    const dummyCustomers = [];
    for (let i = 0; i < REAL_NAMES.length; i++) {
      dummyCustomers.push({
        id: `dummy_cust_${i}`,
        email: `customer${i}@vadiler.com`,
        name: REAL_NAMES[i],
        phone: `555-0000-${String(i).padStart(4, '0')}`,
        password: 'dummy_password',
        created_at: new Date().toISOString(),
      });
    }
    
    console.log(`📝 ${REAL_NAMES.length} dummy müşteri oluşturuluyor (gerçek isimlerle)...`);
    const { error } = await supabase
      .from('customers')
      .upsert(dummyCustomers, { onConflict: 'id' });
    
    if (error) {
      console.log('❌ Hata:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ ${REAL_NAMES.length} gerçek isimli dummy müşteri oluşturuldu!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  }
})();
