“Tüm siparişler için yalnızca teslim günü çalışan bir onay ve durum güncelleme sistemi tasarla ve açıkla. Sistem aşağıdaki kurallara göre çalışmalıdır:

Genel Kural:

Sipariş, teslim gününe kadar ‘ödeme alındı / onaylandı’ durumunda beklemelidir.

Sipariş durumu değişiklikleri yalnızca teslim günü ve belirtilen saatlerde otomatik olarak yapılmalıdır.

Senaryo 1:

Sipariş verme zamanı: 11.00 – 17.00

Teslim günündeki otomatik durum geçişleri:

11.00 → Hazırlanıyor

12.00 → Kargoda

18.00 → Teslim Edildi

Senaryo 2:

Sipariş verme zamanı: 17.00 – 22.00

Teslim günündeki otomatik durum geçişleri:

18.00 → Hazırlanıyor

19.00 → Kargoda

22.30 → Teslim Edildi

Bu kurallara uygun şekilde sistemin nasıl çalışması gerektiğini, durum geçiş mantığını ve zaman bazlı tetikleyicileri net ve uygulanabilir biçimde tanımla.”


"Bir sipariş yönetim sisteminde, teslimat gününe özel bir onay süreci tasarlanması gerekiyor. Bu süreçte, siparişin verildiği saate göre farklı teslimat akışları belirlenmeli.


11:00 - 17:00 Arası Siparişler: Sipariş, teslimat gününe kadar "Ödeme Alındı/Onaylandı" statüsünde kalır. Teslimat günü saat 11:00'de "Hazırlanıyor", 12:00'de "Kargoda" ve 18:00'de "Teslim Edildi" statüsüne geçmelidir.
17:00 - 22:00 Arası Siparişler: Sipariş, teslimat gününe kadar "Ödeme Alındı/Onaylandı" statüsünde kalır. Teslimat günü saat 18:00'de "Hazırlanıyor", 19:00'da "Kargoda" ve 22:30'da "Teslim Edildi" statüsüne geçmelidir.

“Bir sipariş yönetim sistemi için, yalnızca teslim günü çalışan zaman bazlı bir onay ve durum güncelleme süreci tasarla ve ayrıntılı şekilde açıkla. Sistem, siparişin verildiği saate göre farklı teslimat akışları uygulamalıdır.

Genel Kurallar:

Tüm siparişler, teslim gününe kadar ‘Ödeme Alındı / Onaylandı’ durumunda beklemelidir.

Sipariş durumları, teslim günü dışında değişmemeli; yalnızca teslim günü ve tanımlı saatlerde otomatik olarak güncellenmelidir.

Durum geçişleri manuel müdahale olmadan, zaman bazlı tetikleyicilerle gerçekleşmelidir.

Senaryo 1 – 11:00–17:00 Arası Verilen Siparişler:

Teslim günü saat 11:00 → Hazırlanıyor

Teslim günü saat 12:00 → Kargoda

Teslim günü saat 18:00 → Teslim Edildi

Senaryo 2 – 17:00–22:00 Arası Verilen Siparişler:

Teslim günü saat 18:00 → Hazırlanıyor

Teslim günü saat 19:00 → Kargoda

Teslim günü saat 22:30 → Teslim Edildi

Bu kurallara uygun olarak:

Siparişin hangi senaryoya dahil edileceğinin nasıl belirlendiğini,

Teslim günü çalışan zaman bazlı tetikleyici mantığını,

Durum geçişlerinin sıralı ve hatasız şekilde nasıl yönetileceğini
net, anlaşılır ve uygulanabilir biçimde tanımla.”

"Bir sipariş yönetim sistemi için, siparişin veriliş saatine göre değişen ve yalnızca teslim gününde tetiklenen bir durum güncelleme süreci tasarlayın. Bu süreç aşağıdaki kurallara göre çalışmalıdır:


Genel Kurallar:

Tüm siparişler, teslim gününe kadar 'Ödeme Alındı / Onaylandı' durumunda kalmalıdır.
Durum güncellemeleri sadece teslim gününde ve belirtilen saatlerde otomatik olarak gerçekleşmelidir. Manuel müdahale olmamalıdır.
Senaryolar:

