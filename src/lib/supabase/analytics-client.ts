import { createClient } from '@supabase/supabase-js';

/**
 * Analytics için Supabase client (tip kontrolü olmadan)
 * Bu client, yeni analytics tabloları için TypeScript hatalarını önler
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const analyticsDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default analyticsDb;
