'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SpotlightCard, AnimatedCounter, FadeContent, StatusBadge } from '@/components/admin';
import { GradientText, ShinyText, BlurText } from '@/components/ui-kit';
import { useTheme } from './ThemeContext';
import { 
  HiOutlineCube, 
  HiOutlineTag, 
  HiOutlineCurrencyDollar, 
  HiOutlineShoppingCart,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineUsers
} from 'react-icons/hi';

// Order type
interface Order {
  id: string;
  customerId: string;
  customer_id?: string;
  status: string;
  products: Array<{
    productId: number;
    product_id?: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  delivery: {
    recipientName?: string;
    recipient_name?: string;
    recipientPhone?: string;
    recipient_phone?: string;
    province: string;
    district: string;
    neighborhood: string;
    fullAddress?: string;
    full_address?: string;
  };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// Customer type
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Product type
interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  old_price?: number;
  image: string;
  category: string;
  slug: string;
}

export default function YonetimDashboard() {
  const [greeting, setGreeting] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi günler');
    else setGreeting('İyi akşamlar');
    
    // Fetch all data
    const fetchData = async () => {
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/customers'),
          fetch('/api/products')
        ]);
        
        const ordersData = await ordersRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();
        
        console.log('🏠 Dashboard API Responses:');
        console.log('  📦 Products:', productsData.products?.length || 0);
        console.log('  📋 Orders:', ordersData.orders?.length || 0);
        console.log('  👥 Customers:', customersData.customers?.length || 0);
        
        setOrders(ordersData.orders || ordersData.data || []);
        setCustomers(customersData.customers || customersData.data || []);
        setProducts(productsData.products || productsData.data || []);
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate stats from products
  const totalProducts = products.length;
  const categories = [...new Set(products.map(p => p.category))];
  const totalCategories = categories.length;
  
  // Calculate real order stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalCustomers = customers.length;

  const stats = [
    {
      label: 'Toplam Ürün',
      value: totalProducts,
      change: `${categories.length} kategori`,
      trend: 'up',
      icon: HiOutlineCube,
      color: 'blue'
    },
    {
      label: 'Toplam Sipariş',
      value: totalOrders,
      change: pendingOrders > 0 ? `${pendingOrders} bekliyor` : 'Bekleyen yok',
      trend: pendingOrders > 0 ? 'neutral' : 'up',
      icon: HiOutlineShoppingCart,
      color: 'purple',
      badge: pendingOrders > 0 ? pendingOrders : null
    },
    {
      label: 'Toplam Gelir',
      value: totalRevenue,
      prefix: '₺',
      change: `Ort. ₺${avgOrderValue.toLocaleString('tr-TR')}`,
      trend: 'up',
      icon: HiOutlineCurrencyDollar,
      color: 'emerald'
    },
    {
      label: 'Müşteriler',
      value: totalCustomers,
      change: 'Kayıtlı üye',
      trend: 'up',
      icon: HiOutlineUsers,
      color: 'amber'
    },
  ];

  const quickActions = [
    { label: 'Yeni Ürün', href: '/yonetim/urunler', icon: HiOutlinePlus },
    { label: 'Siparişler', href: '/yonetim/siparisler', icon: HiOutlineShoppingCart },
    { label: 'Kategoriler', href: '/yonetim/kategoriler', icon: HiOutlineTag },
  ];

  // Recent products
  const recentProducts = products.slice(-4).reverse();

