import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import App from './App';

vi.mock('./lib/supabase', () => ({
  supabase: null,
  getSupabaseStatus: () => ({ configured: false, message: 'No approved project.' }),
  getSupabaseConfigSummary: () => ({ hasUrl: false, hasAnonKey: false, serviceRoleExposed: false }),
}));

describe('application access without an approved Supabase project', () => {
  it('fails closed on private workspaces and does not request account credentials', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Recipes' }));
    expect(screen.getByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open account access' }));

    expect(await screen.findByRole('heading', { name: 'Authentication is not connected' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });
});
