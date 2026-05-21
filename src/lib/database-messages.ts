/**
 * Mensagem quando o banco Supabase está offline na tela de login.
 * @returns Texto de ajuda para reconectar ao Supabase.
 */
export function getDatabaseOfflineHelp(): {
  title: string;
  steps: string[];
} {
  return {
    title: "Não foi possível conectar ao Supabase",
    steps: [
      "Confira se o projeto está ativo em supabase.com/dashboard",
      "Local: npm run supabase:configure e npm run db:check",
      "Vercel: reconecte a integração Supabase (POSTGRES_PRISMA_URL) — docs/VERCEL-RECUPERAR.md",
      "Reinicie npm run dev após alterar .env (sem prisma dev nem banco local)",
    ],
  };
}

/**
 * Mensagem curta para APIs e toasts.
 * @returns Uma linha de instrução.
 */
export function getDatabaseOfflineShortMessage(): string {
  return "Supabase indisponível. Confira .env e execute: npm run db:check";
}
