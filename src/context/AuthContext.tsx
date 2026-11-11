import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  lastAuthEvent: AuthChangeEvent | null;
  sessionError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAuthEvent, setLastAuthEvent] = useState<AuthChangeEvent | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setLastAuthEvent(event);
      setSession(nextSession);
      setSessionError(null);
      setLoading(false);
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setSession(null);
          setSessionError('Could not restore the saved sign-in session. Please sign in again.');
        } else {
          setSession(data.session);
          setSessionError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setSessionError('Could not restore the saved sign-in session. Please sign in again.');
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(supabase),
    loading,
    session,
    user: session?.user ?? null,
    lastAuthEvent,
    sessionError,
  }), [lastAuthEvent, loading, session, sessionError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
