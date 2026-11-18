import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'dotenv';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
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
