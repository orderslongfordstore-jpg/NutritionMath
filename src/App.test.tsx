import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import App from './App';

vi.mock('./lib/supabase', () => ({
  supabase: null,
  getSupabaseStatus: () => ({ configured: false, message: 'No approved project.' }),
  getSupabaseConfigSummary: () => ({ hasUrl: false, hasAnonKey: false, serviceRoleExposed: false }),
}));

describe('application access without a configured Supabase project', () => {
  it('keeps private workspaces gated until the user explicitly chooses session-only local mode', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

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
});
