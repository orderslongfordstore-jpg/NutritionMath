// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('../components/Dashboard', () => ({
  default: ({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) => (
    <div>Protected dashboard: {email}<button onClick={() => { void onSignOut().catch(() => {}); }}>Sign out</button></div>
  ),
}));

type Listener = (event: AuthChangeEvent, session: Session | null) => void;
type MockClient = { listeners: Listener[]; signOut: ReturnType<typeof vi.fn>; getSession: ReturnType<typeof vi.fn> };
const account = { user: { id: 'user-1', email: 'one@example.com' } } as Session;
const otherAccount = { user: { id: 'user-2', email: 'two@example.com' } } as Session;
const prefix = 'nutritionmath.auth.https%3A%2F%2Fexample.supabase.co';
const userOneKey = `${prefix}.recovery.user-1`;
let clients: MockClient[];
let nextSession: Session | null;
let initialize: ReturnType<typeof vi.fn>;

function emit(client: MockClient, event: AuthChangeEvent, session: Session | null) {
  act(() => { client.listeners.slice().forEach(listener => listener(event, session)); });
}

// jsdom has one Window; dispatch the notification a real second Window receives
// after sharing localStorage. Each tab imports a fresh provider module/client.
function notifyOtherTabs(key: string, newValue: string | null) {
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: window.localStorage })); });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key');
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
  clients = [];
  nextSession = account;
  initialize = vi.fn().mockResolvedValue({ error: null });
  mocks.createClient.mockImplementation(() => {
    const client: MockClient = {
      listeners: [],
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: nextSession }, error: null }),
    };
    clients.push(client);
    return { auth: {
      initialize,
      getSession: client.getSession,
      signOut: client.signOut,
      onAuthStateChange: (listener: Listener) => {
        client.listeners.push(listener);
        return { data: { subscription: { unsubscribe: () => { client.listeners = client.listeners.filter(item => item !== listener); } } } };
      },
    } };
  });
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

