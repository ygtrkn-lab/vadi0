'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/data/products';
import { SpotlightCard, FadeContent, StatusBadge } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineViewList,
  HiOutlineViewGrid,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlinePlay
} from 'react-icons/hi';
import { getMediaType } from '@/components/admin/MediaUpload';

export default function UrunlerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const { isDark } = useTheme();

  const handlePreview = (product: Product) => {
    setPreviewProduct(product);
    setShowPreviewModal(true);
  };

  const itemsPerPage = 12;

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        console.log('🔍 Products API Response:', data);
        console.log('📦 Products count:', data.products?.length || 0);
        const productsArray = data.products || data.data || [];
        console.log('✅ Setting products:', productsArray.length);
        setProducts(productsArray);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    switch (sortBy) {
      case 'newest':
        result = result.reverse();
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove product from local state
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        setShowDeleteModal(false);
        setProductToDelete(null);
        setSelectedProducts(prev => prev.filter(id => id !== productToDelete.id));
      } else {
        alert(data.error || 'Ürün silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ürün silinirken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className={`mt-4 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ürünler</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {filteredProducts.length} ürün bulundu
            </p>
          </div>
          <Link
            href="/yonetim/urunler/yeni"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 
            rounded-xl font-medium transition-all
            ${isDark
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
            <HiOutlinePlus className="w-5 h-5" />
            <span>Yeni Ürün</span>
          </Link>
        </div>
      </FadeContent>

      {/* Filters Bar */}
      <FadeContent direction="up" delay={0.1}>
        <SpotlightCard className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl
                  focus:outline-none transition-colors
                  ${isDark
                    ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300'
                  }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg
                    ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-gray-200'}`}
                >
                  <HiOutlineX className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 
                border rounded-xl
                ${isDark
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
            >
              <HiOutlineFilter className="w-5 h-5" />
              Filtreler
            </button>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-2.5 border rounded-xl focus:outline-none transition-colors
                  ${isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-300 focus:border-neutral-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 focus:border-gray-300'
                  }`}
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-2.5 border rounded-xl focus:outline-none transition-colors
                  ${isDark
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-300 focus:border-neutral-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 focus:border-gray-300'
                  }`}
              >
                <option value="newest">En Yeni</option>
                <option value="price-asc">Fiyat: Düşük → Yüksek</option>
                <option value="price-desc">Fiyat: Yüksek → Düşük</option>
                <option value="name-asc">İsim: A → Z</option>
              </select>

              {/* View Mode */}
              <div className={`flex items-center border rounded-xl p-1
                ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                    ? (isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900 shadow-sm')
                    : (isDark ? 'text-neutral-400' : 'text-gray-500')
                    }`}
                >
                  <HiOutlineViewGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                    ? (isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900 shadow-sm')
                    : (isDark ? 'text-neutral-400' : 'text-gray-500')
                    }`}
                >
                  <HiOutlineViewList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filters Expanded */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sm:hidden overflow-hidden"
              >
                <div className={`pt-3 mt-3 border-t space-y-3 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none
                      ${isDark
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                  >
                    <option value="all">Tüm Kategoriler</option>
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none
                      ${isDark
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                  >
                    <option value="newest">En Yeni</option>
                    <option value="price-asc">Fiyat: Düşük → Yüksek</option>
                    <option value="price-desc">Fiyat: Yüksek → Düşük</option>
                    <option value="name-asc">İsim: A → Z</option>
                  </select>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Görünüm:</span>
                    <div className={`flex items-center border rounded-xl p-1
                      ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                          ? (isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900 shadow-sm')
                          : (isDark ? 'text-neutral-400' : 'text-gray-500')
                          }`}
                      >
                        <HiOutlineViewGrid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                          ? (isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900 shadow-sm')
                          : (isDark ? 'text-neutral-400' : 'text-gray-500')
                          }`}
                      >
                        <HiOutlineViewList className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>
      </FadeContent>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
          >
            <span className="text-blue-400 text-sm font-medium">
              {selectedProducts.length} ürün seçildi
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white transition-colors">
                İptal
              </button>
              <button className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors">
                Sil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid/List */}
      <FadeContent direction="up" delay={0.2}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {paginatedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="group"
              >
                <SpotlightCard className="overflow-hidden">
                  <div className="relative aspect-square">
                    {getMediaType(product.image) === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={product.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        {/* Video badge */}
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-purple-500 text-white text-[10px] font-medium flex items-center gap-0.5 z-10">
                          <HiOutlineVideoCamera className="w-3 h-3" />
                          Video
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className={`absolute top-2 left-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center
                        transition-all ${selectedProducts.includes(product.id)
                          ? 'bg-white border-white'
                          : 'border-white/50 bg-black/20 opacity-0 group-hover:opacity-100'}`}
                    >
                      {selectedProducts.includes(product.id) && (
                        <HiOutlineCheck className="w-4 h-4 text-black" />
                      )}
                    </button>

                    {/* Discount Badge */}
                    {product.discount && product.discount > 0 && (
                      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-bold 
                        bg-red-500 text-white rounded-lg">
                        -{product.discount}%
                      </span>
                    )}

                    {/* Actions Overlay - Desktop hover */}
                    <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity items-end justify-center pb-3 gap-2">
                      <button
                        onClick={() => handlePreview(product)}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <HiOutlineEye className="w-4 h-4 text-black" />
                      </button>
                      <a
                        href={`/yonetim/urunler/${product.id}`}
                        className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <HiOutlinePencil className="w-4 h-4 text-black" />
                      </a>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="p-2 bg-red-500/90 rounded-lg hover:bg-red-500 transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className={`text-xs capitalize mb-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{product.category}</p>
                    <h3 className={`text-sm font-medium truncate mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ₺{product.price.toLocaleString('tr-TR')}
                        </span>
                        {product.discount && product.discount > 0 && (
                          <span className="text-xs text-neutral-500 line-through">
                            ₺{Math.round(product.price / (1 - product.discount / 100)).toLocaleString('tr-TR')}
                          </span>
                        )}
                      </div>
                      {/* Mobile Actions */}
                      <div className="flex sm:hidden items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handlePreview(product);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <a
                          href={`/yonetim/urunler/${product.id}`}
                          className={`p-1.5 rounded-lg transition-colors ${isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(product);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${isDark
                            ? 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <SpotlightCard className="overflow-hidden">
            {/* Table Header */}
            <div className={`hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b
              ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="col-span-1 flex items-center">
                <button
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${selectedProducts.length === paginatedProducts.length
                      ? (isDark ? 'bg-white border-white' : 'bg-purple-600 border-purple-600')
                      : (isDark ? 'border-neutral-600' : 'border-gray-300')}`}
                >
                  {selectedProducts.length === paginatedProducts.length && (
                    <HiOutlineCheck className={`w-3 h-3 ${isDark ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              </div>
              <div className={`col-span-5 text-xs font-medium uppercase ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ürün</div>
              <div className={`col-span-2 text-xs font-medium uppercase ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Kategori</div>
              <div className={`col-span-2 text-xs font-medium uppercase ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Fiyat</div>
              <div className={`col-span-2 text-xs font-medium uppercase text-right ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>İşlemler</div>
            </div>

            {/* Table Body */}
            <div className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-gray-100'}`}>
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors
                    ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${selectedProducts.includes(product.id)
                          ? (isDark ? 'bg-white border-white' : 'bg-purple-600 border-purple-600')
                          : (isDark ? 'border-neutral-600' : 'border-gray-300')}`}
                    >
                      {selectedProducts.includes(product.id) && (
                        <HiOutlineCheck className={`w-3 h-3 ${isDark ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0
                      ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>ID: {product.id}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-sm capitalize ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>{product.category}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₺{product.price.toLocaleString('tr-TR')}
                    </span>
                    {product.discount && product.discount > 0 && (
                      <span className="ml-2 text-xs text-red-400">-{product.discount}%</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handlePreview(product)}
                      className={`p-2 rounded-lg transition-colors
                      ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}>
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                    <a
                      href={`/yonetim/urunler/${product.id}`}
                      className={`p-2 rounded-lg transition-colors
                      ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}>
                      <HiOutlinePencil className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className={`p-2 rounded-lg transition-colors
                        ${isDark ? 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </SpotlightCard>
        )}
      </FadeContent>

      {/* Pagination */}
      {totalPages > 1 && (
        <FadeContent direction="up" delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Sayfa {currentPage} / {totalPages} ({filteredProducts.length} ürün)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
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
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-medium transition-colors
                      ${currentPage === pageNum
                        ? (isDark ? 'bg-white text-black' : 'bg-purple-600 text-white')
                        : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </FadeContent>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/80' : 'bg-black/50'}`} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl border p-6
                ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <HiOutlineTrash className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ürünü Sil</h3>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Bu işlem geri alınamaz</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-xl mb-6
                ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <div className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0
                  ${isDark ? 'bg-neutral-700' : 'bg-gray-200'}`}>
                  {productToDelete.image ? (
                    <Image
                      src={productToDelete.image}
                      alt={productToDelete.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <HiOutlinePhotograph className={`w-6 h-6 absolute inset-0 m-auto
                      ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{productToDelete.name}</p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>₺{productToDelete.price.toLocaleString('tr-TR')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors
                    ${isDark
                      ? 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700'
                      : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 
                    rounded-xl font-medium transition-colors"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && previewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/80' : 'bg-black/50'}`} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border
                ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPreviewModal(false)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors
                  ${isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>

              {/* Product Image */}
              <div className="relative aspect-video w-full">
                <Image
                  src={previewProduct.image}
                  alt={previewProduct.name}
                  fill
                  className="object-cover"
                />
                {previewProduct.discount && previewProduct.discount > 0 && (
                  <span className="absolute top-4 left-4 px-3 py-1.5 text-sm font-bold bg-red-500 text-white rounded-xl">
                    -{previewProduct.discount}%
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 space-y-4">
                <div>
                  <span className={`text-sm capitalize px-2 py-1 rounded-lg
                    ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>
                    {previewProduct.category}
                  </span>
                  <h2 className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {previewProduct.name}
                  </h2>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₺{previewProduct.price.toLocaleString('tr-TR')}
                  </span>
                  {previewProduct.oldPrice && previewProduct.oldPrice > previewProduct.price && (
                    <span className={`text-xl line-through ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                      ₺{previewProduct.oldPrice.toLocaleString('tr-TR')}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {previewProduct.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(previewProduct.rating || 0) ? 'text-yellow-400' : (isDark ? 'text-neutral-700' : 'text-gray-200')}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {previewProduct.rating} ({previewProduct.reviewCount || 0} değerlendirme)
                    </span>
                  </div>
                )}

                {/* Description */}
                {previewProduct.description && (
                  <p className={`${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
                    {previewProduct.description}
                  </p>
                )}

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${previewProduct.inStock !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {previewProduct.inStock !== false ? 'Stokta' : 'Stok Dışı'}
                  </span>
                </div>

                {/* Gallery */}
                {previewProduct.gallery && previewProduct.gallery.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Galeri ({previewProduct.gallery.length} görsel)
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {previewProduct.gallery.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image src={img} alt={`Galeri ${idx + 1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-neutral-800">
                  <a
                    href={`/${previewProduct.category}/${previewProduct.slug}`}
                    target="_blank"
                    className={`flex-1 py-2.5 px-4 rounded-xl text-center font-medium transition-colors
                      ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                  >
                    Sitede Görüntüle
                  </a>
                  <a
                    href={`/yonetim/urunler/${previewProduct.id}`}
                    className="flex-1 py-2.5 px-4 bg-primary-500 text-white rounded-xl text-center font-medium 
                      hover:bg-primary-600 transition-colors"
                  >
                    Düzenle
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
