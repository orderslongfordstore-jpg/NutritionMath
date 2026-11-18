import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}));

// The actual provider must never be contacted by this test suite.
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  mocks.createClient.mockReset();
  mocks.getUser.mockReset();
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser } });
});

const unavailableConfig = { supabaseUrl: '', supabaseAnonKey: '' };

describe('public API and headers', () => {
  it('returns public health without configuration or sensitive details', async () => {
    const response = await request(createApp(unavailableConfig)).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('returns a JSON 404 for unknown API paths and methods', async () => {
    const app = createApp(unavailableConfig);
    for (const [method, url] of [['get', '/api'], ['get', '/api/nope'], ['post', '/api/me']] as const) {
      const response = await request(app)[method](url);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
      expect(response.headers['cache-control']).toBe('no-store');
    }
  });

  it('limits request bodies and preserves parser error statuses without echoing input', async () => {
    const app = createApp(unavailableConfig);
    const large = await request(app).post('/api/missing').set('Content-Type', 'application/json')
      .send(JSON.stringify({ value: 'x'.repeat(20_000) }));
    expect(large.status).toBe(413);
    expect(large.body).toEqual({ error: 'Request too large' });
    const malformed = await request(app).post('/api/missing').set('Content-Type', 'application/json').send('{');
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: 'Bad request' });
  });
});

