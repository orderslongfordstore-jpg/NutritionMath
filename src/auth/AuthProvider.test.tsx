// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

type Callback = (event: AuthChangeEvent, session: Session | null) => void;
const account = { user: { id: 'user-1', email: 'chef@example.com' } } as Session;
let callbacks: Callback[];
let getSession: ReturnType<typeof vi.fn>;
let signOut: ReturnType<typeof vi.fn>;
let initialize: ReturnType<typeof vi.fn>;

function emit(event: AuthChangeEvent, session: Session | null) {
  act(() => { callbacks.slice().forEach(callback => callback(event, session)); });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
  callbacks = [];
  window.history.replaceState(null, '', '/');
  getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
  signOut = vi.fn().mockResolvedValue({ error: null });
  initialize = vi.fn().mockResolvedValue({ error: null });
  mocks.createClient.mockImplementation(() => ({
    auth: {
      initialize,
      getSession,
      signOut,
      onAuthStateChange: (callback: Callback) => {
        callbacks.push(callback);
        return { data: { subscription: { unsubscribe: () => { callbacks = callbacks.filter(item => item !== callback); } } } };
      },
    },
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe('AuthProvider', () => {
  it('uses a NutritionMath-specific and project-specific auth storage key', async () => {
    await import('./AuthProvider');
    expect(mocks.createClient).toHaveBeenCalledWith('https://example.supabase.co', 'public-anon-key', {
      auth: { storageKey: 'nutritionmath.auth.https%3A%2F%2Fexample.supabase.co.session', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    expect(initialize).toHaveBeenCalledOnce();
  });

  it('reports missing configuration without creating a client or hanging', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const { AuthProvider, useAuth, supabase } = await import('./AuthProvider');
    function Observer() {
      const auth = useAuth();
      return <output>{JSON.stringify({ configured: auth.configured, loading: auth.loading, session: auth.session })}</output>;
    }
    render(<AuthProvider><Observer /></AuthProvider>);
    expect(supabase).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('{"configured":false,"loading":false,"session":null}');
  });

  it('removes callback secrets when configuration is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    window.history.replaceState(null, '', '/?keep=yes#error=access_denied&error_description=secret&state=secret');
    await import('./AuthProvider');
    expect(window.location.search).toBe('?keep=yes');
    expect(window.location.hash).toBe('');
  });

  it('restores an existing session and signs out using Supabase', async () => {
    getSession.mockResolvedValue({ data: { session: account }, error: null });
    const { AuthProvider, useAuth } = await import('./AuthProvider');
    function Observer() {
      const auth = useAuth();
      return <><output>{`${auth.loading}:${auth.session?.user.id ?? 'none'}:${auth.recovery}`}</output><button onClick={() => void auth.signOut()}>Sign out</button></>;
    }
    render(<AuthProvider><Observer /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('false:user-1:false'));
    await act(async () => { screen.getByRole('button', { name: 'Sign out' }).click(); });
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
    expect(screen.getByRole('status').textContent).toBe('false:none:false');
  });

  it('recognizes a recovery event that arrives before the provider mounts', async () => {
    getSession.mockResolvedValue({ data: { session: account }, error: null });
    const { AuthProvider, useAuth } = await import('./AuthProvider');
    emit('PASSWORD_RECOVERY', account);
    function Observer() {
      const auth = useAuth();
      return <output>{`${auth.loading}:${auth.session?.user.id ?? 'none'}:${auth.recovery}`}</output>;
    }
    render(<AuthProvider><Observer /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('false:user-1:true'));
  });

  it('keeps a newer recovery event when an older getSession resolves and clears it on completion', async () => {
    let resolveSession!: (value: { data: { session: Session | null }; error: null }) => void;
    getSession.mockImplementation(() => new Promise(resolve => { resolveSession = resolve; }));
    const { AuthProvider, useAuth } = await import('./AuthProvider');
    function Observer() {
      const auth = useAuth();
      return <><output>{`${auth.loading}:${auth.session?.user.id ?? 'none'}:${auth.recovery}`}</output><button onClick={auth.completeRecovery}>Complete</button></>;
    }
    render(<AuthProvider><Observer /></AuthProvider>);
    await waitFor(() => expect(getSession).toHaveBeenCalled());
    emit('PASSWORD_RECOVERY', account);
    expect(screen.getByRole('status').textContent).toBe('true:none:false');
    await act(async () => { resolveSession({ data: { session: null }, error: null }); });
    expect(screen.getByRole('status').textContent).toBe('false:user-1:true');
    act(() => { screen.getByRole('button', { name: 'Complete' }).click(); });
    expect(screen.getByRole('status').textContent).toBe('false:user-1:false');
    expect(window.localStorage.getItem('nutritionmath.auth.https%3A%2F%2Fexample.supabase.co.recovery.user-1')).toBeNull();
  });

  it('clears recovery when the authenticated user changes or signs out', async () => {
    const { AuthProvider, useAuth } = await import('./AuthProvider');
    function Observer() {
      const auth = useAuth();
      return <output>{`${auth.session?.user.id ?? 'none'}:${auth.recovery}`}</output>;
    }
    render(<AuthProvider><Observer /></AuthProvider>);
    await waitFor(() => expect(getSession).toHaveBeenCalled());
    emit('PASSWORD_RECOVERY', account);
    expect(screen.getByRole('status').textContent).toBe('user-1:true');
    emit('SIGNED_IN', { user: { id: 'user-2' } } as Session);
    expect(screen.getByRole('status').textContent).toBe('user-2:false');
    emit('SIGNED_OUT', null);
    expect(screen.getByRole('status').textContent).toBe('none:false');
  });

  it('reports initialization failure rather than silently showing a restored session', async () => {
    initialize.mockResolvedValue({ error: { message: 'private internal provider detail' } });
    getSession.mockResolvedValue({ data: { session: account }, error: null });
    const { AuthProvider, useAuth } = await import('./AuthProvider');
    function Observer() {
      const auth = useAuth();
      return <output>{`${auth.loading}:${auth.session?.user.id}:${auth.notice?.kind}:${auth.notice?.text}`}</output>;
    }
    render(<AuthProvider><Observer /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('false:user-1:unavailable:'));
    expect(screen.getByRole('status').textContent).not.toContain('private internal provider detail');
  });
});
