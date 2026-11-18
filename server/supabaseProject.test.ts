import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), getUser: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  vi.stubGlobal('fetch', vi.fn());
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser } });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('server Supabase project guard', () => {
  it.each([
    'https://ndvjrsegapfhnhrjypck.supabase.co',
    ' HTTPS://NDVJRSEGAPFHNhRJYPCK.SUPABASE.CO/ ',
    'https://ndvjrsegapfhnhrjypck.supabase.co:443/',
    'https://Ndvjrsegapfhnhrjypck.supabase.co:8443/path/',
    'http://ndvjrsegapfhnhrjypck.supabase.co:8080/',
    'https://ndvjrsegapfhnhrjypck.supabase.co./',
    'https://user:secret@ndvjrsegapfhnhrjypck.supabase.co/',
    'https://%6edvjrsegapfhnhrjypck.supabase.co/',
  ])('blocks the known hostname before creating or invoking a verifier: %s', async supabaseUrl => {
    const response = await request(createApp({ supabaseUrl, supabaseAnonKey: 'private-key' }))
      .get('/api/me').set('Authorization', 'Bearer private-token');
    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Authentication unavailable');
    expect(response.body.configuration).toMatch(/previously used shared Supabase project is blocked/i);
    expect(response.body.configuration).toMatch(/SUPABASE_URL.*SUPABASE_ANON_KEY.*separate project/i);
    expect(response.text).not.toMatch(/private-key|private-token|user:secret/);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not allow an injected verifier to bypass an explicitly blocked URL', async () => {
    const verifyToken = vi.fn().mockResolvedValue({ id: 'should-not-be-used' });
    const app = createApp({
      supabaseUrl: 'https://ndvjrsegapfhnhrjypck.supabase.co:8443/',
      supabaseAnonKey: '',
      verifyToken,
    });
    const response = await request(app).get('/api/me').set('Authorization', 'Bearer private-token');
    expect(response.status).toBe(503);
    expect(response.body.configuration).toMatch(/project is blocked/i);
    expect(verifyToken).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects the blocked URL from the server environment even when the key is missing', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://NDVJRSEGAPFHNhRJYPCK.supabase.co/');
    const response = await request(createApp()).get('/api/me').set('Authorization', 'Bearer private-token');
    expect(response.status).toBe(503);
    expect(response.body.configuration).toMatch(/project is blocked/i);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['', '   ', undefined])('does not construct or invoke a verifier without a key: %j', async supabaseAnonKey => {
    const response = await request(createApp({ supabaseUrl: 'https://independent.example.test', supabaseAnonKey }))
      .get('/api/me').set('Authorization', 'Bearer private-token');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Authentication unavailable' });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    'https://independent.example.test/',
    'https://another.example.test:8443/path/',
    'https://ndvjrsegapfhnhrjypck.supabase.co.other.test/',
    'https://proxy.example.test/ndvjrsegapfhnhrjypck.supabase.co',
  ])('permits a different hostname without asserting its project identity: %s', async supabaseUrl => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'verified-id' } }, error: null });
    const response = await request(createApp({ supabaseUrl, supabaseAnonKey: 'test-public-key' }))
      .get('/api/me').set('Authorization', 'Bearer test-token');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: { id: 'verified-id' } });
    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.createClient.mock.calls[0][0]).toBe(supabaseUrl);
    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith('test-token');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['not a url', 'ftp://independent.example.test'])('fails closed for invalid URL: %s', async supabaseUrl => {
    const response = await request(createApp({ supabaseUrl, supabaseAnonKey: 'test-public-key' }))
      .get('/api/me').set('Authorization', 'Bearer test-token');
    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps the health endpoint available without logging configuration, token, or key', async () => {
    const log = vi.spyOn(console, 'log');
    const error = vi.spyOn(console, 'error');
    const app = createApp({ supabaseUrl: 'https://ndvjrsegapfhnhrjypck.supabase.co', supabaseAnonKey: 'private-key' });
    const health = await request(app).get('/api/health');
    const me = await request(app).get('/api/me').set('Authorization', 'Bearer private-token');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok' });
    expect(me.status).toBe(503);
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
