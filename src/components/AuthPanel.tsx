import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { SectionCard } from './SectionCard';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'update-password';

function callbackUrl() {
  return window.location.origin;
}

export function AuthPanel() {
  const { configured, loading, user, lastAuthEvent, sessionError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (lastAuthEvent === 'PASSWORD_RECOVERY') {
      setMode('update-password');
      setPassword('');
      setConfirmation('');
      setErrorMessage('');
      setNotice('Set a new password to finish account recovery.');
    }
  }, [lastAuthEvent]);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmation('');
    setErrorMessage('');
    setNotice('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');

    if (!supabase) {
      setErrorMessage('Authentication is unavailable because no approved Supabase project is configured.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if ((mode === 'sign-up' || mode === 'update-password') && password.length < 8) {
      setErrorMessage('Use a password with at least 8 characters.');
      return;
    }
    if ((mode === 'sign-up' || mode === 'update-password') && password !== confirmation) {
      setErrorMessage('The password entries do not match.');
      return;
    }
    if (mode === 'update-password' && !user) {
      setErrorMessage('Open the password-recovery link before setting a new password.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          setErrorMessage('Email or password was not accepted.');
          return;
        }
        setPassword('');
        setNotice('Sign-in succeeded. Your saved session will be restored by Supabase on this device.');
      } else if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: callbackUrl() },
        });
        if (error) {
          setErrorMessage('Could not create an account with those details. Try signing in or use password recovery.');
          return;
        }
        setPassword('');
        setConfirmation('');
        setNotice(data.session
          ? 'Account created and signed in.'
          : 'If this address can be registered, check your inbox for a confirmation link.');
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: callbackUrl(),
        });
        if (error) {
          setErrorMessage('The recovery request could not be sent. Check your connection and try again.');
          return;
        }
        setNotice('If an account exists for this address, a recovery link will be sent. Check your inbox and spam folder.');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setErrorMessage('The password could not be updated. Request a new recovery link and try again.');
          return;
        }
        setPassword('');
        setConfirmation('');
        setMode('sign-in');
        setNotice('Password updated. Your account remains signed in.');
      }
    } catch {
      setErrorMessage('The request could not be completed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setErrorMessage('Sign-out could not be completed. Please try again.');
      } else {
        changeMode('sign-in');
        setNotice('You have been signed out.');
      }
    } catch {
      setErrorMessage('Sign-out could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const showStatus = (error?: string, success?: string) => (
    <>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      {success ? <p className="auth-notice" role="status" aria-live="polite">{success}</p> : null}
    </>
  );

  return (
    <SectionCard
      title="Account access"
      description="Email/password sessions are handled by Supabase. No service-role key is used in this browser app."
    >
      {!configured ? (
        <div className="auth-status-panel" role="status" aria-live="polite">
          <h3>Authentication is not connected</h3>
          <p>No Supabase project is currently approved for this development build. Account forms are disabled, and no credentials are requested.</p>
          <p>Configure only a separately approved staging project before testing real registration or login. The production project and the unapproved candidate remain untouched.</p>
        </div>
      ) : loading ? (
        <div className="auth-status-panel" role="status" aria-live="polite">
          <h3>Checking account session</h3>
          <p>Supabase is restoring the saved session for this browser.</p>
        </div>
      ) : user && mode !== 'update-password' ? (
        <div className="auth-session-panel">
          <div>
            <p className="eyebrow">Signed in</p>
            <h3>{user.email || 'NutritionPro account'}</h3>
            <p>Authentication is active for this session. Database access remains subject to the approved project’s Row Level Security policies.</p>
          </div>
          {showStatus(sessionError || errorMessage, notice)}
          <div className="action-row">
            <button type="button" className="primary-button" onClick={() => changeMode('update-password')} disabled={busy}>
              Update password
            </button>
            <button type="button" className="secondary-button" onClick={() => void handleSignOut()} disabled={busy}>
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-form-wrap">
          {sessionError ? <p className="auth-error" role="alert">{sessionError}</p> : null}
          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
            {mode !== 'update-password' ? (
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={busy}
                />
              </label>
            ) : null}

            {mode !== 'forgot-password' ? (
              <label>
                {mode === 'update-password' ? 'New password' : 'Password'}
                <input
                  type="password"
                  name="password"
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={mode === 'sign-in' ? undefined : 8}
                  required
                  disabled={busy}
                />
              </label>
            ) : null}

            {mode === 'sign-up' || mode === 'update-password' ? (
              <label>
                Confirm password
                <input
                  type="password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={8}
                  required
                  disabled={busy}
                />
              </label>
            ) : null}

            {showStatus(errorMessage, notice)}

            <button type="submit" className="primary-button" disabled={busy || loading}>
              {busy
                ? 'Please wait…'
                : mode === 'sign-in'
                  ? 'Sign in'
                  : mode === 'sign-up'
                    ? 'Create account'
                    : mode === 'forgot-password'
                      ? 'Send recovery link'
                      : 'Update password'}
            </button>
          </form>

          <div className="auth-mode-links" aria-label="Account options">
            {mode !== 'sign-in' ? (
              <button type="button" className="auth-link" onClick={() => changeMode('sign-in')} disabled={busy}>
                Back to sign in
              </button>
            ) : null}
            {mode === 'sign-in' ? (
              <>
                <button type="button" className="auth-link" onClick={() => changeMode('sign-up')} disabled={busy}>
                  Create an account
                </button>
                <button type="button" className="auth-link" onClick={() => changeMode('forgot-password')} disabled={busy}>
                  Forgot password?
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
