// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('../components/Dashboard', () => ({
  default: ({ onSignOut }: { onSignOut: () => Promise<void> }) => (
    <div>Protected dashboard<button onClick={() => { void onSignOut().catch(() => {}); }}>Sign out</button></div>
  ),
}));

type Callback = (event: AuthChangeEvent, session: Session | null) => void;
const account = { user: { id: 'user-1', email: 'chef@example.com' } } as Session;
let callbacks: Callback[];
let initialize: ReturnType<typeof vi.fn>;
let getSession: ReturnType<typeof vi.fn>;
let signOut: ReturnType<typeof vi.fn>;
let resetPasswordForEmail: ReturnType<typeof vi.fn>;
let resend: ReturnType<typeof vi.fn>;

function emit(event: AuthChangeEvent, session: Session | null) {
  act(() => { callbacks.slice().forEach(fn => fn(event, session)); });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-key');
  window.history.replaceState(null, '', '/');
  window.sessionStorage.clear();
  window.localStorage.clear();
  callbacks = [];
  initialize = vi.fn().mockResolvedValue({ error: null });
  getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
  signOut = vi.fn().mockResolvedValue({ error: null });
  resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
  resend = vi.fn().mockResolvedValue({ error: null });
  mocks.createClient.mockImplementation(() => ({
    auth: {
      initialize, getSession, signOut, resetPasswordForEmail, resend,
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
  window.history.replaceState(null, '', '/');
});

describe('authentication event integration', () => {
  it.each([false, true])('shows an expired link and workable retries with an existing session: %s', async signedIn => {
    window.history.replaceState({ retained: true }, '', '/?campaign=keep#error=access_denied&error_code=otp_expired&error_description=private+link+details');
    let finishInitialization!: (result: { error: unknown }) => void;
    initialize.mockReturnValue(new Promise(resolve => { finishInitialization = resolve; }));
    getSession.mockResolvedValue({ data: { session: signedIn ? account : null }, error: null });
    const { default: App } = await import('../App');
    render(<App />);
    emit('INITIAL_SESSION', signedIn ? account : null);
    expect(screen.getByText(/Checking your session/)).toBeTruthy();
    expect(screen.queryByText('Protected dashboard')).toBeNull();
    await act(async () => { finishInitialization({ error: { name: 'AuthImplicitGrantRedirectError', details: { code: 'otp_expired' }, message: 'private link details' } }); });
    expect((await screen.findByRole('alert')).textContent).toMatch(/invalid, expired, or could not be verified/i);
    expect(screen.queryByText('Protected dashboard')).toBeNull();
    expect(screen.queryByText(/private link details/)).toBeNull();
    expect(window.location.search).toBe('?campaign=keep');
    expect(window.location.hash).toBe('');
    expect(window.history.state).toEqual({ retained: true });
    const user = userEvent.setup();
    if (signedIn) {
      await user.click(screen.getByRole('button', { name: 'Resend confirmation email' }));
      await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
      await user.click(screen.getByRole('button', { name: 'Send confirmation link' }));
      expect(resend).toHaveBeenCalledWith({ type: 'signup', email: 'chef@example.com', options: { emailRedirectTo: `${window.location.origin}/` } });
      expect(screen.getByText(/If confirmation is needed/)).toBeTruthy();
      await user.click(screen.getByRole('button', { name: 'Continue to your account' }));
      expect(await screen.findByText('Protected dashboard')).toBeTruthy();
    } else {
      await user.click(screen.getByRole('button', { name: 'Request a new password reset link' }));
      await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
      await user.click(screen.getByRole('button', { name: 'Send reset link' }));
      expect(resetPasswordForEmail).toHaveBeenCalledWith('chef@example.com', { redirectTo: `${window.location.origin}/` });
      expect(screen.getByText(/If an account exists/)).toBeTruthy();
    }
  });

  it('cleans error query parameters without erasing unrelated navigation', async () => {
    window.history.replaceState(null, '', '/?view=recipe&error=access_denied&error_code=otp_expired&error_description=secret#overview');
    initialize.mockResolvedValue({ error: { name: 'AuthImplicitGrantRedirectError' } });
    const { default: App } = await import('../App');
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/invalid, expired/);
    expect(window.location.search).toBe('?view=recipe');
    expect(window.location.hash).toBe('#overview');
  });

  it('keeps loading between INITIAL_SESSION and a later PASSWORD_RECOVERY event', async () => {
    window.history.replaceState(null, '', '/?view=keep#access_token=secret&refresh_token=also-secret&type=recovery&expires_in=3600&token_type=bearer');
    let finishInitialization!: (result: { error: null }) => void;
    initialize.mockReturnValue(new Promise(resolve => { finishInitialization = resolve; }));
    getSession.mockResolvedValue({ data: { session: account }, error: null });
    const { default: App } = await import('../App');
    render(<App />);
    emit('INITIAL_SESSION', account);
    await act(async () => { finishInitialization({ error: null }); });
    expect(screen.getByText(/Checking your session/)).toBeTruthy();
    expect(screen.queryByText('Protected dashboard')).toBeNull();
    expect(window.location.search).toBe('?view=keep');
    expect(window.location.hash).toBe('');
    emit('SIGNED_IN', account);
    expect(screen.getByText(/Checking your session/)).toBeTruthy();
    expect(screen.queryByText('Protected dashboard')).toBeNull();
    emit('PASSWORD_RECOVERY', account);
    expect(await screen.findByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    expect(screen.queryByText('Protected dashboard')).toBeNull();
  });

  it.each(['dashboard', 'recovery'] as const)('retains a revocation failure after SIGNED_OUT when leaving %s', async source => {
    getSession.mockResolvedValue({ data: { session: account }, error: null });
    let finishSignOut!: (value: { error: unknown }) => void;
    signOut.mockImplementation(() => {
      callbacks.slice().forEach(fn => fn('SIGNED_OUT', null));
      return new Promise(resolve => { finishSignOut = resolve; });
    });
    const { default: App } = await import('../App');
    render(<App />);
    await screen.findByText('Protected dashboard');
    if (source === 'recovery') {
      emit('PASSWORD_RECOVERY', account);
      expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeTruthy();
    }
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: source === 'dashboard' ? 'Sign out' : 'Cancel and sign out' }));
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    await act(async () => { finishSignOut({ error: { message: 'private server error' } }); });
    expect((await screen.findByRole('alert')).textContent).toMatch(/session was cleared on this device.*server-side revocation could not be confirmed/i);
    expect(screen.queryByText(/private server error/)).toBeNull();
    expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
  });

  it('does not claim the session was cleared when sign-out fails before the event, and clears the notice after retry', async () => {
    getSession.mockResolvedValue({ data: { session: account }, error: null });
    signOut.mockResolvedValueOnce({ error: { message: 'private session error' } }).mockImplementationOnce(() => {
      callbacks.slice().forEach(fn => fn('SIGNED_OUT', null));
      return Promise.resolve({ error: null });
    });
    const { default: App } = await import('../App');
    render(<App />);
    await screen.findByText('Protected dashboard');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sign-out could not be completed/);
    expect(screen.getByRole('alert').textContent).not.toMatch(/cleared on this device/);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offers a retry when initialization is unavailable without exposing the error', async () => {
    initialize.mockRejectedValue(new Error('private connection detail'));
    const { default: App } = await import('../App');
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toMatch(/service is unavailable/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryByText(/private connection detail/)).toBeNull();
  });
});
