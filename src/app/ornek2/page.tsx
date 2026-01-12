import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Örnek 2 • Spotlight Workspace',
};

export default function Ornek2Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-100 via-white to-neutral-100">
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary-500">Örnek 02</p>
          <h1 className="mt-4 text-4xl font-bold text-neutral-900">Floating Search Workspace</h1>
          <p className="mt-3 text-lg text-neutral-600 max-w-3xl mx-auto">
            Apple Spotlight + Shopify admin karışımı. Ortada yüzen cam etkili modal, arama deneyimini kontrol merkezi haline getiriyor.
            Masaüstünde iki kolon; mobilde tek kolon.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            {[{
              title: 'Cam Görünümlü Modal',
              desc: '80vh yüksekliğinde, arkaplan blur + beyaz degrade. Kapanması için ESC veya dışarı tıklama.'
            }, {
              title: 'Çift Kolon İçerik',
              desc: 'Sol tarafta filtreler, popular queries, koleksiyonlar. Sağ tarafta ürün kartları ve detay breakdown.'
            }, {
              title: 'Command Palette Vibes',
              desc: '⌘ + K kısayolu ile açılıyor. Kullanıcılar keyboard ile arama, ok tuşları ile gezinme yapabiliyor.'
            }].map(block => (
              <div key={block.title} className="rounded-3xl bg-white shadow-xl shadow-primary-500/5 border border-neutral-100 p-6">
                <h3 className="text-lg font-semibold text-neutral-900">{block.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{block.desc}</p>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative h-[560px] flex items-center justify-center">
              <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(224,90,76,0.25),_transparent_55%)]" />
              <div className="relative w-full max-w-[520px] rounded-[32px] backdrop-blur-2xl border border-white/60 bg-white/80 shadow-[0_30px_60px_rgba(15,23,42,0.15)] overflow-hidden">
                <div className="border-b border-white/60 px-6 py-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Global Search</div>
                    <div className="text-sm text-neutral-500">⌘ + K</div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 text-white">Live</span>
                </div>

                <div className="p-6 grid gap-6 lg:grid-cols-[220px_1fr]">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-2">Filtreler</p>
                      <div className="flex flex-wrap gap-2">
                        {['Ürün', 'Kategori', 'İçerik', 'Blog'].map(item => (
                          <span key={item} className="px-3 py-1.5 rounded-full bg-white text-xs font-medium text-neutral-700 border border-neutral-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-2">Popüler</p>
                      <ul className="space-y-2 text-sm text-neutral-600">
                        {['Güller koleksiyonu', 'Premium buket', 'Hızlı teslimat'].map(text => (
                          <li key={text} className="flex items-center gap-2">
                            <span className="text-primary-500">•</span>
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-neutral-100" />
                        <div>
                          <p className="font-semibold text-neutral-900">Luna Premium Buket</p>
                          <p className="text-sm text-primary-500 font-semibold">₺1.249</p>
                        </div>
                        <button className="ml-auto px-3 py-1.5 text-xs font-semibold text-primary-500 bg-primary-50 rounded-lg">Git</button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] mb-2">Son 5 Arama</p>
                      <ul className="space-y-1 text-sm text-neutral-600">
                        {['Gelin buketi', 'Campagne gül', '3 saat teslimat'].map(item => (
                          <li key={item} className="flex items-center justify-between">
                            <span>{item}</span>
                            <span className="text-xs text-neutral-400">↵</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
