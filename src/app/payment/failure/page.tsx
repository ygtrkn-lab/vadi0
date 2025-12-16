'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const error = searchParams.get('error') || 'Ödeme işlemi başarısız oldu';
  const conversationId = searchParams.get('conversationId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ödeme Başarısız
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 text-left">{error}</p>
            </div>
          </div>

          {conversationId && (
            <p className="text-xs text-gray-500 mb-6 font-mono">
              Ref: {conversationId.substring(0, 12)}...
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/sepet')}
              className="w-full bg-[#e8b4bc] text-white py-3 rounded-lg hover:bg-[#d9a3ab] transition-colors font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Sepete Dön ve Tekrar Dene
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Ana Sayfaya Dön
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Sık Karşılaşılan Sorunlar:
            </p>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>• Kart bilgilerinizi kontrol edin</li>
              <li>• Kartınızda yeterli bakiye olduğundan emin olun</li>
              <li>• 3D Secure şifrenizi doğru girdiğinizden emin olun</li>
              <li>• Bankanızla iletişime geçin</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Sorun devam ederse lütfen{' '}
            <button
              onClick={() => router.push('/iletisim')}
              className="text-[#e8b4bc] hover:underline font-medium"
            >
              müşteri hizmetleri
            </button>
            ile iletişime geçin
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PaymentFailureContent />
    </Suspense>
  );
}
