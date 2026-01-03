'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard, FadeContent, StatusBadge, AnimatedCounter } from '@/components/admin';
import { useTheme } from '../ThemeContext';
import { useCustomer, Customer } from '@/context/CustomerContext';
import { useOrder } from '@/context/OrderContext';
import { 
  HiOutlineSearch, 
  HiOutlineEye,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineStar
} from 'react-icons/hi';

export default function MusterilerPage() {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newTag, setNewTag] = useState('');
  
  const { isDark } = useTheme();
  const { state: customerState, updateCustomer, deleteCustomer } = useCustomer();
  const { state: orderState, getOrdersByCustomer } = useOrder();

  const itemsPerPage = 10;

  const filteredCustomers = useMemo(() => {
    return customerState.customers
      .filter(customer => {
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm);
        
        if (selectedStatus === 'all') return matchesSearch;
        if (selectedStatus === 'active') return matchesSearch && customer.isActive;
        if (selectedStatus === 'inactive') return matchesSearch && !customer.isActive;
        if (selectedStatus === 'vip') return matchesSearch && customer.tags.includes('VIP');
        if (selectedStatus === 'new') return matchesSearch && customer.tags.includes('Yeni');
        
        return matchesSearch;
      })
      .sort((a, b) => {
        // Yeni müşteriler üstte - createdAt'a göre azalan sıralama
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [customerState.customers, selectedStatus, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchTerm]);

  const stats = useMemo(() => {
    const customers = customerState.customers;
    return {
      total: customers.length,
      active: customers.filter(c => c.isActive).length,
      vip: customers.filter(c => c.tags.includes('VIP')).length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      avgOrderValue: customers.length > 0 
        ? Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.filter(c => c.orderCount > 0).length) || 0
        : 0,
    };
  }, [customerState.customers]);

  const handleToggleActive = (customer: Customer) => {
    updateCustomer({ ...customer, isActive: !customer.isActive });
  };

  const handleAddTag = (customer: Customer) => {
    if (newTag.trim() && !customer.tags.includes(newTag.trim())) {
      updateCustomer({ ...customer, tags: [...customer.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (customer: Customer, tag: string) => {
    updateCustomer({ ...customer, tags: customer.tags.filter(t => t !== tag) });
  };

  const handleUpdateNotes = (customer: Customer, notes: string) => {
    updateCustomer({ ...customer, notes });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Müşteriler (CRM)
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {filteredCustomers.length} müşteri bulundu
            </p>
          </div>
        </div>
      </FadeContent>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Toplam Müşteri', value: stats.total, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400', icon: HiOutlineUserGroup },
          { label: 'Aktif', value: stats.active, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-400', icon: HiOutlineCheck },
          { label: 'VIP', value: stats.vip, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-400', icon: HiOutlineStar },
          { label: 'Toplam Gelir', value: stats.totalRevenue, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400', icon: HiOutlineCurrencyDollar, isCurrency: true },
          { label: 'Ort. Sipariş', value: stats.avgOrderValue, color: 'from-pink-500 to-pink-600', textColor: 'text-pink-400', icon: HiOutlineShoppingBag, isCurrency: true },
        ].map((stat, index) => (
          <FadeContent key={stat.label} direction="up" delay={0.05 + index * 0.05}>
            <SpotlightCard className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-lg font-bold ${stat.textColor}`}>
                    {stat.isCurrency ? formatPrice(stat.value) : <AnimatedCounter value={stat.value} />}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.label}</p>
                </div>
              </div>
            </SpotlightCard>
          </FadeContent>
        ))}
      </div>

      {/* Filters */}
      <FadeContent direction="up" delay={0.3}>
        <SpotlightCard className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Müşteri ara (isim, e-posta, telefon)..."
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
                  <HiOutlineX className="w-4 h-4 text-neutral-400" />
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
              Filtrele
            </button>

            {/* Desktop Status Filter */}
            <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'active', label: 'Aktif' },
                { key: 'inactive', label: 'Pasif' },
                { key: 'vip', label: 'VIP' },
                { key: 'new', label: 'Yeni' },
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setSelectedStatus(status.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedStatus === status.key
                      ? (isDark ? 'bg-white text-black' : 'bg-purple-600 text-white')
                      : (isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900')
                  }`}
                >
                  {status.label}
                </button>
              ))}
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
                <div className={`pt-3 mt-3 border-t flex flex-wrap gap-2 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'active', label: 'Aktif' },
                    { key: 'inactive', label: 'Pasif' },
                    { key: 'vip', label: 'VIP' },
                    { key: 'new', label: 'Yeni' },
                  ].map((status) => (
                    <button
                      key={status.key}
                      onClick={() => {
                        setSelectedStatus(status.key);
                        setShowFilters(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedStatus === status.key
                          ? (isDark ? 'bg-white text-black' : 'bg-purple-600 text-white')
                          : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500')
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>
      </FadeContent>

      {/* Customers List */}
      <FadeContent direction="up" delay={0.35}>
        <div className="space-y-3">
          {paginatedCustomers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SpotlightCard className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Customer Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${customer.tags.includes('VIP') 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                        : isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <span className={`text-lg font-bold ${customer.tags.includes('VIP') ? 'text-white' : isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {customer.name}
                        </h3>
                        {customer.tags.includes('VIP') && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full">
                            VIP
                          </span>
                        )}
                        <StatusBadge 
                          status={customer.isActive ? 'success' : 'error'}
                          text={customer.isActive ? 'Aktif' : 'Pasif'}
                        />
                      </div>
                      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <HiOutlineMail className="w-4 h-4" />
                          {customer.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlinePhone className="w-4 h-4" />
                          {customer.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {customer.orderCount}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Sipariş</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold text-emerald-400`}>
                          {formatPrice(customer.totalSpent)}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Toplam</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className={`p-2.5 rounded-xl transition-colors
                        ${isDark 
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                        }`}
                    >
                      <HiOutlineEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-800">
                    {customer.tags.map(tag => (
                      <span 
                        key={tag}
                        className={`px-2 py-1 text-xs rounded-lg ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </FadeContent>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <FadeContent direction="up" delay={0.35}>
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
              ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <HiOutlineUserGroup className={`w-8 h-8 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Müşteri bulunamadı</h3>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Arama kriterlerinize uygun müşteri yok</p>
          </div>
        </FadeContent>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <FadeContent direction="up" delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Sayfa {currentPage} / {totalPages} ({filteredCustomers.length} müşteri)
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
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-medium transition-colors
                      ${currentPage === page 
                        ? (isDark ? 'bg-white text-black' : 'bg-purple-600 text-white')
                        : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                      }`}
                  >
                    {page}
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

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/80' : 'bg-black/50'}`} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border p-6
                ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center
                    ${selectedCustomer.tags.includes('VIP') 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                      : isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                    <span className={`text-xl font-bold ${selectedCustomer.tags.includes('VIP') ? 'text-white' : isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedCustomer.name}
                      </h3>
                      <StatusBadge 
                        status={selectedCustomer.isActive ? 'success' : 'error'}
                        text={selectedCustomer.isActive ? 'Aktif' : 'Pasif'}
                      />
                    </div>
                    <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Kayıt: {formatDate(selectedCustomer.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className={`p-2 rounded-xl transition-colors
                    ${isDark 
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Contact Info */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>İletişim Bilgileri</p>
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <HiOutlineMail className="w-4 h-4 text-neutral-500" />
                    {selectedCustomer.email}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <HiOutlinePhone className="w-4 h-4 text-neutral-500" />
                    {selectedCustomer.phone}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedCustomer.orderCount}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Sipariş</p>
                </div>
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold text-emerald-400`}>
                    {formatPrice(selectedCustomer.totalSpent)}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Toplam Harcama</p>
                </div>
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedCustomer.orderCount > 0 
                      ? formatPrice(selectedCustomer.totalSpent / selectedCustomer.orderCount)
                      : '₺0'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ort. Sipariş</p>
                </div>
              </div>

              {/* Addresses */}
              {selectedCustomer.addresses.length > 0 && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Kayıtlı Adresler ({selectedCustomer.addresses.length})
                  </p>
                  <div className="space-y-3">
                    {selectedCustomer.addresses.map(addr => (
                      <div key={addr.id} className={`p-4 rounded-xl border transition-all
                        ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}
                        ${addr.isDefault ? 'ring-2 ring-[#e05a4c]/30' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`p-1.5 rounded-lg ${
                            addr.type === 'home' ? 'bg-blue-500/10 text-blue-500' :
                            addr.type === 'work' ? 'bg-purple-500/10 text-purple-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {addr.type === 'home' ? '🏠' : addr.type === 'work' ? '🏢' : '📍'}
                          </span>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {addr.title || (addr.type === 'home' ? 'Ev' : addr.type === 'work' ? 'İş' : 'Diğer')}
                          </span>
                          {addr.isDefault && (
                            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[#549658]">
                              <HiOutlineStar className="w-3 h-3" />
                              Varsayılan
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                            <span className="font-medium">{addr.recipientName}</span> - {addr.recipientPhone}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                            {addr.fullAddress}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            {addr.neighborhood && `${addr.neighborhood}, `}{addr.district}/{addr.province}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Etiketler</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCustomer.tags.map(tag => (
                    <span 
                      key={tag}
                      className={`px-3 py-1 text-sm rounded-lg flex items-center gap-2 ${isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(selectedCustomer, tag)}
                        className="text-neutral-500 hover:text-red-400"
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Yeni etiket..."
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border
                      ${isDark 
                        ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag(selectedCustomer)}
                  />
                  <button
                    onClick={() => handleAddTag(selectedCustomer)}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <HiOutlinePlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Notlar</p>
                <textarea
                  value={selectedCustomer.notes}
                  onChange={(e) => handleUpdateNotes(selectedCustomer, e.target.value)}
                  placeholder="Müşteri hakkında notlar..."
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg text-sm border resize-none
                    ${isDark 
                      ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(selectedCustomer)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                    selectedCustomer.isActive
                      ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {selectedCustomer.isActive ? 'Pasife Al' : 'Aktif Et'}
                </button>
                {!selectedCustomer.tags.includes('VIP') ? (
                  <button
                    onClick={() => {
                      updateCustomer({ ...selectedCustomer, tags: [...selectedCustomer.tags, 'VIP'] });
                      setSelectedCustomer({ ...selectedCustomer, tags: [...selectedCustomer.tags, 'VIP'] });
                    }}
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                  >
                    VIP Yap
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const newTags = selectedCustomer.tags.filter(t => t !== 'VIP');
                      updateCustomer({ ...selectedCustomer, tags: newTags });
                      setSelectedCustomer({ ...selectedCustomer, tags: newTags });
                    }}
                    className="flex-1 px-4 py-2.5 bg-neutral-600 text-white rounded-xl font-medium hover:bg-neutral-700 transition-colors"
                  >
                    VIP&apos;i Kaldır
                  </button>
                )}
              </div>

              {/* Order History */}
              {selectedCustomer.orders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Son Siparişler ({selectedCustomer.orders.length})
                  </p>
                  <div className="space-y-2">
                    {getOrdersByCustomer(selectedCustomer.id).slice(0, 5).map(order => (
                      <div key={order.id} className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            #{order.orderNumber}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(order.total)}
                          </p>
                          <StatusBadge 
                            status={
                              order.status === 'delivered' ? 'success' :
                              order.status === 'cancelled' ? 'error' :
                              order.status === 'shipped' ? 'info' :
                              'warning'
                            }
                            text={
                              order.status === 'pending' ? 'Beklemede' :
                              order.status === 'confirmed' ? 'Onaylandı' :
                              order.status === 'processing' ? 'Hazırlanıyor' :
                              order.status === 'shipped' ? 'Kargoda' :
                              order.status === 'delivered' ? 'Teslim Edildi' :
                              'İptal'
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
