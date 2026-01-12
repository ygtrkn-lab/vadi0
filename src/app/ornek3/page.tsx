import type { Metadata } from 'next';

const quickTags = [
  {
    label: 'Trend',
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14l4-4 5 5 7-7" />
        <path d="M14 4h7v7" />
      </svg>
    ),
  },
  {
    label: '3 saatte',
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <path d="M12 8v4l2.5 1.5" />
      </svg>
    ),
  },
  {
    label: 'Premium',
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4l3.5 5-3.5 11-3.5-11z" />
        <path d="M5 9h14" />
      </svg>
    ),
  },
  {
    label: 'Doğal',
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18c5-6 10-6 14-12" />
        <path d="M9 10c0 4 1 7 3 9" />
      </svg>
    ),
  },
];

export const metadata: Metadata = {
  title: 'Örnek 3 • Full-Height Sheet Search',
};

export default function Ornek3Page() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <section className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary-300">Örnek 03</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Full-Height Bottom Sheet</h1>
          <p className="mt-3 text-lg text-neutral-300 max-w-3xl">
            Native iOS / Shopify mobile tarzı. Alt kenardan sürüklenerek açılan, drag handle ile kontrollü sheet. 60% → 90% → 100%
            yükseklik senaryolarını destekler; sekmeli içerik ile sorunsuz mobil UX sağlar.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4 text-sm text-neutral-200">
            <div className="rounded-3xl bg-neutral-800/70 border border-white/10 p-5">
              <h3 className="text-base font-semibold text-white">Sheet Katmanları</h3>
              <ol className="mt-3 space-y-2 list-decimal list-inside text-neutral-300">
                <li>60%: Önerilen kelimeler + son aramalar</li>
                <li>90%: Sekmeler (Öneriler / Ürünler / Kategoriler)</li>
                <li>100%: Scrollable tam sonuç listesi + filtre barı</li>
              </ol>
            </div>
            <div className="rounded-3xl bg-primary-500/10 border border-primary-500/30 p-5">
              <h3 className="text-base font-semibold text-primary-200">Motion</h3>
              <p className="mt-2 text-neutral-100 text-sm">iOS style cubic-bezier (0.32, 0.72, 0, 1). Drag ile kapama, backdrop fade-out, edge-swipe.</p>
            </div>
          </div>

          <div className="relative">
            <div className="mx-auto w-[320px] rounded-[44px] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-6">
              <div className="h-[620px] rounded-[36px] bg-neutral-950 overflow-hidden flex flex-col">
                <div className="px-5 pt-5 pb-3 space-y-4">
                  <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="6" />
                        <path d="M15.5 15.5L20 20" />
                      </svg>
                    </span>
                    <input
                      readOnly
                      value="Luna buket"
                      className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white/10 text-sm text-white placeholder:text-neutral-400 border border-white/15"
                    />
                  </div>
                  <div className="flex gap-2 text-[11px] text-neutral-400 uppercase tracking-[0.3em]">
                    <span>Öneriler</span>
                    <span className="opacity-50">Ürünler</span>
                    <span className="opacity-50">Kategoriler</span>
                  </div>
                </div>

                <div className="flex-1 bg-neutral-900 rounded-t-[28px] p-5 space-y-4 overflow-hidden">
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">Hızlı Etiketler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickTags.map(tag => (
                        <span key={tag.label} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs border border-white/10 text-white/90">
                          {tag.renderIcon()}
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                    {[1, 2, 3].map(item => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                        <div className="w-14 h-14 rounded-xl bg-white/10" />
                        <div className="flex-1 text-sm">
                          <p className="font-semibold">Aurora Deluxe #{item}</p>
                          <p className="text-primary-300 font-bold">₺1.{item}90</p>
                        </div>
                        <button className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-200 text-xs font-semibold">Sepete</button>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-3 rounded-2xl bg-white text-neutral-950 py-3 font-semibold text-sm">Tam Listeyi Gör</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
