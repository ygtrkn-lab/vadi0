'use client';

import { useEffect, useState, useCallback } from 'react';

interface Settings {
  site?: {
    name?: string;
    description?: string;
    logo?: string;
    favicon?: string;
    phone?: string;
    address?: string;
  };
  delivery?: {
    freeDeliveryThreshold?: number;
    standardDeliveryFee?: number;
    expressDeliveryFee?: number;
    sameDay?: boolean;
    sameDayCutoffTime?: string;
    deliveryAreas?: string[];
    workingHours?: {
      start: string;
      end: string;
    };
  };
  payment?: {
    methods?: Array<{
      id: string;
      name: string;
      isActive: boolean;
      fee?: number;
    }>;
    installments?: number[];
  };
  promotions?: {
    welcomeDiscount?: number;
    firstOrderDiscount?: number;
    referralBonus?: number;
  };
  social?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    whatsapp?: string;
  };
  seo?: {
    defaultTitle?: string;
    defaultDescription?: string;
    keywords?: string[];
  };
}

interface UseSettingsReturn {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to default settings if fetch fails
      setSettings({
        site: {
          name: 'Vadiler Çiçekçilik',
          phone: '0850 307 4876',
          address: 'İstanbul, Türkiye',
        },
        delivery: {
          freeDeliveryThreshold: 500,
          standardDeliveryFee: 49,
          expressDeliveryFee: 99,
        },
        social: {
          instagram: 'https://instagram.com/vadilercom',
          facebook: 'https://facebook.com/vadilercom',
          twitter: 'https://twitter.com/vadilercom',
          whatsapp: '908503074876',
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchSettings, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
  };
}

// Hook for getting a specific setting value
export function useSetting<T = any>(
  category: keyof Settings,
  key: string,
  defaultValue?: T
): T | undefined {
  const { settings } = useSettings();

  if (!settings || !settings[category]) {
    return defaultValue;
  }

  const categorySettings = settings[category] as any;
  return (categorySettings[key] as T) ?? defaultValue;
}
