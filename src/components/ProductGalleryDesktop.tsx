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
  showWeeklyCampaignBadge?: boolean;
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
  showWeeklyCampaignBadge = false,
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
      {/* Main Gallery - Clean Style */}
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
        className="relative rounded-xl overflow-hidden bg-[#fafafa] aspect-square cursor-zoom-in select-none group"
      >
        {/* Subtle vignette (placed below image) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/5 z-0 pointer-events-none" />

        {/* Main image container */}
        <motion.div
          ref={imageContainerRef}
          animate={{
            scale: zoomState.scale,
            x: `${zoomState.x * 0.1}%`,
            y: `${zoomState.y * 0.1}%`,
          }}
          transition={{ type: "tween", duration: 0.2 }}
          className="w-full h-full relative z-10"
        >
          <Image
            src={images[selectedImage] || images[0]}
            alt={productName}
            fill
            sizes="(max-width: 1280px) 50vw, (max-width: 1536px) 40vw, 600px"
            className="object-cover will-change-transform z-10"
            priority
            quality={95}
          />
        </motion.div>

        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-sm font-semibold bg-[#e05a4c] shadow-lg z-20">
            -%{discount}
          </div>
        )}

        {/* Weekly campaign badge */}
        {showWeeklyCampaignBadge && (
          <div className="absolute left-4 top-14 z-20">
            <Image
              src="/TR/bugune-ozel.png"
              alt="Bugüne Özel"
              width={80}
              height={80}
              className="h-16 w-16 drop-shadow"
            />
          </div>
        )}

        {/* Zoom hint */}
        <AnimatePresence>
          {showZoomHint && isZooming && zoomState.scale === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm z-20"
            >
              Scroll ile yakınlaştır
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom controls */}
        <AnimatePresence>
          {isZooming && zoomState.scale > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 flex items-center gap-2 z-20"
            >
              <button
                onClick={zoomOut}
                className="h-8 w-8 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-lg hover:bg-gray-50 transition"
              >
                <Minus size={14} />
              </button>
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                {Math.round(zoomState.scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="h-8 w-8 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-lg hover:bg-gray-50 transition"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={resetZoom}
                className="h-8 w-8 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-lg hover:bg-gray-50 transition"
              >
                <RotateCw size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen button */}
        <button
          onClick={onFullscreenOpen}
          className="absolute bottom-4 right-4 rounded-full bg-white/90 text-gray-700 px-4 py-2 text-sm font-medium shadow-lg hover:bg-white transition z-20 flex items-center gap-2 backdrop-blur-sm"
        >
          <Maximize2 size={14} />
          Tam ekran
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-lg hover:bg-white transition z-20 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-lg hover:bg-white transition z-20 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail rail */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={`gallery-thumb-${idx}`}
              onClick={() => {
                onImageSelect(idx);
                resetZoom();
              }}
              className={`relative h-16 w-16 xl:h-20 xl:w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === idx
                  ? "border-[#e05a4c] ring-2 ring-[#e05a4c]/20"
                  : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`${productName}-thumb-${idx}`}
                fill
                sizes="80px"
                className="object-cover"
                quality={70}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}