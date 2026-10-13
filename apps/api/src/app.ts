import cors from "cors";
import express from "express";
import { parseOrigins } from "./cors.js";
import { checkDatabase } from "./db.js";

export function createApp() {
  const app = express();

  // Origines vides = tout autoriser (dev local).
  const origins = parseOrigins(process.env.CORS_ORIGINS);
  app.use(cors(origins ? { origin: origins } : undefined));
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    const database = await checkDatabase();
    const ok = database !== "error";
    res.status(ok ? 200 : 503).json({
      status: ok ? "ok" : "degraded",
      database,
      environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? "local",
    });
  });

  app.get("/api/hello", (req, res) => {
    const name = typeof req.query.name === "string" && req.query.name.trim() ? req.query.name.trim() : "monde";
    res.json({ message: `Bonjour ${name.slice(0, 50)} !` });
  });

  return app;
}
