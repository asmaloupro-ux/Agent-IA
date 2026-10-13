import { readFileSync } from "node:fs";
import pg from "pg";

// Certificat racine public de Supabase (Supabase Root 2021 CA, expire en 2031).
const SUPABASE_CA_PATH = new URL("../certs/supabase-prod-ca-2021.crt", import.meta.url);

// Supabase (*.supabase.co / *.supabase.com) : SSL obligatoire avec vérification complète
// du certificat et du nom d'hôte. Autres bases (Postgres Railway, local) : configuration inchangée.
export function buildPoolConfig(databaseUrl: string, readCa: () => string = () => readFileSync(SUPABASE_CA_PATH, "utf8")): pg.PoolConfig {
  const url = new URL(databaseUrl);
  if (!/\.supabase\.(co|com)$/.test(url.hostname)) {
    return { connectionString: databaseUrl, max: 5 };
  }
  // Un sslmode dans l'URL écraserait l'objet ssl ci-dessous (pg fusionne l'URL en dernier).
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    max: 5,
    ssl: { ca: readCa(), rejectUnauthorized: true },
  };
}

// DATABASE_URL est injectée par Railway (Supabase en production, Postgres Railway ailleurs)
// ou par apps/api/.env en local.
export const pool = process.env.DATABASE_URL ? new pg.Pool(buildPoolConfig(process.env.DATABASE_URL)) : null;

export async function checkDatabase(): Promise<"ok" | "error" | "not_configured"> {
  if (!pool) return "not_configured";
  try {
    await pool.query("SELECT 1");
    return "ok";
  } catch (err) {
    console.error("Base de données injoignable :", (err as Error).message);
    return "error";
  }
}
