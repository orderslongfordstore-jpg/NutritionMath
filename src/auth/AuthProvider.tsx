/// <reference types="vite/client" />
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseProjectUrlStatus } from '../../server/supabaseProject.js';

// These are public browser credentials. Never put a service-role key in a Vite variable.
const env = import.meta.env as {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
};

const callbackKeys = [
  'access_token', 'refresh_token', 'id_token', 'provider_token', 'provider_refresh_token',
  'expires_in', 'expires_at', 'token_type', 'type', 'error', 'error_code',
  'error_description', 'code', 'code_verifier', 'token_hash', 'state', 'sb_flow_id',
];

// Match the SDK's precedence: search parameters override fragment parameters.
function inspectCallback() {
  if (typeof window === 'undefined') return { present: false, success: false, error: false, recovery: false, errorCode: '' };
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const has = (key: string) => url.searchParams.has(key) || hash.has(key);
  const get = (key: string) => url.searchParams.getAll(key).at(-1) ?? hash.getAll(key).at(-1) ?? '';
  const error = has('error') || has('error_code') || has('error_description');
  const tokensPresent = has('access_token') || has('refresh_token');
  // These are the fields required by the SDK's implicit callback parser.
  const valid = ['access_token', 'refresh_token', 'expires_in', 'token_type'].every(key => Boolean(get(key).trim()));
  const malformed = tokensPresent && !valid;
  const recovery = get('type') === 'recovery';
  return { present: error || tokensPresent, success: tokensPresent && valid && !error, error: error || malformed, recovery, errorCode: get('error_code') || get('error') };
}

const callback = inspectCallback();

