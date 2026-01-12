import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for lazy loading videos when they enter the viewport
 * Prevents loading 9.5MB of video data until actually needed
 * 
 * Usage:
 * const { ref, shouldLoad } = useVideoLazyLoad();
 * return <video ref={ref} src={shouldLoad ? videoUrl : undefined} ... />
 */
export function useVideoLazyLoad(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If IntersectionObserver is not supported, load immediately
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            // Once loaded, stop observing
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before visible
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, shouldLoad };
}
