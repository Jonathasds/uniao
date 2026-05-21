/** Rota do dashboard após login (mesmo em mobile e desktop). */
export const POST_LOGIN_PATH = "/";

/** Rotas públicas sem sessão NextAuth. */
export const PUBLIC_AUTH_PATHS = ["/login", "/recuperar-senha"] as const;

/**
 * Redireciona após login bem-sucedido (reload completo ajuda em mobile).
 */
export function redirectAfterLogin(): void {
  if (typeof window !== "undefined") {
    window.location.assign(POST_LOGIN_PATH);
  }
}
