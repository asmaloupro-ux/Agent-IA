# Création unique de l'infrastructure Agent-IA (à lancer une seule fois, depuis la racine du dépôt).
#   Railway : projet Agent-IA, PostgreSQL, service api, environnements production + dev
#   Vercel  : projet agent-ia-web (déploiements pilotés par GitHub Actions)
#   GitHub  : variables RAILWAY_PROJECT_ID, VERCEL_ORG_ID, VERCEL_PROJECT_ID
# Pré-requis : `railway login`, `vercel login` et `gh auth login` déjà faits.
$ErrorActionPreference = 'Stop'
$env:CI = 'true'                # mode non interactif : aucune question des CLI Railway / Vercel
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
# Vrai si la commande réussit (sortie masquée) : sert à sauter ce qui existe déjà, le script est reprenable.
# (PowerShell 5.1 transforme le stderr redirigé d'un exe en erreur bloquante avec 'Stop' : on repasse en 'Continue'.)
function Test-Cmd([string]$exe, [string[]]$argv) {
  $ErrorActionPreference = 'Continue'
  & $exe @argv *> $null
  return $LASTEXITCODE -eq 0
}
function Get-ApiDomain([string]$envName) {
  $ErrorActionPreference = 'Continue'
  $kv = & $railway variable list --service api --environment $envName --kv 2>$null
  return ($kv | Select-String '^RAILWAY_PUBLIC_DOMAIN=(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value })
}
# État réel d'un environnement Railway (services présents, dernier déploiement de l'api).
function Get-RailwayEnv([string]$envName) {
  $ErrorActionPreference = 'Continue'
  $s = (& $railway status --json 2>$null) | ConvertFrom-Json
  return ($s.environments.edges | ForEach-Object { $_.node } | Where-Object { $_.name -eq $envName })
}
function Get-EnvServices([string]$envName) {
  $e = Get-RailwayEnv $envName
  if (-not $e) { return @() }
  return @($e.serviceInstances.edges | ForEach-Object { $_.node.serviceName })
}
function Test-ApiDeployed([string]$envName) {
  $e = Get-RailwayEnv $envName
  return [bool]($e.serviceInstances.edges | ForEach-Object { $_.node } |
    Where-Object { $_.serviceName -eq 'api' -and $_.latestDeployment.status -eq 'SUCCESS' })
}

# ---------- Railway ----------
Step 'Railway : projet Agent-IA'
if (Test-Cmd $railway @('status')) { Write-Host 'Déjà lié à un projet Railway' }
else { Run $railway @('init', '--name', 'Agent-IA') }
$status = (& $railway status --json) | ConvertFrom-Json
$projectId = $status.id
if (-not $projectId) { throw "ID du projet Railway introuvable dans : $($status | ConvertTo-Json -Depth 3)" }
Write-Host "Projet Railway : $projectId"

Step 'Railway : PostgreSQL + service api (production)'
$prodServices = Get-EnvServices 'production'
if ('Postgres' -notin $prodServices) { Run $railway @('add', '--database', 'postgres') }
if ('api' -notin $prodServices) {
  Run $railway @('add', '--service', 'api',
    '--variables', 'DATABASE_URL=${{Postgres.DATABASE_URL}}',
    '--variables', "CORS_ORIGINS=$cors")
}
if (Test-ApiDeployed 'production') { Write-Host 'API production déjà déployée' }
else { Run $railway @('up', '--ci', '--service', 'api', '--environment', 'production') }
if (-not (Get-ApiDomain 'production')) { Run $railway @('domain', '--service', 'api', '--environment', 'production') }

Step 'Railway : environnement dev (copie de production)'
$devServices = Get-EnvServices 'dev'
if ((Get-RailwayEnv 'dev') -and ('api' -notin $devServices)) {
  Write-Host 'Environnement dev incomplet (copie interrompue) : suppression puis recréation'
  Run $railway @('environment', 'delete', 'dev', '--yes')
}
if (-not (Get-RailwayEnv 'dev')) {
  # Sans --service-config ni mode CI, Railway demande interactivement quels services reconfigurer.
  Run $railway @('environment', 'new', 'dev', '--duplicate', 'production', '--json',
    '--service-config', 'api', 'variables.CORS_ORIGINS.value', "$cors,http://localhost:3000")
}
else { Write-Host 'Environnement dev déjà présent' }
Run $railway @('variable', 'set', "CORS_ORIGINS=$cors,http://localhost:3000", '--service', 'api', '--environment', 'dev', '--skip-deploys')
if (Test-ApiDeployed 'dev') { Write-Host 'API dev déjà déployée' }
else { Run $railway @('up', '--ci', '--service', 'api', '--environment', 'dev') }
if (-not (Get-ApiDomain 'dev')) { Run $railway @('domain', '--service', 'api', '--environment', 'dev') }
Run $railway @('environment', 'link', 'dev')   # le dev local (`npm run dev:railway`) utilise l'env dev

# ---------- Vercel ----------
Step 'Vercel : projet agent-ia-web'
if (Test-Path 'apps/web/.vercel/project.json') { Write-Host 'Projet Vercel déjà lié' }
else {
  if (-not (Test-Cmd $vercel @('project', 'inspect', 'agent-ia-web', '--non-interactive'))) { Run $vercel @('project', 'create', 'agent-ia-web', '--non-interactive') }
  Run $vercel @('link', '--yes', '--non-interactive', '--project', 'agent-ia-web', '--cwd', 'apps/web')
}
$link = Get-Content 'apps/web/.vercel/project.json' -Raw | ConvertFrom-Json
Write-Host "Vercel org : $($link.orgId) / projet : $($link.projectId)"

# ---------- GitHub ----------
Step 'GitHub : variables du dépôt (identifiants publics, pas des secrets)'
Run $gh @('variable', 'set', 'RAILWAY_PROJECT_ID', '--repo', $repo, '--body', $projectId)
Run $gh @('variable', 'set', 'VERCEL_ORG_ID', '--repo', $repo, '--body', $link.orgId)
Run $gh @('variable', 'set', 'VERCEL_PROJECT_ID', '--repo', $repo, '--body', $link.projectId)

Step 'Terminé'
Write-Host 'Il reste à ajouter les secrets GitHub (voir README > Secrets).' -ForegroundColor Green
