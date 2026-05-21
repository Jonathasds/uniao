/**
 * Valida e normaliza SUPABASE_SERVICE_ROLE_KEY.
 */

/**
 * Indica formato inválido (URL, publishable, vazio, etc.).
 * @param key - Valor bruto do ambiente.
 * @returns true se não for uma chave de API válida.
 */
export function isInvalidServiceRoleKey(key: string | undefined): boolean {
  const value = key?.trim() ?? "";
  if (!value) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (value.includes("supabase.co/rest")) return true;
  if (value.startsWith("sb_publishable_")) return true;
  if (value.startsWith("NEXT_PUBLIC_")) return true;

  const looksLikeJwt = value.startsWith("eyJ") && value.split(".").length === 3;
  const looksLikeSecret = value.startsWith("sb_secret_");

  return !looksLikeJwt && !looksLikeSecret;
}

/**
 * Mensagem de ajuda quando a chave está errada.
 * @returns Texto para exibir ao desenvolvedor.
 */
export function getServiceRoleKeyHelpMessage(): string {
  return (
    "SUPABASE_SERVICE_ROLE_KEY inválida. No Supabase abra Project Settings → API e copie a chave " +
    "service_role (secret), que começa com eyJ... ou sb_secret_... — não use a URL do projeto nem a publishable."
  );
}

/**
 * Retorna a service_role validada ou lança erro claro.
 * @param raw - Valor de process.env.SUPABASE_SERVICE_ROLE_KEY.
 * @returns Chave pronta para o cliente Supabase.
 */
export function resolveSupabaseServiceRoleKey(raw: string | undefined): string {
  const key = raw?.trim() ?? "";

  if (isInvalidServiceRoleKey(key)) {
    throw new Error(getServiceRoleKeyHelpMessage());
  }

  return key;
}
