"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Health = { status: string; database: string; environment: string };

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealthError(true));
  }, []);

  async function sayHello(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/hello?name=${encodeURIComponent(name)}`);
      setMessage((await r.json()).message);
    } catch {
      setMessage("Impossible de joindre l'API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-16">
      <h1 className="text-3xl font-bold">Agent-IA</h1>

      <section aria-labelledby="status-title" className="rounded-lg border p-4">
        <h2 id="status-title" className="mb-2 font-semibold">État de l&apos;API</h2>
        {healthError ? (
          <p className="text-red-600">API injoignable ({API_URL})</p>
        ) : health ? (
          <ul className="text-sm">
            <li>Statut : {health.status}</li>
            <li>Base de données : {health.database}</li>
            <li>Environnement : {health.environment}</li>
          </ul>
        ) : (
          <p className="text-sm">Chargement…</p>
        )}
      </section>

      <form onSubmit={sayHello} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="name" className="sr-only">Ton prénom</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          maxLength={50}
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" disabled={loading} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {loading ? "…" : "Dire bonjour"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
