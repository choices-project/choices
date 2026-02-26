import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase credentials required. Add to .env:\n' +
        '  SUPABASE_URL=https://your-project.supabase.co\n' +
        '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n' +
        '(Or use NEXT_PUBLIC_SUPABASE_URL if your project uses that.)',
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cachedClient;
}

