/**
 * Descobre host do pooler Supabase que responde para o projeto.
 */
import { Pool } from "pg";

const pwd = decodeURIComponent(
  process.env.SUPABASE_DB_PASSWORD ?? "%40jonatha042728."
);
const ref = "gvxtzvcxjodpyvaxiqqn";
const user = `postgres.${ref}`;

const hosts = [
  "aws-0-sa-east-1.pooler.supabase.com",
  "aws-1-sa-east-1.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
  "aws-1-us-east-1.pooler.supabase.com",
  "aws-0-us-east-2.pooler.supabase.com",
  "aws-1-us-east-2.pooler.supabase.com",
];

async function probe(host: string, port: number) {
  const pool = new Pool({
    host,
    port,
    user,
    password: pwd,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await pool.query("SELECT 1");
    console.log("OK", `${host}:${port}`);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("FAIL", `${host}:${port}`, msg.slice(0, 100));
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  for (const host of hosts) {
    if (await probe(host, 6543)) process.exit(0);
    if (await probe(host, 5432)) process.exit(0);
  }
  console.log("Nenhum pooler respondeu. Copie a URL em Supabase → Connect → ORMs → Prisma.");
  process.exit(1);
}

main();
