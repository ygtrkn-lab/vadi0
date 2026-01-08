"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, RotateCw, Minus, Plus, Play, Pause, Volume2, VolumeX } from "lucide-react";

// URL'den medya türünü belirle
function getMediaType(url: string): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';
  const lowered = url.toLowerCase();
  if (lowered.includes('.mp4') || lowered.includes('.webm') || lowered.includes('.mov') || lowered.includes('/video/')) {
    return 'video';
  }
  if (lowered.includes('.jpg') || lowered.includes('.jpeg') || lowered.includes('.png') || lowered.includes('.gif') || lowered.includes('.webp') || lowered.includes('/image/')) {
    return 'image';
  }
  return 'unknown';
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zoomState, setZoomState] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [touchDistance, setTouchDistance] = useState(0);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  // Check if current media is video
  const currentMedia = images[selectedImage] || images[0];
  const isCurrentVideo = getMediaType(currentMedia) === 'video';

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

  // Always open the app modal for a consistent fullscreen experience across browsers
  const handleFullscreen = () => {
    onFullscreenOpen();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    if (isZooming) setShowZoomHint(false);
  }, [isZooming]);

  // Video controls
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Reset video state when changing media
  useEffect(() => {
    setIsVideoPlaying(false);
    setIsVideoMuted(true);
  }, [selectedImage]);

  return (
    <div className="hidden lg:flex flex-col gap-4">
      {/* Main Gallery - Clean Style - 1:1 aspect ratio for consistency */}
      <div
        ref={containerRef}
        onMouseMove={isCurrentVideo ? undefined : handleMouseMove}
        onMouseEnter={() => !isCurrentVideo && setIsZooming(true)}
        onMouseLeave={() => {
          if (!isCurrentVideo) {
            setIsZooming(false);
            resetZoom();
          }
        }}
        onTouchMove={isCurrentVideo ? undefined : handleTouchMove}
        onTouchEnd={isCurrentVideo ? undefined : handleTouchEnd}
        className={`relative rounded-xl overflow-hidden bg-[#fafafa] aspect-square select-none group ${!isCurrentVideo ? 'cursor-zoom-in' : ''}`}
      >
        {/* Subtle vignette (placed below media) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/5 z-0 pointer-events-none" />

        {/* Main media container */}
        {isCurrentVideo ? (
          // Video display
          <div className="w-full h-full relative z-10">
            <video
              ref={videoRef}
              src={currentMedia}
              className="w-full h-full object-cover"
              loop
              muted={isVideoMuted}
              playsInline
              autoPlay
              onClick={toggleVideoPlay}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            
            {/* Video controls overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence>
                {!isVideoPlaying && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={toggleVideoPlay}
                    className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto hover:bg-black/70 transition-colors"
                  >
                    <Play size={28} className="ml-1" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Video control buttons */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
              <button
                onClick={toggleVideoPlay}
                className="h-10 w-10 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-lg hover:bg-white transition"
              >
                {isVideoPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={toggleVideoMute}
                className="h-10 w-10 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-lg hover:bg-white transition"
              >
                {isVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
        ) : (
          // Image display with zoom
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
              src={currentMedia}
              alt={productName}
              fill
              sizes="(max-width: 1280px) 50vw, (max-width: 1536px) 40vw, 600px"
              className="object-cover will-change-transform z-10"
              priority
              quality={80}
            />
          </motion.div>
        )}

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

        {/* Zoom hint - only for images */}
        <AnimatePresence>
          {!isCurrentVideo && showZoomHint && isZooming && zoomState.scale === 1 && (
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

        {/* Zoom controls - only for images */}
        <AnimatePresence>
          {!isCurrentVideo && isZooming && zoomState.scale > 1 && (
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
          onClick={handleFullscreen}
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

      {/* Thumbnail rail with video indicators */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((mediaUrl, idx) => {
            const isVideo = getMediaType(mediaUrl) === 'video';
            
            return (
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
                {isVideo ? (
                  <div className="relative w-full h-full bg-gray-900">
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    {/* Video play indicator on thumbnail */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <Play size={14} className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={mediaUrl}
                    alt={`${productName}-thumb-${idx}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    quality={70}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}