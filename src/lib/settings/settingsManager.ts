import { createClient } from '@supabase/supabase-js';
import settingsJsonFallback from '@/data/settings.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Create Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cache implementation
interface CacheEntry {
  value: any;
  expiry: number;
}

export class SettingsManager {
  private static cache: Map<string, CacheEntry> = new Map();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get a setting value from Supabase with fallback to settings.json
   * @param category - Setting category (e.g., 'site', 'delivery', 'payment')
   * @param key - Setting key within the category
   * @param defaultValue - Optional default value if setting not found
   * @returns The setting value
   */
  static async get(
    category: string,
    key: string,
    defaultValue?: any
  ): Promise<any> {
    const cacheKey = `${category}.${key}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() < cached.expiry) {
        return cached.value;
      } else {
        // Expired, remove from cache
        this.cache.delete(cacheKey);
      }
    }

    try {
      // Query Supabase
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('category', category)
        .eq('key', key)
        .single();

      if (error || !data) {
        // Fallback to settings.json
        return this.getFallback(category, key, defaultValue);
      }

      const value = data.value;

      // Store in cache
      this.cache.set(cacheKey, {
        value,
        expiry: Date.now() + this.CACHE_TTL,
      });

      return value;
    } catch (error) {
      console.error(`Error fetching setting ${category}.${key}:`, error);
      // Fallback to settings.json
      return this.getFallback(category, key, defaultValue);
    }
  }

  /**
   * Get all settings for a category
   * @param category - Setting category
   * @param publicOnly - Whether to fetch only public settings (default: true)
   * @returns Object with all settings in the category
   */
  static async getCategory(
    category: string,
    publicOnly: boolean = true
  ): Promise<Record<string, any>> {
    const cacheKey = `category:${category}:${publicOnly}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() < cached.expiry) {
        return cached.value;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      let query = supabaseAdmin
        .from('site_settings')
        .select('key, value')
        .eq('category', category);

      if (publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error || !data) {
        // Fallback to settings.json
        return this.getCategoryFallback(category);
      }

      const settings = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      // Store in cache
      this.cache.set(cacheKey, {
        value: settings,
        expiry: Date.now() + this.CACHE_TTL,
      });

      return settings;
    } catch (error) {
      console.error(`Error fetching category ${category}:`, error);
      return this.getCategoryFallback(category);
    }
  }

  /**
   * Update a setting value (server-side only)
   * @param category - Setting category
   * @param key - Setting key
   * @param value - New value
   * @returns Updated setting data
   */
  static async set(
    category: string,
    key: string,
    value: any
  ): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .upsert(
          {
            category,
            key,
            value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'category,key',
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear cache for this setting and category
      this.cache.delete(`${category}.${key}`);
      this.cache.delete(`category:${category}:true`);
      this.cache.delete(`category:${category}:false`);

      return data;
    } catch (error) {
      console.error(`Error updating setting ${category}.${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific category
   */
  static clearCategoryCache(category: string): void {
    // Clear all cache entries for this category
    for (const key of this.cache.keys()) {
      if (key.startsWith(category) || key.startsWith(`category:${category}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get value from settings.json fallback
   */
  private static getFallback(
    category: string,
    key: string,
    defaultValue?: any
  ): any {
    try {
      const categoryData = (settingsJsonFallback as any)[category];
      if (categoryData && key in categoryData) {
        return categoryData[key];
      }
      return defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Get category from settings.json fallback
   */
  private static getCategoryFallback(category: string): Record<string, any> {
    try {
      return (settingsJsonFallback as any)[category] || {};
    } catch (error) {
      return {};
    }
  }
}
