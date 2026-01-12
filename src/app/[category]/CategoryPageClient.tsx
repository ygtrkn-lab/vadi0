'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Grid3X3, 
  LayoutGrid, 
  SlidersHorizontal,
  ChevronDown,
  X,
  Filter as FilterIcon
} from 'lucide-react';
import { Header, Footer, MobileNavBar, ProductCard } from '@/components';
import type { Product } from '@/data/products';

interface CategoryPageClientProps {
  category: string;
  categoryName: string;
  products: Product[];
  totalProducts: number;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating' | 'discount';
type ViewMode = 'grid' | 'list';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Varsayılan Sıralama' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'name-asc', label: 'İsim: A-Z' },
  { value: 'name-desc', label: 'İsim: Z-A' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'discount', label: 'En Yüksek İndirim' },
];

const ITEMS_PER_PAGE = 24;

export default function CategoryPageClient({ 
  category, 
  categoryName, 
  products, 
  totalProducts 
}: CategoryPageClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    if (products.length === 0) return [0, 0];
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const hasProducts = products.length > 0;

  // Fiyat aralığını hesapla
  const priceStats = useMemo(() => {
    if (products.length === 0) {
      return { min: 0, max: 0 };
    }
    const prices = products.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  // Keep price range in sync with category changes (and new data)
  useEffect(() => {
    setPriceRange([priceStats.min, priceStats.max]);
    setSelectedTags([]);
    setSortBy('default');
    setCurrentPage(1);
  }, [category, priceStats.min, priceStats.max]);

  // Tüm benzersiz tag'leri topla
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [products]);

  // Ürünleri filtrele ve sırala
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Fiyat filtreleme
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Tag filtreleme
    if (selectedTags.length > 0) {
      result = result.filter(p => 
        p.tags?.some(t => selectedTags.includes(t))
      );
    }

    // Sıralama
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'tr'));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
    }

    return result;
  }, [products, sortBy, priceRange, selectedTags]);

  // Sayfalama
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setPriceRange([priceStats.min, priceStats.max]);
    setSelectedTags([]);
    setSortBy('default');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedTags.length > 0 ||
    priceRange[0] !== priceStats.min ||
    priceRange[1] !== priceStats.max;

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 pt-32 lg:pt-44 pb-20">
        {/* Breadcrumb */}
        <div className="container-custom mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-500 transition-colors">
              Ana Sayfa
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">
              {categoryName}
            </span>
          </nav>
        </div>

        {/* Category Header */}
        <div className="container-custom mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {categoryName}
            </h1>
            <p className="text-gray-600">
              {hasProducts
                ? `${filteredAndSortedProducts.length} ürün bulundu${hasActiveFilters ? ` (toplam ${totalProducts} ürün)` : ''}`
                : 'Bu kategoride henüz ürün yok.'}
            </p>
          </motion.div>
        </div>

        {/* Filters & Sort Bar */}
        <div className="container-custom mb-6">
          <div className="bg-white rounded-2xl shadow-soft p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Side - Filters */}
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl 
                    hover:bg-gray-200 transition-colors"
                >
                  <FilterIcon size={18} />
                  <span className="text-sm font-medium">Filtrele</span>
                  {hasActiveFilters && (
                    <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full 
                      flex items-center justify-center">
                      {selectedTags.length + (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* Desktop Filters */}
                <div className="hidden lg:flex items-center gap-3">
                  {/* Price Range */}
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl 
                        hover:bg-gray-200 transition-colors"
                    >
                      <SlidersHorizontal size={18} />
                      <span className="text-sm font-medium">Filtreler</span>
                      {hasActiveFilters && (
                        <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full 
                          flex items-center justify-center">
                          !
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Active Filter Tags */}
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2">
                      {selectedTags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 
                            text-primary-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                            className="hover:text-primary-900"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Temizle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Sort & View */}
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <div className="relative flex-1 lg:flex-none">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full lg:w-auto flex items-center justify-between gap-2 px-4 py-2 
                      bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-sm font-medium truncate">
                      {sortOptions.find(o => o.value === sortBy)?.label}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isSortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-full lg:w-64 bg-white rounded-xl 
                          shadow-lg border border-gray-100 z-50 overflow-hidden"
                      >
                        {sortOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setIsSortOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 
                              transition-colors ${sortBy === option.value ? 'bg-primary-50 text-primary-600' : ''}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-primary-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-primary-500' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container-custom">
          <div className={`grid gap-4 lg:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1 sm:grid-cols-2'
          }`}>
            {paginatedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {paginatedProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 text-lg mb-4">
                {hasActiveFilters && hasProducts
                  ? 'Filtrelere uygun ürün bulunamadı.'
                  : 'Bu kategoride henüz ürün yok.'}
              </p>
              {hasActiveFilters && hasProducts && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-primary-500 text-white rounded-xl 
                    hover:bg-primary-600 transition-colors font-medium"
                >
                  Filtreleri Temizle
                </button>
              )}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 
                  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Önceki
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 
                  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filter Sidebar */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-50 
                  overflow-y-auto lg:hidden"
              >
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 
                  flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filtreler</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 space-y-6">
                  {/* Price Range */}
                  <div>
                    <h4 className="font-medium mb-3">Fiyat Aralığı</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                        placeholder="Min"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Etiketler</h4>
                      <div className="flex flex-wrap gap-2">
                        {allTags.slice(0, 20).map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(tag) 
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              );
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              selectedTags.includes(tag)
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply Filters Button */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium
                      hover:bg-primary-600 transition-colors"
                  >
                    {filteredAndSortedProducts.length} Ürünü Göster
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Filter Panel (Expandable) */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="hidden lg:block container-custom mb-6"
            >
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <div className="flex items-start gap-8">
                  {/* Price Range */}
                  <div className="flex-1">
                    <h4 className="font-medium mb-3">Fiyat Aralığı</h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => {
                          setPriceRange([Number(e.target.value), priceRange[1]]);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                        placeholder="Min"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => {
                          setPriceRange([priceRange[0], Number(e.target.value)]);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                        placeholder="Max"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">TL</span>
                    </div>
                    {hasProducts ? (
                      <p className="text-xs text-gray-500 mt-2">
                        Aralık: {priceStats.min.toLocaleString('tr-TR')} - {priceStats.max.toLocaleString('tr-TR')} TL
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">Bu kategoride fiyat bilgisi yok.</p>
                    )}
                  </div>

                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div className="flex-[2]">
                      <h4 className="font-medium mb-3">Etiketler</h4>
                      <div className="flex flex-wrap gap-2">
                        {allTags.slice(0, 30).map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(tag) 
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              );
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              selectedTags.includes(tag)
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Visible SEO Content */}
      <section className="container-custom py-6">
        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {categoryName} - İstanbul Çiçek Siparişi
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {categoryName} kategorisinde İstanbul içi online çiçek siparişi verin. Taze çiçekler, güvenli ödeme ve aynı gün teslimat ile
            sevdiklerinize hızlıca ulaştırıyoruz.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Bu sayfada {categoryName.toLowerCase()} ürünlerini fiyata, isme, puana ve etikete göre sıralayabilir; bütçenize uygun seçenekleri
            kolayca filtreleyebilirsiniz.
          </p>
        </div>
      </section>

      <Footer />
      <MobileNavBar />
      
      {/* Hidden SEO Content for Category Pages */}
      <div className="sr-only" aria-hidden="false">
        <h2>{categoryName} - İstanbul Çiçek Siparişi</h2>
        <p>
          {categoryName} kategorisinde İstanbul çiçek siparişi verin. {categoryName} için güvenilir online çiçek siparişi.
          İstanbul içi {categoryName.toLowerCase()} siparişi, aynı gün teslimat ile kapınızda.
        </p>
        <p>
          İstanbul gül siparişi, 7'li gül buketi, 15'li gül buketi, 21'li gül buketi, 30'lu gül buketi.
          Kırmızı gül, beyaz gül, pembe gül, sarı gül buketi siparişi.
          Orkide, lilyum, papatya, gerbera, ayçiçeği, aranjman çiçekler.
          Kutuda çiçek, sepette çiçek, buket çiçek siparişi İstanbul.
        </p>
        <p>
          Doğum günü çiçekleri, sevgililer günü çiçekleri, anneler günü çiçekleri, yıldönümü çiçekleri.
          Aynı gün çiçek teslimatı İstanbul, ücretsiz kargo, hızlı teslimat.
          Kadıköy, Beşiktaş, Şişli, Bakırköy, Üsküdar, Ataşehir, Maltepe, Kartal, Pendik çiçek siparişi.
          Avrupa yakası çiçekçi, Anadolu yakası çiçekçi, İstanbul online çiçekçi.
        </p>
      </div>
    </>
  );
}
