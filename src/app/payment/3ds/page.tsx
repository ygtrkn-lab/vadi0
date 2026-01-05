'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import Image from 'next/image';

function extractInlineScripts(html: string): string[] {
  const matches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  const scripts: string[] = [];
  for (const m of matches) {
    const code = (m[1] || '').trim();
    if (code) scripts.push(code);
  }
  return scripts;
}

function ThreeDSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iyzicoContainerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const htmlContent = searchParams.get('html');
    
    if (!htmlContent) {
      setError('3DS doğrulama bilgileri eksik');
      setLoading(false);
      setTimeout(() => router.push('/sepet'), 3000);
      return;
    }

    const container = iyzicoContainerRef.current;
    if (!container) return;

    try {
      const decoded = atob(htmlContent);

      // Clear previous content
      container.innerHTML = '';

      // Create iyzico container
      const checkoutDiv = document.createElement('div');
      checkoutDiv.id = 'iyzipay-checkout-form';
      checkoutDiv.className = 'responsive';
      container.appendChild(checkoutDiv);

      // Reset global iyziInit
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        if (w.iyziInit) {
          delete w.iyziInit;
          w.iyziInit = undefined;
        }
      } catch {
        // ignore
      }

      // Remove previously injected scripts
      for (const s of Array.from(document.querySelectorAll('script[data-iyzico-checkout="1"]'))) {
        s.parentElement?.removeChild(s);
      }

      // Execute inline scripts
      const scripts = extractInlineScripts(decoded);
      for (const code of scripts) {
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.setAttribute('data-iyzico-checkout', '1');
        scriptEl.text = code;
        document.body.appendChild(scriptEl);
      }

      // Fallback: inject HTML
      if (scripts.length === 0) {
        container.insertAdjacentHTML('beforeend', decoded);
      }

      setLoading(false);
    } catch (e) {
      console.error('❌ Failed to mount 3DS form:', e);
      setError('3DS formu yüklenemedi');
      setLoading(false);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Bir Hata Oluştu</h1>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <p className="text-gray-400 text-xs">Sepet sayfasına yönlendiriliyorsunuz...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#e05a4c] to-[#e8b4bc] rounded-xl flex items-center justify-center shadow-sm">
                <CreditCard size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Güvenli Ödeme</h1>
                <p className="text-xs text-gray-500">3D Secure Doğrulama</p>
              </div>
            </div>
            <Image
              src="/iyzico/iyzicoLogoWhite.svg"
              alt="iyzico"
              width={80}
              height={24}
              className="h-6 w-auto opacity-70"
            />
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Güvenli Ödeme Sayfası
              </p>
              <p className="text-xs text-blue-800">
                Bankanızın 3D Secure doğrulama sayfasına yönlendirildiniz. 
                Lütfen SMS ile gelen doğrulama kodunu girin. İşlem tamamlandığında 
                otomatik olarak sitemize döneceksiniz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Loader2 className="w-12 h-12 text-[#e05a4c] animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">3D Secure formu yükleniyor...</p>
            <p className="text-gray-400 text-sm mt-2">Lütfen bekleyin</p>
          </div>
        </div>
      )}

      {/* iyzico Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          <div ref={iyzicoContainerRef} className="w-full" />
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-600" />
            <span>SSL Güvenli Bağlantı</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-blue-600" />
            <span>PCI DSS Uyumlu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThreeDSPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-12 h-12 text-[#e05a4c] animate-spin" />
        </div>
      }
    >
      <ThreeDSContent />
    </Suspense>
  );
}
