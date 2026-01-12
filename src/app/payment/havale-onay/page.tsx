"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { downloadPdfClientSide } from "@/lib/print";
import { useCart } from "@/context/CartContext";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  }).format(amount);
}

function BankTransferConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [data, setData] = useState<{
    orderNumber: number | null;
    amount: number | null;
    items: { name: string; quantity: number; unitPrice: number; total: number }[];
  }>({ orderNumber: null, amount: null, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  const handleDownloadPdf = async () => {
    if (data.orderNumber === null || !pdfRef.current) return;
    try {
      await downloadPdfClientSide(pdfRef.current, `vadiler-siparis-${data.orderNumber}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  useEffect(() => {
    const fromQueryOrderNumber = searchParams.get("orderNumber");
    const fromQueryAmount = searchParams.get("amount");

    if (process.env.NODE_ENV === 'development') {
      console.log('Havale page - Query params:', { fromQueryOrderNumber, fromQueryAmount });
    }

    const normalizeItems = (raw: any) =>
      Array.isArray(raw)
        ? raw
            .map((item) => ({
              name: typeof item?.name === "string" ? item.name : "",
              quantity: Number(item?.quantity) || 0,
              unitPrice: Number(item?.unitPrice) || 0,
              total: Number(item?.total) || 0,
            }))
            .filter((item) => item.name && item.quantity > 0)
        : [];

    let storedInfo: any = null;
    try {
      const stored = localStorage.getItem("vadiler_bank_transfer_info");
      if (stored) {
        storedInfo = JSON.parse(stored);
        if (process.env.NODE_ENV === 'development') {
          console.log('Havale page - localStorage data:', storedInfo);
        }
      }
    } catch (e) {
      console.error('Failed to parse localStorage:', e);
      storedInfo = null;
    }

    const resolvedOrderNumber = fromQueryOrderNumber && Number.isFinite(Number(fromQueryOrderNumber))
      ? Number(fromQueryOrderNumber)
      : (typeof storedInfo?.orderNumber === "number" ? storedInfo.orderNumber : null);

    const resolvedAmount = fromQueryAmount && Number.isFinite(Number(fromQueryAmount))
      ? Number(fromQueryAmount)
      : (typeof storedInfo?.totalAmount === "number" ? storedInfo.totalAmount : null);

    const resolvedItems = normalizeItems(storedInfo?.items);

    if (process.env.NODE_ENV === 'development') {
      console.log('Havale page - Resolved:', { resolvedOrderNumber, resolvedAmount });
    }

    if (resolvedOrderNumber !== null && resolvedAmount !== null) {
      setData({ orderNumber: resolvedOrderNumber, amount: resolvedAmount, items: resolvedItems });
      setIsLoading(false);
      
      // Checkout flag'i temizle, sepet ve form verilerini koru
      try {
        localStorage.removeItem('vadiler_checkout_started');
      } catch {}
      
      return;
    }

    // Fallback to cart if nothing usable
    if (process.env.NODE_ENV === 'development') {
      console.warn('Havale page - No data found, redirecting to cart');
    }
    setIsLoading(false);
    router.push("/sepet");
  }, [router, searchParams]);

  const amountText = useMemo(() =>
    data.amount !== null && Number.isFinite(data.amount)
      ? formatPrice(data.amount)
      : "Tutar alınamadı"
  , [data.amount]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="bg-white shadow-sm rounded-2xl p-8 text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-[#e05a4c] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-700">Sipariş bilgileriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (data.orderNumber === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="bg-white shadow-sm rounded-2xl p-8 text-center max-w-md w-full">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-4">Sipariş bilgisi bulunamadı.</p>
          <Link
            href="/sepet"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold"
          >
            Sepete Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gray-900 text-white px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-200 uppercase tracking-[0.18em]">Havale / EFT Onayı</p>
              <h1 className="text-xl font-bold mt-1">Siparişiniz oluşturuldu</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-300">Sipariş No</p>
              <p className="font-mono text-lg">#{data.orderNumber}</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-300 uppercase tracking-[0.12em]">Ödenecek Tutar</p>
                <p className="text-3xl font-bold mt-1">{amountText}</p>
                <p className="text-xs text-gray-400 mt-2">Açıklama kısmına sipariş numarasını eklemeyi unutmayın.</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sipariş No</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">#{data.orderNumber}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(data.orderNumber))}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">Durum</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Ödeme Bekleniyor</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Banka</span>
                <Image src="/TR/garanti.svg" alt="Garanti Bankası" width={120} height={28} className="h-7 w-auto" />
              </div>
              <div className="py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm block mb-1">Hesap Sahibi</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-900 text-center">STR GRUP A.Ş</p>
                  <button
                    onClick={() => navigator.clipboard.writeText("STR GRUP A.Ş")}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Kopyala</span>
                  </button>
                </div>
              </div>
              <div className="py-2.5">
                <span className="text-gray-500 text-sm block mb-1">IBAN</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-mono text-sm text-gray-900 leading-relaxed text-center">TR12 0006 2000 7520 0006 2942 76</p>
                  <button
                    onClick={() => navigator.clipboard.writeText("TR120006200075200006294276")}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>IBAN'ı Kopyala</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Açıklama kısmına <span className="font-semibold">#{data.orderNumber}</span> yazın. Ödeme tamamlandığında siparişiniz onaylanacaktır.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href={`/siparis-takip?siparis=${encodeURIComponent(String(data.orderNumber))}`}
                className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-center"
              >
                Siparişi Takip Et
              </Link>
              <Link
                href="/"
                className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-center"
              >
                Alışverişe Devam Et
              </Link>
              <button
                onClick={handleDownloadPdf}
                className="w-full py-3.5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                  <path d="M12 3v12"></path>
                  <path d="m8 11 4 4 4-4"></path>
                  <path d="M5 19h14"></path>
                </svg>
                PDF Olarak İndir
              </button>
            </div>
          </div>
        </motion.div>
        <div className="absolute -left-[9999px] top-0">
          <div
            ref={pdfRef}
            className="w-[720px] bg-white text-gray-900 rounded-2xl border border-gray-200 p-10 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Havale / EFT Fişi</p>
                <h2 className="text-2xl font-semibold mt-1">Vadiler Sipariş Onayı</h2>
                <p className="text-sm text-gray-600 mt-2">Tarih: {formatDate(new Date())}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Sipariş No</p>
                <p className="font-mono text-xl font-semibold">#{data.orderNumber}</p>
                <p className="mt-2 text-sm text-gray-700">Tutar: {amountText}</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Sepet Özeti</p>
              <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-50 text-[11px] font-semibold text-gray-600 px-4 py-2">
                  <span className="col-span-6">Ürün</span>
                  <span className="col-span-2 text-center">Adet</span>
                  <span className="col-span-2 text-right">Birim</span>
                  <span className="col-span-2 text-right">Tutar</span>
                </div>
                {data.items.length > 0 ? (
                  data.items.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="grid grid-cols-12 px-4 py-3 border-t border-gray-100 text-sm text-gray-800">
                      <span className="col-span-6 pr-3 font-medium">{item.name}</span>
                      <span className="col-span-2 text-center text-gray-700">{item.quantity}x</span>
                      <span className="col-span-2 text-right text-gray-700">{formatPrice(item.unitPrice)}</span>
                      <span className="col-span-2 text-right font-semibold">{formatPrice(item.total)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-500">Sepet özeti bulunamadı.</div>
                )}
                <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm font-semibold text-gray-900">
                  <span className="col-span-8">Toplam</span>
                  <span className="col-span-4 text-right">{amountText}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end">
              <div className="p-3 border border-gray-200 rounded-xl" data-qr>
                <QRCode value={`https://vadiler.com/siparis-takip?siparis=${data.orderNumber ?? ''}`} size={120} />
                <p className="text-[11px] text-gray-600 mt-2 text-center">Bu QR'ı okutarak siparişinizi takip edebilirsiniz.</p>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
              <p>• Açıklama kısmına <span className="font-semibold">#{data.orderNumber}</span> yazın.</p>
              <p className="mt-2">• Ödeme onayı sonrası siparişiniz işleme alınır.</p>
              <p className="mt-2">• Bu fiş, ödeme dekontunuza eklemek için hazırlanmıştır.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BankTransferConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="bg-white shadow-sm rounded-2xl p-8 text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-[#e05a4c] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-700">Yükleniyor...</p>
        </div>
      </div>
    }>
      <BankTransferConfirmPageContent />
    </Suspense>
  );
}

