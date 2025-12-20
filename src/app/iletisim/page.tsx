'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNavBar from '@/components/MobileNavBar';
import { Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';

export default function IletisimPage() {
  const phone = useSetting('site', 'phone', '0850 307 4876');
  const phoneHref = phone?.toString().replace(/\s/g, '') || '08503074876';

  return (
    <>
      <Header />
      <div className="h-0 lg:h-40" />
      
      <main className="min-h-screen pt-[26px] lg:pt-[18px] pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container-custom">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 bg-gradient-to-r from-[#e05a4c] to-[#c94a3c] bg-clip-text text-transparent">
              Bize Ulaşın
            </h1>
            <p className="text-base lg:text-lg text-gray-600 leading-relaxed px-4">
              Sorularınız, önerileriniz veya özel sipariş talepleriniz için bizimle iletişime geçin. 
              Size en kısa sürede dönüş yapalım.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto px-4 lg:px-0">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Phone Card */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg shadow-gray-200/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e05a4c] to-[#c94a3c] 
                    flex items-center justify-center shadow-lg shadow-[#e05a4c]/20">
                    <Phone className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Telefon</h3>
                </div>
                <a 
                  href={`tel:${phoneHref}`}
                  className="block text-gray-600 hover:text-[#e05a4c] transition-colors font-medium"
                >
                  {phone}
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Hafta içi: 09:00 - 18:00<br />
                  Hafta sonu: 10:00 - 17:00
                </p>
              </div>

              {/* Office Address Card */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg shadow-gray-200/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e05a4c] to-[#c94a3c] 
                    flex items-center justify-center shadow-lg shadow-[#e05a4c]/20">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Merkez Ofisimiz</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Soğanlı mah Gökçe sok no:1 kat: 4<br />
                  Bahçelievler İstanbul
                </p>
              </div>

              {/* Social Media Card */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg shadow-gray-200/50 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sosyal Medya</h3>
                <div className="flex gap-3 justify-center">
                  <a
                    href="https://www.tiktok.com/@vadilercom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-black to-gray-800 
                      flex items-center justify-center hover:scale-110 transition-transform 
                      shadow-lg shadow-black/20"
                    aria-label="TikTok"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/vadilercom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 
                      flex items-center justify-center hover:scale-110 transition-transform 
                      shadow-lg shadow-purple-500/20"
                    aria-label="Instagram"
                  >
                    <Instagram className="text-white" size={20} />
                  </a>
                  <a
                    href="https://www.facebook.com/vadilercom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 
                      flex items-center justify-center hover:scale-110 transition-transform 
                      shadow-lg shadow-blue-600/20"
                    aria-label="Facebook"
                  >
                    <Facebook className="text-white" size={20} />
                  </a>
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-gradient-to-br from-[#e05a4c] to-[#c94a3c] rounded-2xl lg:rounded-3xl 
                shadow-lg shadow-[#e05a4c]/20 p-6 text-white">
                <h3 className="text-lg font-bold mb-3">Hızlı Bilgi</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5" />
                    <span>İstanbul geneli ücretsiz kargo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5" />
                    <span>Özel tasarım hizmeti sunuyoruz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5" />
                    <span>Kurumsal satış için özel fiyatlar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5" />
                    <span>Taze ve kaliteli ürün garantisi</span>
                  </li>
                </ul>
              </div>

              {/* Company Info Card */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg shadow-gray-200/50 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Şirket Bilgilerimiz</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Ünvan</p>
                    <p>STR GRUP ANONİM ŞİRKETİ</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Ticaret Sicil Numarası</p>
                    <p>702202</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Adres</p>
                    <p>SOĞANLI MAH. GÖLÇE SOKAK NO: 1 İÇ KAPI NO: 4<br />BAHÇELİEVLER / İSTANBUL</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Vergi Dairesi / Vergi Numarası</p>
                    <p>KOCASİNAN / 7810867621</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">E-posta</p>
                    <a href="mailto:bilgi@vadiler.com" className="text-[#e05a4c] hover:underline">
                      bilgi@vadiler.com
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">KEP Adresi</p>
                    <p>strgrup@hs01.kep.tr</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Yer Sağlayıcı</p>
                    <p>Vadiler İnternet Hizmetleri</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </>
  );
}
