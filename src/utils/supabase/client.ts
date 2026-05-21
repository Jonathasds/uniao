import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/env";

/**
 * Cliente Supabase para Client Components (browser).
 * @returns Instância do Supabase com cookies no navegador.
 */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}
