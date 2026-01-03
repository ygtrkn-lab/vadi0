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
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineHome
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { Squares, GradientText, BlurText, StarBorder, ShinyText } from '@/components/ui-kit';
import { useCustomer } from '@/context/CustomerContext';

// Slider images - çiçek görselleri
const sliderImages = [
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&q=80',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80',
  'https://images.unsplash.com/photo-1518882605630-8eb7c9641e00?w=1200&q=80',
  'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1200&q=80',
  'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=1200&q=80',
];

export default function GirisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <GirisContent />
    </Suspense>
  );
}

function GirisContent() {
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
  const [currentSlide, setCurrentSlide] = useState(0);
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
  // Guard against redirecting back to /giris and causing loops.
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
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    
    // Türkiye telefon numarası: 10 haneli (5XX XXX XX XX)
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
    // Türkiye cep telefonu: 5 ile başlamalı ve 10 haneli olmalı
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

    // Eğer OTP henüz doğrulanmadıysa, önce OTP'yi gerçekten doğrula
    if (!otpVerified) {
      if (otpCode.length !== 6) {
        setError('Lütfen 6 haneli kodu eksiksiz girin.');
        return;
      }

      setIsLoading(true);

      try {
        // Sadece OTP doğrulaması için özel endpoint kullan
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
          // OTP doğru
          setOtpVerified(true);
          setSuccess('Kod doğrulandı! Şimdi yeni şifrenizi belirleyin.');
        } else {
          // OTP hatalı
          setError(result.error || 'Doğrulama kodu hatalı.');
        }
      } catch (err) {
        setError('Doğrulama işlemi sırasında bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // OTP doğrulandıysa, şifre güncelleme
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
    // Admin session redirect (keep compatibility) but do NOT use customer session here.
    const user = localStorage.getItem('vadiler_user');
    if (!user) return;

    try {
      const userData = JSON.parse(user);
      const sessionAge = Date.now() - (userData.loginTime || 0);
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 saat

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
    // Prevent redirect loops: only redirect once CustomerContext has fully restored session.
    if (!customerState.isReady) return;
    if (!customerState.isAuthenticated) return;
    if (!customerState.currentCustomer) return;
    if (didAutoRedirectRef.current) return;
    didAutoRedirectRef.current = true;

    // If user is already logged in, go to intended page.
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

    // Customer login
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

    // Real customer registration
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
    <div className="min-h-[100dvh] flex bg-black">
      {/* Left Side - Image Slider with Squares Background */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Squares Background */}
        <Squares 
          speed={0.3} 
          squareSize={50}
          direction='diagonal'
          borderColor='rgba(255,255,255,0.08)'
          hoverFillColor='rgba(255,255,255,0.03)'
        />
        
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
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Home Button */}
          <Link 
            href="/" 
            className="group flex items-center gap-3 w-fit px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-300"
          >
            <HiOutlineHome className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
            <span className="text-white/90 group-hover:text-white font-medium text-sm transition-colors">
              Anasayfaya Dön
            </span>
          </Link>

          {/* Center Content */}
          <div className="max-w-lg">
            <BlurText
              text="Sevdiklerinize Özel Anlar"
              className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6"
              delay={100}
              animateBy="words"
              direction="top"
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <ShinyText
                text="İstanbul geneline hızlı teslimat ile sevdiklerinizi mutlu edin."
                speed={4}
                className="text-lg mb-10 leading-relaxed"
              />
            </motion.div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: HiOutlineTruck, text: 'Hızlı Teslimat' },
                { icon: HiOutlineSparkles, text: 'Taze Çiçek Garantisi' },
                { icon: HiOutlineShieldCheck, text: 'Güvenli Alışveriş' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10
                    flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-white/70 font-medium">{feature.text}</span>
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-neutral-950 relative overflow-hidden overflow-y-auto">
        {/* Subtle grid background for form side */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Gradient glow */}
        <div 
          className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.3), transparent 70%)',
          }}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 
              flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <GradientText 
              colors={['#a855f7', '#ec4899', '#a855f7']} 
              animationSpeed={4}
              className="font-bold text-xl"
            >
              Vadiler
            </GradientText>
          </Link>

          {/* Header */}
          <div className="mb-5 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {otpStep ? (
                <BlurText text="E-posta doğrulama" delay={50} animateBy="words" className="inline-flex" />
              ) : activeTab === 'login' ? (
                <BlurText text="Tekrar hoş geldiniz" delay={50} animateBy="words" className="inline-flex" />
              ) : (
                <BlurText text="Hesap oluşturun" delay={50} animateBy="words" className="inline-flex" />
              )}
            </h2>
            <ShinyText
              text={otpStep ? 'E-postanıza gelen 6 haneli kodu girin' : activeTab === 'login' ? 'Hesabınıza giriş yapın' : 'Alışverişe başlamak için üye olun'}
              speed={5}
              className="text-base"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-neutral-900 rounded-xl p-1 mb-5 sm:mb-8 border border-neutral-800">
            <button
              onClick={() => { resetOtpFlow(); setActiveTab('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { resetOtpFlow(); setActiveTab('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Üye Ol
            </button>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-center gap-3 text-emerald-400 bg-emerald-500/10 
                  border border-emerald-500/20 px-4 py-3 rounded-xl"
              >
                <HiOutlineShieldCheck className="w-5 h-5 flex-shrink-0" />
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
                className="mb-6 flex items-center gap-3 text-red-400 bg-red-500/10 
                  border border-red-500/20 px-4 py-3 rounded-xl"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="space-y-4 sm:space-y-5"
              >
                <div className="text-sm text-neutral-400">
                  <div className="flex items-center justify-between gap-3">
                    <span>Doğrulama kodu:</span>
                    <span className="text-neutral-300 truncate max-w-[60%]">{otpEmail}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    6 haneli kod
                  </label>
                  <div className="relative">
                    <HiOutlineShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                        text-white placeholder:text-neutral-600
                        focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                        transition-all duration-200"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                      {otpCode.length}/6
                    </div>
                  </div>
                </div>

                <StarBorder
                  as="button"
                  type="submit"
                  disabled={isLoading}
                  color="rgba(168, 85, 247, 0.6)"
                  speed="4s"
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2 font-semibold">
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
                  </span>
                </StarBorder>

                <button
                  type="button"
                  onClick={() => { resetOtpFlow(); setError(''); setSuccess(''); }}
                  className="w-full text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Geri dön
                </button>
              </motion.form>
            ) : activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-4 sm:space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                        text-white placeholder:text-neutral-600
                        focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                        transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Şifre
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                        text-white placeholder:text-neutral-600
                        focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                        transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300
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
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white 
                        focus:ring-white/20 focus:ring-offset-0"
                    />
                    <span className="text-sm text-neutral-400">Beni hatırla</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Şifremi unuttum
                  </button>
                </div>

                <StarBorder
                  as="button"
                  type="submit"
                  disabled={isLoading}
                  color="rgba(168, 85, 247, 0.6)"
                  speed="4s"
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2 font-semibold">
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
                  </span>
                </StarBorder>

                {/* Divider */}
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-neutral-950 text-neutral-500">veya</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 
                      bg-neutral-900 border border-neutral-800 rounded-xl 
                      hover:bg-neutral-800 hover:border-neutral-700 transition-all"
                  >
                    <FcGoogle className="w-5 h-5" />
                    <span className="text-sm font-medium text-neutral-300">Google</span>
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-3 sm:space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Adınız
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adınız"
                        className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl 
                          text-white placeholder:text-neutral-600
                          focus:ring-2 focus:ring-white/20 focus:border-neutral-700
                          transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Soyadınız
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Soyadınız"
                        className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl 
                          text-white placeholder:text-neutral-600
                          focus:ring-2 focus:ring-white/20 focus:border-neutral-700
                          transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="5XX XXX XX XX"
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl 
                        text-white placeholder:text-neutral-600
                        focus:ring-2 focus:ring-white/20 focus:border-neutral-700
                        transition-all duration-200"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                      {phone.length}/10
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">5 ile başlayan 10 haneli numara</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl 
                        text-white placeholder:text-neutral-600
                        focus:ring-2 focus:ring-white/20 focus:border-neutral-700
                        transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Şifre
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl 
                          text-white placeholder:text-neutral-600
                          focus:ring-2 focus:ring-white/20 focus:border-neutral-700
                          transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Tekrar
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl 
                          text-white placeholder:text-neutral-600
                          focus:ring-2 focus:ring-white/20 focus:border-neutral-700
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
                    className="w-4 h-4 mt-0.5 rounded border-neutral-700 bg-neutral-900 text-white 
                      focus:ring-white/20 focus:ring-offset-0"
                  />
                  <span className="text-sm text-neutral-500">
                    <Link href="/uyelik-sozlesmesi" className="text-neutral-300 hover:text-white">
                      Üyelik Sözleşmesi
                    </Link>&apos;ni ve{' '}
                    <Link href="/gizlilik" className="text-neutral-300 hover:text-white">
                      Gizlilik Politikası
                    </Link>&apos;nı kabul ediyorum.
                  </span>
                </label>

                <StarBorder
                  as="button"
                  type="submit"
                  disabled={isLoading}
                  color="rgba(236, 72, 153, 0.6)"
                  speed="4s"
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2 font-semibold">
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
                  </span>
                </StarBorder>

                {/* Divider */}
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-neutral-950 text-neutral-500">veya</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 
                      bg-neutral-900 border border-neutral-800 rounded-xl 
                      hover:bg-neutral-800 hover:border-neutral-700 transition-all"
                  >
                    <FcGoogle className="w-5 h-5" />
                    <span className="text-sm font-medium text-neutral-300">Google</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer */}
          <p className="text-center text-neutral-600 text-xs sm:text-sm mt-4 sm:mt-8">
            © 2025 Vadiler. Tüm hakları saklıdır.
          </p>
        </motion.div>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={resetPasswordResetFlow}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {passwordResetStep === 1 ? 'Şifremi Unuttum' : 'Yeni Şifre Belirle'}
                </h2>
                <button
                  onClick={resetPasswordResetFlow}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm"
                >
                  {success}
                </motion.div>
              )}

              {passwordResetStep === 1 ? (
                <form onSubmit={handlePasswordResetEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      E-posta Adresiniz
                    </label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="ornek@email.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                          text-white placeholder:text-neutral-600
                          focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                          transition-all duration-200"
                        required
                      />
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      Kayıtlı e-posta adresinize şifre sıfırlama kodu göndereceğiz.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-white text-black rounded-xl
                      font-semibold hover:bg-neutral-200 transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Gönderiliyor...
                      </span>
                    ) : (
                      'Kod Gönder'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordResetVerify} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Doğrulama Kodu
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="━━━━━━"
                      maxLength={6}
                      disabled={otpVerified}
                      className="w-full px-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                        text-white text-center text-2xl tracking-[0.5em] placeholder:text-neutral-700
                        focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 font-mono"
                      required
                    />
                    <p className="mt-2 text-xs text-neutral-500 text-center">
                      E-posta adresinize gönderilen 6 haneli kodu girin
                    </p>
                  </div>

                  {otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                          Yeni Şifre
                        </label>
                        <div className="relative">
                          <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => handleNewPasswordChange(e.target.value)}
                            placeholder="En az 6 karakter"
                            className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                              text-white placeholder:text-neutral-600
                              focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                              transition-all duration-200"
                            required
                          />
                        </div>
                        {newPassword && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-neutral-500">Şifre Gücü</span>
                              <span className="font-medium text-white">
                                {passwordStrength >= 75 ? 'Güçlü' :
                                 passwordStrength >= 50 ? 'Orta' :
                                 'Zayıf'}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${passwordStrength}%` }}
                                className="h-full bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                          Yeni Şifre (Tekrar)
                        </label>
                        <div className="relative">
                          <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Şifreyi tekrar girin"
                            className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-neutral-800 rounded-xl 
                              text-white placeholder:text-neutral-600
                              focus:ring-2 focus:ring-white/20 focus:border-neutral-700 focus:bg-neutral-900
                              transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-white text-black rounded-xl
                      font-semibold hover:bg-neutral-200 transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {otpVerified ? 'Şifre Güncelleniyor...' : 'Doğrulanıyor...'}
                      </span>
                    ) : (
                      otpVerified ? 'Şifremi Güncelle' : 'Kodu Doğrula'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordResetStep(1);
                      setOtpCode('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setOtpVerified(false);
                      setError('');
                    }}
                    className="w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    ← Geri Dön
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
