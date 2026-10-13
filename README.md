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

## Automatisation des Pull Requests

| Workflow | Déclencheur | Ce qu'il fait |
|----------|-------------|---------------|
| [`pr-quality.yml`](.github/workflows/pr-quality.yml) | Chaque PR (ouverte / mise à jour) | CI auto-détectée (Node ou Python : lint, tests, build), puis revue de code par Claude avec commentaires en ligne et verdict |
| [`deploy-check.yml`](.github/workflows/deploy-check.yml) | Chaque déploiement réussi (Vercel, Netlify, Render...) | Smoke test de l'URL, puis tests utilisateur Playwright par Claude (desktop + mobile), rapport commenté sur la PR |

### Configuration requise (une seule fois)

1. **Installer l'app GitHub Claude** sur le dépôt : https://github.com/apps/claude
2. **Ajouter UN secret** dans *Settings → Secrets and variables → Actions* :
   - `ANTHROPIC_API_KEY` : clé API de https://console.anthropic.com, **ou**
   - `CLAUDE_CODE_OAUTH_TOKEN` : si tu as un abonnement Claude Pro/Max, génère-le avec `claude setup-token`.
3. *(Recommandé)* Protéger `main` dans *Settings → Branches* : exiger une PR et que le job **CI** passe avant de merger.
