import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function getSupabaseStatus() {
  if (!supabase) {
    return {
      configured: false,
      message: 'Supabase environment variables are not configured for local development.',
    };
  }

  return {
    configured: true,
    message: 'Supabase client ready for authenticated data access.',
  };
}
