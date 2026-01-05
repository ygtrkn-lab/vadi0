import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Admin client with service role key for bypassing RLS policies
// Use this ONLY in API routes for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
