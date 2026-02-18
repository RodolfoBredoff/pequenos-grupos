/**
 * Stub - migrado para PostgreSQL. Este arquivo não é mais utilizado.
 * O createClient do client.ts é usado para hooks de offline/realtime.
 */
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export async function createClient() {
  return createBrowserClient();
}
