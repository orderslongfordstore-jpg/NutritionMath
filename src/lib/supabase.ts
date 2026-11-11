import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseUrl = configuredUrl?.trim();
const supabaseAnonKey = configuredAnonKey?.trim();

function isAllowedSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname));
  } catch {
    return false;
  }
}

const hasPublicConfiguration = isAllowedSupabaseUrl(supabaseUrl) && Boolean(supabaseAnonKey);

export const supabase = hasPublicConfiguration && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'nutritionpro-auth-token',
      },
    })
  : null;

export function getSupabaseStatus() {
  if (!supabase) {
    return {
      configured: false,
      message: 'No approved Supabase project is configured. Authentication controls remain disabled.',
    };
  }

  return {
    configured: true,
    message: 'Public Supabase Auth client configured. Remote flows still require an approved staging project.',
  };
}

export function getSupabaseConfigSummary() {
  return {
    hasUrl: isAllowedSupabaseUrl(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    serviceRoleExposed: false,
  };
}
