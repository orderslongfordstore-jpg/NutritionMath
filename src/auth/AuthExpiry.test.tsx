// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('../components/Dashboard', () => ({
  default: ({ email }: { email: string }) => <div>Protected dashboard: {email}</div>,
}));

type Listener = (event: AuthChangeEvent, session: Session | null) => void;
let listeners: Listener[];
let getSession: ReturnType<typeof vi.fn>;
let signOut: ReturnType<typeof vi.fn>;
let initial: Session | null;

function session(secondsFromNow: number, id = 'user-1'): Session {
  return {
    access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token',
    token_type: 'bearer', expires_in: secondsFromNow,
    expires_at: Math.floor(Date.now() / 1000) + secondsFromNow,
    user: { id, email: `${id}@example.test` },
  } as Session;
}

function emit(event: AuthChangeEvent, value: Session | null) {
  act(() => { listeners.slice().forEach(listener => listener(event, value)); });
}

async function mount() {
  const { default: App } = await import('../App');
  let view!: ReturnType<typeof render>;
  await act(async () => { view = render(<App />); });
  return view;
}

function dashboard() { return screen.queryByText(/Protected dashboard/); }

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'synthetic-public-key');
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  listeners = [];
  initial = session(10);
  getSession = vi.fn().mockImplementation(async () => ({ data: { session: initial }, error: null }));
  signOut = vi.fn().mockResolvedValue({ error: null });
  mocks.createClient.mockImplementation(() => ({ auth: {
    initialize: vi.fn().mockResolvedValue({ error: null }), getSession, signOut,
    onAuthStateChange: (listener: Listener) => {
      listeners.push(listener);
      return { data: { subscription: { unsubscribe: () => { listeners = listeners.filter(item => item !== listener); } } } };
    },
  } }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('session expiry UI safeguard', () => {
  it('hides the dashboard at the expiry boundary without signing out or reading the SDK again, and accepts a refreshed event', async () => {
    window.localStorage.setItem('synthetic-sdk-session', 'retained');
    await mount();
    expect(dashboard()).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(9_999); });
    expect(dashboard()).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(dashboard()).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).not.toMatch(/synthetic-access-token|synthetic-refresh-token/);
    expect(signOut).not.toHaveBeenCalled();
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('synthetic-sdk-session')).toBe('retained');
    emit('TOKEN_REFRESHED', session(30));
    expect(dashboard()).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('reschedules the timer when a valid session is refreshed before expiry', async () => {
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    emit('TOKEN_REFRESHED', session(20));
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(dashboard()).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(dashboard()).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
  });

  it('rechecks long deadlines without overflowing the browser timer', async () => {
    initial = session(3_000_000);
    await mount();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(2_147_483_647); });
    expect(dashboard()).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(852_516_353); });
    expect(dashboard()).toBeNull();
  });

  it.each(['visibilitychange', 'focus', 'pageshow'] as const)(
    'rechecks on %s after a suspended timer without an SDK request', async event => {
      await mount();
      vi.setSystemTime(new Date('2026-01-01T00:00:11Z'));
      act(() => { (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event)); });
      expect(dashboard()).toBeNull();
      expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
      expect(getSession).toHaveBeenCalledTimes(1);
      expect(signOut).not.toHaveBeenCalled();
    },
  );

  it('cleans up timers and all foreground listeners on unmount', async () => {
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const documentRemove = vi.spyOn(document, 'removeEventListener');
    const windowAdd = vi.spyOn(window, 'addEventListener');
    const windowRemove = vi.spyOn(window, 'removeEventListener');
    const view = await mount();
    const visibility = documentAdd.mock.calls.find(([name]) => name === 'visibilitychange')?.[1];
    const focus = windowAdd.mock.calls.find(([name]) => name === 'focus')?.[1];
    const pageshow = windowAdd.mock.calls.find(([name]) => name === 'pageshow')?.[1];
    expect(visibility).toBeTruthy();
    expect(focus).toBeTruthy();
    expect(pageshow).toBeTruthy();
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(documentRemove).toHaveBeenCalledWith('visibilitychange', visibility);
    expect(windowRemove).toHaveBeenCalledWith('focus', focus);
    expect(windowRemove).toHaveBeenCalledWith('pageshow', pageshow);
    expect(listeners).toHaveLength(1); // Original module-level SDK listener remains.
  });

  it('does not offer dismissal of an expired session; a valid sign-in clears the derived notice', async () => {
    initial = session(-1);
    await mount();
    expect(dashboard()).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    emit('SIGNED_IN', session(20, 'user-2'));
    expect(dashboard()?.textContent).toContain('user-2@example.test');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('exposes only a boolean for a hidden session and cannot dismiss it into a usable one', async () => {
    initial = session(-1);
    const { AuthProvider, useAuth } = await import('./AuthProvider');
    function Observer() {
      const auth = useAuth();
      return <><output>{JSON.stringify({ session: auth.session, hasUnusableSession: auth.hasUnusableSession, kind: auth.notice?.kind })}</output><button onClick={auth.dismissNotice}>Dismiss notice</button></>;
    }
    await act(async () => { render(<AuthProvider><Observer /></AuthProvider>); });
    expect(screen.getByRole('status').textContent).toBe('{"session":null,"hasUnusableSession":true,"kind":"session-unusable"}');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }));
    expect(screen.getByRole('status').textContent).toBe('{"session":null,"hasUnusableSession":true,"kind":"session-unusable"}');
    expect(screen.getByRole('status').textContent).not.toMatch(/synthetic-access-token|synthetic-refresh-token/);
  });

  it('signs out the locally held session after it expires', async () => {
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(dashboard()).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
    // The mock does not emit SIGNED_OUT: success must clear the provider's held session.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(dashboard()).toBeNull();
    act(() => { window.dispatchEvent(new Event('focus')); });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps the failed sign-out warning and allows retry without reopening the expired dashboard', async () => {
    initial = session(-1);
    signOut.mockResolvedValueOnce({ error: { message: 'private error' } }).mockResolvedValueOnce({ error: null });
    await mount();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(screen.getByRole('alert').textContent).toMatch(/Sign-out could not be completed/i);
    expect(screen.queryByText(/private error/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    expect(dashboard()).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  });

  it('retains the revocation warning if the SDK clears the expired session before reporting failure', async () => {
    initial = session(-1);
    signOut.mockImplementationOnce(() => {
      listeners.slice().forEach(listener => listener('SIGNED_OUT', null));
      return Promise.resolve({ error: { message: 'private error' } });
    });
    await mount();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
    expect(screen.getByRole('alert').textContent).toMatch(/session was cleared on this device.*server-side revocation could not be confirmed/i);
    expect(screen.queryByText(/private error/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    expect(dashboard()).toBeNull();
  });

  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MAX_VALUE])(
    'hides a session with missing or non-finite usable expiry: %s', async expires_at => {
      initial = { ...session(10), expires_at };
      await mount();
      expect(dashboard()).toBeNull();
      expect(screen.getByRole('alert').textContent).toMatch(/session could not be verified/i);
      expect(screen.getByRole('alert').textContent).not.toMatch(/has expired/i);
      expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
      expect(dashboard()).toBeNull();
      emit('TOKEN_REFRESHED', session(30));
      expect(dashboard()).toBeTruthy();
      expect(screen.queryByRole('alert')).toBeNull();
    },
  );

  it('preserves a higher-priority callback notice across expiry and refresh', async () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired');
    await mount();
    expect(screen.getByRole('alert').textContent).toMatch(/invalid, expired/i);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole('alert').textContent).toMatch(/invalid, expired/i);
    emit('TOKEN_REFRESHED', session(30));
    expect(dashboard()).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/invalid, expired/i);
    fireEvent.click(screen.getByRole('button', { name: 'Continue to your account' }));
    expect(dashboard()).toBeTruthy();
  });

  it('shows the expiry notice after a higher-priority callback notice is dismissed', async () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired');
    initial = session(-1);
    await mount();
    expect(screen.getByRole('alert').textContent).toMatch(/invalid, expired/i);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByRole('alert').textContent).toMatch(/session has expired/i);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    expect(dashboard()).toBeNull();
  });

  it('allows sign-out under a higher-priority callback notice', async () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired');
    initial = session(-1);
    await mount();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
    expect(screen.getByRole('alert').textContent).toMatch(/invalid, expired/i);
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(dashboard()).toBeNull();
  });

  it('preserves recovery storage priority while allowing sign-out and retry on failure', async () => {
    const blockedStorage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    initial = session(-1);
    signOut.mockResolvedValueOnce({ error: { message: 'private error' } }).mockResolvedValueOnce({ error: null });
    await mount();
    expect(screen.getByRole('alert').textContent).toMatch(/Recovery status cannot be shared between tabs/i);
    expect(dashboard()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(screen.getByRole('alert').textContent).toMatch(/Recovery status cannot be shared between tabs/i);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    blockedStorage.mockRestore();
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: null })); });
    expect(screen.getByRole('alert').textContent).toMatch(/Sign-out could not be completed/i);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sign out' })); });
    expect(signOut).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    expect(dashboard()).toBeNull();
  });

  it('preserves recovery markers across expiry and a later refresh', async () => {
    const marker = 'nutritionmath.auth.https%3A%2F%2Fexample.supabase.co.recovery.user-1';
    window.localStorage.setItem(marker, '1');
    await mount();
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(dashboard()).toBeNull();
    expect(window.localStorage.getItem(marker)).toBe('1');
    emit('TOKEN_REFRESHED', session(30));
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    expect(window.localStorage.getItem(marker)).toBe('1');
  });
});
