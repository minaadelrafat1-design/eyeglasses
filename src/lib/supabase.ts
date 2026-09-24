/**
 * Browser Supabase client.
 *
 * Re-exports the generated Lovable Cloud client so the whole app shares a
 * single auth session (two clients on the same storage key fight over token
 * refresh). Existing service modules keep importing from `@/lib/supabase`.
 *
 * When the backend isn't connected the storefront still runs on the local
 * catalog fallback, so `isSupabaseConfigured` reports the real state and
 * service modules short-circuit instead of throwing during render.
 */
import { supabase } from '@/integrations/supabase/client';

export const isSupabaseConfigured = Boolean(
  import.meta.env['VITE_SUPABASE_URL'] && import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'],
);

export { supabase };
