'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSetting } from '@/hooks/useSettings';

const footerLinks = {
  kategoriler: {
    title: "Kategoriler",
    items: [
      { name: "Güller", href: "/guller" },
      { name: "Aranjmanlar", href: "/aranjmanlar" },
      { name: "Buketler", href: "/buketler" },
      { name: "Orkideler", href: "/orkideler" },
      { name: "Doğum Günü", href: "/dogum-gunu" },
      { name: "Tüm Kategoriler", href: "/kategoriler" },
    ]
  },
  kurumsal: {
    title: "Kurumsal",
    items: [
      { name: "Hakkımızda", href: "/hakkimizda" },
      { name: "Müşteri Politikası", href: "/musteri-politikasi" },
      { name: "Ürün Güvenliği", href: "/urun-guvenligi" },
      { name: "KVKK", href: "/kvkk" },
      { name: "Gizlilik Politikası", href: "/gizlilik" },
      { name: "Çerez Politikası", href: "/cerez-politikasi" },
    ]
  },
  yardim: {
    title: "Yardım",
    items: [
      { name: "Sipariş Takibi", href: "/siparis-takip" },
      { name: "Kullanım Koşulları", href: "/kullanim-kosullari" },
      { name: "Mesafeli Satış", href: "/mesafeli-satis" },
      { name: "Üyelik Sözleşmesi", href: "/uyelik-sozlesmesi" },
      { name: "Bilgi Güvenliği", href: "/bilgi-guvenligi" },
      { name: "Yasal Bilgiler", href: "/yasal" },
    ]
  },
  hesabim: {
    title: "Hesabım",
    items: [
      { name: "Giriş Yap", href: "/giris" },
      { name: "Siparişlerim", href: "/hesabim/siparislerim" },
      { name: "Favorilerim", href: "/hesabim/favorilerim" },
      { name: "Adreslerim", href: "/hesabim/adreslerim" },
      { name: "Ayarlar", href: "/hesabim/ayarlar" },
    ]
  },
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [openSections, setOpenSections] = useState<string[]>([]);
  
  // Get social links from settings
  const instagram = useSetting('social', 'instagram', 'https://instagram.com/vadilercom');
  const facebook = useSetting('social', 'facebook', 'https://facebook.com/vadilercom');
  const twitter = useSetting('social', 'twitter', 'https://twitter.com/vadilercom');

  const socialMedia = [
    {
      name: "Instagram",
      href: instagram?.toString() || "https://instagram.com/vadilercom",
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: facebook?.toString() || "https://facebook.com/vadilercom",
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "Twitter",
      href: twitter?.toString() || "https://twitter.com/vadilercom",
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
  ];

  const toggleSection = (key: string) => {
    setOpenSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || subscribeStatus !== 'idle') return;

    setSubscribeStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setSubscribeStatus('success');
      setTimeout(() => {
        setEmail('');
        setSubscribeStatus('idle');
      }, 3000);
    }, 1000);
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 border-t border-gray-200">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2 space-y-4 sm:space-y-6">
            <Link href="/" className="inline-block group">
              <Image
                src="/logo.png"
                alt="Vadiler Çiçek"
                width={140}
                height={45}
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-sm">
              Türkiye&apos;nin en güvenilir online çiçek mağazası. Taze çiçeklerle sevdiklerinize mutluluk gönderin.
            </p>

            {/* Contact Info */}
            <FooterPhone />

            {/* Newsletter */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-gray-900 text-xs sm:text-sm font-semibold">Bültenimize Abone Olun</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta"
                  disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/50 focus:border-[#e05a4c] transition-all disabled:opacity-60"
                />
                <button 
                  type="submit"
                  disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
                  className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#e05a4c] to-red-600 hover:from-[#d04a3c] hover:to-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 whitespace-nowrap disabled:opacity-70"
                >
                  {subscribeStatus === 'loading' ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : subscribeStatus === 'success' ? (
                    'Tamam ✓'
                  ) : (
                    'Abone Ol'
                  )}
                </button>
              </form>
            </div>

            {/* Social Media */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-gray-900 text-xs sm:text-sm font-semibold">Bizi Takip Edin</h4>
              <div className="flex gap-2 sm:gap-3">
                {socialMedia.map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border border-gray-200 hover:border-[#e05a4c] flex items-center justify-center transition-all hover:scale-110 hover:bg-[#e05a4c]/10 shadow-sm hover:shadow-md"
                    title={platform.name}
                  >
                    <platform.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-[#e05a4c] transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links Sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="space-y-3 sm:space-y-4">
                {/* Mobilde tıklanabilir başlık */}
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between md:cursor-default"
                >
                  <h3 className="text-gray-900 text-xs sm:text-sm font-bold tracking-wide uppercase">
                    {section.title}
                  </h3>
                  <svg 
                    className={`w-4 h-4 text-gray-500 md:hidden transition-transform duration-300 ${openSections.includes(key) ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Mobilde açılıp kapanan, desktop'ta her zaman açık liste */}
                <ul className={`space-y-1.5 sm:space-y-2.5 overflow-hidden transition-all duration-300 md:!max-h-[500px] md:!opacity-100 ${openSections.includes(key) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 md:max-h-[500px] md:opacity-100'}`}>
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-gray-600 hover:text-[#e05a4c] text-xs sm:text-sm transition-colors inline-flex items-center group"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform">
                          {item.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6 sm:mb-8"></div>

        {/* Payment Methods Band */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <Image
                src="/logo_band_colored@3x.png"
                alt="Güvenli Ödeme"
                width={400}
                height={30}
                className="w-full h-auto object-contain opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6 sm:mb-8"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6">
          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
            <p>© {new Date().getFullYear()} <span className="font-bold text-gray-900">VADİLER<span className="text-[#e05a4c]">ÇİÇEK</span></span></p>
            <span className="hidden sm:inline">•</span>
            <p>Tüm hakları saklıdır.</p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <Link
              href="/gizlilik"
              className="text-xs sm:text-sm text-gray-600 hover:text-[#e05a4c] transition-colors"
            >
              Gizlilik
            </Link>
            <Link
              href="/kullanim-kosullari"
              className="text-xs sm:text-sm text-gray-600 hover:text-[#e05a4c] transition-colors"
            >
              Şartlar
            </Link>
            <Link
              href="/cerez-politikasi"
              className="text-xs sm:text-sm text-gray-600 hover:text-[#e05a4c] transition-colors"
            >
              Çerezler
            </Link>
            <FooterContactLink />
          </div>

          {/* Badges/Trust Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] sm:text-xs text-gray-700 font-medium shadow-sm">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="hidden xs:inline">SSL</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] sm:text-xs text-gray-700 font-medium shadow-sm">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="hidden xs:inline">Güvenli</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] sm:text-xs text-gray-700 font-medium shadow-sm">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#e05a4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="hidden xs:inline">Hızlı</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Footer phone component with settings
function FooterPhone() {
  const phone = useSetting('site', 'phone', '0850 307 4876');
  const phoneHref = phone?.toString().replace(/\s/g, '') || '08503074876';

  return (
    <div className="space-y-2">
      <a 
        href={`tel:${phoneHref}`} 
        className="flex items-center gap-2 text-gray-700 hover:text-[#e05a4c] transition-colors group"
      >
        <svg className="w-4 h-4 text-[#e05a4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="text-sm font-semibold group-hover:underline">{phone}</span>
      </a>
    </div>
  );
}

// Footer contact link with settings
function FooterContactLink() {
  return (
    <Link
      href="/iletisim"
      className="text-xs sm:text-sm text-gray-600 hover:text-[#e05a4c] transition-colors"
    >
      İletişim
    </Link>
  );
}
