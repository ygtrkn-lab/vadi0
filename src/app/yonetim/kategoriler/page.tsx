'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard, FadeContent, AnimatedCounter } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import { 
  HiOutlinePlus, 
  HiOutlineSearch, 
  HiOutlineTag, 
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineDotsVertical,
  HiOutlineExternalLink,
  HiOutlineCheck
} from 'react-icons/hi';

interface CategoryStat {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  avgPrice: number;
  totalRevenue: number;
  discountedCount: number;
  percentage: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  discount?: number;
}

type RawCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
  productCount?: number;
};

export default function KategorilerPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryStat | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [categories, setCategories] = useState<RawCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  
  const { isDark } = useTheme();

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch('/api/categories?all=true'),
          fetch('/api/products')
        ]);
        
        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();
        
        setCategories(categoriesData.categories || categoriesData.data || []);
        setProducts(productsData.products || productsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate category stats by merging API categories with product data
  const categoryStats = useMemo(() => {
    if (categories.length === 0 || products.length === 0) return [];
    
    return categories.map(cat => {
      const categoryProducts = products.filter(p => p.category === cat.slug);
      const avgPrice = categoryProducts.length > 0
        ? Math.round(categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length)
        : 0;
      const totalRevenue = categoryProducts.reduce((sum, p) => sum + p.price, 0);
      const discountedCount = categoryProducts.filter(p => p.discount && p.discount > 0).length;
      
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: categoryProducts.length,
        avgPrice,
        totalRevenue,
        discountedCount,
        percentage: products.length > 0 ? Math.round((categoryProducts.length / products.length) * 100) : 0
      };
    }).sort((a, b) => b.productCount - a.productCount);
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categoryStats;
    return categoryStats.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categoryStats, searchTerm]);

  const totalProducts = categoryStats.reduce((sum, c) => sum + c.productCount, 0);
  const totalRevenue = categoryStats.reduce((sum, c) => sum + c.totalRevenue, 0);
  const avgProductsPerCategory = categoryStats.length > 0 ? Math.round(totalProducts / categoryStats.length) : 0;

  const handleEditClick = (category: CategoryStat) => {
    router.push(`/yonetim/kategoriler/${category.id}`);
  };

  const handleDeleteClick = (category: CategoryStat) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setActionLoading(true);
    try {
      // Generate slug from name
      const slug = newCategoryName
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug,
          description: '',
          image: '',
          order: categoryStats.length,
          isActive: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message || 'Kategori başarıyla oluşturuldu', 'success');
        setNewCategoryName('');
        setShowAddModal(false);
        // Refresh products to update category stats
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        setProducts(productsData.products || productsData.data || []);
      } else {
        showToast(data.error || 'Kategori oluşturulamadı', 'error');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('Kategori oluşturulurken hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editCategoryName.trim() || !selectedCategory) return;
    
    setActionLoading(true);
    try {
      // Note: This is a simplified edit - only updates the name in products
      // For full category editing, we need /yonetim/kategoriler/[id] page
      showToast('Tam düzenleme için kategori düzenleme sayfası gerekli', 'error');
      setShowEditModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error editing category:', error);
      showToast('Kategori düzenlenirken hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    // Check if category has products
    if (selectedCategory.productCount > 0) {
      showToast(`Bu kategoride ${selectedCategory.productCount} ürün var. Önce ürünleri başka kategoriye taşıyın.`, 'error');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/categories?id=${selectedCategory.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message || 'Kategori başarıyla silindi', 'success');
        // Refresh categories
        const categoriesRes = await fetch('/api/categories?all=true');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || categoriesData.data || []);
      } else {
        showToast(data.error || 'Kategori silinemedi', 'error');
      }
      
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Kategori silinirken hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kategoriler</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {categoryStats.length} kategori • {totalProducts.toLocaleString('tr-TR')} ürün
            </p>
          </div>
          <button 
            onClick={() => router.push('/yonetim/kategoriler/yeni')}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 
              rounded-xl font-medium transition-all
              ${isDark 
                ? 'bg-white text-black hover:bg-neutral-200' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Yeni Kategori</span>
          </button>
        </div>
      </FadeContent>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <FadeContent direction="up" delay={0.05}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <HiOutlineTag className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <AnimatedCounter value={categoryStats.length} />
                </p>
                <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Kategori</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <FadeContent direction="up" delay={0.1}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <HiOutlineCube className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <AnimatedCounter value={totalProducts} />
                </p>
                <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Toplam Ürün</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <FadeContent direction="up" delay={0.15}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <HiOutlineChartBar className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <AnimatedCounter value={avgProductsPerCategory} />
                </p>
                <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ort. Ürün</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>

        <FadeContent direction="up" delay={0.2}>
          <SpotlightCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <HiOutlineTrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₺<AnimatedCounter value={Math.round(totalRevenue / 1000)} />K
                </p>
                <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Toplam Değer</p>
              </div>
            </div>
          </SpotlightCard>
        </FadeContent>
      </div>

      {/* Search & View Toggle */}
      <FadeContent direction="up" delay={0.25}>
        <SpotlightCard className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-colors
                  ${isDark 
                    ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-gray-200'}`}
                >
                  <HiOutlineX className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                </button>
              )}
            </div>

            {/* View Mode */}
            <div className="flex items-center justify-end">
              <div className={`flex items-center rounded-xl p-1 ${isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-gray-100 border border-gray-200'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' 
                    ? isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900 shadow-sm' 
                    : isDark ? 'text-neutral-400' : 'text-gray-500'}`}
                >
                  <HiOutlineViewGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' 
                    ? isDark ? 'bg-neutral-700 text-white' : 'bg-white text-gray-900 shadow-sm' 
                    : isDark ? 'text-neutral-400' : 'text-gray-500'}`}
                >
                  <HiOutlineViewList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </FadeContent>

      {/* Categories Display */}
      <FadeContent direction="up" delay={0.3}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <SpotlightCard className="p-5 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold uppercase
                        ${isDark ? 'bg-gradient-to-br from-neutral-700 to-neutral-800 text-white' : 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700'}`}>
                        {category.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{category.productCount} ürün</p>
                      </div>
                    </div>
                    
                    {/* Actions Menu */}
                    <div className="relative group">
                      <button className={`p-2 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                        <HiOutlineDotsVertical className="w-5 h-5" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 
                        group-hover:visible transition-all duration-200 z-10">
                        <div className={`rounded-xl shadow-xl py-1 min-w-[140px] ${isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-gray-200'}`}>
                          <button className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                            ${isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                            <HiOutlineExternalLink className="w-4 h-4" />
                            Görüntüle
                          </button>
                          <button 
                            onClick={() => handleEditClick(category)}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                              ${isDark ? 'text-neutral-300 hover:text-white hover:bg-neutral-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(category)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 
                              hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Toplam ürünlerin</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.percentage}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <motion.div
                        className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-white/80 to-white' : 'bg-gradient-to-r from-purple-500 to-purple-600'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.05 + 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2.5 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>₺{category.avgPrice.toLocaleString('tr-TR')}</p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ort. Fiyat</p>
                    </div>
                    <div className={`p-2.5 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.discountedCount}</p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>İndirimli</p>
                    </div>
                    <div className={`p-2.5 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                      <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>₺{(category.totalRevenue / 1000).toFixed(0)}K</p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Değer</p>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <SpotlightCard className="overflow-hidden">
            {/* Table Header */}
            <div className={`hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`col-span-4 text-xs font-medium uppercase ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Kategori</div>
              <div className={`col-span-2 text-xs font-medium uppercase text-center ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ürün</div>
              <div className={`col-span-2 text-xs font-medium uppercase text-center ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ort. Fiyat</div>
              <div className={`col-span-2 text-xs font-medium uppercase text-center ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Değer</div>
              <div className={`col-span-2 text-xs font-medium uppercase text-right ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>İşlemler</div>
            </div>

            {/* Table Body */}
            <div className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-gray-100'}`}>
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 items-center transition-colors ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold uppercase flex-shrink-0
                      ${isDark ? 'bg-gradient-to-br from-neutral-700 to-neutral-800 text-white' : 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700'}`}>
                      {category.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-medium capitalize truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{category.name}</h3>
                      <div className="flex items-center gap-3 sm:hidden">
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{category.productCount} ürün</span>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>₺{(category.totalRevenue / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex col-span-2 justify-center">
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>{category.productCount}</span>
                  </div>
                  <div className="hidden sm:flex col-span-2 justify-center">
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>₺{category.avgPrice.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="hidden sm:flex col-span-2 justify-center">
                    <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>₺{(category.totalRevenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-1 -mt-8 sm:mt-0">
                    <button 
                      onClick={() => handleEditClick(category)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(category)}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <FadeContent direction="up" delay={0.3}>
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <HiOutlineTag className={`w-8 h-8 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Kategori bulunamadı</h3>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Arama kriterlerinize uygun kategori yok</p>
          </div>
        </FadeContent>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200 shadow-xl'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <HiOutlinePlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Yeni Kategori</h3>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Yeni bir kategori oluşturun</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="ör: Vazolar"
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                      ${isDark 
                        ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors
                    ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                >
                  İptal
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim() || actionLoading}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                  {actionLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200 shadow-xl'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <HiOutlinePencil className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kategori Düzenle</h3>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{selectedCategory.productCount} ürün etkilenecek</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors
                      ${isDark 
                        ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600' 
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'}`}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors
                    ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                >
                  İptal
                </button>
                <button
                  onClick={handleEditCategory}
                  disabled={!editCategoryName.trim() || actionLoading}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                  {actionLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200 shadow-xl'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <HiOutlineTrash className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kategori Sil</h3>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Bu işlem geri alınamaz</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold uppercase flex-shrink-0
                    ${isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {selectedCategory.name.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedCategory.name}</p>
                    <p className="text-xs text-red-400">{selectedCategory.productCount} ürün silinecek!</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors
                    ${isDark ? 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 
                    rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[110]"
          >
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl min-w-[300px] ${
              toast.type === 'success' 
                ? isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                : isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              }`}>
                {toast.type === 'success' ? (
                  <HiOutlineCheck className="w-5 h-5 text-white" />
                ) : (
                  <HiOutlineX className="w-5 h-5 text-white" />
                )}
              </div>
              <p className={`text-sm font-medium ${
                toast.type === 'success'
                  ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                  : isDark ? 'text-red-300' : 'text-red-700'
              }`}>
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
