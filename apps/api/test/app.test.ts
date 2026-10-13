import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("API", () => {
  const app = createApp();

  it("GET /health répond ok sans base configurée", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "not_configured" });
  });

  it("GET /api/hello salue par défaut", async () => {
    const res = await request(app).get("/api/hello");
    expect(res.body.message).toBe("Bonjour monde !");
  });

  it("GET /api/hello tronque les noms trop longs", async () => {
    const res = await request(app).get("/api/hello").query({ name: "a".repeat(200) });
    expect(res.body.message).toBe(`Bonjour ${"a".repeat(50)} !`);
  });
});
