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
    <div className="hidden lg:flex flex-col gap-3">
      {/* Main Gallery - Compact Apple Style */}
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
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 shadow-md aspect-square max-h-[420px] cursor-zoom-in select-none group"
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

        {/* Discount badge - Compact */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-white text-xs font-bold bg-[#e05a4c] shadow-md z-20">
            -{discount}%
          </div>
        )}

        {/* Zoom hint */}
        <AnimatePresence>
          {showZoomHint && isZooming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm z-20"
            >
              Yakınlaştır
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom controls - Compact */}
        <AnimatePresence>
          {isZooming && zoomState.scale > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-3 flex flex-col items-center gap-1.5 z-20"
            >
              <button
                onClick={zoomIn}
                className="h-7 w-7 rounded-lg bg-white/90 text-slate-700 flex items-center justify-center shadow-md hover:bg-white transition"
              >
                <Plus size={14} />
              </button>
              <span className="text-[10px] font-medium text-slate-600 bg-white/80 px-1.5 py-0.5 rounded">
                {Math.round(zoomState.scale * 100)}%
              </span>
              <button
                onClick={zoomOut}
                className="h-7 w-7 rounded-lg bg-white/90 text-slate-700 flex items-center justify-center shadow-md hover:bg-white transition"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={resetZoom}
                className="h-7 w-7 rounded-lg bg-white/90 text-slate-700 flex items-center justify-center shadow-md hover:bg-white transition"
              >
                <RotateCw size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen button - Compact */}
        <button
          onClick={onFullscreenOpen}
          className="absolute bottom-3 right-3 rounded-lg bg-white/90 text-slate-700 px-3 py-1.5 text-[11px] font-semibold shadow-md hover:bg-white transition z-20 flex items-center gap-1.5"
        >
          <Maximize2 size={12} />
          Tam ekran
        </button>

        {/* Navigation arrows - Compact */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-white/90 text-slate-700 flex items-center justify-center shadow-md hover:bg-white transition z-20"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-white/90 text-slate-700 flex items-center justify-center shadow-md hover:bg-white transition z-20"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail rail - Compact */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={`gallery-thumb-${idx}`}
              onClick={() => {
                onImageSelect(idx);
                resetZoom();
              }}
              className={`relative h-14 w-14 xl:h-16 xl:w-16 flex-shrink-0 rounded-lg overflow-hidden border transition-all ${
                selectedImage === idx
                  ? "border-[#e05a4c] ring-2 ring-[#e05a4c]/20"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName}-thumb-${idx}`}
                fill
                sizes="64px"
                className="object-cover"
                quality={70}
              />
            </button>
          ))}
          {/* Image counter */}
          <div className="flex items-center px-2 text-[11px] text-slate-400 font-medium">
            {selectedImage + 1}/{images.length}
          </div>
        </div>
      )}
    </div>
  );
}