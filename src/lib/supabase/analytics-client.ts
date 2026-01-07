import { createClient } from '@supabase/supabase-js';

/**
 * Analytics için Supabase client (tip kontrolü olmadan)
 * Bu client, yeni analytics tabloları için TypeScript hatalarını önler
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vercel'de environment variables yoksa boş client döndür
const hasCredentials = supabaseUrl && supabaseServiceKey;

export const analyticsDb = hasCredentials 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Base analytics status (credentials check)
const baseAnalyticsEnabled = hasCredentials;

/**
 * Check if analytics is enabled from settings
 */
export async function getAnalyticsStatus(): Promise<boolean> {
  if (!baseAnalyticsEnabled || !analyticsDb) {
    return false;
  }

  try {
    const { data, error } = await analyticsDb
      .from('settings')
      .select('value')
      .eq('category', 'analytics')
      .eq('key', 'enabled')
      .single();

    if (error || !data) {
      // Default to true if setting not found (backwards compatibility)
      return true;
    }

    return data.value === true || data.value === 'true';
  } catch (error) {
    console.error('Error checking analytics status:', error);
    // Default to true on error (backwards compatibility)
    return true;
  }
}

// Legacy export for backwards compatibility
export const isAnalyticsEnabled = baseAnalyticsEnabled;

export default analyticsDb;
