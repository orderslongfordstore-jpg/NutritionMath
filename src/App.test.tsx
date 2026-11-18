import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const authState = vi.hoisted(() => ({
  current: { configured: false, loading: false, user: null as { id: string } | null },
}));

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => authState.current,
}));

vi.mock('./lib/supabase', () => ({
  supabase: null,
  getSupabaseStatus: () => ({ configured: false, message: 'No approved project.' }),
  getSupabaseConfigSummary: () => ({ hasUrl: false, hasAnonKey: false, serviceRoleExposed: false }),
}));

describe('application access without a configured Supabase project', () => {
  beforeEach(() => {
    authState.current = { configured: false, loading: false, user: null };
  });

  it('keeps private workspaces gated until the user explicitly chooses session-only local mode', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Recipes' }));
    expect(screen.getByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue in local-only mode' })).toBeInTheDocument();
    expect(screen.getByText(/No sign-in, database connection or durable save is provided/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue in local-only mode' }));
    expect(screen.getByRole('heading', { name: 'Recipe calculator' })).toBeInTheDocument();
    expect(screen.getByText(/Local-only workspace — all records are kept in this page session/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ingredients' }));
    expect(screen.getByRole('heading', { name: 'Ingredient records' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Labels' }));
    expect(screen.getByRole('heading', { name: 'Printable food-label draft' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Accounts' }));
    expect(await screen.findByRole('heading', { name: 'Authentication is not connected' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('discards session records synchronously when the authenticated user changes', () => {
    authState.current = { configured: true, loading: false, user: { id: 'user-one' } };
    const { rerender } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Ingredients' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Add reference' })[0]);
    expect(screen.getAllByRole('button', { name: 'Added' })).toHaveLength(1);

    authState.current = { configured: true, loading: false, user: { id: 'user-two' } };
    rerender(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Ingredients' }));
    expect(screen.queryAllByRole('button', { name: 'Added' })).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: 'Add reference' })).toHaveLength(4);
    expect(screen.getByText('No ingredient records yet. Add verified values above; nothing is preloaded.')).toBeInTheDocument();
  });
});
