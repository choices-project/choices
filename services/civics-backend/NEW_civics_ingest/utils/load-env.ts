/**
 * Load .env and .env.local (local overrides).
 * Use in scripts that need env from either file.
 * Run from services/civics-backend/ (process.cwd()).
 *
 * Load order: .env → .env.local → ../../web/.env.local (monorepo fallback)
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnv(): void {
  config({ quiet: true }); // .env
  config({ path: '.env.local', override: true, quiet: true }); // overrides
  // Monorepo: web/.env.local often has shared vars
  const webEnvLocal = resolve(process.cwd(), '../../web/.env.local');
  if (existsSync(webEnvLocal)) {
    config({ path: webEnvLocal, override: true, quiet: true });
  }
}
