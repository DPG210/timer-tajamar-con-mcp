/**
 * Centralized environment configuration.
 * Replaces src/Global.js — resolves M-09.
 *
 * All VITE_ vars are validated at module load time so missing config
 * surfaces immediately as a thrown error rather than a runtime 404.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.example to .env and set the value.`
    );
  }
  return value as string;
}

export const ENV = {
  API_URL: requireEnv('VITE_API_URL'),
  SOCKET_URL: requireEnv('VITE_SOCKET_URL'),
} as const;
