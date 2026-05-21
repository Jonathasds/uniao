import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/utils/supabase/env";

/**
 * Cliente Supabase com service_role — apenas no servidor (uploads Storage).
 * Não use a chave publishable aqui: ela pode ir para o browser e não deve gravar arquivos.
 * @returns Instância sem persistência de sessão.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não definida. No Supabase: Project Settings → API → service_role (secret). " +
        "Adicione ao .env e rode: npm run supabase:storage:setup"
    );
  }

  const { url } = getSupabaseEnv();

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
