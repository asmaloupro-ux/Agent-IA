# Création unique de l'infrastructure Agent-IA (à lancer une seule fois, depuis la racine du dépôt).
#   Railway : projet Agent-IA, PostgreSQL, service api, environnements production + dev
#   Vercel  : projet agent-ia-web (déploiements pilotés par GitHub Actions)
#   GitHub  : variables RAILWAY_PROJECT_ID, VERCEL_ORG_ID, VERCEL_PROJECT_ID
# Pré-requis : `railway login`, `vercel login` et `gh auth login` déjà faits.
$ErrorActionPreference = 'Stop'
$env:NODE_USE_SYSTEM_CA = '1'   # antivirus avec inspection HTTPS : utiliser le magasin de certificats Windows
Set-Location (Split-Path $PSScriptRoot -Parent)

$railway = "$env:APPDATA\npm\node_modules\@railway\cli\bin\railway.exe"
$vercel  = "$env:APPDATA\npm\vercel.cmd"
$gh      = "$env:ProgramFiles\GitHub CLI\gh.exe"
$repo    = 'asmaloupro-ux/Agent-IA'
$cors    = 'https://agent-ia-web.vercel.app,https://agent-ia-web-*.vercel.app'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Run([string]$exe, [string[]]$argv) {
  & $exe @argv
  if ($LASTEXITCODE -ne 0) { throw "Échec : $exe $($argv -join ' ')" }
}

# ---------- Railway ----------
Step 'Railway : création du projet Agent-IA'
Run $railway @('init', '--name', 'Agent-IA')
$status = (& $railway status --json) | ConvertFrom-Json
$projectId = $status.id
if (-not $projectId) { throw "ID du projet Railway introuvable dans : $($status | ConvertTo-Json -Depth 3)" }
Write-Host "Projet Railway : $projectId"

Step 'Railway : base PostgreSQL'
Run $railway @('add', '--database', 'postgres')

Step 'Railway : service api (production)'
Run $railway @('add', '--service', 'api',
  '--variables', 'DATABASE_URL=${{Postgres.DATABASE_URL}}',
  '--variables', "CORS_ORIGINS=$cors")
Run $railway @('up', '--ci', '--service', 'api', '--environment', 'production')
Run $railway @('domain', '--service', 'api', '--environment', 'production')

Step 'Railway : environnement dev (copie de production)'
Run $railway @('environment', 'new', 'dev', '--duplicate', 'production')
Run $railway @('variable', 'set', "CORS_ORIGINS=$cors,http://localhost:3000", '--service', 'api', '--environment', 'dev', '--skip-deploys')
Run $railway @('up', '--ci', '--service', 'api', '--environment', 'dev')
Run $railway @('domain', '--service', 'api', '--environment', 'dev')
Run $railway @('environment', 'link', 'dev')   # le dev local (`npm run dev:railway`) utilise l'env dev

# ---------- Vercel ----------
Step 'Vercel : projet agent-ia-web'
Run $vercel @('project', 'create', 'agent-ia-web')
Run $vercel @('link', '--yes', '--project', 'agent-ia-web', '--cwd', 'apps/web')
$link = Get-Content 'apps/web/.vercel/project.json' -Raw | ConvertFrom-Json
Write-Host "Vercel org : $($link.orgId) / projet : $($link.projectId)"

# ---------- GitHub ----------
Step 'GitHub : variables du dépôt (identifiants publics, pas des secrets)'
Run $gh @('variable', 'set', 'RAILWAY_PROJECT_ID', '--repo', $repo, '--body', $projectId)
Run $gh @('variable', 'set', 'VERCEL_ORG_ID', '--repo', $repo, '--body', $link.orgId)
Run $gh @('variable', 'set', 'VERCEL_PROJECT_ID', '--repo', $repo, '--body', $link.projectId)

Step 'Terminé'
Write-Host 'Il reste à ajouter les secrets GitHub (voir README > Secrets).' -ForegroundColor Green
