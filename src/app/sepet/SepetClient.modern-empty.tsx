'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/CartContext'
import { useCustomer } from '@/context/CustomerContext'
import { useOrder } from '@/context/OrderContext'
import { Header, Footer } from '@/components'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Trash2,
  Truck,
  User,
  UserPlus,
  Home,
  MessageSquare,
  Check,
  Gift,
  Package,
  Loader2,
  Star,
  Search,
  X,
} from 'lucide-react'
import { getNeighborhoods, type Neighborhood } from '@/data/turkiye-api'
import { ISTANBUL_ILCELERI } from '@/data/istanbul-districts'

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount)

type NoticeTone = 'info' | 'success' | 'warning'

interface SurfaceNotice {
  id: number
  tone: NoticeTone
  title: string
  message: string
}

type CheckoutMode = 'undecided' | 'guest' | 'login' | 'register'
type PaymentMethod = 'credit_card' | 'bank_transfer'

const STEPS = [
  { id: 'cart', label: 'Sepetiniz' },
  { id: 'address', label: 'Teslimat' },
  { id: 'account', label: 'Üyelik' },
  { id: 'payment', label: 'Ödeme' }
] as const

type StepId = (typeof STEPS)[number]['id']

interface AddressForm {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
  district: string
  neighborhood: string
  notes: string
  deliveryDate: string
  deliveryTime: string
  isGift: boolean
  senderName: string
  messageCard: string
}

interface LoginForm {
  email: string
  password: string
}

interface RegisterForm {
  name: string
  surname: string
  email: string
  phone: string
  password: string
}

interface CardForm {
  number: string
  name: string
  expiry: string
  cvc: string
}

