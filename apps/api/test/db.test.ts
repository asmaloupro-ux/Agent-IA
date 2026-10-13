import { describe, expect, it } from "vitest";
import { buildPoolConfig } from "../src/db.js";

const fakeCa = () => "CA";

describe("buildPoolConfig", () => {
  it("laisse les bases non Supabase inchangées", () => {
    const url = "postgresql://u:p@postgres.railway.internal:5432/railway";
    expect(buildPoolConfig(url, fakeCa)).toEqual({ connectionString: url, max: 5 });
  });

  it("active SSL vérifié pour le pooler Supabase et retire sslmode de l'URL", () => {
    const config = buildPoolConfig(
      "postgresql://postgres.ref:p@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require",
      fakeCa,
    );
    expect(config.ssl).toEqual({ ca: "CA", rejectUnauthorized: true });
    expect(config.connectionString).not.toContain("sslmode");
  });

  it("active SSL vérifié pour la connexion directe Supabase", () => {
    const config = buildPoolConfig("postgresql://postgres:p@db.ref.supabase.co:5432/postgres", fakeCa);
    expect(config.ssl).toEqual({ ca: "CA", rejectUnauthorized: true });
  });

  it("ne se laisse pas tromper par un domaine qui contient supabase", () => {
    const config = buildPoolConfig("postgresql://u:p@supabase.com.evil.example:5432/db", fakeCa);
    expect(config.ssl).toBeUndefined();
  });

  it("lit le vrai certificat Supabase fourni avec l'API", () => {
    const config = buildPoolConfig("postgresql://postgres:p@db.ref.supabase.co:5432/postgres");
    expect((config.ssl as { ca: string }).ca).toContain("BEGIN CERTIFICATE");
  });
});
