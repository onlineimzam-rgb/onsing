<#
.SYNOPSIS
  One-shot Azure bootstrap for OnSig — Container Apps deployment.

.DESCRIPTION
  This is a guided installer. Run it ONCE, on a workstation with Azure CLI
  installed and after you've signed into the right tenant + subscription.

  It will:
    1. Verify Azure CLI is installed and you are signed in.
    2. Create the resource group (idempotent).
    3. Deploy the Bicep template (`main.bicep`).
    4. Push your application secrets into Key Vault.
    5. Wire those secrets onto the Container App.
    6. Print the public URL and next-step instructions.

  Re-running is safe — Bicep is declarative and Key Vault secrets are upserted.

.PARAMETER ResourceGroup
  Resource group name. Default: onsig-prod.

.PARAMETER Location
  Azure region. Default: westeurope.

.PARAMETER Subscription
  Subscription ID or name. If omitted, the script uses your current default.

.EXAMPLE
  pwsh ./infra/bootstrap.ps1 -ResourceGroup onsig-prod -Location westeurope

#>
[CmdletBinding()]
param(
  [string]$ResourceGroup = 'onsig-prod',
  [string]$Location      = 'westeurope',
  [string]$Subscription
)

$ErrorActionPreference = 'Stop'

function Write-Section($msg) {
  Write-Host ''
  Write-Host "── $msg " + ('─' * [Math]::Max(0, 70 - $msg.Length)) -ForegroundColor Cyan
}

# ─── 0. Prereqs ────────────────────────────────────────────────────────────
Write-Section 'Checking prerequisites'

try { az --version | Out-Null } catch {
  throw "Azure CLI not found. Install from https://aka.ms/install-azure-cli"
}

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
  Write-Host "Not signed in — opening browser for `az login`…" -ForegroundColor Yellow
  az login | Out-Null
  $account = az account show | ConvertFrom-Json
}

if ($Subscription) {
  az account set --subscription $Subscription | Out-Null
  $account = az account show | ConvertFrom-Json
}

Write-Host "  Tenant:        $($account.tenantId)"
Write-Host "  Subscription:  $($account.name)  ($($account.id))"
Write-Host "  User:          $($account.user.name)"

# Make sure the container-apps provider is registered.
az provider register --namespace Microsoft.App --wait | Out-Null
az provider register --namespace Microsoft.ContainerRegistry --wait | Out-Null
az provider register --namespace Microsoft.OperationalInsights --wait | Out-Null

# ─── 1. Resource group ─────────────────────────────────────────────────────
Write-Section "Resource group: $ResourceGroup ($Location)"
az group create --name $ResourceGroup --location $Location --tags app=onsig env=prod | Out-Null

# ─── 2. Bicep deployment ───────────────────────────────────────────────────
Write-Section 'Deploying Bicep (this can take ~3-5 minutes)'
$deploy = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$PSScriptRoot/main.bicep" `
  --parameters    "$PSScriptRoot/main.parameters.prod.json" `
  --parameters    location=$Location `
  --query 'properties.outputs' -o json | ConvertFrom-Json

$acrServer        = $deploy.acrLoginServer.value
$appName          = $deploy.containerAppName.value
$appUrl           = $deploy.containerAppUrl.value
$kvName           = $deploy.keyVaultName.value
$uamiClientId     = $deploy.managedIdentityClientId.value
$appiConn         = $deploy.appInsightsConnectionString.value
$storageName      = $deploy.storageAccountName.value

Write-Host "  ACR:                $acrServer"
Write-Host "  Container App:      $appName"
Write-Host "  Public URL:         $appUrl"
Write-Host "  Key Vault:          $kvName"
Write-Host "  Storage Account:    $storageName"

# ─── 3. Collect & push secrets ─────────────────────────────────────────────
Write-Section 'Provisioning secrets in Key Vault'
Write-Host @"
You will be prompted for each secret. Press ENTER to skip (existing value kept).
The placeholders the Bicep file inserted will be overwritten on a real value.
"@ -ForegroundColor Yellow

function Set-KvSecret($name, $prompt) {
  $existing = az keyvault secret show --vault-name $kvName --name $name --query value -o tsv 2>$null
  if ($existing -and $existing -ne 'set-via-pipeline') {
    Write-Host "  $name → already set (skipping)"
    return $existing
  }
  $secure = Read-Host -Prompt "  $prompt" -AsSecureString
  $plain = [System.Net.NetworkCredential]::new('', $secure).Password
  if (-not $plain) { Write-Host "  $name → SKIPPED"; return $existing }
  az keyvault secret set --vault-name $kvName --name $name --value $plain | Out-Null
  Write-Host "  $name → written"
  return $plain
}

# Grant the operator running this script Key Vault Secrets Officer for upserts.
$me = az ad signed-in-user show --query id -o tsv
$kvId = az keyvault show -n $kvName --query id -o tsv
$roleSecretsOfficer = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'
az role assignment create --assignee-object-id $me --assignee-principal-type User `
  --role $roleSecretsOfficer --scope $kvId 2>$null | Out-Null

$postgres   = Set-KvSecret 'postgres-url'    'POSTGRES_URL (Neon pooled)'
$jwt        = Set-KvSecret 'jwt-secret'      'JWT_SECRET (32+ byte base64)'
$resend     = Set-KvSecret 'resend-api-key'  'RESEND_API_KEY (Resend.com)'
$storageKey = az storage account show-connection-string --name $storageName -g $ResourceGroup --query connectionString -o tsv
az keyvault secret set --vault-name $kvName --name 'storage-conn' --value $storageKey | Out-Null
Write-Host "  storage-conn → auto-derived from storage account"

# ─── 4. Wire secrets onto the Container App ─────────────────────────────────
Write-Section 'Updating Container App secrets'
az containerapp secret set `
  --name $appName --resource-group $ResourceGroup `
  --secrets `
    "postgres-url=$postgres" `
    "jwt-secret=$jwt" `
    "resend-api-key=$resend" `
    "storage-conn=$storageKey" `
    "appi-conn=$appiConn" | Out-Null

# ─── 5. Summary ─────────────────────────────────────────────────────────────
Write-Section 'Done!'
Write-Host @"

  Container App URL:  $appUrl
  Key Vault:          https://portal.azure.com/#blade/Microsoft_Azure_KeyVault/VaultBlade/path/$kvName

Next steps:

  1. Build & push the image:
       az acr login --name $($acrServer.Split('.')[0])
       docker build -t $acrServer/onsig-web:0.1.0 .
       docker push     $acrServer/onsig-web:0.1.0

  2. Point the app at the new image:
       az containerapp update -n $appName -g $ResourceGroup \\
         --image $acrServer/onsig-web:0.1.0

  3. Tail logs:
       az containerapp logs show -n $appName -g $ResourceGroup --follow

  4. Once your domain is ready, add a custom domain + managed certificate via
     `az containerapp hostname add` (see docs/DEPLOY.md).

"@ -ForegroundColor Green
