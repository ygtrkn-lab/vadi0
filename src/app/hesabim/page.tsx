'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCustomer } from '@/context/CustomerContext';
import { useOrder, Order } from '@/context/OrderContext';
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineLocationMarker,
  HiOutlineCurrencyDollar,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineGift,
  HiOutlineCog,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { SpotlightCard, FadeIn, AnimatedCounter, Ripple } from '@/components/ui-kit/premium';

export default function HesabimPage() {
  const { state: customerState } = useCustomer();
  const { state: orderState } = useOrder();

  const customer = customerState.currentCustomer;
  if (!customer) return null;

  // Müşterinin siparişlerini getir
  const customerOrders: Order[] = orderState.orders.filter(
    (order: Order) => customer.orders.includes(order.id)
  );

  // Güvenli değer hesaplama
  const totalOrders = customer.orderCount ?? customerOrders.length;
  const totalSpent = customer.totalSpent ?? customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const favoritesCount = customer.favorites?.length ?? 0;
  const addressesCount = customer.addresses?.length ?? 0;

  const stats = [
    {
      label: 'Toplam Sipariş',
      value: totalOrders,
      icon: HiOutlineShoppingBag,
      color: 'from-gray-900 to-gray-800',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900',
      spotlightColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'border-gray-200',
    },
    {
      label: 'Toplam Harcama',
      value: totalSpent,
      prefix: '₺',
      icon: HiOutlineCurrencyDollar,
      color: 'from-gray-900 to-gray-800',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900',
      spotlightColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'border-gray-200',
    },
    {
      label: 'Favorilerim',
      value: favoritesCount,
      icon: HiOutlineHeart,
      color: 'from-gray-900 to-gray-800',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900',
      spotlightColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'border-gray-200',
    },
    {
      label: 'Kayıtlı Adres',
      value: addressesCount,
      icon: HiOutlineLocationMarker,
      color: 'from-gray-900 to-gray-800',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900',
      spotlightColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'border-gray-200',
    },
  ];

  const quickActions = [
    { label: 'Siparişlerim', href: '/hesabim/siparislerim', icon: HiOutlineShoppingBag, desc: 'Tüm siparişlerin' },
    { label: 'Favorilerim', href: '/hesabim/favorilerim', icon: HiOutlineHeart, desc: 'Beğendiklerin' },
    { label: 'Adreslerim', href: '/hesabim/adreslerim', icon: HiOutlineLocationMarker, desc: 'Teslimat adreslerin' },
    { label: 'Ayarlar', href: '/hesabim/ayarlar', icon: HiOutlineCog, desc: 'Hesap ayarların' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'confirmed': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'preparing': return 'bg-gray-300 text-gray-900 border-gray-400';
      case 'shipped': return 'bg-gray-400 text-white border-gray-500';
      case 'delivered': return 'bg-gray-800 text-white border-gray-900';
      case 'cancelled': return 'bg-gray-500 text-white border-gray-600';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'shipped': return 'Yolda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return HiOutlineClock;
      case 'confirmed': return HiOutlineCheckCircle;
      case 'preparing': return HiOutlineGift;
      case 'shipped': return HiOutlineTruck;
      case 'delivered': return HiOutlineCheckCircle;
      case 'cancelled': return HiOutlineExclamationCircle;
      default: return HiOutlineShoppingBag;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Mobile Only */}
      <FadeIn className="lg:hidden">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-2xl p-6 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
              <span>Hoş geldin</span>
              <HiOutlineSparkles className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold mt-2 text-white drop-shadow-lg">{customer.name.split(' ')[0]}</h2>
            <p className="text-white/80 text-sm mt-2">
              Bugün nasıl yardımcı olabiliriz?
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Desktop Welcome */}
      <FadeIn className="hidden lg:block">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-3xl p-8 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <Ripple mainCircleSize={200} color="rgba(255,255,255,0.08)" numCircles={5} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/90 mb-1 text-sm">
                <span>Hoş geldin</span>
                <HiOutlineSparkles className="w-4 h-4" />
              </div>
              <h1 className="text-3xl font-bold text-white">{customer.name}</h1>
              <p className="text-white/80 mt-2 flex items-center gap-2">
                <HiOutlineSparkles className="w-4 h-4" />
                {totalOrders > 0 
                  ? `${totalOrders} sipariş ile birlikte büyük bir yol kat ettik!`
                  : 'İlk siparişine hazır mısın?'
                }
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter value={totalOrders} />
                </p>
                <p className="text-white/80 text-sm mt-1">Sipariş</p>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter value={totalSpent} prefix="₺" />
                </p>
                <p className="text-white/80 text-sm mt-1">Toplam</p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <FadeIn key={stat.label} delay={index * 0.1}>
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
            <SpotlightCard 
              spotlightColor={stat.spotlightColor}
              className={`p-5 lg:p-6 bg-white/60 backdrop-blur-xl border border-white/20 hover:bg-white/80 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl will-change-transform`}
            >
              <motion.div 
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-sm 
                flex items-center justify-center mb-3 shadow-sm border border-black/5`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.textColor}`} />
              </motion.div>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {stat.prefix && <span>{stat.prefix}</span>}
                <AnimatedCounter value={stat.value} />
              </p>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </SpotlightCard>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      {/* Quick Actions */}
      <FadeIn delay={0.3}>
        <SpotlightCard className="p-5 lg:p-7 bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="text-xl">⚡</span> Hızlı Erişim
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center p-5 rounded-2xl bg-white/70 backdrop-blur-lg border border-white/30 hover:bg-white/90 hover:border-white/50 hover:shadow-xl
                    transition-all duration-300 cursor-pointer group text-center"
                >
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-gray-900
                    flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="font-medium text-gray-900 text-sm lg:text-base">
                    {action.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 hidden lg:block">
                    {action.desc}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </SpotlightCard>
      </FadeIn>

      {/* Recent Orders */}
      <FadeIn delay={0.4}>
        <SpotlightCard className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-5 lg:p-7 border-b border-white/30 bg-gradient-to-r from-white/40 to-transparent">
            <h2 className="text-base lg:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <HiOutlineShoppingBag className="w-6 h-6 text-gray-600" />
              <span>Son Siparişlerim</span>
            </h2>
            <Link 
              href="/hesabim/siparislerim"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              Tümü <HiOutlineChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {customerOrders.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {customerOrders.slice(0, 3).map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.8)" }}
                  className="p-4 hover:backdrop-blur-sm transition-all duration-300 will-change-transform"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gray-100
                      flex items-center justify-center shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {React.createElement(getStatusIcon(order.status), { className: 'w-6 h-6 text-gray-900' })}
                    </motion.div>
                    
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border shrink-0
                          ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <HiOutlineClock className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₺{order.total.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 lg:p-12 text-center">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl 
                flex items-center justify-center mx-auto mb-4 text-4xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                🌷
              </motion.div>
              <p className="text-gray-600 font-medium mb-1">Henüz siparişin yok</p>
              <p className="text-gray-400 text-sm mb-6">İlk siparişini ver, çiçeklerle tanış!</p>
              <Link href="/kategoriler">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e05a4c] to-[#c94a3c] 
                    text-white font-medium rounded-xl shadow-lg shadow-[#e05a4c]/25 
                    hover:shadow-[#e05a4c]/40 transition-shadow"
                >
                  <HiOutlineGift className="w-5 h-5" />
                  Alışverişe Başla
                </motion.button>
              </Link>
            </div>
          )}
        </SpotlightCard>
      </FadeIn>

      {/* Membership Info */}
      <FadeIn delay={0.5}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/70 backdrop-blur-2xl p-6 lg:p-7 border border-white/10 shadow-2xl">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineSparkles className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white/90">Vadiler Üyesi</span>
              </div>
              <p className="text-lg lg:text-xl font-bold text-white">
                {new Date(customer.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
                <span>tarihinden beri birlikteyiz</span>
                <HiOutlineSparkles className="w-4 h-4" />
              </p>
            </div>
            
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customer.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Promo Banner */}
      <FadeIn delay={0.6}>
        <SpotlightCard 
          spotlightColor="rgba(147, 51, 234, 0.1)"
          className="p-5 lg:p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-xl border border-violet-300/30 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600
              flex items-center justify-center shrink-0 shadow-md">
              <HiOutlineGift className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Arkadaşını Davet Et</h3>
              <p className="text-sm text-gray-600">Arkadaşın ilk alışverişinde ikınıze de %15 indirim!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-xl 
                hover:shadow-lg transition-all shrink-0 relative overflow-hidden group"
            >
              <span className="relative z-10">Davet Et</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </div>
        </SpotlightCard>
      </FadeIn>
    </div>
  );
}
