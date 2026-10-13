import pg from "pg";

// DATABASE_URL est injectée par Railway (service PostgreSQL) ou par apps/api/.env en local.
export const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : null;

export async function checkDatabase(): Promise<"ok" | "error" | "not_configured"> {
  if (!pool) return "not_configured";
  try {
    await pool.query("SELECT 1");
    return "ok";
  } catch {
    return "error";
  }
}