export default function SepetClient() {
  const { state, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart()
  const { state: customerState, login, register } = useCustomer()
  const { createOrder } = useOrder()
  const router = useRouter()

  // Step management
  const [stepIndex, setStepIndex] = useState(0)
  const currentStep: StepId = STEPS[stepIndex]?.id as StepId

  // Address form
  const [addressForm, setAddressForm] = useState<AddressForm>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    neighborhood: '',
    notes: '',
    deliveryDate: '',
    deliveryTime: '',
    isGift: false,
    senderName: '',
    messageCard: ''
  })

  // Account mode
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('undecided')
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: ''
  })

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card')
  const [cardForm, setCardForm] = useState<CardForm>({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  })

  // Neighborhood autocomplete
  const [neighborhoodSuggestions, setNeighborhoodSuggestions] = useState<Neighborhood[]>([])
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false)
  const [neighborhoodSearchOpen, setNeighborhoodSearchOpen] = useState(false)
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('')
  const neighborhoodInputRef = useRef<HTMLInputElement>(null)

  // Notifications
  const [surfaceNotice, setSurfaceNotice] = useState<SurfaceNotice | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  const isLoggedIn = !!customerState.currentCustomer
  const items = state.items
  const totalPrice = getTotalPrice()
  const totalCount = getTotalItems()
  const shippingPrice = 0 // Free shipping
  const estimatedTotal = totalPrice + shippingPrice

  const showNotice = (notice: Omit<SurfaceNotice, 'id'>) => {
    setSurfaceNotice({ id: Date.now(), ...notice })
  }

  useEffect(() => {
    if (!surfaceNotice) return
    const timer = window.setTimeout(() => setSurfaceNotice(null), 3600)
    return () => window.clearTimeout(timer)
  }, [surfaceNotice])

  // Handle district selection and fetch neighborhoods
  useEffect(() => {
    if (!addressForm.district) return

    const districtData = ISTANBUL_ILCELERI.find(d => d.name === addressForm.district)
    if (districtData) {
      setLoadingNeighborhoods(true)
      getNeighborhoods(districtData.id)
        .then(data => setNeighborhoodSuggestions(data))
        .catch(() => setNeighborhoodSuggestions([]))
        .finally(() => setLoadingNeighborhoods(false))
    }
  }, [addressForm.district])

  const validateStep = () => {
    switch (stepIndex) {
      case 0: {
        if (!items.length) {
          showNotice({
            tone: 'warning',
            title: 'Sepetiniz boş',
            message: 'Devam etmeden önce sepetinize ürün ekleyin.'
          })
          return false
        }
        return true
      }
      case 1: {
        const required = ['fullName', 'phone', 'address', 'district', 'neighborhood', 'deliveryDate', 'deliveryTime'] as const
        const missing = required.filter((key) => !addressForm[key]?.trim())
        if (missing.length) {
          showNotice({
            tone: 'warning',
            title: 'Teslimat bilgileri eksik',
            message: 'Lütfen tüm gerekli alanları doldurun.'
          })
          return false
        }
        return true
      }
      case 2: {
        if (checkoutMode === 'undecided') {
          showNotice({
            tone: 'warning',
            title: 'Üyelik seçeneği',
            message: 'Lütfen devam etme şeklinizi seçin.'
          })
          return false
        }
        return true
      }
      case 3: {
        if (paymentMethod === 'credit_card') {
          if (!cardForm.number.trim() || !cardForm.name.trim() || !cardForm.expiry.trim() || !cardForm.cvc.trim()) {
            showNotice({
              tone: 'warning',
              title: 'Kart bilgileri eksik',
              message: 'Ödeme bilgilerini tamamlayın.'
            })
            return false
          }
        }
        return true
      }
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const handlePrev = () => {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  const handlePlaceOrder = async () => {
    if (!validateStep()) return

    setIsProcessing(true)
    try {
      // Create order
      const order = await createOrder({
        items,
        recipientName: addressForm.fullName,
        recipientPhone: addressForm.phone,
        recipientAddress: addressForm.address,
        deliveryDate: addressForm.deliveryDate,
        deliveryTimeSlot: addressForm.deliveryTime,
        messageCard: addressForm.messageCard,
        isGift: addressForm.isGift,
        senderName: addressForm.senderName,
        paymentMethod: paymentMethod === 'credit_card' ? 'iyzico' : 'bank_transfer'
      })

      setOrderPlaced(true)
      showNotice({
        tone: 'success',
        title: 'Siparişiniz alındı',
        message: 'Ödeme onaylandıktan sonra siparişiniz hazırlanmaya başlayacak.'
      })
      clearCart()
    } catch (error) {
      showNotice({
        tone: 'warning',
        title: 'Hata',
        message: 'Siparişiniz oluşturulurken bir hata oluştu.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find(i => i.product.id === id)
    if (!item) return

    const nextQuantity = item.quantity + delta
    if (nextQuantity <= 0) {
      removeFromCart(id)
    } else {
      updateQuantity(id, nextQuantity)
    }
  }

  // Render functions
  const renderCartItems = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Sepet Özeti</p>
          <h2 className="text-2xl font-semibold text-slate-900">{totalCount} ürün</h2>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearCart()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#e05a4c]/60 hover:text-slate-900"
          >
            <Trash2 className="h-4 w-4" />
            Sepeti Temizle
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ffe5e5] text-[#e05a4c]">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Sepetiniz boş</h3>
          <p className="mt-2 text-sm text-slate-600">
            Sevdiklerinize çiçek göndermek için sepete ürün ekleyin.
          </p>
          <Link
            href="/kategoriler"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e05a4c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#cd3f31]"
          >
            <Sparkles className="h-4 w-4" />
            Çiçek Seç
          </Link>
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const lineTotal = item.product.price * item.quantity
            const imageUrl = item.product.image

            return (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                  <div className="relative mx-auto h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:mx-0">
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {formatPrice(item.product.price)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Çiçek Buketi</p>
                          <h3 className="text-lg font-semibold text-slate-900">{item.product.name}</h3>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500">Toplam: <span className="font-semibold text-slate-900">{formatPrice(lineTotal)}</span></p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, -1)}
                          className="rounded-l-full p-2 hover:bg-slate-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, 1)}
                          className="rounded-r-full p-2 hover:bg-slate-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-[#e05a4c]" />
                        Taze çiçek garantisi
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )

  const renderAddressForm = () => (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Teslimat Bilgileri</p>
        <h2 className="text-2xl font-semibold text-slate-900">Çiçekler nereye gitsin?</h2>
        <p className="text-sm text-slate-600">
          Sevdiklerinize ulaştırmak için teslimat bilgilerini girin. Tüm veriler SSL ile korunur.
        </p>
      </header>

      {/* Trust Guarantee Card */}
      <div className="rounded-3xl border border-[#d9efb8] bg-[#f3fbe3] p-5 text-sm text-slate-700 shadow-sm">
        <div className="flex items-start gap-3">
          <Truck className="h-5 w-5 text-[#549658]" />
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Güvenli Teslimat Garantisi</p>
            <p>Seçtiğiniz tarih ve saatte çiçekleriniz özenle hazırlanıp teslim edilir. %100 taze çiçek garantimiz var.</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        {/* Name */}
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          İsim Soyisim
          <input
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
            value={addressForm.fullName}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder="Ad Soyad"
          />
        </label>

        {/* Phone */}
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Telefon
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <Phone className="h-4 w-4 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              value={addressForm.phone}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="05xx xxx xx xx"
            />
          </div>
        </label>

        {/* District and Neighborhood */}
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          İlçe
          <select
            value={addressForm.district}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, district: event.target.value, neighborhood: '' }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
          >
            <option value="">İlçe Seçin</option>
            {ISTANBUL_ILCELERI.map(district => (
              <option key={district.id} value={district.name}>{district.name}</option>
            ))}
          </select>
        </label>

        {/* Neighborhood Autocomplete */}
        {addressForm.district && (
          <label className="flex flex-col gap-2 text-sm text-slate-600 relative">
            Mahalle
            <div className="relative">
              <input
                ref={neighborhoodInputRef}
                type="text"
                value={neighborhoodSearch || addressForm.neighborhood}
                onChange={(e) => {
                  const val = e.target.value
                  setNeighborhoodSearch(val)
                  setNeighborhoodSearchOpen(true)
                  setAddressForm((prev) => ({ ...prev, neighborhood: val }))
                }}
                onFocus={() => setNeighborhoodSearchOpen(true)}
                onBlur={() => setTimeout(() => setNeighborhoodSearchOpen(false), 200)}
                placeholder="Mahalle ara..."
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
              />
              {loadingNeighborhoods && (
                <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-[#e05a4c]" />
              )}

              {neighborhoodSearchOpen && !loadingNeighborhoods && neighborhoodSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {neighborhoodSuggestions
                    .filter(n => !neighborhoodSearch || n.name.toLowerCase().includes(neighborhoodSearch.toLowerCase()))
                    .slice(0, 15)
                    .map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setAddressForm((prev) => ({ ...prev, neighborhood: n.name }))
                          setNeighborhoodSearch('')
                          setNeighborhoodSearchOpen(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#e05a4c]/5 transition-colors flex items-center gap-2"
                      >
                        <span>{n.name}</span>
                      </button>
                    ))}
                </motion.div>
              )}
            </div>
          </label>
        )}

        {/* Address */}
        <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
          Açık Adres
          <textarea
            className="min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
            value={addressForm.address}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="Sokak, bina no, daire no, kat gibi detayları yazın"
          />
        </label>

        {/* Delivery Date */}
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Teslimat Tarihi
          <input
            type="date"
            value={addressForm.deliveryDate}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, deliveryDate: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
          />
        </label>

        {/* Delivery Time */}
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Teslimat Saati
          <select
            value={addressForm.deliveryTime}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, deliveryTime: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
          >
            <option value="">Saat Seçin</option>
            <option value="11:00-17:00">11:00 - 17:00 (Gündüz)</option>
            <option value="17:00-22:00">17:00 - 22:00 (Akşam)</option>
          </select>
        </label>

        {/* Notes */}
        <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
          Teslimat Notu
          <textarea
            className="min-h-[90px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
            value={addressForm.notes}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Kurye için notunuz (isteğe bağlı)"
          />
        </label>

        {/* Gift Option */}
        <label className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={addressForm.isGift}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, isGift: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-[#e05a4c] focus:ring-0"
          />
          <span className="text-sm text-slate-600">Bu bir hediye - Fiyat bilgisi gizlensin</span>
        </label>

        {/* Sender Name (if gift) */}
        {addressForm.isGift && (
          <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
            Gönderen Adı (Kartta görünecek)
            <input
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
              value={addressForm.senderName}
              onChange={(event) => setAddressForm((prev) => ({ ...prev, senderName: event.target.value }))}
              placeholder="Sevgilerimle, Ahmet"
            />
          </label>
        )}

        {/* Message Card */}
        <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
          Mesaj Kartı (Opsiyonel)
          <p className="text-xs text-slate-500">%80 müşterimiz mesaj ekliyor</p>
          <textarea
            className="min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:bg-white focus:outline-none"
            value={addressForm.messageCard}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, messageCard: event.target.value }))}
            placeholder="Sevdiklerinize özel bir mesaj yazın..."
            maxLength={200}
          />
          <p className="text-xs text-slate-400">{addressForm.messageCard.length}/200</p>
        </label>
      </div>
    </div>
  )

  const renderAccountStep = () => (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Üyelik Seçenekleri</p>
        <h2 className="text-2xl font-semibold text-slate-900">Nasıl devam etmek istersiniz?</h2>
        <p className="text-sm text-slate-600">
          Green hesabınıza giriş yapabilir, yeni bir üyelik oluşturabilir veya misafir olarak ödeme adımına geçebilirsiniz.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Guest Option */}
        <button
          onClick={() => setCheckoutMode('guest')}
          className={`flex flex-col gap-4 rounded-3xl border p-6 text-left transition shadow-sm ${
            checkoutMode === 'guest'
              ? 'border-[#e05a4c]/60 bg-[#ffe5e5] text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-[#e05a4c]/30 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">Misafir</span>
            <BadgeCheck className={`h-5 w-5 ${checkoutMode === 'guest' ? 'text-[#e05a4c]' : 'text-slate-300'}`} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Hızlı Ödeme</h3>
            <p className="text-sm text-slate-600">Üyelik oluşturmadan siparişinizi tamamlayın.</p>
            <p className="text-xs text-slate-500">Sadece 2 dakika</p>
          </div>
        </button>

        {/* Login Option */}
        <button
          onClick={() => setCheckoutMode('login')}
          className={`flex flex-col gap-4 rounded-3xl border p-6 text-left transition shadow-sm ${
            checkoutMode === 'login'
              ? 'border-[#e05a4c]/60 bg-[#ffe5e5] text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-[#e05a4c]/30 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">Mevcut</span>
            <LogIn className={`h-5 w-5 ${checkoutMode === 'login' ? 'text-[#e05a4c]' : 'text-slate-300'}`} />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Hesapla Devam Et</h3>
            <p className="text-sm text-slate-600">Siparış geçmişi ve kaydedilmiş adreslere erişin.</p>
            {checkoutMode === 'login' && (
              <div className="space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="E-posta"
                />
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Şifre"
                />
              </div>
            )}
          </div>
        </button>

        {/* Register Option */}
        <button
          onClick={() => setCheckoutMode('register')}
          className={`flex flex-col gap-4 rounded-3xl border p-6 text-left transition shadow-sm ${
            checkoutMode === 'register'
              ? 'border-[#e05a4c]/60 bg-[#ffe5e5] text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-[#e05a4c]/30 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">Yeni</span>
            <UserPlus className={`h-5 w-5 ${checkoutMode === 'register' ? 'text-[#e05a4c]' : 'text-slate-300'}`} />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Üyelik Oluştur</h3>
            <p className="text-sm text-slate-600">Sipariş geçmişi, hızlı iade, özel kampanyalar.</p>
            {checkoutMode === 'register' && (
              <div className="space-y-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ad"
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={registerForm.surname}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, surname: e.target.value }))}
                  placeholder="Soyad"
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="E-posta"
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Telefon"
                />
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Şifre"
                />
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Ödeme Seçenekleri</p>
        <h2 className="text-2xl font-semibold text-slate-900">Ödemenizi Tamamlayın</h2>
        <p className="text-sm text-slate-600">
          Ödemeleriniz 256-bit SSL ile korunur. Kartınız saklanmaz, veriler gelişmiş şifreleme ile işlenir.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Credit Card */}
        <button
          onClick={() => setPaymentMethod('credit_card')}
          className={`flex h-full flex-col gap-4 rounded-3xl border p-6 text-left transition shadow-sm ${
            paymentMethod === 'credit_card'
              ? 'border-[#e05a4c]/60 bg-[#ffe5e5] text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-[#e05a4c]/30 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">Kart</span>
            <CreditCard className={`h-6 w-6 ${paymentMethod === 'credit_card' ? 'text-[#e05a4c]' : 'text-slate-300'}`} />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Kredi / Banka Kartı</h3>
            <p className="text-sm text-slate-600">Tüm bankaların 3D Secure destekli kartlarıyla ödeme.</p>
          </div>

          {paymentMethod === 'credit_card' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                value={cardForm.number}
                onChange={(e) => setCardForm((prev) => ({ ...prev, number: e.target.value }))}
                placeholder="**** **** **** 4090"
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                value={cardForm.name}
                onChange={(e) => setCardForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ad Soyad"
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_100px]">
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm((prev) => ({ ...prev, expiry: e.target.value }))}
                  placeholder="AA/YY"
                />
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e05a4c] focus:outline-none"
                  value={cardForm.cvc}
                  onChange={(e) => setCardForm((prev) => ({ ...prev, cvc: e.target.value }))}
                  placeholder="CVV"
                />
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  <ShieldCheck className="mr-2 h-4 w-4 text-[#e05a4c]" />
                  3D Secure
                </div>
              </div>
            </motion.div>
          )}
        </button>

        {/* Bank Transfer */}
        <button
          onClick={() => setPaymentMethod('bank_transfer')}
          className={`flex h-full flex-col gap-4 rounded-3xl border p-6 text-left transition shadow-sm ${
            paymentMethod === 'bank_transfer'
              ? 'border-[#e05a4c]/60 bg-[#ffe5e5] text-slate-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-[#e05a4c]/30 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">EFT / Havale</span>
            <Banknote className={`h-6 w-6 ${paymentMethod === 'bank_transfer' ? 'text-[#e05a4c]' : 'text-slate-300'}`} />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Banka Transferi</h3>
            <p className="text-sm text-slate-600">Vadiler hesaplarına 7/24 FAST ile ödeme yapabilirsiniz.</p>
            {paymentMethod === 'bank_transfer' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
              >
                <p className="font-semibold text-slate-900">Banka Bilgileri</p>
                <p>Garanti BBVA - Vadiler</p>
                <p>IBAN: TR00 0000 0000 0000 0000 0000</p>
                <p className="text-xs text-slate-400">Açıklama: Sipariş numaranız ve adınız.</p>
              </motion.div>
            )}
          </div>
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#e05a4c]" />
          <p>Vadiler ödeme altyapısı BKM Express ve MasterCard güvenlik standartları ile uyumludur. Kart bilgileriniz saklanmaz.</p>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 'cart':
        return renderCartItems()
      case 'address':
        return renderAddressForm()
      case 'account':
        return renderAccountStep()
      case 'payment':
        return renderPaymentStep()
      default:
        return null
    }
  }

  const timelineProgress = (stepIndex / (STEPS.length - 1)) * 100
  const buttonLabel = stepIndex === STEPS.length - 1 ? 'Siparişi Tamamla' : `${STEPS[stepIndex + 1]?.label} →`

  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-24 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        {/* Header */}
        <header className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm">
            <ShoppingCart className="h-4 w-4 text-[#e05a4c]" />
            Modern Checkout
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Sepetiniz, teslimatınız ve ödemeniz tek sayfada. Her adım sade ve net.
            </h1>
            <p className="text-base text-slate-600">
              Adımları izleyerek sepetinizi düzenleyin, adresinizi girin, hesabınızla veya misafir olarak ilerleyin. Ödemeleriniz gelişmiş güvenlik standartlarıyla korunur.
            </p>
          </div>
        </header>

        {/* Progress */}
        <div className="space-y-6">
          <div className="relative rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em]">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
                    index <= stepIndex ? 'border-[#e05a4c]/60 bg-[#ffe5e5] text-[#a83a2a]' : 'border-slate-200 text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{step.label}</span>
                </div>
              ))}
            </div>
            <motion.span
              className="absolute left-10 right-10 top-1/2 h-px origin-left bg-gradient-to-r from-transparent via-[#e05a4c]/60 to-transparent"
              animate={{ scaleX: timelineProgress / 100 }}
            />
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {surfaceNotice && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm shadow-sm ${
                surfaceNotice.tone === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : surfaceNotice.tone === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              {surfaceNotice.tone === 'success' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : surfaceNotice.tone === 'warning' ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              <div>
                <p className="font-semibold">{surfaceNotice.title}</p>
                <p className="text-xs">{surfaceNotice.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div
            key={STEPS[stepIndex].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {renderStepContent()}
          </motion.div>

          {/* Sidebar Summary */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Sipariş Özeti</span>
                  <span className="text-lg font-semibold text-slate-900">{totalCount} ürün</span>
                </div>
                <Sparkles className="h-5 w-5 text-[#e05a4c]" />
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Ürün toplamı</span>
                  <span className="font-semibold text-slate-900">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kargo</span>
                  <span className="font-semibold text-slate-900">{formatPrice(shippingPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>KDV</span>
                  <span className="font-semibold text-slate-900">Dahil</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold text-slate-900">Tahmini toplam</span>
                  <span className="text-xl font-semibold text-[#e05a4c]">{formatPrice(estimatedTotal)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-[#e05a4c]" />
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Müşteri Deneyimi</p>
                  <p>Vadiler müşteri ekibi siparişinizin her adımında yanınızda. 7/24 canlı destek ile aklınızdaki soruları iletebilirsiniz.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Sonraki adım: {STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]?.label}</span>
            <span>Siparişinizi tamamlamadan önce tüm bilgilerinizi kontrol edin.</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-[#e05a4c]/50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </button>
            {stepIndex === STEPS.length - 1 ? (
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#e05a4c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#cd3f31] disabled:opacity-50"
              >
                <BadgeCheck className="h-4 w-4" />
                {isProcessing ? 'İşleniyor...' : 'Siparişi Tamamla'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b140a] transition hover:bg-slate-100"
              >
                {buttonLabel}
              </button>
            )}
          </div>
        </div>

        {/* Order Confirmation */}
        <AnimatePresence>
          {orderPlaced && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="relative overflow-hidden rounded-3xl border border-[#ffd9d9] bg-[#fff3f3] p-8 text-center text-slate-900 shadow-lg"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(224,90,76,0.18),_transparent_60%)]" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#e05a4c] shadow-[0_0_30px_rgba(224,90,76,0.25)]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-semibold">Siparişiniz Alındı!</h3>
                <p className="max-w-2xl text-sm text-slate-600">
                  Teşekkür ederiz. Siparişiniz onay için sıraya alındı. Vadiler ekibi kısa süre içinde sizinle iletişime geçecek. Hesabınız varsa siparişlerim bölümünden takip edebilirsiniz.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/kategoriler"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#e05a4c]/50 hover:text-slate-900"
                  >
                    Keşfe Devam Et
                  </Link>
                  <button
                    onClick={() => setOrderPlaced(false)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b140a] transition hover:bg-slate-100"
                  >
                    Yeni Sipariş Planla
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