describe('auth regressions', () => {
  it('isolates normalized full endpoint URLs and normalizes trailing slashes', async () => {
    const urls = ['https://EXAMPLE.supabase.co/v1/', 'https://example.supabase.co/v2', 'http://example.supabase.co/v1', 'https://example.supabase.co/v1'];
    const keys: string[] = [];
    for (const url of urls) {
      vi.resetModules();
      vi.stubEnv('VITE_SUPABASE_URL', url);
      await import('./AuthProvider');
      const call = mocks.createClient.mock.calls.at(-1);
      keys.push(call?.[2].auth.storageKey as string);
    }
    expect(new Set(keys.slice(0, 3)).size).toBe(3);
    expect(keys[0]).toBe(keys[3]);
    expect(keys[0]).toBe('nutritionmath.auth.https%3A%2F%2Fexample.supabase.co%2Fv1.session');
  });

  it.each(['https://user@example.supabase.co', 'https://user:secret@example.supabase.co/path'])('rejects URL credentials for %s', async url => {
    vi.stubEnv('VITE_SUPABASE_URL', url);
    const { supabase } = await import('./AuthProvider');
    expect(supabase).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('shares recovery with a newly opened independent tab and propagates completion', async () => {
    const first = await import('./AuthProvider');
    function FirstObserver() {
      const auth = first.useAuth();
      return <><output data-testid="first">{`${auth.loading}:${auth.recovery}`}</output><button onClick={auth.completeRecovery}>Complete recovery</button></>;
    }
    render(<first.AuthProvider><FirstObserver /></first.AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('first').textContent).toBe('false:false'));
    emit(clients[0], 'PASSWORD_RECOVERY', account);
    expect(screen.getByTestId('first').textContent).toBe('false:true');
    expect(window.localStorage.getItem(userOneKey)).toBe('1');

    // Unlike a cloned tab, the new tab has no shared sessionStorage.
    window.sessionStorage.clear();
    vi.resetModules();
    const second = await import('./AuthProvider');
    function SecondObserver() {
      const auth = second.useAuth();
      return <output data-testid="second">{`${auth.loading}:${auth.recovery}`}</output>;
    }
    render(<second.AuthProvider><SecondObserver /></second.AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('second').textContent).toBe('false:true'));
    act(() => { screen.getByRole('button', { name: 'Complete recovery' }).click(); });
    expect(window.localStorage.getItem(userOneKey)).toBeNull();
    notifyOtherTabs(userOneKey, null);
    expect(screen.getByTestId('first').textContent).toBe('false:false');
    expect(screen.getByTestId('second').textContent).toBe('false:false');
  });

  it('reconciles recovery starting after another tab has already opened', async () => {
    const first = await import('./AuthProvider');
    vi.resetModules();
    const second = await import('./AuthProvider');
    function Observer() {
      const auth = second.useAuth();
      return <output>{`${auth.loading}:${auth.recovery}`}</output>;
    }
    render(<second.AuthProvider><Observer /></second.AuthProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('false:false'));
    // The first tab's early listener can receive a recovery even before mount.
    expect(first.supabase).not.toBeNull();
    emit(clients[0], 'PASSWORD_RECOVERY', account);
    notifyOtherTabs(userOneKey, '1');
    expect(screen.getByRole('status').textContent).toBe('false:true');
  });

  it('does not apply or delete another user or project recovery marker', async () => {
    const first = await import('./AuthProvider');
    emit(clients[0], 'PASSWORD_RECOVERY', account);
    expect(window.localStorage.getItem(userOneKey)).toBe('1');
    nextSession = otherAccount;
    vi.resetModules();
    const second = await import('./AuthProvider');
    function SecondObserver() {
      const auth = second.useAuth();
      return <output data-testid="other-user">{`${auth.loading}:${auth.recovery}`}</output>;
    }
    render(<second.AuthProvider><SecondObserver /></second.AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('other-user').textContent).toBe('false:false'));
    expect(window.localStorage.getItem(userOneKey)).toBe('1');
    nextSession = account;
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co/different-project');
    vi.resetModules();
    const third = await import('./AuthProvider');
    function ThirdObserver() {
      const auth = third.useAuth();
      return <output data-testid="other-project">{`${auth.loading}:${auth.recovery}`}</output>;
    }
    render(<third.AuthProvider><ThirdObserver /></third.AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('other-project').textContent).toBe('false:false'));
    expect(window.localStorage.getItem(userOneKey)).toBe('1');
    expect(first.supabase).not.toBeNull();
  });

  it('clears the restored user marker on SIGNED_OUT even without an earlier auth event', async () => {
    window.localStorage.setItem(userOneKey, '1');
    const otherKey = `${prefix}.recovery.user-2`;
    window.localStorage.setItem(otherKey, '1');
    const provider = await import('./AuthProvider');
    function Observer() {
      const auth = provider.useAuth();
      return <output>{`${auth.loading}:${auth.session?.user.id ?? 'none'}:${auth.recovery}`}</output>;
    }
    render(<provider.AuthProvider><Observer /></provider.AuthProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('false:user-1:true'));
    emit(clients[0], 'SIGNED_OUT', null);
    expect(screen.getByRole('status').textContent).toBe('false:none:false');
    expect(window.localStorage.getItem(userOneKey)).toBeNull();
    expect(window.localStorage.getItem(otherKey)).toBe('1');
  });

  it('fails closed instead of opening the dashboard when recovery storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    const { default: App } = await import('../App');
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/Recovery status cannot be shared between tabs/);
    expect(screen.queryByText(/Protected dashboard/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue to your account' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    emit(clients[0], 'PASSWORD_RECOVERY', account);
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    expect(screen.queryByText(/Protected dashboard/)).toBeNull();
  });

  it('keeps the recovery state and fails closed when its marker write alone fails', async () => {
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === userOneKey) throw new DOMException('quota', 'QuotaExceededError');
      original.call(this, key, value);
    });
    const { default: App } = await import('../App');
    render(<App />);
    expect(await screen.findByText(/Protected dashboard/)).toBeTruthy();
    emit(clients[0], 'PASSWORD_RECOVERY', account);
    expect(screen.getByRole('alert').textContent).toMatch(/Recovery status cannot be shared between tabs/);
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    expect(screen.queryByText(/Protected dashboard/)).toBeNull();
  });

  it('guards the window before the SDK emits the recovery event', async () => {
    window.history.replaceState(null, '', '/#access_token=secret&refresh_token=refresh&expires_in=3600&token_type=bearer&type=recovery');
    let finish!: (result: { error: null }) => void;
    initialize.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    await import('./AuthProvider');
    const pendingKey = Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i)).find(key => key?.startsWith(`${prefix}.recovery-pending.`));
    expect(pendingKey).toBeTruthy();
    window.history.replaceState(null, '', '/');
    vi.resetModules();
    const { default: App } = await import('../App');
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/recovery is being verified in another tab/i);
    expect(screen.queryByText(/Protected dashboard/)).toBeNull();
    emit(clients[0], 'PASSWORD_RECOVERY', account);
    notifyOtherTabs(userOneKey, '1');
    notifyOtherTabs(pendingKey!, null);
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    await act(async () => { finish({ error: null }); });
  });

  it.each(['SIGNED_IN', 'PASSWORD_RECOVERY'] as const)('does not overwrite newer %s after delayed sign-out', async event => {
    const { default: App } = await import('../App');
    let finish!: (result: { error: null }) => void;
    clients[0].signOut.mockImplementation(() => {
      clients[0].listeners.slice().forEach(listener => listener('SIGNED_OUT', null));
      return new Promise(resolve => { finish = resolve; });
    });
    render(<App />);
    expect(await screen.findByText(/Protected dashboard: one@example.com/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    emit(clients[0], event, otherAccount);
    if (event === 'SIGNED_IN') expect(screen.getByText(/Protected dashboard: two@example.com/)).toBeTruthy();
    else expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    await act(async () => { finish({ error: null }); });
    if (event === 'SIGNED_IN') expect(screen.getByText(/Protected dashboard: two@example.com/)).toBeTruthy();
    else {
      expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
      expect(window.localStorage.getItem(`${prefix}.recovery.user-2`)).toBe('1');
    }
  });

  it.each([
    '#access_token=&type=recovery',
    '#access_token=token&refresh_token=&expires_in=3600&token_type=bearer&type=recovery',
  ])('rejects malformed credentials without waiting for an event: %s', async fragment => {
    nextSession = null;
    window.history.replaceState(null, '', `/${fragment}`);
    const createClient = mocks.createClient.getMockImplementation()!;
    let hashAtClientCreation: string | undefined;
    mocks.createClient.mockImplementation((...args) => {
      hashAtClientCreation = window.location.hash;
      return createClient(...args);
    });
    const { default: App } = await import('../App');
    render(<App />);
    emit(clients[0], 'INITIAL_SESSION', null);
    expect(hashAtClientCreation).toBe('');
    expect((await screen.findByRole('alert')).textContent).toMatch(/invalid, expired, or could not be verified/i);
    expect(screen.queryByText(/Checking your session/)).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it.each([false, true])('times out a missing callback event and preserves recovery when necessary: %s', async recovery => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', `/#access_token=token&refresh_token=refresh&expires_in=3600&token_type=bearer${recovery ? '&type=recovery' : ''}`);
    const { default: App } = await import('../App');
    render(<App />);
    emit(clients[0], 'INITIAL_SESSION', account);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText(/Checking your session/)).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole('alert').textContent).toMatch(/could not verify/i);
    expect(screen.queryByText(/Checking your session/)).toBeNull();
    expect(screen.queryByText(/Protected dashboard/)).toBeNull();
    if (recovery) {
      expect(window.localStorage.getItem(userOneKey)).toBe('1');
      fireEvent.click(screen.getByRole('button', { name: 'Continue to your account' }));
      expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    }
  });

  it.each([
    new TypeError('private network detail'),
    { name: 'AuthRetryableFetchError', status: 503, message: 'private provider detail' },
    { status: 503, message: 'private service detail' },
    { name: 'AuthUnknownError', message: 'private unknown detail' },
  ])('shows callback initialization outages as unavailable without exposing details', async error => {
    window.history.replaceState(null, '', '/#access_token=token&refresh_token=refresh&expires_in=3600&token_type=bearer');
    initialize.mockResolvedValue({ error });
    const { default: App } = await import('../App');
    render(<App />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/service is unavailable/i);
    expect(alert.textContent).not.toMatch(/expired|private/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('still recognizes the SDK redirect error as an invalid link despite its status 500', async () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired');
    initialize.mockResolvedValue({ error: { name: 'AuthImplicitGrantRedirectError', status: 500, message: 'private expired detail' } });
    const { default: App } = await import('../App');
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/invalid, expired/i);
    expect(screen.queryByText(/private expired detail/)).toBeNull();
  });

  it('recognizes a provider server error in a callback as unavailable', async () => {
    window.history.replaceState(null, '', '/#error=server_error&error_description=private+provider+detail');
    initialize.mockResolvedValue({ error: { name: 'AuthImplicitGrantRedirectError', status: 500 } });
    const { default: App } = await import('../App');
    render(<App />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/service is unavailable/i);
    expect(alert.textContent).not.toMatch(/expired|private/i);
  });
});
