"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, RotateCw, Minus, Plus } from "lucide-react";

interface ProductGalleryDesktopProps {
  images: string[];
  productName: string;
  selectedImage: number;
  onImageSelect: (index: number) => void;
  onFullscreenOpen: () => void;
  discount?: number;
}

interface ZoomState {
  scale: number;
  x: number;
  y: number;
  isDragging?: boolean;
  dragStartX?: number;
  dragStartY?: number;
}

export default function ProductGalleryDesktop({
  images,
  productName,
  selectedImage,
  onImageSelect,
  onFullscreenOpen,
  discount = 0,
}: ProductGalleryDesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [zoomState, setZoomState] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [touchDistance, setTouchDistance] = useState(0);
  const [showZoomHint, setShowZoomHint] = useState(true);

  // Mouse wheel zoom - Amazon style
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current?.matches(":hover")) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomState((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + delta, 1), 2.5),
    }));
  }, []);

  // Mouse move for zoom point
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomState.scale <= 1 || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomState((prev) => ({
      ...prev,
      x: (x - 50) * (prev.scale - 1) * 0.3,
      y: (y - 50) * (prev.scale - 1) * 0.3,
    }));
  }, [zoomState.scale]);

  // Touch pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (touchDistance > 0) {
        const scale = Math.min(Math.max(distance / touchDistance, 1), 2.5);
        setZoomState((prev) => ({ ...prev, scale }));
      }
      setTouchDistance(distance);
    }
  }, [touchDistance]);

  const handleTouchEnd = () => setTouchDistance(0);

  // Increment/decrement zoom
  const zoomIn = () => setZoomState((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.25, 2.5) }));
  const zoomOut = () => setZoomState((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.25, 1) }));

  const handlePrevImage = () => {
    setZoomState({ scale: 1, x: 0, y: 0 });
    onImageSelect((selectedImage - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setZoomState({ scale: 1, x: 0, y: 0 });
    onImageSelect((selectedImage + 1) % images.length);
  };

  const resetZoom = () => setZoomState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    if (isZooming) setShowZoomHint(false);
  }, [isZooming]);

  return (
    <div className="hidden lg:flex flex-col gap-4">
      {/* Main Gallery - Retina Ready - lg+ breakpoint */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => {
          setIsZooming(false);
          resetZoom();
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_20px_80px_rgba(15,23,42,0.15)] aspect-square max-h-[600px] max-w-[600px] cursor-zoom-in select-none group"
      >
        {/* Grid overlay for product inspection */}
        {isZooming && zoomState.scale > 1 && (
          <div className="absolute inset-0 z-10 pointer-events-none opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }} />
          </div>
        )}

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-transparent to-black/5 z-10 pointer-events-none" />

        {/* Main image container */}
        <motion.div
          ref={imageContainerRef}
          animate={{
            scale: zoomState.scale,
            x: `${zoomState.x * 0.1}%`,
            y: `${zoomState.y * 0.1}%`,
          }}
          transition={{ type: "tween", duration: 0.2 }}
          className="w-full h-full"
        >
          <Image
            src={images[selectedImage] || images[0]}
            alt={productName}
            fill
            sizes="(max-width: 1280px) 50vw, (max-width: 1536px) 40vw, 600px"
            className="object-cover will-change-transform"
            priority
            quality={95}
          />
        </motion.div>

        {/* Discount badge - positioned better */}
        {discount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-6 left-6 px-5 py-3 rounded-full text-white text-base font-bold bg-gradient-to-r from-[#e05a4c] to-[#d43a2a] shadow-[0_8px_24px_rgba(224,90,76,0.3)] z-20"
          >
            -{discount}%
          </motion.div>
        )}

        {/* Zoom hint */}
        <AnimatePresence>
          {showZoomHint && isZooming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm z-20"
            >
              Kaydır ve yakınlaştır
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom controls - Amazon style */}
        <AnimatePresence>
          {isZooming && zoomState.scale > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-6 left-6 flex flex-col items-center gap-2 z-20"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={zoomIn}
                className="h-10 w-10 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all"
                title="Yakınlaştır"
              >
                <Plus size={18} />
              </motion.button>
              <div className="text-xs font-semibold text-slate-700 bg-white/90 px-2 py-1 rounded-full">
                {Math.round(zoomState.scale * 100)}%
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={zoomOut}
                className="h-10 w-10 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all"
                title="Uzaklaştır"
              >
                <Minus size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetZoom}
                className="h-10 w-10 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all"
                title="Sıfırla"
              >
                <RotateCw size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen & Info button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onFullscreenOpen}
          className="absolute bottom-6 right-6 rounded-full bg-white/95 text-slate-800 px-5 py-3 text-xs font-semibold shadow-lg hover:bg-white transition-all z-20 flex items-center gap-2"
        >
          <Maximize2 size={16} />
          Tam ekran
        </motion.button>

        {/* Navigation arrows - better visibility */}
        {images.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.15, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white hover:shadow-xl transition-all z-20 backdrop-blur-sm"
              aria-label="Önceki resim"
            >
              <ChevronLeft size={24} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15, x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white hover:shadow-xl transition-all z-20 backdrop-blur-sm"
              aria-label="Sonraki resim"
            >
              <ChevronRight size={24} />
            </motion.button>
          </>
        )}
      </div>

      {/* Thumbnail rail - Horizontal scroll with better UX */}
      {images.length > 1 && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory">
            {images.map((img, idx) => (
              <motion.button
                key={`gallery-thumb-${idx}`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  onImageSelect(idx);
                  resetZoom();
                }}
                className={`relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all snap-center ${
                  selectedImage === idx
                    ? "border-[#e05a4c] shadow-[0_0_0_4px_rgba(224,90,76,0.15)]"
                    : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${productName}-thumb-${idx}`}
                  fill
                  sizes="96px"
                  className="object-cover group-hover:scale-105 transition-transform"
                  quality={80}
                />
                {selectedImage === idx && (
                  <div className="absolute inset-0 bg-[#e05a4c]/10" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Image counter & scrollbar hint */}
          <div className="flex items-center justify-between px-1">
            <div className="text-sm text-slate-500 font-medium">
              <span className="text-[#e05a4c] font-bold">{selectedImage + 1}</span>
              <span className="text-slate-400"> / {images.length}</span>
            </div>
            {images.length > 5 && (
              <p className="text-xs text-slate-400">← Kaydır →</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
