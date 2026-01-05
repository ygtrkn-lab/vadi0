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

export const isAnalyticsEnabled = hasCredentials;

export default analyticsDb;
