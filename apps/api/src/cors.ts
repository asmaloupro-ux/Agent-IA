// CORS_ORIGINS : origines séparées par des virgules. « * » remplace un segment de sous-domaine,
// ex. https://agent-ia-web-*.vercel.app pour accepter toutes les previews Vercel.
export function parseOrigins(value: string | undefined): (string | RegExp)[] | undefined {
  const entries = value?.split(",").map((o) => o.trim()).filter(Boolean);
  if (!entries?.length) return undefined;
  return entries.map((entry) => {
    if (!entry.includes("*")) return entry;
    const escaped = entry.replace(/[.+?^${}()|[\]\/]/g, "\$&").replace(/\*/g, "[a-z0-9-]+");
    return new RegExp(`^${escaped}$`);
  });
}
