// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthPage } from './AuthPage';

const mocks = vi.hoisted(() => ({
  state: {
    session: null as null | { user: { id: string; email: string } },
    hasUnusableSession: false,
    loading: false,
    configured: true,
    recovery: false,
    notice: null as null | { kind: 'callback' | 'unavailable' | 'sign-out'; text: string },
    dismissNotice: vi.fn(),
    signOut: vi.fn(),
    completeRecovery: vi.fn(),
  },
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    resend: vi.fn(),
    updateUser: vi.fn(),
  },
}));
vi.mock('./AuthProvider', () => ({
  useAuth: () => mocks.state,
  supabase: { auth: mocks.auth },
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.state, { session: null, hasUnusableSession: false, loading: false, configured: true, recovery: false, notice: null });
  mocks.state.signOut.mockResolvedValue(undefined);
  mocks.auth.signInWithPassword.mockResolvedValue({ error: null });
  mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.auth.resend.mockResolvedValue({ error: null });
  mocks.auth.updateUser.mockResolvedValue({ error: null });
});
afterEach(cleanup);

describe('AuthPage', () => {
  it('shows an actionable configuration message instead of a fake form', () => {
    mocks.state.configured = false;
    render(<AuthPage />);
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
  });

  it('signs in with the supplied credentials', async () => {
    const user = userEvent.setup();
    render(<AuthPage />);
    expect(screen.getByText('Accounts belong to the configured Supabase project.')).toBeTruthy();
    expect(screen.queryByText(/account may also be used by other apps/i)).toBeNull();
    await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
    await user.type(screen.getByLabelText('Password'), 'my secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'chef@example.com', password: 'my secret' }));
  });

  it('does not reveal raw backend errors', async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ error: { message: 'sensitive internal error' } });
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Could not sign in right now. Please try again.');
    expect(screen.queryByText(/sensitive internal error/)).toBeNull();
  });

  it('distinguishes invalid credentials from a provider outage and lets the user retry', async () => {
    mocks.auth.signInWithPassword
      .mockResolvedValueOnce({ error: { code: 'invalid_credentials', status: 400, message: 'private credentials detail' } })
      .mockResolvedValueOnce({ error: { name: 'AuthRetryableFetchError', status: 503, message: 'private network detail' } })
      .mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Check your details/);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert').textContent).toMatch(/service is temporarily unavailable.*try again/i);
    expect(screen.queryByText(/private network detail/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledTimes(3);
    expect(mocks.state.dismissNotice).toHaveBeenCalled();
  });

  it('treats thrown fetch failures as unavailable rather than wrong credentials', async () => {
    mocks.auth.signInWithPassword.mockRejectedValue(new TypeError('private fetch failure'));
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert').textContent).toMatch(/service is temporarily unavailable/);
    expect(screen.queryByText(/private fetch failure/)).toBeNull();
  });

  it('validates matching passwords and signs up with a callback URL', async () => {
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByText(/Accounts belong to the configured Supabase project/)).toBeTruthy();
    await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'password');
    await user.type(screen.getByLabelText('Confirm password'), 'notthesame');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert').textContent).toMatch(/do not match/);
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Confirm password'));
    await user.type(screen.getByLabelText('Confirm password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(mocks.auth.signUp).toHaveBeenCalledWith({
      email: 'chef@example.com', password: 'password', options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
    }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringMatching(/confirmation email/i));
  });

  it('requests a reset link with a privacy-preserving success message', async () => {
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByText(/If other apps use this same account and project, changing your password affects those apps too/)).toBeTruthy();
    await user.type(screen.getByLabelText('Email address'), 'chef@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith('chef@example.com', { redirectTo: `${window.location.origin}${window.location.pathname}` }));
    expect((await screen.findByRole('status')).textContent).toMatch(/If an account exists/);
  });

  it('updates a recovered password and only finishes recovery on success', async () => {
    mocks.state.session = { user: { id: 'user-1', email: 'chef@example.com' } };
    mocks.state.recovery = true;
    mocks.auth.updateUser.mockResolvedValueOnce({ error: { message: 'private error' } }).mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    render(<AuthPage />);
    expect(screen.getByText(/If other apps use this same account and project, changing your password affects those apps too/)).toBeTruthy();
    await user.type(screen.getByLabelText('New password'), 'newsecret');
    await user.type(screen.getByLabelText('Confirm password'), 'newsecret');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(mocks.state.completeRecovery).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    await waitFor(() => expect(mocks.auth.updateUser).toHaveBeenCalledWith({ password: 'newsecret' }));
    expect(mocks.state.completeRecovery).toHaveBeenCalledTimes(1);
  });

  it('permits cancelling a recovery session by really signing out', async () => {
    mocks.state.session = { user: { id: 'user-1', email: 'chef@example.com' } };
    mocks.state.recovery = true;
    const user = userEvent.setup();
    render(<AuthPage />);
    await user.click(screen.getByRole('button', { name: 'Cancel and sign out' }));
    await waitFor(() => expect(mocks.state.signOut).toHaveBeenCalledTimes(1));
  });
});
