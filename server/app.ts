import { createClient } from '@supabase/supabase-js';
import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import { supabaseProjectUrlStatus } from './supabaseProject.js';

/** A verifier must authenticate the supplied token, not merely decode it. */
export type TokenVerifier = (token: string) => Promise<{ id: string } | null>;

export interface AppOptions {
  /** Dependency injection for tests or an independently implemented verifier. */
  verifyToken?: TokenVerifier;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  nodeEnv?: string;
  /** Directory containing the built public Vite assets; false disables serving them. */
  staticDir?: string | false;
}

// Reject known Supabase service-role key formats, even if misconfigured as the
// anon key. The decoded payload is used only to DENY a key, never to authorize.
function isServiceRoleKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload === 'object' && payload !== null &&
      'role' in payload && payload.role === 'service_role';
  } catch {
    return false;
  }
}

function createSupabaseVerifier(url: string | undefined, anonKey: string | undefined): TokenVerifier | undefined {
  const cleanUrl = url?.trim();
  const cleanKey = anonKey?.trim();
  if (!cleanUrl || supabaseProjectUrlStatus(cleanUrl) !== 'allowed' || !cleanKey || isServiceRoleKey(cleanKey)) return undefined;

  try {
    const supabase = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    return async (token) => {
      // getUser makes an authenticated request to Supabase; do not decode or
      // otherwise accept the user JWT locally without verifying it.
      const { data, error } = await supabase.auth.getUser(token);
      if (error) {
        // Invalid/expired credentials are distinct from an unavailable auth service.
        if (!error.status || error.status === 429 || error.status >= 500) {
          throw new Error('Authentication service unavailable');
        }
        return null;
      }
      return data.user ? { id: data.user.id } : null;
    };
  } catch {
    // A bad URL or client setup must not prevent health checks or bypass auth.
    return undefined;
  }
}

function unauthorized(res: express.Response): void {
  res.set('WWW-Authenticate', 'Bearer');
  res.status(401).json({ error: 'Unauthorized' });
}

// Prevent URL-encoded or repeated-slash API paths from falling through to the SPA.
function isApiPath(rawPath: string): boolean {
  let decoded = rawPath;
  for (let count = 0; count < 3; count += 1) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  const slashes = decoded.replace(/\\/g, '/');
  const normalized = path.posix.normalize(`/${slashes}`);
  return /^\/+api(?:\/|$)/i.test(slashes) || /^\/api(?:\/|$)/i.test(normalized);
}

export function createApp(options: AppOptions = {}): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');

  app.use((_req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    });
    next();
  });

  // Limit bodies even though the current API exposes only GET routes.
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb', parameterLimit: 100 }));

  const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL;
  const blockedProject = supabaseProjectUrlStatus(supabaseUrl) === 'blocked';
  const verifyToken = blockedProject ? undefined : options.verifyToken ?? createSupabaseVerifier(
    supabaseUrl,
    options.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY,
  );

  const api = express.Router();
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.get('/me', async (req, res) => {
    const authorization = req.get('authorization') ?? '';
    // RFC 6750 bearer-token syntax; do not pass malformed input to the verifier.
    const match = /^Bearer[ \t]+([A-Za-z0-9._~+\/-]+=*)$/i.exec(authorization);
    if (!match || match[1].length > 8192) {
      unauthorized(res);
      return;
    }
    if (!verifyToken) {
      res.status(503).json(blockedProject
        ? { error: 'Authentication unavailable', configuration: 'The previously used shared Supabase project is blocked. Configure SUPABASE_URL and SUPABASE_ANON_KEY for a separate project.' }
        : { error: 'Authentication unavailable' });
      return;
    }
    try {
      const user = await verifyToken(match[1]);
      if (!user || typeof user.id !== 'string' || user.id.length === 0) {
        unauthorized(res);
        return;
      }
      // Do not return the token, email, metadata, or any other provider fields.
      res.json({ user: { id: user.id } });
    } catch {
      // Never log provider errors: they can include credentials or tokens.
      res.status(503).json({ error: 'Authentication unavailable' });
    }
  });

  api.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use('/api', api);

  app.use((req, res, next) => {
    try {
      if (isApiPath(req.path)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      next();
    } catch {
      res.status(400).json({ error: 'Bad request' });
    }
  });

  const production = (options.nodeEnv ?? process.env.NODE_ENV) === 'production';
  if (production && options.staticDir !== false) {
    const staticDir = path.resolve(options.staticDir ?? path.join(process.cwd(), 'dist'));
    app.use(express.static(staticDir, { dotfiles: 'ignore', index: false }));
    app.use((req, res, next) => {
      // Missing assets, hidden paths, and non-navigation requests remain 404s.
      const decodedPath = decodeURIComponent(req.path);
      const hiddenSegment = decodedPath.split(/[\\/]/).some((part) => part.startsWith('.'));
      if ((req.method !== 'GET' && req.method !== 'HEAD') ||
          !req.accepts('html') || hiddenSegment || path.posix.extname(decodedPath)) {
        next();
        return;
      }
      res.sendFile(path.join(staticDir, 'index.html'), (error) => {
        if (error) next(error);
      });
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Preserve client-error statuses from Express/body parsing without echoing
  // request content or internal error messages.
  const handleError: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const candidate = error as { status?: unknown; statusCode?: unknown } | null;
    const code = candidate?.status ?? candidate?.statusCode;
    const status = typeof code === 'number' && Number.isInteger(code) && code >= 400 && code <= 599
      ? code : 500;
    const message = status === 400 ? 'Bad request' :
      status === 404 ? 'Not found' : status === 413 ? 'Request too large' :
      status >= 500 ? 'Internal server error' : 'Request failed';
    res.status(status).json({ error: message });
  };
  app.use(handleError);
  return app;
}
