const blockedHostname = 'ndvjrsegapfhnhrjypck.supabase.co';

/** Only the known direct hostname is blocked; aliases and proxies cannot be identified here. */
export function supabaseProjectUrlStatus(value: string | undefined): 'allowed' | 'blocked' | 'invalid' {
  if (!value?.trim()) return 'invalid';
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'invalid';
    // URL.hostname normalizes case and excludes ports. DNS treats trailing dots as equivalent.
    const hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
    return hostname === blockedHostname ? 'blocked' : 'allowed';
  } catch {
    return 'invalid';
  }
}
