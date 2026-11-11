import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from '../context/AuthContext';
import { AuthPanel } from './AuthPanel';

const authMocks = vi.hoisted(() => {
  let listener: ((event: string, session: unknown) => void) | undefined;
  return {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
        listener = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    emit(event: string, session: unknown) {
      listener?.(event, session);
    },
    clearListener() {
      listener = undefined;
    },
  };
});

vi.mock('../lib/supabase', () => ({
  supabase: { auth: authMocks.auth },
  getSupabaseStatus: () => ({ configured: true, message: 'mock client' }),
  getSupabaseConfigSummary: () => ({ hasUrl: true, hasAnonKey: true, serviceRoleExposed: false }),
}));

const testSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: 'mock-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'owner@example.test',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: '2026-11-12T00:00:00.000Z',
  },
} as unknown as Session;

function renderPanel(session: Session | null = null) {
  authMocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  return render(
    <AuthProvider>
      <AuthPanel />
    </AuthProvider>,
  );
}

async function waitForSessionRestore() {
  await waitFor(() => expect(authMocks.auth.getSession).toHaveBeenCalled());
}

describe('AuthPanel with a mocked Supabase client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.clearListener();
    authMocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    authMocks.auth.signInWithPassword.mockResolvedValue({ error: null });
    authMocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    authMocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    authMocks.auth.updateUser.mockResolvedValue({ error: null });
    authMocks.auth.signOut.mockImplementation(async () => {
      authMocks.emit('SIGNED_OUT', null);
      return { error: null };
    });
  });

  it('submits an email/password sign-in and updates the UI from the Supabase session event', async () => {
    authMocks.auth.signInWithPassword.mockImplementation(async () => {
      authMocks.emit('SIGNED_IN', testSession);
      return { error: null };
    });
    renderPanel();
    await waitForSessionRestore();

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: ' OWNER@example.test ' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'not-a-real-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('owner@example.test')).toBeInTheDocument();
    expect(authMocks.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.test',
      password: 'not-a-real-password',
    });
  });

  it('registers without exposing whether an email already exists', async () => {
    renderPanel();
    await waitForSessionRestore();
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'mock-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'mock-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/If this address can be registered/)).toBeInTheDocument();
    expect(authMocks.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.test',
      password: 'mock-password-123',
      options: { emailRedirectTo: window.location.origin },
    });
  });

  it('requests a generic password-recovery link without account enumeration', async () => {
    renderPanel();
    await waitForSessionRestore();
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'owner@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send recovery link' }));

    expect(await screen.findByText(/If an account exists for this address/)).toBeInTheDocument();
    expect(authMocks.auth.resetPasswordForEmail).toHaveBeenCalledWith('owner@example.test', {
      redirectTo: window.location.origin,
    });
  });

  it('accepts a recovery event, updates the password and keeps the user session active', async () => {
    renderPanel();
    await waitForSessionRestore();
    await act(async () => {
      authMocks.emit('PASSWORD_RECOVERY', testSession);
    });
    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'another-mock-pass-456' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'another-mock-pass-456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('owner@example.test')).toBeInTheDocument();
    expect(screen.getByText('Password updated. Your account remains signed in.')).toBeInTheDocument();
    expect(authMocks.auth.updateUser).toHaveBeenCalledWith({ password: 'another-mock-pass-456' });
  });

  it('restores a saved session and signs out through Supabase', async () => {
    renderPanel(testSession);
    expect(await screen.findByText('owner@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('You have been signed out.')).toBeInTheDocument();
    expect(authMocks.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
