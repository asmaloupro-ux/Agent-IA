# Agent-IA - règles pour Claude Code

## Langue
Répondre en français.

## Workflow Git : toujours passer par une PR (automatique, sans demander)
- Ne jamais committer directement sur `main`.
- Avant de modifier du code, créer une branche depuis `main` à jour :
  `feat/<sujet>`, `fix/<sujet>` ou `chore/<sujet>`.
- Une fois le travail terminé et vérifié (tests / lint passés en local si disponibles) :
  1. commit avec un message clair en français ;
  2. `git push -u origin <branche>` ;
  3. ouvrir la PR avec `gh pr create --base main --fill` (titre + description :
     quoi, pourquoi, comment c'est vérifié) ;
  4. donner le lien de la PR à l'utilisateur.
- Ne jamais merger une PR ni activer l'auto-merge sans que l'utilisateur le demande.

Le hook `.claude/hooks/auto-pr.mjs` (Stop) bloque la fin de réponse tant que ce n'est pas fait.

## Projet
- Monorepo npm workspaces : `apps/web` (Next.js → Vercel), `apps/api` (Express + Postgres → Railway).
- Commandes : `npm run dev`, `npm run dev:railway`, `npm test`, `npm run lint`, `npm run build` (à la racine).
- Variables : le front lit `NEXT_PUBLIC_API_URL` ; l'API lit `DATABASE_URL`, `CORS_ORIGINS`, `PORT`.
  Ne jamais committer de `.env` ni de secret.
- Une nouvelle variable d'environnement doit être ajoutée à `.env.example`, et côté Railway à l'env `dev`
  (les env `pr-N` en sont des copies) et `production`.

## Vérifications automatiques sur chaque PR (GitHub Actions)
- `pr-quality.yml` : CI (lint, tests, build) puis revue de code par Claude.
- `preview.yml` : env Railway `pr-N` + preview Vercel branchée dessus, puis `deploy-check.yml`
  (tests utilisateur Playwright par Claude). Env Railway supprimé à la fermeture de la PR.
- `production.yml` : déploiement production au merge sur `main`.
- Si la CI, la revue ou les tests utilisateur signalent un problème, le corriger sur la même branche et repousser.
- Après avoir ouvert une PR, suivre les checks (`gh pr checks`) et corriger les échecs.

## Débogage et tests utilisateurs
Pour tout bug, erreur ou test utilisateur, utiliser l'agent `debug-tester`
(`.claude/agents/debug-tester.md`).
