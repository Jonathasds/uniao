import { isSupabaseConfigured } from "@/lib/database-url";

/**
 * Mensagem quando o banco está offline na tela de login.
 * @returns Texto de ajuda conforme Supabase ou ambiente local.
 */
export function getDatabaseOfflineHelp(): {
  title: string;
  steps: string[];
} {
  if (isSupabaseConfigured()) {
    return {
      title: "Não foi possível conectar ao Supabase",
      steps: [
        "Confira se o projeto está ativo em supabase.com/dashboard",
        "Local: npm run supabase:configure e npm run db:check",
        "Vercel: ative IPv4 no Supabase e USE_DIRECT_DATABASE_ON_VERCEL=true — docs/VERCEL-RECUPERAR.md",
        "Ou reconecte a integração Supabase no painel da Vercel",
      ],
    };
  }

  return {
    title: "Banco de dados não está rodando",
    steps: [
      "Configure Supabase no .env (recomendado) — docs/SUPABASE.md",
      "Ou, localmente: npx prisma dev e depois npm run dev",
    ],
  };
}

/**
 * Mensagem curta para APIs e toasts.
 * @returns Uma linha de instrução.
 */
export function getDatabaseOfflineShortMessage(): string {
  if (isSupabaseConfigured()) {
    return "Supabase indisponível. Confira .env e execute: npm run db:check";
  }
  return "Banco offline. Configure Supabase (docs/SUPABASE.md) ou npx prisma dev";
}
