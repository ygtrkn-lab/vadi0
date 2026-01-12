'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, X, ArrowUpRight, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: 'product' | 'category';
  id: string;
  name: string;
  slug: string;
  image: string;
  price?: number;
  originalPrice?: number;
  category?: string;
  productCount?: number;
}

interface SearchBarProps {
  isMobile?: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

// Popüler aramalar - Apple/Google style
const TRENDING_SEARCHES = [
  { text: 'Güller', emoji: '🌹' },
  { text: 'Doğum günü', emoji: '🎂' },
  { text: 'Orkide', emoji: '🌺' },
  { text: 'Sevgiliye', emoji: '💝' },
  { text: 'Papatya', emoji: '🌼' },
  { text: 'Anneler günü', emoji: '💐' },
];

// Son aramalar (localStorage'dan gelecek)
const getRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('vadiler_recent_searches');
    return saved ? JSON.parse(saved).slice(0, 5) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string) => {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, 5);
    localStorage.setItem('vadiler_recent_searches', JSON.stringify(updated));
  } catch {
    // ignore
  }
};

export default function SearchBar({ isMobile = false, onClose, autoFocus = false, onOpenChange }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' })
        ]);
        
        if (!productsRes.ok || !categoriesRes.ok) {
          throw new Error('Veri yüklenemedi');
        }

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        setAllProducts(productsData.products || productsData.data || []);
        setAllCategories(categoriesData.categories || categoriesData.data || []);
      } catch (error) {
        console.error('Error fetching search data:', error);
        setAllProducts([]);
        setAllCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 1) return [];

    const searchTerm = debouncedQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Categories
    allCategories.forEach(category => {
      const productCount = category.productCount || category.product_count || 0;
      if (productCount > 0 && category.name?.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'category',
          id: category.slug,
          name: category.name,
          slug: `/${category.slug}`,
          image: category.image,
          productCount: productCount,
        });
      }
    });

    // Products
    allProducts.forEach(product => {
      const nameMatch = product.name?.toLowerCase().includes(searchTerm);
      const descMatch = product.description?.toLowerCase().includes(searchTerm);
      const categoryMatch = product.category?.toLowerCase().includes(searchTerm);
      const categoryNameMatch = product.categoryName?.toLowerCase().includes(searchTerm);
      const tagsMatch = product.tags?.some((tag: string) => tag?.toLowerCase().includes(searchTerm));

      if (nameMatch || descMatch || categoryMatch || categoryNameMatch || tagsMatch) {
        results.push({
          type: 'product',
          id: String(product.id),
          name: product.name,
          slug: `/${product.category}/${product.slug}`,
          image: product.image,
          price: product.price,
          originalPrice: product.oldPrice || product.old_price,
          category: product.category,
        });
      }
    });

    const categoryResults = results.filter(r => r.type === 'category').slice(0, 3);
    const productResults = results.filter(r => r.type === 'product').slice(0, 6);
    
    return [...categoryResults, ...productResults];
  }, [debouncedQuery, allProducts, allCategories]);

  // Notify parent
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (searchResults.length > 0) setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (searchResults.length > 0) setActiveIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && searchResults[activeIndex]) {
          handleResultClick(searchResults[activeIndex].slug, searchResults[activeIndex].name);
        } else if (query.trim()) {
          handleResultClick(`/arama?search=${encodeURIComponent(query)}`, query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        onClose?.();
        break;
    }
  }, [isOpen, searchResults, activeIndex, query, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleResultClick = (slug: string, searchQuery?: string) => {
    if (searchQuery) saveRecentSearch(searchQuery);
    setIsOpen(false);
    setQuery('');
    onClose?.();
    window.location.href = slug;
  };

  const handleTrendingClick = (text: string) => {
    setQuery(text);
    saveRecentSearch(text);
    window.location.href = `/arama?search=${encodeURIComponent(text)}`;
  };

  const handleRecentClick = (text: string) => {
    setQuery(text);
    window.location.href = `/arama?search=${encodeURIComponent(text)}`;
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('vadiler_recent_searches');
    setRecentSearches([]);
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const hasResults = searchResults.length > 0;
  const showInitialState = !query.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ══════════════════════════════════════════════════════════════════
          SEARCH INPUT - Apple/Google Style
          ══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <motion.div
          initial={false}
          animate={{
            boxShadow: isOpen 
              ? '0 0 0 4px rgba(224, 90, 76, 0.1)' 
              : '0 0 0 0px rgba(224, 90, 76, 0)',
          }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Search Icon - Animated */}
          <motion.div
            initial={false}
            animate={{ 
              scale: query ? 0.9 : 1,
              x: query ? -2 : 0 
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
          >
            <Search size={20} className="text-gray-400" />
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Çiçek, buket veya hediye ara..."
            className={`
              w-full bg-gray-50/80 border-0 rounded-2xl 
              focus:outline-none focus:bg-white
              transition-all duration-300 text-[16px] font-medium
              placeholder:text-gray-400 placeholder:font-normal
              ${isMobile ? 'pl-12 pr-24 py-4' : 'pl-12 pr-24 py-3.5'}
            `}
            style={{ 
              fontSize: '16px',
              WebkitAppearance: 'none',
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          
          {/* Right side buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Clear button - Apple style */}
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleClear}
                  className="p-2 rounded-full bg-gray-200/80 hover:bg-gray-300/80 transition-colors"
                >
                  <X size={14} className="text-gray-600" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Search button - Gradient */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => query && handleResultClick(`/arama?search=${encodeURIComponent(query)}`, query)}
              className="p-2.5 rounded-xl text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #e05a4c 0%, #c94a3c 100%)',
                boxShadow: '0 2px 8px rgba(224, 90, 76, 0.3)',
              }}
            >
              <Search size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RESULTS DROPDOWN - Apple Spotlight / Instagram Style
          ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className={`
              absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl 
              overflow-hidden z-[9999]
              ${isMobile ? 'max-h-[70vh]' : 'max-h-[60vh]'}
            `}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* ════════════ INITIAL STATE - Trending & Recent ════════════ */}
            {showInitialState && (
              <div className="overflow-y-auto max-h-[inherit]">
                {/* Recent Searches - Google Style */}
                {recentSearches.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <Clock size={14} />
                        Son Aramalar
                      </div>
                      <button 
                        onClick={clearRecentSearches}
                        className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                      >
                        Temizle
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <motion.button
                          key={search}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleRecentClick(search)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 
                            hover:bg-gray-200 transition-all text-sm text-gray-700 group"
                        >
                          <Clock size={12} className="text-gray-400" />
                          <span>{search}</span>
                          <ArrowUpRight size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches - Instagram/TikTok Style */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-500">
                    <TrendingUp size={14} />
                    Popüler Aramalar
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((item, i) => (
                      <motion.button
                        key={item.text}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => handleTrendingClick(item.text)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full 
                          bg-gradient-to-r from-gray-50 to-gray-100/80 border border-gray-200/50
                          hover:border-primary-200 hover:from-primary-50/50 hover:to-primary-100/30
                          transition-all text-sm font-medium text-gray-700"
                      >
                        <span>{item.emoji}</span>
                        <span>{item.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Quick Tip - Apple Style */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Sparkles size={14} className="text-primary-500" />
                    </div>
                    <span>Ürün adı, kategori veya özel gün yazarak arayabilirsiniz</span>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ SEARCH RESULTS - Apple Spotlight Style ════════════ */}
            {!showInitialState && hasResults && (
              <div className="overflow-y-auto max-h-[inherit]">
                {searchResults.map((result, index) => (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleResultClick(result.slug, result.name)}
                    className={`
                      w-full flex items-center gap-4 p-4 transition-all duration-150
                      border-b border-gray-100/80 last:border-0
                      ${activeIndex === index 
                        ? 'bg-primary-50' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    {/* Image - Apple rounded style */}
                    <div className={`
                      relative flex-shrink-0 overflow-hidden bg-gray-100
                      ${result.type === 'category' 
                        ? 'w-14 h-14 rounded-2xl' 
                        : 'w-16 h-16 rounded-2xl'
                      }
                    `}>
                      {result.image ? (
                        <Image
                          src={result.image}
                          alt={result.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🌸
                        </div>
                      )}
                      {/* Category badge overlay */}
                      {result.type === 'category' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left min-w-0">
                      <p className={`
                        font-semibold line-clamp-1
                        ${activeIndex === index ? 'text-primary-600' : 'text-gray-900'}
                      `}>
                        {result.name}
                      </p>
                      
                      {result.type === 'category' ? (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {result.productCount} ürün • Kategori
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-primary-500">
                            ₺{result.price?.toLocaleString('tr-TR')}
                          </span>
                          {result.originalPrice && result.originalPrice > (result.price || 0) && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                ₺{result.originalPrice.toLocaleString('tr-TR')}
                              </span>
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                %{Math.round((1 - (result.price || 0) / result.originalPrice) * 100)}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight 
                      size={18} 
                      className={`
                        flex-shrink-0 transition-colors
                        ${activeIndex === index ? 'text-primary-500' : 'text-gray-300'}
                      `}
                    />
                  </motion.button>
                ))}

                {/* View All - Apple style button */}
                <div className="p-3 bg-gray-50/80">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleResultClick(`/arama?search=${encodeURIComponent(query)}`, query)}
                    className="w-full flex items-center justify-center gap-2 p-3.5 
                      text-white font-semibold rounded-2xl transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #e05a4c 0%, #c94a3c 100%)',
                      boxShadow: '0 4px 12px rgba(224, 90, 76, 0.25)',
                    }}
                  >
                    <Search size={18} />
                    Tümünü Gör • {searchResults.length} sonuç
                  </motion.button>
                </div>
              </div>
            )}

            {/* ════════════ NO RESULTS - Friendly Empty State ════════════ */}
            {!showInitialState && !hasResults && !loading && (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gray-100 flex items-center justify-center"
                >
                  <span className="text-4xl">🔍</span>
                </motion.div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  &ldquo;{query}&rdquo; bulunamadı
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Farklı bir kelime deneyin veya kategorilere göz atın
                </p>
                
                {/* Quick suggestions */}
                <div className="flex flex-wrap justify-center gap-2">
                  {TRENDING_SEARCHES.slice(0, 3).map((item) => (
                    <button
                      key={item.text}
                      onClick={() => handleTrendingClick(item.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                        bg-primary-50 text-primary-600 text-sm font-medium
                        hover:bg-primary-100 transition-colors"
                    >
                      <span>{item.emoji}</span>
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════ LOADING STATE ════════════ */}
            {loading && !showInitialState && (
              <div className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-gray-200 border-t-primary-500"
                />
                <p className="text-sm text-gray-500">Aranıyor...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
