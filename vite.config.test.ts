import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import viteConfig from './vite.config';

const projectRoot = process.cwd();
const configEnv = { command: 'serve', mode: 'development', isSsrBuild: false, isPreview: false } as const;
let fixture: string;
let originalPort: string | undefined;
let originalViteEnv: Record<string, string>;

beforeEach(() => {
  originalPort = process.env.PORT;
  delete process.env.PORT;
  originalViteEnv = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (name.startsWith('VITE_') && value !== undefined) {
      originalViteEnv[name] = value;
      delete process.env[name];
    }
  }
  fixture = mkdtempSync(join(tmpdir(), 'nutritionmath-vite-config-'));
  vi.spyOn(process, 'cwd').mockReturnValue(fixture);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalPort === undefined) delete process.env.PORT;
  else process.env.PORT = originalPort;
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('VITE_')) delete process.env[name];
  }
  Object.assign(process.env, originalViteEnv);
  rmSync(fixture, { recursive: true, force: true });
});

function target() {
  return viteConfig(configEnv).server?.proxy?.['/api'];
}

describe('development API proxy', () => {
  it('defaults to port 3000 when PORT is not configured', () => {
    expect(target()).toBe('http://localhost:3000');
  });

  it('loads PORT from .env without adding private env values to the client config', () => {
    writeFileSync(join(fixture, '.env'), 'PORT=4100\nSECRET_KEY=private-value\n');
    const config = viteConfig(configEnv);
    expect(config.server?.proxy?.['/api']).toBe('http://localhost:4100');
    expect(config.define).toBeUndefined();
    expect(config.envPrefix).toBeUndefined();
    expect(JSON.stringify(config)).not.toContain('private-value');
  });

  it('prefers the process environment over .env', () => {
    writeFileSync(join(fixture, '.env'), 'PORT=4100\n');
    process.env.PORT = '4200';
    expect(target()).toBe('http://localhost:4200');
  });

  it('does not override the server port with Vite-only mode or local env files', () => {
    writeFileSync(join(fixture, '.env'), 'PORT=4100\n');
    writeFileSync(join(fixture, '.env.development'), 'PORT=4200\n');
    writeFileSync(join(fixture, '.env.local'), 'PORT=4300\n');
    expect(target()).toBe('http://localhost:4100');
  });

  it('does not expand a PORT value that dotenv/config would leave literal', () => {
    writeFileSync(join(fixture, '.env'), 'DEV_PORT=4100\nPORT=$DEV_PORT\n');
    expect(target).toThrowError(/^PORT must be an integer between 1 and 65535 for the Vite proxy$/);
  });

  it.each(['1', '65535', '00042'])('accepts and normalizes valid PORT %s', (port) => {
    process.env.PORT = port;
    expect(target()).toBe(`http://localhost:${Number(port)}`);
  });

  it.each(['', '0', '65536', '-1', '1.5', '0x10', '3000oops', 'secret-value'])('rejects invalid PORT %j without echoing it', (port) => {
    process.env.PORT = port;
    expect(target).toThrowError(/^PORT must be an integer between 1 and 65535 for the Vite proxy$/);
  });

  it('rejects an invalid process PORT instead of falling back to a valid .env PORT', () => {
    writeFileSync(join(fixture, '.env'), 'PORT=4100\n');
    process.env.PORT = '';
    expect(target).toThrowError('PORT must be an integer between 1 and 65535 for the Vite proxy');
  });

  it('rejects an invalid PORT loaded from .env', () => {
    writeFileSync(join(fixture, '.env'), 'PORT=not-a-port\n');
    expect(target).toThrowError(/^PORT must be an integer between 1 and 65535 for the Vite proxy$/);
  });
});

function jwtWithRole(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ role, marker: 'synthetic-token-payload' })).toString('base64url');
  return `${header}.${payload}.synthetic_signature`;
}

