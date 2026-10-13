import { describe, expect, it } from "vitest";
import { parseOrigins } from "../src/cors.js";

const matches = (origins: (string | RegExp)[], origin: string) =>
  origins.some((o) => (typeof o === "string" ? o === origin : o.test(origin)));

describe("parseOrigins", () => {
  it("renvoie undefined si vide", () => {
    expect(parseOrigins("")).toBeUndefined();
    expect(parseOrigins(undefined)).toBeUndefined();
  });

  it("accepte les previews Vercel via le joker", () => {
    const origins = parseOrigins("https://agent-ia-web-*.vercel.app, http://localhost:3000")!;
    expect(matches(origins, "https://agent-ia-web-abc123-asma.vercel.app")).toBe(true);
    expect(matches(origins, "http://localhost:3000")).toBe(true);
  });

  it("rejette les domaines qui ne font que ressembler", () => {
    const origins = parseOrigins("https://agent-ia-web-*.vercel.app")!;
    expect(matches(origins, "https://agent-ia-web-x.vercel.app.evil.com")).toBe(false);
    expect(matches(origins, "https://evil.com/agent-ia-web-x.vercel.app")).toBe(false);
    expect(matches(origins, "https://agent-ia-web-a.b.vercel.app")).toBe(false);
  });
});
