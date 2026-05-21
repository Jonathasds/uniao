import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/utils/supabase/env";

/**
 * Cliente Supabase para Server Components e Server Actions.
 * @param cookieStore - Store de cookies do Next.js (`await cookies()`).
 * @returns Instância do Supabase com sessão em cookies.
 */
export function createClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll em Server Component sem stream de resposta — middleware renova a sessão.
        }
      },
    },
  });
}

/**
 * Atalho: cria cliente usando `cookies()` do request atual.
 * @returns Instância do Supabase no servidor.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}