function expectSecretRejected(secret: string, mode = 'development', command: 'serve' | 'build' = 'serve') {
  let thrown: unknown;
  try {
    viteConfig({ ...configEnv, mode, command });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(Error);
  const diagnostic = (thrown as Error).stack ?? String(thrown);
  expect(diagnostic).toContain('VITE_ variables are browser-visible');
  expect(diagnostic).toContain('known formats only, not all secrets');
  expect(diagnostic).not.toContain(secret);
}

describe('browser-visible Supabase secret guard', () => {
  it('rejects a secret key in an arbitrary VITE_ variable from .env without leaking it', () => {
    const secret = 'sb_secret_synthetic_file_value';
    writeFileSync(join(fixture, '.env'), `VITE_NOT_A_SUPABASE_NAME=${secret}\n`);
    expectSecretRejected(secret);
  });

  it('rejects a secret key embedded in an inherited VITE_ value', () => {
    const secret = 'sb_secret_synthetic_inherited_value';
    process.env.VITE_ARBITRARY = `Bearer ${secret}`;
    expectSecretRejected(secret);
  });

  it('detects a private env value expanded into a VITE_ variable', () => {
    const secret = 'sb_secret_synthetic_expansion_value';
    writeFileSync(join(fixture, '.env'), `PRIVATE_SOURCE=${secret}\nVITE_EXPANDED=$PRIVATE_SOURCE\n`);
    expectSecretRejected(secret);
  });

  it('checks the selected mode rather than unrelated mode files', () => {
    const secret = 'sb_secret_synthetic_production_value';
    writeFileSync(join(fixture, '.env'), 'VITE_KEY=sb_publishable_base\n');
    writeFileSync(join(fixture, '.env.development'), 'VITE_KEY=sb_publishable_development\n');
    writeFileSync(join(fixture, '.env.production'), `VITE_KEY=${secret}\n`);
    expect(() => viteConfig(configEnv)).not.toThrow();
    expectSecretRejected(secret, 'production');
  });

  it('rejects a production-mode secret when configuring a build', () => {
    const secret = 'sb_secret_synthetic_build_value';
    writeFileSync(join(fixture, '.env.production'), `VITE_BUILD_VALUE=${secret}\n`);
    expectSecretRejected(secret, 'production', 'build');
  });

  it('uses Vite precedence for base, local, mode, and mode-local files', () => {
    const baseSecret = 'sb_secret_synthetic_base';
    const localSecret = 'sb_secret_synthetic_local';
    const modeLocalSecret = 'sb_secret_synthetic_mode_local';
    writeFileSync(join(fixture, '.env'), `VITE_KEY=${baseSecret}\n`);
    writeFileSync(join(fixture, '.env.local'), `VITE_KEY=${localSecret}\n`);
    writeFileSync(join(fixture, '.env.production'), 'VITE_KEY=sb_publishable_production\n');
    writeFileSync(join(fixture, '.env.production.local'), `VITE_KEY=${modeLocalSecret}\n`);

    expectSecretRejected(modeLocalSecret, 'production');
    rmSync(join(fixture, '.env.production.local'));
    expect(() => viteConfig({ ...configEnv, mode: 'production' })).not.toThrow();
    rmSync(join(fixture, '.env.production'));
    expectSecretRejected(localSecret, 'production');
    rmSync(join(fixture, '.env.local'));
    expectSecretRejected(baseSecret, 'production');
  });

  it('prefers inherited VITE_ values over all env files', () => {
    const fileSecret = 'sb_secret_synthetic_overridden_file';
    const processSecret = 'sb_secret_synthetic_process_override';
    writeFileSync(join(fixture, '.env.production.local'), `VITE_KEY=${fileSecret}\n`);
    process.env.VITE_KEY = 'sb_publishable_inherited';
    expect(() => viteConfig({ ...configEnv, mode: 'production' })).not.toThrow();
    process.env.VITE_KEY = processSecret;
    expectSecretRejected(processSecret, 'production');
  });

  it('rejects a legacy service_role JWT in an arbitrary VITE_ variable without leaking it', () => {
    const secret = jwtWithRole('service_role');
    process.env.VITE_UNRELATED_SETTING = secret;
    expectSecretRejected(secret);
  });

  it('rejects a legacy service_role JWT embedded in an env file value', () => {
    const secret = jwtWithRole('service_role');
    writeFileSync(join(fixture, '.env'), `VITE_URL=https://example.test/?token=${secret}\n`);
    expectSecretRejected(secret);
  });

  it('allows publishable keys, legacy anon JWTs, malformed tokens, and plain role text', () => {
    writeFileSync(join(fixture, '.env'), 'VITE_PUBLISHABLE=sb_publishable_synthetic\nVITE_BROKEN=not.a.jwt\nVITE_TEXT=service_role\n');
    process.env.VITE_LEGACY_ANON = jwtWithRole('anon');
    expect(() => viteConfig(configEnv)).not.toThrow();
  });

  it('allows known secrets that remain in server-only variables', () => {
    const secret = 'sb_secret_synthetic_server_only';
    const token = jwtWithRole('service_role');
    writeFileSync(join(fixture, '.env'), `SUPABASE_SECRET=${secret}\nSUPABASE_SERVICE_ROLE=${token}\n`);
    expect(() => viteConfig(configEnv)).not.toThrow();
  });

  it('rejects a known secret without exposing it in Vite debug output', () => {
    const secret = 'sb_secret_synthetic_debug_sentinel';
    const child = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
      cwd: projectRoot,
      env: { ...process.env, DEBUG: 'vite:env', VITE_SUPABASE_ANON_KEY: secret },
      encoding: 'utf8',
      timeout: 15000,
    });
    expect(child.error).toBeUndefined();
    expect(child.status).not.toBe(0);
    const output = child.stdout + child.stderr;
    expect(output).toContain('A known Supabase secret was detected');
    expect(output).not.toContain(secret);
  });
});
