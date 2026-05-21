import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/utils/supabase/env";
import {
  getServiceRoleKeyHelpMessage,
  resolveSupabaseServiceRoleKey,
} from "@/utils/supabase/service-role-key";

/**
 * Cliente Supabase com service_role — apenas no servidor (uploads Storage).
 * @returns Instância sem persistência de sessão.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  let serviceKey: string;

  try {
    serviceKey = resolveSupabaseServiceRoleKey(
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch {
    throw new Error(
      `${getServiceRoleKeyHelpMessage()} Depois reinicie npm run dev.`
    );
  }

  const { url } = getSupabaseEnv();

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
