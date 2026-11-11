import { useState } from 'react';
import { getSupabaseStatus } from '../lib/supabase';
import { SectionCard } from './SectionCard';

export function AuthPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('team@nutritionpro.app');
  const [password, setPassword] = useState('SecurePass123!');
  const [status, setStatus] = useState('Ready for Supabase authentication setup.');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const supabaseStatus = getSupabaseStatus();

    if (!supabaseStatus.configured) {
      setStatus(supabaseStatus.message);
      return;
    }

    setStatus(`${mode === 'signin' ? 'Sign in' : 'Account registration'} request prepared for Supabase.`);
  };

  return (
    <SectionCard title="Accounts and authentication" description="Use Supabase Auth with secure sessions, row-level policy support, and ownership controls.">
      <div className="auth-layout">
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="segmented-control">
            <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>
              Sign in
            </button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
              Register
            </button>
          </div>

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>

          <button type="submit" className="primary-button">
            {mode === 'signin' ? 'Continue to NutritionPro' : 'Create account'}
          </button>
        </form>

        <div className="auth-status-panel">
          <h3>Security checklist</h3>
          <ul>
            <li>Supabase Auth configured via environment variables</li>
            <li>Session persistence enabled</li>
            <li>Row Level Security reserved for saved data</li>
            <li>No service-role key in frontend code</li>
          </ul>
          <p>{status}</p>
        </div>
      </div>
    </SectionCard>
  );
}
