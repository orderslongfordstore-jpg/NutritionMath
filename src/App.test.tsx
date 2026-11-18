// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const mocks = vi.hoisted(() => ({
  state: {
    session: null as null | { user: { email?: string } },
    loading: false,
    recovery: false,
    notice: null as null | { kind: string; text: string },
    signOut: vi.fn(),
  },
}));
vi.mock('./auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mocks.state,
}));
vi.mock('./auth/AuthPage', () => ({ default: () => <div>Authentication screen</div> }));
vi.mock('./components/Dashboard', () => ({
  default: ({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) => (
    <div>Dashboard for {email}<button onClick={onSignOut}>Sign out</button></div>
  ),
}));

beforeEach(() => {
  mocks.state.session = null;
  mocks.state.loading = false;
  mocks.state.recovery = false;
  mocks.state.notice = null;
  mocks.state.signOut.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('application session gate', () => {
  it('shows a loading state before rendering protected content', () => {
    mocks.state.loading = true;
    render(<App />);
    expect(screen.getByText(/Checking your session/)).toBeTruthy();
    expect(screen.queryByText(/Dashboard for/)).toBeNull();
  });

  it('shows authentication when signed out', () => {
    render(<App />);
    expect(screen.getByText('Authentication screen')).toBeTruthy();
    expect(screen.queryByText(/Dashboard for/)).toBeNull();
  });

  it('shows the authenticated dashboard and passes through sign-out', () => {
    mocks.state.session = { user: { email: 'maker@example.com' } };
    render(<App />);
    expect(screen.getByText(/Dashboard for maker@example.com/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(mocks.state.signOut).toHaveBeenCalledOnce();
  });

  it('keeps the recovery form visible even with a recovery session', () => {
    mocks.state.session = { user: { email: 'maker@example.com' } };
    mocks.state.recovery = true;
    render(<App />);
    expect(screen.getByText('Authentication screen')).toBeTruthy();
    expect(screen.queryByText(/Dashboard for/)).toBeNull();
  });

  it('shows an authentication notice instead of silently opening the dashboard', () => {
    mocks.state.session = { user: { email: 'maker@example.com' } };
    mocks.state.notice = { kind: 'callback', text: 'Link expired' };
    render(<App />);
    expect(screen.getByText('Authentication screen')).toBeTruthy();
    expect(screen.queryByText(/Dashboard for/)).toBeNull();
  });

  it('uses a neutral account label when the email is missing', () => {
    mocks.state.session = { user: {} };
    render(<App />);
    expect(screen.getByText(/Dashboard for Your account/)).toBeTruthy();
  });
});
