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

## Vérifications automatiques sur chaque PR (GitHub Actions)
- `.github/workflows/pr-quality.yml` : CI (lint, tests, build) puis revue de code par Claude.
- `.github/workflows/deploy-check.yml` : après chaque déploiement de preview réussi,
  smoke test de l'URL puis tests utilisateur Playwright par Claude.
- Si la CI ou la revue signale un problème, le corriger sur la même branche et repousser.

## Débogage et tests utilisateurs
Pour tout bug, erreur ou test utilisateur, utiliser l'agent `debug-tester`
(`.claude/agents/debug-tester.md`).