describe('GET /api/me', () => {
  it('rejects missing or malformed authorization without calling the verifier', async () => {
    const verifyToken = vi.fn();
    const app = createApp({ verifyToken });
    for (const header of [undefined, 'Basic abc', 'Bearer', 'Bearer abc def', 'Bearer abc,def', 'Bearer ' + 'x'.repeat(8193)]) {
      const req = request(app).get('/api/me');
      if (header) req.set('Authorization', header);
      const response = await req;
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
      expect(response.headers['www-authenticate']).toBe('Bearer');
      expect(response.headers['cache-control']).toBe('no-store');
    }
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects a token the verifier does not authenticate', async () => {
    const verifyToken = vi.fn().mockResolvedValue(null);
    const response = await request(createApp({ verifyToken })).get('/api/me').set('Authorization', 'Bearer bad.token');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
    expect(verifyToken).toHaveBeenCalledWith('bad.token');
  });

  it('returns only the verified user id', async () => {
    const verifyToken = vi.fn().mockResolvedValue({ id: 'user-123', email: 'private@example.test', metadata: { secret: true } });
    const response = await request(createApp({ verifyToken })).get('/api/me').set('Authorization', 'bearer good-token');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: { id: 'user-123' } });
    expect(response.text).not.toContain('good-token');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(verifyToken).toHaveBeenCalledOnce();
    expect(verifyToken).toHaveBeenCalledWith('good-token');
  });

  it('fails closed when the verifier returns an invalid identity', async () => {
    const response = await request(createApp({ verifyToken: async () => ({ id: '' }) }))
      .get('/api/me').set('Authorization', 'Bearer token');
    expect(response.status).toBe(401);
  });

  it('handles verifier exceptions without returning or logging tokens or error details', async () => {
    const log = vi.spyOn(console, 'log');
    const error = vi.spyOn(console, 'error');
    try {
      const response = await request(createApp({ verifyToken: async () => { throw new Error('sensitive-token'); } }))
        .get('/api/me').set('Authorization', 'Bearer sensitive-token');
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ error: 'Authentication unavailable' });
      expect(response.text).not.toContain('sensitive-token');
      expect(log).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });

  it('fails closed when configuration is missing', async () => {
    const response = await request(createApp(unavailableConfig)).get('/api/me').set('Authorization', 'Bearer token');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Authentication unavailable' });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe('Supabase verifier', () => {
  const config = { supabaseUrl: 'https://example.supabase.test', supabaseAnonKey: 'anon-key' };

  it('validates the presented token with auth.getUser using the anon client', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'verified-id', email: 'not-returned' } }, error: null });
    const app = createApp(config);
    const response = await request(app).get('/api/me').set('Authorization', 'Bearer user.jwt.token');
    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.createClient).toHaveBeenCalledWith(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    expect(mocks.getUser).toHaveBeenCalledWith('user.jwt.token');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: { id: 'verified-id' } });
  });

  it('does not accept an unverified JWT when getUser rejects it', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401, message: 'invalid token' } });
    const response = await request(createApp(config)).get('/api/me').set('Authorization', 'Bearer fake.authenticated.jwt');
    expect(mocks.getUser).toHaveBeenCalledWith('fake.authenticated.jwt');
    expect(response.status).toBe(401);
  });

  it('returns 503 for Supabase failures and handles client setup errors', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 503, message: 'private details' } });
    const response = await request(createApp(config)).get('/api/me').set('Authorization', 'Bearer token');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Authentication unavailable' });
    mocks.createClient.mockImplementationOnce(() => { throw new Error('invalid config'); });
    const badConfig = await request(createApp(config)).get('/api/me').set('Authorization', 'Bearer token');
    expect(badConfig.status).toBe(503);
  });

  it('rejects known secret and legacy service-role keys configured as anon keys', async () => {
    const legacyServiceKey = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
    for (const key of ['sb_secret_example', legacyServiceKey]) {
      const response = await request(createApp({ ...config, supabaseAnonKey: key }))
        .get('/api/me').set('Authorization', 'Bearer token');
      expect(response.status).toBe(503);
    }
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe('production static hosting', () => {
  // Keep all test-created files within the checkout and remove them afterwards.
  const fixture = fs.mkdtempSync(path.join(process.cwd(), '.api-test-'));
  const dist = path.join(fixture, 'dist');
  fs.mkdirSync(dist);
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>SPA</title>');
  fs.writeFileSync(path.join(dist, 'app.js'), 'console.log("asset")');
  fs.writeFileSync(path.join(dist, '.env'), 'hidden-secret');
  fs.writeFileSync(path.join(fixture, 'private.txt'), 'outside-secret');
  afterAll(() => fs.rmSync(fixture, { recursive: true, force: true }));

  it('serves public files and falls back to the SPA for navigation', async () => {
    const app = createApp({ ...unavailableConfig, nodeEnv: 'production', staticDir: dist });
    const asset = await request(app).get('/app.js');
    expect(asset.status).toBe(200);
    expect(asset.text).toContain('asset');
    const page = await request(app).get('/dashboard').set('Accept', 'text/html');
    expect(page.status).toBe(200);
    expect(page.type).toBe('text/html');
    expect(page.text).toContain('<title>SPA</title>');
  });

  it('never falls back to HTML for API, hidden, missing asset, or non-navigation requests', async () => {
    const app = createApp({ ...unavailableConfig, nodeEnv: 'production', staticDir: dist });
    for (const url of ['/api', '/api/missing', '/API/missing', '/api%2Fmissing', '/%61pi/missing', '//api/missing', '/.env', '/missing.js', '/..%2Fprivate.txt']) {
      const response = await request(app).get(url).set('Accept', 'text/html');
      expect(response.status, url).toBe(404);
      expect(response.type, url).not.toBe('text/html');
      expect(response.text, url).not.toContain('secret');
    }
    expect((await request(app).post('/dashboard')).status).toBe(404);
    expect((await request(app).get('/dashboard').set('Accept', 'application/json')).status).toBe(404);
  });

  it('preserves a missing SPA index as 404 and does not serve static files in development', async () => {
    const missing = createApp({ ...unavailableConfig, nodeEnv: 'production', staticDir: path.join(fixture, 'missing') });
    expect((await request(missing).get('/dashboard')).status).toBe(404);
    const development = createApp({ ...unavailableConfig, nodeEnv: 'development', staticDir: dist });
    expect((await request(development).get('/app.js')).status).toBe(404);
  });
});
