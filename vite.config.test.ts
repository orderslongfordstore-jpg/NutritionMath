import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import viteConfig from './vite.config';

const configEnv = { command: 'serve', mode: 'development', isSsrBuild: false, isPreview: false } as const;
let fixture: string;
let originalPort: string | undefined;

beforeEach(() => {
  originalPort = process.env.PORT;
  delete process.env.PORT;
  fixture = mkdtempSync(join(tmpdir(), 'nutritionmath-vite-config-'));
  vi.spyOn(process, 'cwd').mockReturnValue(fixture);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalPort === undefined) delete process.env.PORT;
  else process.env.PORT = originalPort;
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