function clearCallbackParameters() {
  if (!callback.present || typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const hasAuthFragment = callbackKeys.some(key => hash.has(key));
  for (const key of callbackKeys) {
    url.searchParams.delete(key);
    hash.delete(key);
  }
  // Preserve ordinary fragment navigation rather than treating it as a query.
  if (hasAuthFragment) {
    const remaining = hash.toString();
    url.hash = remaining ? `#${remaining}` : '';
  }
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

// Do not let the SDK consume credentials we already know are malformed. The
// captured error details above are enough to render a sanitized link notice.
if (callback.error) clearCallbackParameters();

function normalizedProjectUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.username || parsed.password) return null;
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

const projectStatus = supabaseProjectUrlStatus(env.VITE_SUPABASE_URL);
const projectUrl = projectStatus === 'allowed' ? normalizedProjectUrl(env.VITE_SUPABASE_URL) : null;
const configurationError = projectStatus === 'blocked'
  ? 'The previously used shared Supabase project is blocked. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for a separate project.'
  : null;
const storagePrefix = projectUrl ? `nutritionmath.auth.${encodeURIComponent(projectUrl)}` : null;
const recoveryPrefix = `${storagePrefix}.recovery.`;
const pendingPrefix = `${storagePrefix}.recovery-pending.`;
const pendingLifetimeMs = 10 * 60 * 1000;
const callbackEventTimeoutMs = 5000;
const fallbackRecovery = new Set<string>();
const recoveryWriteFailures = new Set<string>();
const recoveryListeners = new Set<() => void>();

function notifyRecoveryListeners() {
  recoveryListeners.forEach(listener => listener());
}

function recoveryKey(userId: string) {
  return `${recoveryPrefix}${encodeURIComponent(userId)}`;
}

function writeRecovery(userId: string, active: boolean) {
  if (active) fallbackRecovery.add(userId);
  else fallbackRecovery.delete(userId);
  try {
    if (active) window.localStorage.setItem(recoveryKey(userId), '1');
    else window.localStorage.removeItem(recoveryKey(userId));
    recoveryWriteFailures.delete(userId);
  } catch {
    // The current tab retains the marker in memory; other tabs fail closed if storage is blocked.
    recoveryWriteFailures.add(userId);
  }
  notifyRecoveryListeners();
}

function recoveryStatus(userId: string): { active: boolean; available: boolean; pending: boolean } {
  try {
    const storage = window.localStorage;
    // A readable but unwritable store cannot reliably publish a new recovery marker.
    const probe = `${storagePrefix}.storage-probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    const active = storage.getItem(recoveryKey(userId)) === '1';
    let pending = false;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(pendingPrefix)) {
        const expiry = Number(storage.getItem(key));
        if (Number.isFinite(expiry) && expiry > Date.now()) pending = true;
      }
    }
    return recoveryWriteFailures.has(userId)
      ? { active: fallbackRecovery.has(userId), available: false, pending }
      : { active, available: true, pending };
  } catch {
    return { active: fallbackRecovery.has(userId), available: false, pending: false };
  }
}

// A callback's session can be saved before PASSWORD_RECOVERY is delivered. Publish
// a short-lived project-level guard before constructing the SDK client, then
// replace it with a user-specific marker when the event identifies the user.
const pendingKey = storagePrefix && callback.success && callback.recovery
  ? `${pendingPrefix}${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
  : null;
if (pendingKey) {
  try { window.localStorage.setItem(pendingKey, String(Date.now() + pendingLifetimeMs)); } catch { /* detected by recoveryStatus */ }
}
function clearPendingRecovery() {
  if (!pendingKey) return;
  try { window.localStorage.removeItem(pendingKey); } catch { /* detected by recoveryStatus */ }
  notifyRecoveryListeners();
}

function makeClient(): SupabaseClient | null {
  const key = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!projectUrl || !storagePrefix || !key) return null;
  try {
    return createClient(projectUrl, key, {
      auth: { storageKey: `${storagePrefix}.session`, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch {
    return null;
  }
}

/** The single browser client, or null when the public environment is not configured. */
export const supabase = makeClient();
if (!supabase) {
  clearCallbackParameters();
  clearPendingRecovery();
}

// Subscribe immediately, before React mounts, to catch callbacks between client
// construction and mounting. Supabase also broadcasts auth events to open tabs.
let lastObservedUser: string | null = null;
let resolveCallbackEvent: (() => void) | undefined;
const callbackEvent = new Promise<void>(resolve => { resolveCallbackEvent = resolve; });
if (supabase) {
  supabase.auth.onAuthStateChange((event, nextSession) => {
    if (event === 'PASSWORD_RECOVERY' && nextSession?.user.id) {
      writeRecovery(nextSession.user.id, true);
      clearPendingRecovery();
    } else if (event === 'SIGNED_OUT' && lastObservedUser) {
      writeRecovery(lastObservedUser, false);
    }
    if (nextSession?.user.id) lastObservedUser = nextSession.user.id;
    else if (event === 'SIGNED_OUT') lastObservedUser = null;
    if (nextSession && (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && !callback.recovery))) resolveCallbackEvent?.();
  });
}

// initialize() returns the cached initialization result even when construction
// started it. Its error is otherwise lost: INITIAL_SESSION can still be emitted.
const initialization = supabase
  ? supabase.auth.initialize().then(result => {
      clearCallbackParameters();
      if (result.error || callback.error) clearPendingRecovery();
      return result.error;
    }).catch(error => {
      clearCallbackParameters();
      clearPendingRecovery();
      return error as unknown;
    })
  : Promise.resolve(null);

function isUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const details = typeof error === 'object' ? error as { name?: string; status?: number; code?: string } : {};
  // The SDK's redirect-error class itself has status 500 even for expired links.
  if (details.name === 'AuthImplicitGrantRedirectError') return false;
  return error instanceof TypeError || details.name === 'AuthRetryableFetchError' || details.status === 0 || details.status === 408 || details.status === 429 || (details.status !== undefined && details.status >= 500) || details.code === 'network_error' || details.code === 'request_timeout';
}

function callbackFailureIsUnavailable(error: unknown): boolean {
  if (isUnavailableError(error)) return true;
  if (['server_error', 'temporarily_unavailable', 'service_unavailable', 'internal_server_error', 'network_error', 'request_timeout'].includes(callback.errorCode)) return true;
  if (callback.error) return false;
  if (!error) return false;
  const details = typeof error === 'object' ? error as { name?: string; status?: number } : {};
  // Unknown errors are not evidence that a link has expired.
  return !(details.name === 'AuthImplicitGrantRedirectError' || details.name === 'AuthPKCEGrantCodeExchangeError' || (details.status !== undefined && details.status >= 400 && details.status < 500 && details.status !== 408 && details.status !== 429));
}

async function waitForCallbackEvent(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      callbackEvent.then(() => true),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), callbackEventTimeoutMs); }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export type AuthNotice = { kind: 'callback' | 'unavailable' | 'sign-out' | 'recovery-storage' | 'session-unusable'; text: string };

const expiredSessionNotice: AuthNotice = { kind: 'session-unusable', text: 'Your session has expired. Check your connection and try again, or sign in again.' };
const unverifiedSessionNotice: AuthNotice = { kind: 'session-unusable', text: 'Your session could not be verified. Check your connection and try again, or sign in again.' };

export interface AuthContextValue {
  session: Session | null;
  hasUnusableSession: boolean;
  loading: boolean;
  configured: boolean;
  configurationError: string | null;
  recovery: boolean;
  notice: AuthNotice | null;
  dismissNotice: () => void;
  signOut: () => Promise<void>;
  /** Call only after Supabase has successfully updated the recovered password. */
  completeRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [recovery, setRecovery] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [storageNotice, setStorageNotice] = useState<AuthNotice | null>(null);
  const [expiryTick, setExpiryTick] = useState(0);
  const currentSession = useRef<Session | null>(null);
  const sessionEventVersion = useRef(0);
  const signingOut = useRef(false);
  const clearedDuringSignOut = useRef(false);

  // Supabase expires_at is an absolute Unix timestamp in seconds.
  const expiry = typeof session?.expires_at === 'number' && Number.isFinite(session.expires_at * 1000)
    ? session.expires_at * 1000 : null;
  const expiryNotice = !session ? null : expiry === null ? unverifiedSessionNotice
    : expiry <= Date.now() ? expiredSessionNotice : null;
  const exposedSession = expiryNotice ? null : session;

  useEffect(() => {
    if (!session) return;
    const checkExpiry = () => setExpiryTick(tick => tick + 1);
    const remaining = expiry === null ? 0 : expiry - Date.now();
    // Browsers clamp longer delays to a signed 32-bit integer; recheck then.
    const timer = remaining > 0 ? setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647)) : undefined;
    // The deadline may have passed between the render and running this effect.
    if (remaining <= 0 && exposedSession) checkExpiry();
    document.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('focus', checkExpiry);
    window.addEventListener('pageshow', checkExpiry);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('focus', checkExpiry);
      window.removeEventListener('pageshow', checkExpiry);
    };
  }, [session, expiry, expiryTick]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    let ready = false;
    const events: { latest: { event: string; session: Session | null } | null } = { latest: null };
    let eventVersion = 0;

    function reconcileRecovery() {
      if (!active) return;
      const userId = currentSession.current?.user.id;
      if (!userId) {
        setRecovery(false);
        setStorageNotice(null);
        return;
      }
      const status = recoveryStatus(userId);
      setRecovery(status.active);
      setStorageNotice(!status.available
        ? { kind: 'recovery-storage', text: 'Recovery status cannot be shared between tabs. Enable browser storage and try again, or sign out.' }
        : status.pending
          ? { kind: 'recovery-storage', text: 'A password recovery is being verified in another tab. Wait for it to finish or sign out.' }
          : null);
    }

    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key.startsWith(recoveryPrefix) || event.key.startsWith(pendingPrefix)) {
        // A cross-tab removal must invalidate this tab's in-memory fallback too.
        const userId = currentSession.current?.user.id;
        if (userId && (event.key === null || event.key === recoveryKey(userId))) {
          if (event.newValue === '1') fallbackRecovery.add(userId);
          else fallbackRecovery.delete(userId);
        }
        reconcileRecovery();
      }
    }
    recoveryListeners.add(reconcileRecovery);
    window.addEventListener('storage', onStorage);

    function applySession(event: string, nextSession: Session | null) {
      if (!active) return;
      if (event === 'SIGNED_OUT' && currentSession.current?.user.id) {
        writeRecovery(currentSession.current.user.id, false);
      }
      currentSession.current = nextSession;
      setSession(nextSession);
      reconcileRecovery();
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT' && signingOut.current) clearedDuringSignOut.current = true;
      if (nextSession) sessionEventVersion.current += 1;
      events.latest = { event, session: nextSession };
      eventVersion += 1;
      // Never await another Supabase call inside this callback.
      if (ready) applySession(event, nextSession);
    });

    void (async () => {
      const initError = await initialization;
      if (!active) return;
      if (callback.present && (callback.error || initError)) {
        setNotice(callbackFailureIsUnavailable(initError)
          ? { kind: 'unavailable', text: 'The authentication service is unavailable. Check your connection and try again.' }
          : { kind: 'callback', text: 'This confirmation or password reset link is invalid, expired, or could not be verified. Request a new link and try again.' });
      } else if (initError) {
        setNotice({ kind: 'unavailable', text: 'The authentication service is unavailable. Check your connection and try again.' });
      }
      // INITIAL_SESSION alone does not identify a recovery. Do not wait forever
      // if the SDK never delivers the expected event.
      const eventReceived = !callback.success || Boolean(initError) || await waitForCallbackEvent();
      if (!active) return;
      if (!eventReceived) setNotice({ kind: 'callback', text: 'We could not verify this confirmation or password reset link. Request a new link and try again.' });
      const versionBeforeRead = eventVersion;
      try {
        const { data, error } = await client.auth.getSession();
        if (!active) return;
        if (error && !initError && !callback.error && eventReceived) {
          setNotice({ kind: 'unavailable', text: 'The authentication service is unavailable. Check your connection and try again.' });
        }
        ready = true;
        const newer = eventVersion !== versionBeforeRead ? events.latest : null;
        const restored = newer ? newer.session : error ? null : data.session;
        // If a recovery event never arrived, conservatively retain recovery for
        // the restored user rather than accidentally showing the dashboard.
        if (!eventReceived && callback.recovery && restored?.user.id) writeRecovery(restored.user.id, true);
        if (!eventReceived) clearPendingRecovery();
        applySession(newer?.event ?? 'SESSION_RESTORED', restored);
      } catch {
        if (!active) return;
        if (!initError && !callback.error && eventReceived) setNotice({ kind: 'unavailable', text: 'The authentication service is unavailable. Check your connection and try again.' });
        ready = true;
        if (!eventReceived && callback.recovery && events.latest?.session?.user.id) writeRecovery(events.latest.session.user.id, true);
        if (!eventReceived) clearPendingRecovery();
        if (events.latest) applySession(events.latest.event, events.latest.session);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
      recoveryListeners.delete(reconcileRecovery);
      window.removeEventListener('storage', onStorage);
      subscription.unsubscribe();
    };
  }, []);

  const completeRecovery = useCallback(() => {
    const userId = currentSession.current?.user.id;
    if (userId) writeRecovery(userId, false);
    setRecovery(false);
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error('Authentication is not configured.');
    const versionAtStart = sessionEventVersion.current;
    const userAtStart = currentSession.current?.user.id;
    signingOut.current = true;
    clearedDuringSignOut.current = false;
    try {
      // The auth pool may be shared with other apps; do not revoke other sessions.
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      // SIGNED_OUT can precede network revocation. Never erase a later sign-in.
      if (sessionEventVersion.current === versionAtStart) {
        if (userAtStart) writeRecovery(userAtStart, false);
        currentSession.current = null;
        setRecovery(false);
        setStorageNotice(null);
        setSession(null);
      }
      setNotice(previous => previous?.kind === 'sign-out' ? null : previous);
    } catch {
      if (clearedDuringSignOut.current) {
        setNotice({ kind: 'sign-out', text: 'The previous session was cleared on this device, but server-side revocation could not be confirmed. The previous session may still be active on the server; contact support if concerned.' });
      } else {
        setNotice({ kind: 'sign-out', text: 'Sign-out could not be completed. Please try again.' });
      }
      throw new Error('Could not confirm sign-out.');
    } finally {
      signingOut.current = false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session: exposedSession, hasUnusableSession: Boolean(expiryNotice), loading, configured: Boolean(supabase), configurationError, recovery, notice: storageNotice ?? notice ?? expiryNotice, dismissNotice, signOut, completeRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
