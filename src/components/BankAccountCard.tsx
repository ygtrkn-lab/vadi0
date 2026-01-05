'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';

type Props = {
  iban: string;
  bankName: string;
  accountName: string;
  logoSrc?: string;
};

export default function BankAccountCard({ iban, bankName, accountName, logoSrc }: Props) {
  const [copied, setCopied] = useState(false);

  const copyIban = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }, [iban]);

  return (
    <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-white to-gray-50 border border-gray-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary-100/20 blur-2xl group-hover:bg-primary-100/30 transition" />
      <div className="space-y-6 md:space-y-8 relative">
        <div className="space-y-2">
          <p className="text-xs md:text-sm text-gray-500">Banka</p>
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={`${bankName} logo`}
                width={200}
                height={48}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <p className="text-xl md:text-2xl font-semibold text-gray-900">{bankName}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs md:text-sm text-gray-500">Hesap Adı</p>
          <p className="text-lg md:text-xl font-semibold text-gray-900">{accountName}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <p className="text-xs md:text-sm text-gray-500">IBAN</p>
            <div className={`relative inline-flex items-center w-full rounded-2xl bg-gray-100/70 px-4 py-3 md:px-5 md:py-4 ${copied ? 'border border-green-400/60 ring-2 ring-green-500/20' : 'border border-gray-200'}`}>
              <span className={`absolute inset-0 pointer-events-none opacity-0 ${copied ? 'opacity-100' : ''} bg-gradient-to-r from-transparent via-green-100/40 to-transparent`} />
              <span className="relative font-mono font-bold tracking-wider text-gray-900 leading-tight text-sm sm:text-base md:text-lg lg:text-xl break-all sm:break-normal">
                {iban}
              </span>
            </div>
          </div>
          <div className="sm:pt-6">
            <button
              onClick={copyIban}
              className={`relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-semibold transition-all shadow-sm
                ${copied ? 'bg-green-600 text-white shadow-green-500/30' : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'}`}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopyala
                </>
              )}
            </button>
          </div>
        </div>
        <div className="text-xs md:text-sm text-gray-600">
          Havale/EFT açıklamasına sipariş numaranızı eklemeyi unutmayınız.
        </div>
      </div>
    </div>
  );
}
