'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, ArrowRight, Tag, Folder } from 'lucide-react';

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

export default function SearchBar({ isMobile = false, onClose, autoFocus = false, onOpenChange }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount - Supabase integrated
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

  // Search results - optimized matching
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 1) return [];

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search in categories - only show categories with products
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

    // Search in products - improved matching
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

    // Optimize results distribution
    const categoryResults = results.filter(r => r.type === 'category').slice(0, 4);
    const productResults = results.filter(r => r.type === 'product').slice(0, 8);
    
    return [...categoryResults, ...productResults];
  }, [query, allProducts, allCategories]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const categoryResults = searchResults.filter(r => r.type === 'category');
    const productResults = searchResults.filter(r => r.type === 'product');
    return { categoryResults, productResults };
  }, [searchResults]);

  // Notify parent about open state changes
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

  // Handle keyboard navigation
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
          window.location.href = searchResults[activeIndex].slug;
        } else if (query.trim()) {
          window.location.href = `/arama?search=${encodeURIComponent(query)}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, searchResults, activeIndex, query]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setActiveIndex(-1);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Navigate to result
  const handleResultClick = (slug: string) => {
    setIsOpen(false);
    setQuery('');
    onClose?.();
    window.location.href = slug;
  };

  // Auto focus for mobile
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the input is visible
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ zIndex: 9999 }}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Çiçek, kategori veya ürün ara..."
          // Prevent zoom on mobile with font-size: 16px
          className={`
            w-full bg-gray-50 border border-gray-200 rounded-full 
            focus:outline-none focus:border-[#e05a4c] focus:ring-2 focus:ring-[#e05a4c]/20
            transition-all duration-300 text-[16px]
            ${isMobile ? 'px-5 py-3.5 pr-20' : 'px-5 py-3 pr-20'}
          `}
          style={{ fontSize: '16px' }} // Prevents zoom on iOS
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 
              hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => query && handleResultClick(`/arama?search=${encodeURIComponent(query)}`)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 bg-[#e05a4c]
            text-white rounded-full hover:bg-[#c94a3c] transition-colors"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`
              absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl 
              border border-gray-100 overflow-hidden z-[9999]
              ${isMobile ? 'max-h-[60vh]' : 'max-h-[70vh]'}
            `}
            style={{ zIndex: 9999 }}
          >
            {searchResults.length > 0 ? (
              <div className="overflow-y-auto max-h-[inherit]">
                {/* Categories Section */}
                {groupedResults.categoryResults.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Folder size={14} />
                      Kategoriler
                    </div>
                    <div className="space-y-1">
                      {groupedResults.categoryResults.map((result, index) => {
                        const globalIndex = index;
                        return (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleResultClick(result.slug)}
                            className={`
                              w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150
                              ${activeIndex === globalIndex 
                                ? 'bg-[#e05a4c]/10 text-[#e05a4c]' 
                                : 'hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {result.image ? (
                                <Image
                                  src={result.image}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                  🌸
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900 line-clamp-1">{result.name}</p>
                              <p className="text-sm text-gray-500">{result.productCount} ürün</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Products Section */}
                {groupedResults.productResults.length > 0 && (
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Tag size={14} />
                      Ürünler
                    </div>
                    <div className="space-y-1">
                      {groupedResults.productResults.map((result, index) => {
                        const globalIndex = groupedResults.categoryResults.length + index;
                        return (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (groupedResults.categoryResults.length + index) * 0.03 }}
                            onClick={() => handleResultClick(result.slug)}
                            className={`
                              w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150
                              ${activeIndex === globalIndex 
                                ? 'bg-[#e05a4c]/10 text-[#e05a4c]' 
                                : 'hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {result.image ? (
                                <Image
                                  src={result.image}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                  🌸
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium text-gray-900 line-clamp-1">{result.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#e05a4c]">
                                  ₺{result.price?.toLocaleString('tr-TR')}
                                </span>
                                {result.originalPrice && result.originalPrice > (result.price || 0) && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₺{result.originalPrice.toLocaleString('tr-TR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* View All Results */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => handleResultClick(`/arama?search=${encodeURIComponent(query)}`)}
                    className="w-full flex items-center justify-center gap-2 p-3 text-[#e05a4c] 
                      font-medium rounded-xl hover:bg-[#e05a4c]/10 transition-colors"
                  >
                    <Search size={18} />
                    Tüm sonuçları gör ({searchResults.length})
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Aranıyor...</p>
                <p className="text-sm text-gray-400 mt-1">Lütfen bekleyin</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">"{query}" için sonuç bulunamadı</p>
                <p className="text-sm text-gray-400 mt-1">Başka bir kelime ile arayın</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