  // Recent orders - from real data
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const nameParts = customer.name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
      }
      return customer.name;
    }
    return 'Misafir';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { type: 'success' as const, text: 'Teslim Edildi' };
      case 'shipped':
        return { type: 'info' as const, text: 'Kargoda' };
      case 'preparing':
        return { type: 'warning' as const, text: 'Hazırlanıyor' };
      case 'pending':
        return { type: 'pending' as const, text: 'Bekliyor' };
      case 'cancelled':
        return { type: 'error' as const, text: 'İptal' };
      default:
        return { type: 'pending' as const, text: status };
    }
  };

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(order => ({
      id: `#${order.id.replace('ord_', '')}`,
      customer: order.delivery?.recipientName || getCustomerName(order.customerId),
      amount: order.total,
      status: order.status,
      time: getTimeAgo(order.createdAt)
    }));

  // Category distribution
  const categoryStats = categories.map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length,
    percentage: Math.round((products.filter(p => p.category === cat).length / totalProducts) * 100)
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-500' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BlurText text={greeting} delay={80} animateBy="letters" className="inline-flex" />
              <span>👋</span>
            </h1>
            <ShinyText 
              text="İşte bugünkü özet ve istatistikler" 
              speed={4} 
              className={`mt-1 ${isDark ? '' : '!text-gray-500'}`}
            />
          </div>
          <Link
            href="/yonetim/urunler"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all group ${
              isDark 
                ? 'bg-white text-black hover:bg-neutral-200' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Yeni Ürün</span>
          </Link>
        </div>
      </FadeContent>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];
          
          return (
            <FadeContent key={stat.label} direction="up" delay={index * 0.1}>
              <SpotlightCard 
                className="p-4 sm:p-5"
                spotlightColor={`rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'emerald' ? '16, 185, 129' : stat.color === 'amber' ? '245, 158, 11' : '168, 85, 247'}, 0.15)`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  {stat.badge && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold 
                      bg-red-500 text-white rounded-full animate-pulse">
                      {stat.badge}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{stat.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedCounter 
                      value={stat.value} 
                      prefix={stat.prefix || ''} 
                      duration={1.5}
                    />
                  </p>
                  <div className="flex items-center gap-1.5">
                    {stat.trend === 'up' ? (
                      <HiOutlineTrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : stat.trend === 'down' ? (
                      <HiOutlineTrendingDown className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <HiOutlineClock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className={`text-xs ${stat.trend === 'up' ? 'text-emerald-400' : stat.trend === 'down' ? 'text-red-400' : 'text-amber-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </FadeContent>
          );
        })}
      </div>

      {/* Quick Actions - Mobile */}
      <FadeContent direction="up" delay={0.4} className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 
                  border rounded-xl text-sm transition-all
                  ${isDark 
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </FadeContent>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <FadeContent direction="up" delay={0.2} className="lg:col-span-2">
          <SpotlightCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Son Siparişler</h2>
              <Link 
                href="/yonetim/siparisler"
                className={`text-sm flex items-center gap-1 transition-colors
                  ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Tümü <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Henüz sipariş yok
                </div>
              ) : recentOrders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors
                    ${isDark ? 'bg-neutral-900/50 hover:bg-neutral-800/50' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.id}</span>
                      <StatusBadge 
                        status={statusInfo.type} 
                        text={statusInfo.text}
                        size="sm"
                        pulse={order.status === 'pending' || order.status === 'preparing'}
                      />
                    </div>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>₺{order.amount.toLocaleString('tr-TR')}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{order.time}</p>
                  </div>
                </motion.div>
              )})}
            </div>
          </SpotlightCard>
        </FadeContent>

        {/* Category Distribution */}
        <FadeContent direction="up" delay={0.3}>
          <SpotlightCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kategoriler</h2>
              <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{totalCategories} kategori</span>
            </div>
            
            <div className="space-y-4">
              {categoryStats.map((cat, index) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm capitalize truncate ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{cat.name}</span>
                    <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{cat.count} ürün</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </SpotlightCard>
        </FadeContent>
      </div>

      {/* Recent Products */}
      <FadeContent direction="up" delay={0.4}>
        <SpotlightCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Son Eklenen Ürünler</h2>
            <Link 
              href="/yonetim/urunler"
              className={`text-sm flex items-center gap-1 transition-colors
                ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Tümünü Gör <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recentProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="group"
              >
                <div className={`relative aspect-square rounded-xl overflow-hidden mb-2
                  ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-lg opacity-0 
                    group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <HiOutlineEye className="w-4 h-4 text-black" />
                  </button>
                </div>
                <h3 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>₺{product.price.toLocaleString('tr-TR')}</p>
              </motion.div>
            ))}
          </div>
        </SpotlightCard>
      </FadeContent>
    </div>
  );
}
