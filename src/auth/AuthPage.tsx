import { useId, useState, type FormEvent } from 'react';
import { supabase, useAuth } from './AuthProvider';
import './auth.css';

type Mode = 'sign-in' | 'sign-up' | 'reset' | 'resend';
type Notice = { kind: 'error' | 'success'; text: string } | null;

function publicError(error: unknown, action: Mode | 'update' | 'sign-out'): string {
  const details = typeof error === 'object' && error !== null
    ? error as { status?: number; code?: string; name?: string }
    : {};
  if (details.status === 429 || details.code?.includes('rate_limit')) {
    return 'Too many attempts. Please wait a little while and try again.';
  }
  if (error instanceof TypeError || details.name === 'AuthRetryableFetchError' || details.status === 0 || details.status === 408 || (details.status !== undefined && details.status >= 500) || details.code === 'network_error' || details.code === 'request_timeout') {
    return 'The authentication service is temporarily unavailable. Check your connection and try again.';
  }
  if (action === 'sign-in') {
    if (details.code === 'email_not_confirmed') {
      return 'Please confirm your email address before signing in.';
    }
    if (details.code === 'invalid_credentials' || details.name === 'AuthInvalidCredentialsError') {
      return 'Could not sign in. Check your details and try again.';
    }
    return 'Could not sign in right now. Please try again.';
  }
  if (action === 'sign-up') return 'Could not create your account. Check your details and try again.';
  if (action === 'reset') return 'Could not request a reset link. Please try again.';
  if (action === 'resend') return 'Could not request a confirmation link. Please try again.';
  if (action === 'update') {
    return 'Could not update your password. Check the password requirements or request a new reset link.';
  }
  return 'Could not sign out. Please try again.';
}

function callbackUrl(): string {
  // Keep the current route, but not callback query parameters or tokens.
  return `${window.location.origin}${window.location.pathname}`;
}

