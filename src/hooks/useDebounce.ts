import { useEffect, useState, useCallback } from 'react';

/**
 * useDebounce Hook
 * Bir değeri belirtilen süre kadar geciktirerek döndürür.
 * INP optimizasyonu için input event handler'larda kullanılır.
 * 
 * @param value - Debounce edilecek değer
 * @param delay - Gecikme süresi (ms), varsayılan 300ms
 * @returns Debounced değer
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Değer değiştiğinde timer başlat
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: önceki timer'ı temizle
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 * Callback fonksiyonunu debounce eder.
 * 
 * @param callback - Debounce edilecek fonksiyon
 * @param delay - Gecikme süresi (ms), varsayılan 300ms
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  );
}
