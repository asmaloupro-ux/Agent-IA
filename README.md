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