export function AuthPage() {
  const { session, hasUnusableSession, loading, configured, configurationError, recovery, notice: authNotice, dismissNotice, signOut, completeRecovery } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const id = useId();
  const linkProblem = authNotice?.kind === 'callback';
  const isRecovery = recovery && Boolean(session) && !linkProblem;
  const isSignedIn = Boolean(session) && !recovery && !linkProblem;

  function changeMode(next: Mode) {
    setMode(next);
    setPassword('');
    setConfirmation('');
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !supabase) return;
    setNotice(null);

    if ((isRecovery || mode === 'sign-up') && password !== confirmation) {
      setNotice({ kind: 'error', text: 'The passwords do not match. Please try again.' });
      return;
    }

    setBusy(true);
    const action = isRecovery ? 'update' : mode;
    try {
      if (isRecovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        setNotice({ kind: 'success', text: 'Your password has been updated.' });
        completeRecovery();
      } else if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setPassword('');
        dismissNotice();
      } else if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: callbackUrl() },
        });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        if (data.session) dismissNotice();
        if (!data.session) {
          setNotice({ kind: 'success', text: 'If a confirmation email is required, check your inbox for a link to finish signing up.' });
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: callbackUrl(),
        });
        if (error) throw error;
        setNotice({ kind: 'success', text: 'If an account exists for this email, you will receive a password reset link. Check your inbox.' });
      } else {
        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: callbackUrl() } });
        if (error) throw error;
        setNotice({ kind: 'success', text: 'If confirmation is needed, check your inbox for a new link.' });
      }
    } catch (error) {
      setNotice({ kind: 'error', text: publicError(error, action) });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await signOut();
      setPassword('');
      setConfirmation('');
      setMode('sign-in');
    } catch {
      // The provider retains this error across session-driven screen changes.
    } finally {
      setBusy(false);
    }
  }

  const title = !configured ? 'Set up authentication'
    : loading ? 'Getting things ready'
    : isRecovery ? 'Choose a new password'
    : isSignedIn ? 'You’re signed in'
    : mode === 'sign-up' ? 'Create your account'
    : mode === 'reset' ? 'Reset your password'
    : mode === 'resend' ? 'Resend confirmation'
    : 'Welcome back';
  const description = !configured ? 'Connect your Supabase project to use secure sign-in.'
    : loading ? 'Checking your session securely.'
    : isRecovery ? 'Enter a new password for your account.'
    : isSignedIn ? 'Your session is active on this device.'
    : mode === 'sign-up' ? 'Create an account to access NutritionMath.'
    : mode === 'reset' ? 'Enter your email and we’ll send you a reset link.'
    : mode === 'resend' ? 'Enter your email to request a new confirmation link.'
    : 'Sign in to continue to your workspace.';

  return (
    <main className="nm-auth">
      <div className="nm-auth__layout">
        <aside className="nm-auth__intro" aria-label="About NutritionMath">
          <div className="nm-auth__brand"><span className="nm-auth__brand-mark" aria-hidden="true">N<span>.</span></span><span>NutritionMath</span></div>
          <div className="nm-auth__intro-copy">
            <span className="nm-auth__eyebrow">MADE FOR FOOD PEOPLE</span>
            <p className="nm-auth__intro-title">Good food.<br /><em>Clear numbers.</em></p>
            <p className="nm-auth__intro-description">Recipe, ingredient and nutrition tools are planned for a later stage.</p>
          </div>
          <p className="nm-auth__intro-footer"><span aria-hidden="true">✳</span> A smarter way to work with food.</p>
        </aside>

        <section className="nm-auth__panel" aria-labelledby={`${id}-title`}>
          <div className="nm-auth__mobile-brand"><span className="nm-auth__brand-mark" aria-hidden="true">N<span>.</span></span><span>NutritionMath</span></div>
          <div className="nm-auth__content">
            <div className="nm-auth__heading">
              <span className="nm-auth__section-label">YOUR WORKSPACE <span aria-hidden="true">/</span> ACCOUNT</span>
              <h1 id={`${id}-title`}>{title}</h1>
              <p>{description}</p>
              {configured && !loading && !isSignedIn && (
                <p className="nm-auth__shared-account">Accounts belong to the configured Supabase project.{(isRecovery || mode === 'reset') && ' If other apps use this same account and project, changing your password affects those apps too.'}</p>
              )}
            </div>

            {!configured ? (
              <div className="nm-auth__setup" role="status">
                {configurationError ?? <>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your Vite environment, then restart the app. Use a public anon or publishable key, never a service-role key.</>}
              </div>
            ) : loading ? (
              <p className="nm-auth__loading" role="status">Loading your session…</p>
            ) : <>
              {authNotice && <div className="nm-auth__notice nm-auth__notice--error" role="alert">
                <p>{authNotice.text}</p>
                {authNotice.kind === 'callback' && <p>
                  <button className="nm-auth__text-button" type="button" onClick={() => changeMode('reset')}>Request a new password reset link</button>{' · '}
                  <button className="nm-auth__text-button" type="button" onClick={() => changeMode('resend')}>Resend confirmation email</button>
                </p>}
                {(authNotice.kind === 'unavailable' || authNotice.kind === 'recovery-storage' || authNotice.kind === 'session-unusable') && <p><button className="nm-auth__text-button" type="button" onClick={() => window.location.reload()}>Try again</button></p>}
                {authNotice.kind !== 'recovery-storage' && authNotice.kind !== 'session-unusable' && <button className="nm-auth__text-button" type="button" onClick={dismissNotice}>{session ? 'Continue to your account' : 'Dismiss'}</button>}
              </div>}
              {isSignedIn ? (
              <div className="nm-auth__signed-in">
                {session?.user.email && <p className="nm-auth__account">Signed in as <strong>{session.user.email}</strong></p>}
                {notice && <p className={`nm-auth__notice nm-auth__notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
                <button className="nm-auth__button nm-auth__button--secondary" type="button" onClick={handleSignOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
              </div>
            ) : (
              <>
                {notice && <p className={`nm-auth__notice nm-auth__notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
                <form className="nm-auth__form" onSubmit={handleSubmit}>
                  <fieldset disabled={busy}>
                    {!isRecovery && (
                      <div className="nm-auth__field">
                        <label htmlFor={`${id}-email`}>Email address</label>
                        <input id={`${id}-email`} type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required />
                      </div>
                    )}
                    {(isRecovery || (mode !== 'reset' && mode !== 'resend')) && (
                      <div className="nm-auth__field">
                        <div className="nm-auth__label-row">
                          <label htmlFor={`${id}-password`}>{isRecovery ? 'New password' : 'Password'}</label>
                          {!isRecovery && mode === 'sign-in' && <button className="nm-auth__text-button" type="button" onClick={() => changeMode('reset')}>Forgot password?</button>}
                        </div>
                        <input id={`${id}-password`} type="password" name="password" autoComplete={isRecovery || mode === 'sign-up' ? 'new-password' : 'current-password'} placeholder={isRecovery || mode === 'sign-up' ? 'At least 6 characters' : 'Enter your password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={isRecovery || mode === 'sign-up' ? 6 : undefined} aria-describedby={isRecovery || mode === 'sign-up' ? `${id}-password-hint` : undefined} />
                        {(isRecovery || mode === 'sign-up') && <p className="nm-auth__hint" id={`${id}-password-hint`}>Use at least 6 characters. Your project may require more.</p>}
                      </div>
                    )}
                    {(isRecovery || mode === 'sign-up') && (
                      <div className="nm-auth__field">
                        <label htmlFor={`${id}-confirm`}>Confirm password</label>
                        <input id={`${id}-confirm`} type="password" name="confirm-password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
                      </div>
                    )}
                    <button className="nm-auth__button nm-auth__button--primary" type="submit">
                      {busy ? 'Please wait…' : isRecovery ? 'Update password' : mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : mode === 'resend' ? 'Send confirmation link' : 'Sign in'}
                      {!busy && <span aria-hidden="true">↗</span>}
                    </button>
                  </fieldset>
                </form>
                {!isRecovery && (
                  <div className="nm-auth__switch">
                    {mode === 'sign-in' ? <>New to NutritionMath? <button className="nm-auth__text-button" type="button" disabled={busy} onClick={() => changeMode('sign-up')}>Create an account</button></> : <>Already have an account? <button className="nm-auth__text-button" type="button" disabled={busy} onClick={() => changeMode('sign-in')}>Sign in</button></>}
                  </div>
                )}
                {isRecovery && <div className="nm-auth__switch"><button className="nm-auth__text-button" type="button" disabled={busy} onClick={handleSignOut}>Cancel and sign out</button></div>}
                {hasUnusableSession && <div className="nm-auth__switch"><button className="nm-auth__text-button" type="button" disabled={busy} onClick={handleSignOut}>{busy ? 'Signing out…' : 'Sign out'}</button></div>}
              </>
              )}
            </>}
            <p className="nm-auth__footnote">A little more clarity, from recipe to label.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;
