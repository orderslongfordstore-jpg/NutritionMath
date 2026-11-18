// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../components/Dashboard', () => ({
  default: () => <div>Protected dashboard</div>,
}));

let client: SupabaseClient | null = null;
const endpoint = 'https://auth-expiry-test.invalid';
const storageKey = `nutritionmath.auth.${encodeURIComponent(endpoint)}.session`;
const user = { id: 'synthetic-user', email: 'synthetic@example.test', aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {} };

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  vi.stubEnv('VITE_SUPABASE_URL', endpoint);
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_synthetic');
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(async () => {
  cleanup();
  if (client) await client.auth.dispose();
  client = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

it('real SDK retains a retryable expired session without SIGNED_OUT; a later successful refresh restores the dashboard', async () => {
  let available = false;
  const unexpected: string[] = [];
  const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url !== `${endpoint}/auth/v1/token?grant_type=refresh_token` || init?.method !== 'POST') {
      unexpected.push(url);
      throw new Error('Unexpected request blocked by test');
    }
    return new Response(JSON.stringify(available ? {
      access_token: 'synthetic-renewed-access', refresh_token: 'synthetic-renewed-refresh',
      expires_in: 3600, token_type: 'bearer', user,
    } : { message: 'synthetic outage' }), {
      status: available ? 200 : 503, headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fakeFetch);
  window.localStorage.setItem(storageKey, JSON.stringify({
    access_token: 'synthetic-old-access', refresh_token: 'synthetic-old-refresh',
    token_type: 'bearer', expires_in: 300, expires_at: Math.floor(Date.now() / 1000) + 300, user,
  }));
  const storedSession = window.localStorage.getItem(storageKey);
  const { default: App } = await import('../App');
  const provider = await import('./AuthProvider');
  client = provider.supabase;
  expect(client).not.toBeNull();
  const events: AuthChangeEvent[] = [];
  const subscription = client!.auth.onAuthStateChange(event => { events.push(event); }).data.subscription;
  await act(async () => { render(<App />); });
  expect(screen.getByText('Protected dashboard')).toBeTruthy();
  // Explicit start disables the SDK's normal visibility handling. The separate
  // lifecycle test below exercises the unmodified browser behavior.
  await client!.auth.startAutoRefresh();
  await act(async () => { await vi.advanceTimersByTimeAsync(300_000); });
  expect(fakeFetch).toHaveBeenCalled();
  expect(events).not.toContain('SIGNED_OUT');
  expect(window.localStorage.getItem(storageKey)).toBe(storedSession);
  expect(screen.queryByText('Protected dashboard')).toBeNull();
  expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
  available = true;
  await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
  expect(events).toContain('TOKEN_REFRESHED');
  expect(screen.getByText('Protected dashboard')).toBeTruthy();
  expect(unexpected).toEqual([]);
  subscription.unsubscribe();
});

it('signs out an expired SDK session locally and removes its persisted session', async () => {
  const signOutEndpoint = 'https://auth-signout-test.invalid';
  const signOutStorageKey = `nutritionmath.auth.${encodeURIComponent(signOutEndpoint)}.session`;
  vi.stubEnv('VITE_SUPABASE_URL', signOutEndpoint);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  const unexpected: string[] = [];
  const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === `${signOutEndpoint}/auth/v1/token?grant_type=refresh_token` && init?.method === 'POST') {
      return new Response(JSON.stringify({
        access_token: 'synthetic-renewed-access', refresh_token: 'synthetic-renewed-refresh',
        expires_in: 3600, token_type: 'bearer', user,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url === `${signOutEndpoint}/auth/v1/logout?scope=local` && init?.method === 'POST') {
      return new Response(null, { status: 204 });
    }
    unexpected.push(url);
    throw new Error('Unexpected request blocked by test');
  });
  vi.stubGlobal('fetch', fakeFetch);
  window.localStorage.setItem(signOutStorageKey, JSON.stringify({
    access_token: 'synthetic-old-access', refresh_token: 'synthetic-old-refresh',
    token_type: 'bearer', expires_in: 300, expires_at: Math.floor(Date.now() / 1000) + 300, user,
  }));
  const { default: App } = await import('../App');
  client = (await import('./AuthProvider')).supabase;
  expect(client).not.toBeNull();
  const sdkSignOut = vi.spyOn(client!.auth, 'signOut');
  await act(async () => { render(<App />); });
  expect(screen.getByText('Protected dashboard')).toBeTruthy();
  vi.setSystemTime(new Date('2026-01-01T00:05:01Z'));
  act(() => { window.dispatchEvent(new Event('focus')); });
  expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
  expect(window.localStorage.getItem(signOutStorageKey)).not.toBeNull();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(sdkSignOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
  expect(window.localStorage.getItem(signOutStorageKey)).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  expect(screen.queryByText('Protected dashboard')).toBeNull();
  expect(unexpected).toEqual([]);
});

it('real SDK refreshes on becoming visible without an explicit startAutoRefresh', async () => {
  const visibilityEndpoint = 'https://auth-visibility-test.invalid';
  const visibilityStorageKey = `nutritionmath.auth.${encodeURIComponent(visibilityEndpoint)}.session`;
  vi.stubEnv('VITE_SUPABASE_URL', visibilityEndpoint);
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  const unexpected: string[] = [];
  const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url !== `${visibilityEndpoint}/auth/v1/token?grant_type=refresh_token` || init?.method !== 'POST') {
      unexpected.push(url);
      throw new Error('Unexpected request blocked by test');
    }
    return new Response(JSON.stringify({
      access_token: 'synthetic-visible-access', refresh_token: 'synthetic-visible-refresh',
      expires_in: 3600, token_type: 'bearer', user,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fakeFetch);
  window.localStorage.setItem(visibilityStorageKey, JSON.stringify({
    access_token: 'synthetic-old-access', refresh_token: 'synthetic-old-refresh',
    token_type: 'bearer', expires_in: 300, expires_at: Math.floor(Date.now() / 1000) + 300, user,
  }));
  const { default: App } = await import('../App');
  client = (await import('./AuthProvider')).supabase;
  expect(client).not.toBeNull();
  const startAutoRefresh = vi.spyOn(client!.auth, 'startAutoRefresh');
  const events: AuthChangeEvent[] = [];
  const subscription = client!.auth.onAuthStateChange(event => { events.push(event); }).data.subscription;
  await act(async () => { render(<App />); });
  expect(screen.getByText('Protected dashboard')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(300_000); });
  expect(fakeFetch).not.toHaveBeenCalled();
  expect(screen.queryByText('Protected dashboard')).toBeNull();
  visibility.mockReturnValue('visible');
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(startAutoRefresh).not.toHaveBeenCalled();
  expect(fakeFetch).toHaveBeenCalled();
  expect(events).toContain('TOKEN_REFRESHED');
  expect(screen.getByText('Protected dashboard')).toBeTruthy();
  expect(unexpected).toEqual([]);
  subscription.unsubscribe();
});
