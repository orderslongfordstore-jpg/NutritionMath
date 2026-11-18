// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  initialize: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://independent.example.test');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-public-key');
  vi.stubGlobal('fetch', vi.fn());
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  mocks.initialize.mockResolvedValue({ error: null });
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mocks.createClient.mockReturnValue({ auth: {
    initialize: mocks.initialize,
    getSession: mocks.getSession,
    onAuthStateChange: mocks.onAuthStateChange,
  } });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('browser Supabase project guard', () => {
  it.each([
    'https://ndvjrsegapfhnhrjypck.supabase.co',
    ' HTTPS://NDVJRSEGAPFHNhRJYPCK.SUPABASE.CO/ ',
    'https://ndvjrsegapfhnhrjypck.supabase.co:443/',
    'https://Ndvjrsegapfhnhrjypck.supabase.co:8443/path/',
    'http://ndvjrsegapfhnhrjypck.supabase.co:8080/',
    'https://ndvjrsegapfhnhrjypck.supabase.co./',
    'https://user:secret@ndvjrsegapfhnhrjypck.supabase.co/',
    'https://%6edvjrsegapfhnhrjypck.supabase.co/',
  ])('blocks the known hostname before creating a browser client: %s', async url => {
    vi.stubEnv('VITE_SUPABASE_URL', url);
    const { supabase } = await import('./AuthProvider');
    expect(supabase).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders specific safe setup guidance and removes callback tokens when blocked, even without a key', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://user:private-password@ndvjrsegapfhnhrjypck.supabase.co/');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    window.history.replaceState(null, '', '/?keep=yes#access_token=private-token&refresh_token=private-refresh&expires_in=3600&token_type=bearer&type=recovery');
    const { AuthProvider } = await import('./AuthProvider');
    const { AuthPage } = await import('./AuthPage');
    render(<AuthProvider><AuthPage /></AuthProvider>);
    const message = screen.getByRole('status').textContent ?? '';
    expect(message).toMatch(/previously used shared Supabase project is blocked/i);
    expect(message).toMatch(/VITE_SUPABASE_URL.*VITE_SUPABASE_ANON_KEY.*separate project/i);
    expect(message).not.toMatch(/private-password|private-token|private-refresh/);
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
    expect(window.location.search).toBe('?keep=yes');
    expect(window.location.hash).toBe('');
    expect(window.localStorage.length).toBe(0);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['', '   ', undefined])('fails closed when an allowed URL lacks an anon key: %j', async key => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', key);
    const { supabase } = await import('./AuthProvider');
    expect(supabase).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['https://independent.example.test/', 'https://independent.example.test'],
    ['HTTPS://ANOTHER.example.test:8443/path/', 'https://another.example.test:8443/path'],
    ['https://ndvjrsegapfhnhrjypck.supabase.co.other.test/', 'https://ndvjrsegapfhnhrjypck.supabase.co.other.test'],
    ['https://proxy.example.test/ndvjrsegapfhnhrjypck.supabase.co', 'https://proxy.example.test/ndvjrsegapfhnhrjypck.supabase.co'],
  ])('permits a different hostname without asserting its project identity: %s', async (url, expectedUrl) => {
    vi.stubEnv('VITE_SUPABASE_URL', url);
    const { supabase } = await import('./AuthProvider');
    expect(supabase).not.toBeNull();
    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.createClient.mock.calls[0][0]).toBe(expectedUrl);
    expect(mocks.initialize).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['not a url', 'ftp://independent.example.test', 'https://user:password@independent.example.test'])('fails closed for invalid browser configuration: %s', async url => {
    vi.stubEnv('VITE_SUPABASE_URL', url);
    const { supabase } = await import('./AuthProvider');
    expect(supabase).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
