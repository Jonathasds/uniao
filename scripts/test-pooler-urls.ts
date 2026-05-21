/**
 * Testa formatos de URL do pooler Supabase (diagnóstico).
 */
import { Pool } from "pg";

const pwd = decodeURIComponent("%40jonatha042728.");

const urls = [
  {
    name: "direct-5432",
    config: {
      host: "db.gvxtzvcxjodpyvaxiqqn.supabase.co",
      port: 5432,
      user: "postgres",
      password: pwd,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    },
  },
  {
    name: "session-pooler-ref",
    config: {
      host: "aws-0-sa-east-1.pooler.supabase.com",
      port: 5432,
      user: "postgres.gvxtzvcxjodpyvaxiqqn",
      password: pwd,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    },
  },
  {
    name: "session-pooler-postgres",
    config: {
      host: "aws-0-sa-east-1.pooler.supabase.com",
      port: 5432,
      user: "postgres",
      password: pwd,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    },
  },
  {
    name: "txn-6543",
    config: {
      host: "aws-0-sa-east-1.pooler.supabase.com",
      port: 6543,
      user: "postgres.gvxtzvcxjodpyvaxiqqn",
      password: pwd,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    },
  },
  {
    name: "supavisor-db-6543",
    config: {
      host: "db.gvxtzvcxjodpyvaxiqqn.supabase.co",
      port: 6543,
      user: "postgres.gvxtzvcxjodpyvaxiqqn",
      password: pwd,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    },
  },
  {
    name: "db-host-session-ref",
    config: {
      host: "db.gvxtzvcxjodpyvaxiqqn.supabase.co",
      port: 5432,
      user: "postgres.gvxtzvcxjodpyvaxiqqn",
      password: pwd,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    },
  },
];

async function main() {
  for (const { name, config } of urls) {
    const pool = new Pool(config);
    try {
      await pool.query("SELECT 1");
      const users = await pool
        .query('SELECT count(*)::int as c FROM "User"')
        .catch(() => ({ rows: [{ c: "?" }] }));
      console.log(name, "OK", "users=", users.rows[0]?.c);
    } catch (e) {
      console.log(name, "FAIL", e instanceof Error ? e.message.slice(0, 120) : e);
    }
    await pool.end();
  }
}

main();
