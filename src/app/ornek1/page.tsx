import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Örnek 1 • Slide-In Search',
};

export default function Ornek1Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-300/80">Örnek 01</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Slide-In Drawer Arama</h1>
          <p className="mt-3 text-lg text-neutral-300 max-w-3xl">
            Spotify / Instagram yaklaşımı: arama paneli sayfayı terk etmeden sağdan içeri kayıyor. Sayfa ile aynı ruhu koruyup
            kullanıcıyı bağlamdan koparmadan sonuçlara yönlendiriyor.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6 text-sm text-neutral-300">
            <div className="rounded-3xl bg-neutral-900/70 p-6 border border-white/5">
              <h2 className="text-lg font-semibold mb-2 text-white">Başlıca Noktalar</h2>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary-400">•</span>
                  <span>Hamburger butonuna basınca panel yarım genişlikte açılıyor (mobilde tam genişlik).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">•</span>
                  <span>Sayfa arkada hafif kararıyor; içerik görünür kalıyor.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">•</span>
                  <span>Üstte arama çubuğu, altında son aramalar / popüler tagler / koleksiyon kartları.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-400">•</span>
                  <span>Panel dışına tıklayınca kapanıyor, kayma animasyonu 280ms spring.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-primary-500/10 border border-primary-500/30 p-6">
              <h3 className="text-base font-semibold text-primary-200">Kullanım Senaryosu</h3>
              <p className="mt-3 text-neutral-200">
                Ürün listelerindeyken kullanıcı arama yapmak isterse sayfayı terk etmeden hızlıca filtreleyebilir. Özellikle koleksiyonları
                ve kampanyaları öne çıkarmak için ideal.
              </p>
            </div>
          </div>

          <div className="relative h-[520px]">
            <div className="absolute inset-0 rounded-[34px] bg-gradient-to-br from-neutral-800 via-neutral-900 to-black shadow-[0_40px_80px_rgba(0,0,0,0.5)] p-6">
              <div className="flex h-full">
                <div className="relative flex-1 rounded-3xl bg-gradient-to-br from-primary-500/20 to-transparent border border-white/10 p-6 flex flex-col">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="uppercase tracking-[0.2em]">Sayfa</span>
                    <span>11:48</span>
                  </div>
                  <div className="mt-6 flex-1 rounded-2xl border border-dashed border-white/10" />
                  <p className="mt-4 text-sm text-neutral-500">Sayfa görünür kalır</p>
                </div>
                <div className="relative w-64 -mr-8 -mt-4">
                  <div className="absolute inset-0 rounded-3xl bg-white text-neutral-900 shadow-2xl p-5">
                    <div className="text-xs font-semibold tracking-[0.2em] text-neutral-400">Search Drawer</div>
                    <div className="mt-4 rounded-2xl bg-neutral-100 p-3 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center">🔍</span>
                      <div>
                        <p className="text-sm font-medium">Çiçek ara</p>
                        <p className="text-xs text-neutral-500">"Sevgiliye" yaz...</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {['Son Aramalar', 'Popüler Tagler', 'Özel Koleksiyonlar'].map(section => (
                        <div key={section} className="rounded-2xl border border-neutral-200 p-3">
                          <p className="text-xs font-semibold text-neutral-500 uppercase">{section}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {['Güller', 'Doğum günü', 'Premium'].map(item => (
                              <span key={item} className="text-xs px-3 py-1 rounded-full bg-neutral-100 font-medium text-neutral-700">{item}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 w-full rounded-2xl bg-neutral-900 text-white py-3 text-sm font-semibold">
                      Paneli Kapat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
