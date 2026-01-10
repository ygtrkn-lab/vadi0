'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { Truck, Flower2, ShieldCheck } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import { FcGoogle } from 'react-icons/fc';
import { Header, Footer, MobileNavBar } from '@/components';
import { useCustomer } from '@/context/CustomerContext';
import { slides as heroSlides } from '@/data/products';

// Use homepage hero slides images for consistency
const sliderImages = (Array.isArray(heroSlides) && heroSlides.length > 0)
  ? heroSlides.map((s) => s.mobileImage ?? s.image)
  : [];

export default function GirisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" />}>
      <GirisContent />
    </Suspense>
  );
}

function GirisContent() {
    const features = [
      { icon: <Truck className="w-6 h-6 text-[#e05a4c]" />, text: 'Hızlı Teslimat' },
      { icon: <Flower2 className="w-6 h-6 text-[#e05a4c]" />, text: 'Taze Çiçek Garantisi' },
      { icon: <ShieldCheck className="w-6 h-6 text-[#e05a4c]" />, text: 'Güvenli Alışveriş' },
    ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'register' | 'password-reset'>('login');
  const [otpId, setOtpId] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  // Password reset states
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, register, verifyLoginOtp, verifyRegisterOtp, forgotPassword, verifyPasswordResetOtp, state: customerState } = useCustomer();

  const didAutoRedirectRef = useRef(false);

  const redirectParam = searchParams?.get('redirect');
  const redirectTargetRaw = redirectParam && redirectParam.startsWith('/') ? redirectParam : null;
  const redirectTarget = redirectTargetRaw && !redirectTargetRaw.startsWith('/giris') ? redirectTargetRaw : null;

  const resetOtpFlow = () => {
    setOtpStep(false);
    setOtpPurpose('login');
    setOtpId('');
    setOtpEmail('');
    setOtpCode('');
  };

  const resetPasswordResetFlow = () => {
    setShowPasswordResetModal(false);
    setPasswordResetStep(1);
    setResetEmail('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordStrength(0);
    setOtpId('');
    setOtpEmail('');
    setOtpCode('');
    setOtpVerified(false);
    setError('');
    setSuccess('');
  };

  // Telefon numarası formatlama fonksiyonu
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers;
    }
    return numbers.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^5[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleForgotPassword = () => {
    setShowPasswordResetModal(true);
    setPasswordResetStep(1);
    setError('');
    setSuccess('');
  };

  const handlePasswordResetEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await forgotPassword(resetEmail);
      
      if (result.success && result.otpId) {
        setOtpId(result.otpId);
        setOtpEmail(result.email || resetEmail);
        setPasswordResetStep(2);
        setSuccess('Şifre sıfırlama kodu e-posta adresinize gönderildi.');
      } else {
        setError(result.error || 'Şifre sıfırlama işlemi başlatılamadı.');
      }
    } catch (err) {
      setError('Şifre sıfırlama işlemi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpVerified) {
      if (otpCode.length !== 6) {
        setError('Lütfen 6 haneli kodu eksiksiz girin.');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/customers/password-reset/validate-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            otpId,
            email: otpEmail,
            code: otpCode,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setOtpVerified(true);
          setSuccess('Kod doğrulandı! Şimdi yeni şifrenizi belirleyin.');
        } else {
          setError(result.error || 'Doğrulama kodu hatalı.');
        }
      } catch (err) {
        setError('Doğrulama işlemi sırasında bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyPasswordResetOtp({
        otpId,
        email: otpEmail,
        code: otpCode,
        newPassword,
      });

      if (result.success) {
        setSuccess('Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          resetPasswordResetFlow();
          setActiveTab('login');
        }, 2000);
      } else {
        setError(result.error || 'Şifre güncellenemedi.');
      }
    } catch (err) {
      setError('Şifre güncelleme işlemi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('vadiler_user');
    if (!user) return;

    try {
      const userData = JSON.parse(user);
      const sessionAge = Date.now() - (userData.loginTime || 0);
      const maxSessionAge = 24 * 60 * 60 * 1000;

      if (sessionAge >= maxSessionAge) {
        localStorage.removeItem('vadiler_user');
        return;
      }

      if (userData.role === 'admin') {
        const target = redirectTarget && redirectTarget.startsWith('/yonetim') ? redirectTarget : '/yonetim';
        router.replace(target);
      }
    } catch {
      localStorage.removeItem('vadiler_user');
    }
  }, [router, redirectTarget]);

  useEffect(() => {
    if (!customerState.isReady) return;
    if (!customerState.isAuthenticated) return;
    if (!customerState.currentCustomer) return;
    if (didAutoRedirectRef.current) return;
    didAutoRedirectRef.current = true;

    router.replace(redirectTarget || '/');
  }, [customerState.isReady, customerState.isAuthenticated, customerState.currentCustomer, router, redirectTarget]);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Admin login check
    if (email === 'bilgi@vadiler.com' && password === 'Uytn22mzybn') {
      localStorage.setItem('vadiler_user', JSON.stringify({ 
        email, 
        name: 'Admin', 
        role: 'admin',
        loginTime: Date.now() 
      }));
      const target = redirectTarget && redirectTarget.startsWith('/yonetim') ? redirectTarget : '/yonetim';
      router.replace(target);
      return;
    }

    const result = await login(email, password);

    if (result.success && result.requiresOtp && result.otpId && result.email) {
      setOtpPurpose('login');
      setOtpId(result.otpId);
      setOtpEmail(result.email);
      setOtpCode('');
      setSuccess('Doğrulama kodu e-postanıza gönderildi.');
      setOtpStep(true);
    } else if (!result.success) {
      setError(result.error || 'Giriş yapılırken bir hata oluştu.');
    } else {
      setError('Doğrulama kodu oluşturulamadı.');
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');

    const redirectTo = `${window.location.origin}/giris${
      redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''
    }`;

    const result = await loginWithGoogle({ redirectTo });
    if (!result.success) {
      setError(result.error || 'Google ile giriş başlatılamadı.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim() || !surname.trim()) {
      setError('İsim ve soyisim alanları zorunludur.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      setIsLoading(false);
      return;
    }

    if (!validatePhoneNumber(phone)) {
      setError('Geçerli bir Türkiye telefon numarası giriniz (5XX XXX XX XX).');
      setIsLoading(false);
      return;
    }

    const result = await register({
      email,
      name: `${name.trim()} ${surname.trim()}`,
      phone: phone,
      password,
    });

    if (result.success && result.requiresOtp && result.otpId && result.email) {
      setOtpPurpose('register');
      setOtpId(result.otpId);
      setOtpEmail(result.email);
      setOtpCode('');
      setSuccess('Doğrulama kodu e-postanıza gönderildi.');
      setOtpStep(true);
    } else if (!result.success) {
      setError(result.error || 'Kayıt olurken bir hata oluştu.');
    } else {
      setError('Doğrulama kodu oluşturulamadı.');
    }
    
    setIsLoading(false);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const code = otpCode.replace(/\D/g, '').slice(0, 6);
    const verifier = otpPurpose === 'login' ? verifyLoginOtp : verifyRegisterOtp;

    const result = await verifier({ otpId, email: otpEmail, code });

    if (result.success) {
      router.replace(redirectTarget || '/');
    } else {
      setError(result.error || 'Doğrulama başarısız.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-white">
      {/* Left Side - Image Slider */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden mt-0">
        {/* Slider Images */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <Image
              src={sliderImages[currentSlide]}
              alt="Çiçek"
              fill
              className="object-cover"
              priority
            />
            {/* Darker overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/30" />
          </motion.div>
        </AnimatePresence>

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="absolute inset-0 bg-black/20 rounded-2xl pointer-events-none" />
          {/* Logo / Home Button */}
          <Link 
            href="/" 
            className="group flex items-center gap-3 w-fit px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-300"
          >
            <svg className="w-5 h-5 text-white/90 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-white/90 group-hover:text-white font-medium text-sm transition-colors">
              Anasayfaya Dön
            </span>
          </Link>

          {/* Center Content */}
          <div className="max-w-lg">
            <motion.h1
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.8, type: 'spring' }}
              className="text-4xl xl:text-5xl font-extrabold mb-6 drop-shadow-lg leading-tight"
            >
              <GradientText className="animate-gradient bg-gradient-to-r from-[#e05a4c] via-[#ff7a6b] to-[#e05a4c] bg-clip-text text-transparent">
                <motion.span
                  style={{ display: 'inline-block' }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
                  className="tracking-tight"
                >
                  Sevdiklerinize Özel Anlar
                </motion.span>
              </GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="text-lg text-white/90 mb-10 leading-relaxed animate-fadein font-sans"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' }}
            >
              İstanbul geneline hızlı teslimat ile sevdiklerinizi mutlu edin.
            </motion.p>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                    <motion.div
                      key={feature.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3 + i * 0.2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
                        whileHover={{ scale: 1.06 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <span className="text-white/90 font-semibold tracking-tight text-lg animate-fadein" style={{fontFamily:'Inter, sans-serif'}}>{feature.text}</span>
                    </motion.div>
              ))}
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center gap-3">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-8 h-2 bg-white rounded-full' 
                    : 'w-2 h-2 bg-white/30 rounded-full hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-white relative overflow-hidden overflow-y-auto pt-60 lg:pt-12">
        {/* Mobile Hero - Only on mobile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden w-full max-w-md mb-8 text-center absolute top-24"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {otpStep ? 'E-posta Doğrulama' : activeTab === 'login' ? 'Hesabınıza Giriş Yapın' : 'Hesap Oluşturun'}
          </h1>
          <p className="text-slate-600">
            {otpStep 
              ? 'E-postanıza gönderilen kodu girin' 
              : activeTab === 'login' 
                ? 'Siparişlerinizi takip edin' 
                : 'Ücretsiz üye olun'}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10 lg:mt-0 mt-0"
        >
                {/* Tabs */}
                {!otpStep && (
                  <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-8">
                    <button
                      onClick={() => { resetOtpFlow(); setActiveTab('login'); setError(''); setSuccess(''); }}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                        activeTab === 'login'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Giriş Yap
                    </button>
                    <button
                      onClick={() => { resetOtpFlow(); setActiveTab('register'); setError(''); setSuccess(''); }}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                        activeTab === 'register'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Üye Ol
                    </button>
                  </div>
                )}

                {/* Messages */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 flex items-center gap-3 text-emerald-700 bg-emerald-50 
                        border border-emerald-200 px-4 py-3 rounded-xl"
                    >
                      <HiOutlineShieldCheck className="w-5 h-5 shrink-0" />
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 flex items-center gap-3 text-red-700 bg-red-50 
                        border border-red-200 px-4 py-3 rounded-xl"
                    >
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forms */}
                <AnimatePresence mode="wait">
                  {otpStep ? (
                    <motion.form
                      key="otp"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleOtpVerify}
                      className="space-y-5"
                    >
                      <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span>Doğrulama kodu gönderildi:</span>
                          <span className="text-slate-900 font-medium truncate max-w-[60%]">{otpEmail}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          6 Haneli Kod
                        </label>
                        <div className="relative">
                          <HiOutlineShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="••••••"
                            className="w-full pl-12 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-xl 
                              text-slate-900 placeholder:text-slate-400 text-lg tracking-widest text-center
                              focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                              transition-all duration-200"
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                            {otpCode.length}/6
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#e05a4c] text-white rounded-xl font-semibold
                          hover:bg-[#d54a3c] transition-all duration-200 shadow-lg shadow-[#e05a4c]/25
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Doğrulanıyor...
                          </>
                        ) : (
                          <>
                            Doğrula
                            <HiOutlineArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { resetOtpFlow(); setError(''); setSuccess(''); }}
                        className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
                      >
                        ← Geri dön
                      </button>
                    </motion.form>
                  ) : activeTab === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleLogin}
                      className="space-y-5"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          E-posta
                        </label>
                        <div className="relative">
                          <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl 
                              text-slate-900 placeholder:text-slate-400
                              focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                              transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Şifre
                        </label>
                        <div className="relative">
                          <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl 
                              text-slate-900 placeholder:text-slate-400
                              focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                              transition-all duration-200"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600
                              transition-colors"
                          >
                            {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-[#e05a4c] 
                              focus:ring-[#e05a4c]/20 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-600">Beni hatırla</span>
                        </label>
                        <button 
                          type="button" 
                          onClick={handleForgotPassword}
                          className="text-sm text-[#e05a4c] hover:text-[#d54a3c] font-medium transition-colors"
                        >
                          Şifremi unuttum
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#e05a4c] text-white rounded-xl font-semibold
                          hover:bg-[#d54a3c] transition-all duration-200 shadow-lg shadow-[#e05a4c]/25
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Giriş yapılıyor...
                          </>
                        ) : (
                          <>
                            Giriş Yap
                            <HiOutlineArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-slate-500">veya</span>
                        </div>
                      </div>

                      {/* Google Login */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 
                          bg-white border border-slate-200 rounded-xl 
                          hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700"
                      >
                        <FcGoogle className="w-5 h-5" />
                        Google ile devam et
                      </button>
                      {/* Modern Home Button */}
                      <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#e05a4c] to-[#ff7a6b] text-white font-bold text-base shadow-lg hover:from-[#d54a3c] hover:to-[#e05a4c] transition-all duration-200 border-2 border-[#e05a4c] hover:border-[#d54a3c] focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/40"
                        style={{ zIndex: 10000 }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Anasayfaya Dön
                      </Link>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Adınız
                          </label>
                          <div className="relative">
                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Adınız"
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                                text-slate-900 placeholder:text-slate-400
                                focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                                transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Soyadınız
                          </label>
                          <div className="relative">
                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              value={surname}
                              onChange={(e) => setSurname(e.target.value)}
                              placeholder="Soyadınız"
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                                text-slate-900 placeholder:text-slate-400
                                focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                                transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Telefon Numarası
                        </label>
                        <div className="relative">
                          <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="5XX XXX XX XX"
                            maxLength={10}
                            className="w-full pl-12 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                              text-slate-900 placeholder:text-slate-400
                              focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                              transition-all duration-200"
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                            {phone.length}/10
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">5 ile başlayan 10 haneli numara</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          E-posta
                        </label>
                        <div className="relative">
                          <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                              text-slate-900 placeholder:text-slate-400
                              focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                              transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Şifre
                          </label>
                          <div className="relative">
                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••"
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                                text-slate-900 placeholder:text-slate-400
                                focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                                transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tekrar
                          </label>
                          <div className="relative">
                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••"
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl 
                                text-slate-900 placeholder:text-slate-400
                                focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] focus:bg-white
                                transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer py-2">
                        <input
                          type="checkbox"
                          required
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#e05a4c] 
                            focus:ring-[#e05a4c]/20 focus:ring-offset-0"
                        />
                        <span className="text-sm text-slate-600">
                          <Link href="/uyelik-sozlesmesi" className="text-[#e05a4c] hover:underline">
                            Üyelik Sözleşmesi
                          </Link>&apos;ni ve{' '}
                          <Link href="/gizlilik" className="text-[#e05a4c] hover:underline">
                            Gizlilik Politikası
                          </Link>&apos;nı kabul ediyorum.
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#e05a4c] text-white rounded-xl font-semibold
                          hover:bg-[#d54a3c] transition-all duration-200 shadow-lg shadow-[#e05a4c]/25
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Kaydediliyor...
                          </>
                        ) : (
                          <>
                            Hesap Oluştur
                            <HiOutlineArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-slate-500">veya</span>
                        </div>
                      </div>

                      {/* Google Login */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 
                          bg-white border border-slate-200 rounded-xl 
                          hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700"
                      >
                        <FcGoogle className="w-5 h-5" />
                        Google ile devam et
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
        </motion.div>
      </div>

      {/* Mobile Footer & Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <MobileNavBar />
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={resetPasswordResetFlow}
          >
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">Şifre Sıfırlama</h3>
                <p className="text-sm text-slate-600 mb-4">{passwordResetStep === 1 ? 'E-posta adresinizi girin' : 'E-postanıza gönderilen kodu girin ve yeni şifrenizi belirleyin'}</p>

                {passwordResetStep === 1 ? (
                  <div className="space-y-4">
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="E-posta adresiniz" className="w-full px-4 py-3 border rounded-lg" />
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={async (e) => { e.stopPropagation(); await handlePasswordResetEmailSubmit(e as any); }} disabled={isLoading} className="w-full py-3 bg-[#e05a4c] text-white rounded-lg">{isLoading ? 'Gönderiliyor...' : 'Kodu Gönder'}</button>
                      <button type="button" onClick={resetPasswordResetFlow} className="w-full py-2 text-sm text-slate-600">İptal</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Kodu girin" className="w-full px-4 py-3 border rounded-lg text-center" />
                    {otpVerified && (
                      <>
                        <input type="password" value={newPassword} onChange={(e) => handleNewPasswordChange(e.target.value)} placeholder="Yeni şifre" className="w-full px-4 py-3 border rounded-lg" />
                        <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Yeni şifre (tekrar)" className="w-full px-4 py-3 border rounded-lg" />
                      </>
                    )}
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={async (e) => { e.stopPropagation(); await handlePasswordResetVerify(e as any); }} disabled={isLoading} className="w-full py-3 bg-[#e05a4c] text-white rounded-lg">{isLoading ? (otpVerified ? 'Şifre Güncelleniyor...' : 'Doğrulanıyor...') : (otpVerified ? 'Şifremi Güncelle' : 'Kodu Doğrula')}</button>
                      <button type="button" onClick={() => { setPasswordResetStep(1); setOtpCode(''); setNewPassword(''); setConfirmNewPassword(''); setOtpVerified(false); setError(''); }} className="w-full py-2 text-sm text-slate-600">← Geri Dön</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
