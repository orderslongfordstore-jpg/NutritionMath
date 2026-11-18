import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Mirror Vite's .env file precedence and expansion before Vite loads the env.
// Calling Vite's loadEnv here is unsafe: DEBUG=vite:env can log all resolved
// VITE_ values, including a secret, before our preflight has a chance to reject it.
function resolvedClientEnv(mode: string): Record<string, string> {
  if (mode === 'local') throw new Error('local cannot be used as a Vite mode');
  const parsed: Record<string, string> = {};
  for (const file of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    const path = join(process.cwd(), file);
    try {
      const stat = statSync(path);
      if (stat.isFile() || stat.isFIFO()) Object.assign(parsed, parseEnv(readFileSync(path, 'utf8')));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  // Expand against a copy, so validation never mutates the actual process env.
  const processCopy: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) processCopy[key] = value;
  }
  expand({ parsed, processEnv: processCopy });
  const client: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) if (key.startsWith('VITE_')) client[key] = value;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('VITE_') && value !== undefined) client[key] = value;
  }
  return client;
}

function hasServiceRoleJwt(value: string): boolean {
  // Decode only to recognize a dangerous payload, never to verify or authorize a token.
  const jwtPattern = /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)(?=$|[^A-Za-z0-9_-])/g;
  for (const match of value.matchAll(jwtPattern)) {
    try {
      const payload: unknown = JSON.parse(Buffer.from(match[2], 'base64url').toString('utf8'));
      if (payload !== null && typeof payload === 'object' && 'role' in payload && payload.role === 'service_role') return true;
    } catch {
      // A malformed or unrelated token is not evidence of a service-role JWT.
    }
  }
  return false;
}

export default defineConfig(({ mode }) => {
  // This checks known formats only; it cannot detect every type of secret.
  const clientEnv = resolvedClientEnv(mode);
  if (Object.values(clientEnv).some((value) => /sb_secret_/i.test(value) || hasServiceRoleJwt(value))) {
    throw new Error('VITE_ variables are browser-visible. A known Supabase secret was detected; use a server-only variable. This guard detects known formats only, not all secrets.');
  }

  // The server uses dotenv/config, which reads only .env without expansion.
  // Match that behavior instead of Vite's mode-specific .env file precedence.
  let filePort: string | undefined;
  try {
    filePort = parse(readFileSync(join(process.cwd(), '.env'))).PORT;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const rawPort = process.env.PORT ?? filePort ?? '3000';
  const port = Number(rawPort);
  // Port 0 is valid for the server, but its ephemeral port cannot be proxied reliably.
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535 for the Vite proxy');
  }

  return {
    plugins: [react()],
    server: {
      proxy: { '/api': `http://localhost:${port}` },
    },
    test: {
      environment: 'node',
      clearMocks: true,
    },
  };
});