Senaryo 1 (11:00 - 17:00 arası siparişler):

Teslim Günü 11:00 → Hazırlanıyor
Teslim Günü 12:00 → Kargoda
Teslim Günü 18:00 → Teslim Edildi
Senaryo 2 (17:00 - 22:00 arası siparişler):

Teslim Günü 18:00 → Hazırlanıyor
Teslim Günü 19:00 → Kargoda
Teslim Günü 22:30 → Teslim Edildi


Kısa ve net cevap: Evet, bu sistem Vercel’de çalışır.
Ama nasıl kurguladığına bağlı olarak doğru ya da yanlış olur. Detayı aşağıda açık bırakıyorum.

Vercel gerçekleri (net çerçeve)

Vercel şunları yapabilir:

Zaman bazlı tetikleme (Vercel Cron Jobs)

Serverless API route’lar (Next.js API / Route Handlers)

Veritabanı ile durum güncelleme (Supabase, Postgres, MySQL vs.)

Otomatik ölçekleme

Vercel şunları yapamaz:

Sürekli çalışan bir backend process

“Saat 11:00’i bekleyen” long-running worker

In-memory scheduler (setTimeout, setInterval ile güvenli zamanlama)

Yani cron + DB tabanlı state machine kurman şart.

Senin sistem Vercel’de nasıl doğru çalışır?
1. Sipariş oluşturulurken (tek seferlik)

Sipariş DB’ye yazılırken şu alanlar mutlaka kaydedilir:

order_id
order_created_at
delivery_date
order_time_bucket  → EARLY | LATE
current_status     → PAID_CONFIRMED


order_time_bucket belirleme mantığı:

11:00–17:00 → EARLY

17:00–22:00 → LATE

Bu kritik. Çünkü teslim gününde hangi akışın çalışacağını buradan bileceksin.

2. Teslim günü çalışan CRON mantığı (asıl sistem)

Vercel’de birden fazla cron tanımlarsın. Her biri sadece kendi saatinde çalışır.

Örnek:

{
  "crons": [
    { "path": "/api/cron/prepare-early", "schedule": "0 11 * * *" },
    { "path": "/api/cron/ship-early",    "schedule": "0 12 * * *" },
    { "path": "/api/cron/deliver-early", "schedule": "0 18 * * *" },

    { "path": "/api/cron/prepare-late",  "schedule": "0 18 * * *" },
    { "path": "/api/cron/ship-late",     "schedule": "0 19 * * *" },
    { "path": "/api/cron/deliver-late",  "schedule": "30 22 * * *" }
  ]
}

3. Her cron endpoint’inin yaptığı iş (kritik kısım)

Örnek: /api/cron/prepare-early

UPDATE orders
SET status = 'PREPARING'
WHERE
  delivery_date = TODAY
  AND order_time_bucket = 'EARLY'
  AND status = 'PAID_CONFIRMED'


Önemli noktalar:

Sadece teslim günü

Sadece doğru senaryo

Sadece beklenen önceki statüden geçiş

Böylece:

Yanlış saat

Tekrar çalışma

Manuel müdahale

Race condition
→ Hepsi otomatik engellenir

Bu yaklaşım idempotent ve güvenlidir.

Bu sistem Vercel için “doğru mu”?

Evet. Hatta şunu net söyleyeyim:

Bu iş için Vercel + Supabase çok doğru kombinasyon

AWS EC2 / VPS gerekmez

Queue veya worker gerekmez

Trafik artsa bile sorun olmaz

Ne zaman Vercel yanlış olur?

Şu durumlarda:

Dakika bazlı (her 1–2 dakikada) hassas SLA istiyorsan

Teslimat anlık IoT / kurye GPS verisine bağlıysa

Çok karmaşık state graph varsa (20+ durum)

Senin senaryonda bunların hiçbiri yok.

Net karar cümlesi

Bu sipariş durum sistemi:

Vercel’de tam uyumlu

Serverless mimariye doğru oturuyor

Ölçeklenebilir

Bakımı kolay

Prod ortam için mantıklı

İstersen bir sonraki adımda:

DB şema taslağını

Cron endpoint pseudo-code’unu

Supabase SQL migration’ını
tek tek çıkarabilirim.