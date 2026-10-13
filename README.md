# Agent-IA

Agents IA personnalisés pour [Claude Code](https://docs.claude.com/claude-code).

## Agents disponibles

### `debug-tester`

Agent spécialisé dans le **débogage**, la **correction de code** et les **tests utilisateurs**.

- Reproduit le bug, identifie la cause racine et applique une correction minimale.
- Relance les tests pour vérifier l'absence de régression.
- Teste l'application comme un utilisateur dans le navigateur : parcours nominal, cas limites, erreurs, mobile, accessibilité.
- Rend un rapport clair : diagnostic, correction, vérification, tableau des scénarios testés.

Fichier : [`.claude/agents/debug-tester.md`](.claude/agents/debug-tester.md)

## Utilisation

**Dans ce projet** : l'agent est chargé automatiquement depuis `.claude/agents/`.

**Dans tous tes projets** : copie le fichier dans ton dossier utilisateur :

```powershell
Copy-Item .claude\agents\debug-tester.md $env:USERPROFILE\.claude\agents\
```

Puis, dans Claude Code :

> Utilise l'agent debug-tester pour corriger l'erreur au login

ou mentionne-le avec `@debug-tester`.

## Architecture

```
apps/web   Next.js (React, Tailwind)      → Vercel   (projet agent-ia-web)
apps/api   Express + TypeScript + Postgres → Railway (projet Agent-IA, service api)
```

| Environnement | Railway (API + Postgres) | Vercel (front) | Déclencheur |
|---|---|---|---|
| `production` | env `production` | production | merge sur `main` |
| `dev` | env `dev` | — (local) | `npm run dev:railway` |
| preview PR | env `pr-<N>` (copie de `dev`, supprimé à la fermeture) | preview | chaque PR |

## Développement local

```powershell
npm install
npm run dev            # API sur :4000 (sans base) + front sur :3000
npm run dev:railway    # idem, avec les variables (Postgres) de l'environnement Railway « dev »
npm test; npm run lint; npm run build
```

Fichiers d'exemple : `apps/api/.env.example`, `apps/web/.env.example`.

## Workflow automatisé

1. **Claude écrit du code** → le hook [`auto-pr.mjs`](.claude/hooks/auto-pr.mjs) l'empêche de terminer tant que
   le code n'est pas sur une branche, commité, poussé et en PR ([`CLAUDE.md`](CLAUDE.md) décrit la règle).
2. **PR ouverte ou mise à jour** :

| Workflow | Ce qu'il fait |
|----------|---------------|
| [`pr-quality.yml`](.github/workflows/pr-quality.yml) | CI (lint, tests, build) puis revue de code Claude avec verdict |
| [`preview.yml`](.github/workflows/preview.yml) | Crée l'env Railway `pr-N`, déploie l'API, déploie le front Vercel avec `NEXT_PUBLIC_API_URL` = API de la PR, commente les URL |
| [`deploy-check.yml`](.github/workflows/deploy-check.yml) | Smoke test + tests utilisateur Playwright par Claude (desktop + mobile), rapport sur la PR |

3. **PR fermée** → l'environnement Railway `pr-N` est supprimé.
4. **Merge sur `main`** → [`production.yml`](.github/workflows/production.yml) déploie Railway puis Vercel en production et lance les tests utilisateur.

Le déploiement automatique « Git » de Vercel est désactivé (`apps/web/vercel.json`) : c'est GitHub Actions qui
déploie, pour pouvoir transmettre l'URL de l'API Railway de chaque environnement.

## Mise en place (une seule fois)

1. **Créer l'infrastructure** (Railway + Vercel + variables GitHub) :
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\bootstrap.ps1
   ```
2. **Secrets GitHub** — *Settings → Secrets and variables → Actions → Secrets* :

   | Secret | Où l'obtenir |
   |---|---|
   | `RAILWAY_API_TOKEN` | https://railway.com/account/tokens (jeton de compte/workspace, pas de projet) |
   | `VERCEL_TOKEN` | https://vercel.com/account/tokens |
   | `ANTHROPIC_API_KEY` **ou** `CLAUDE_CODE_OAUTH_TOKEN` | https://console.anthropic.com, ou `claude setup-token` (abonnement Pro/Max) |
   | `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel → projet → *Settings → Deployment Protection → Protection Bypass for Automation* (permet aux tests de passer la protection des previews) |

3. **App GitHub Claude** sur le dépôt : https://github.com/apps/claude
4. *(Recommandé)* Protéger `main` dans *Settings → Branches* : PR obligatoire et jobs **CI** + **Railway** + **Vercel** au vert.

> Antivirus avec inspection HTTPS (Avast…) : la variable utilisateur `NODE_USE_SYSTEM_CA=1` fait utiliser à Node.js
> le magasin de certificats Windows, sans désactiver la vérification SSL.
