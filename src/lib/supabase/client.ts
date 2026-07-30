import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Creates a Supabase client configured for use in browser/client components.
 * Automatically validates variables using our env schema.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
