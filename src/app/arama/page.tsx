import { Footer, Header, MobileNavBar } from '@/components';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Props = { searchParams?: { search?: string } };

export default async function AramaPage({ searchParams }: Props) {
  const q = (searchParams?.search || '').toString();

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const [productsRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/api/products?search=${encodeURIComponent(q)}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/categories?all=true`, { cache: 'no-store' }),
  ]);

  const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
  const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };

  const products = productsData.products || productsData.data || [];
  const categories = (categoriesData.categories || categoriesData.data || []).filter((c: any) => {
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q.toLowerCase());
  });

  const hasResults = products.length > 0 || categories.length > 0;
  const featuredCategories = categories.slice(0, 8);
  const compactProducts = products.slice(0, 30);

  const formatPrice = (price?: number) => {
    if (typeof price !== 'number') return '—';
    return `₺${price.toLocaleString('tr-TR')}`;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900 overflow-hidden pt-[140px] md:pt-[180px]">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#e05a4c]/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-slate-200 blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 container-custom py-10 lg:py-16">
        <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
          <section className="relative overflow-hidden rounded-3xl bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] border border-slate-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(224,90,76,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_35%)]" aria-hidden />
            <div className="relative p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] shadow-md">
                    Tüm sonuçları göster
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">{q ? `"${q}" için arama sonuçları` : 'Tüm ürün ve kategoriler'}</h1>
                  <p className="text-sm text-slate-600 max-w-2xl">Arama sonuçlarını hızlıca inceleyin ve ilgili ürün ya da kategorilere hemen ulaşın.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
                  <div className="text-xs text-slate-500">Toplam</div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                      <span className="text-xl font-semibold text-slate-900">{products.length}</span>
                      <span className="text-xs text-slate-500">Ürün</span>
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <div className="flex flex-col text-right">
                      <span className="text-xl font-semibold text-slate-900">{categories.length}</span>
                      <span className="text-xs text-slate-500">Kategori</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-wrap gap-2">
                  {q ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">Aranan kelime: {q}</span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">Şu anda filtre yok</span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">Kapsam: Tüm sonuçlar</span>
                  <Link href="/haftanin-kampanyalari" className="inline-flex items-center gap-2 rounded-full bg-[#e05a4c] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#e05a4c]/30 hover:translate-y-[-1px] transition-transform">Haftanın kampanyaları</Link>
                </div>
                <form action="/arama" className="md:justify-self-end w-full md:w-auto">
                  <label className="sr-only" htmlFor="search">Arama</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#e05a4c]/30">
                    <input id="search" name="search" defaultValue={q} placeholder="Aramayı daralt" className="w-full text-sm bg-transparent focus:outline-none" />
                    <button type="submit" className="rounded-xl bg-[#e05a4c] px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5">Ara</button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {hasResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6 lg:gap-8">
              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Kategoriler</h3>
                    <span className="text-xs text-slate-500">{categories.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {featuredCategories.map((cat: any) => (
                      <Link key={cat.slug} href={`/${cat.slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[13px]">{cat.image ? <Image src={cat.image} alt={cat.name} width={20} height={20} className="rounded-full object-cover" /> : '🌸'}</span>
                        <span className="truncate max-w-[120px]">{cat.name}</span>
                        <span className="text-[11px] text-slate-500">{cat.productCount || cat.product_count || 0}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Hızlı özet</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-slate-500">Ürün</p>
                      <p className="text-xl font-semibold text-slate-900">{products.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-slate-500">Kategori</p>
                      <p className="text-xl font-semibold text-slate-900">{categories.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-slate-500">Liste düzeni</p>
                      <p className="text-sm font-semibold text-slate-900">Kompakt</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-slate-500">Tema</p>
                      <p className="text-sm font-semibold text-slate-900">Modern</p>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Ürünler ({compactProducts.length})</h3>
                  <span className="text-xs text-slate-500">Kompakt kartlar</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {compactProducts.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/${p.category}/${p.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(224,90,76,0.18)]"
                    >
                      <div className="flex gap-3 p-4">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} fill sizes="80px" className="object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-lg">🌸</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-[#e05a4c]">{p.name}</h4>
                            <span className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2 py-1 whitespace-nowrap">{p.categoryName || p.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-[#e05a4c]">{formatPrice(p.price)}</span>
                            {p.oldPrice || p.old_price ? (
                              <span className="text-xs text-slate-400 line-through">{formatPrice(p.oldPrice || p.old_price)}</span>
                            ) : null}
                          </div>
                          {p.tags?.length ? (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {p.tags.slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-[11px] rounded-full bg-slate-100 px-2 py-1 text-slate-600">{tag}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🔍</div>
              <h3 className="text-xl font-semibold text-slate-900">Sonuç bulunamadı</h3>
              <p className="mt-2 text-sm text-slate-600">Farklı bir anahtar kelime deneyin veya kategorilere göz atın.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/" className="rounded-full bg-[#e05a4c] px-4 py-2 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 transition">Ana sayfa</Link>
                <Link href="/kategoriler" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 transition">Tüm kategoriler</Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </div>
  );
}
