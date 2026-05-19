// =============================================================================
// OnSig — Azure infrastructure (Bicep)
// =============================================================================
//
// Provisions everything OnSig needs to run on Azure Container Apps:
//
//   Resource Group                  (deployed by az cli, not this file)
//     ├── Log Analytics Workspace   (logs sink for ACA + App Insights)
//     ├── Application Insights      (request traces, exceptions, perf)
//     ├── Container Registry (ACR)  (production images, geo-replicated later)
//     ├── Key Vault                 (secrets: JWT_SECRET, POSTGRES_URL, …)
//     ├── Storage Account + Blob    (signed PDFs, audit zips)
//     └── Container Apps Environment
//           └── Container App "onsig-web"  (scale-to-zero, public ingress)
//
// Why Bicep over Terraform?
//   - Native to Azure, no extra state backend, smaller surface area for MVP.
//   - First-class support for `userAssignedIdentities`, ACA, Key Vault
//     references — Terraform's azurerm provider lags behind.
//
// Deploy:
//   az group create -n onsig-prod -l westeurope
//   az deployment group create \
//     --resource-group onsig-prod \
//     --template-file infra/main.bicep \
//     --parameters infra/main.parameters.prod.json
//
// =============================================================================

@description('Short environment identifier — appears in every resource name.')
@allowed(['prod', 'staging', 'dev'])
param environmentName string = 'prod'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Globally-unique short tag used to derive resource names. Lowercase letters/digits only, 4-12 chars.')
@minLength(4)
@maxLength(12)
param namePrefix string = 'onsig'

@description('Container image to deploy on first apply. Subsequent deploys come from the pipeline.')
param initialImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Min/max ACA replicas. minReplicas=1 keeps the app warm (no cold starts) for ~$8/mo extra. Set to 0 to allow scale-to-zero.')
param minReplicas int = 1
param maxReplicas int = 3

@description('CPU cores per replica. 0.5 fits OnSig MVP comfortably (Next.js + PDF render burst).')
param cpu string = '0.5'

@description('Memory per replica.')
param memory string = '1Gi'

// ─── Derived names ────────────────────────────────────────────────────────────
var tagPrefix = '${namePrefix}-${environmentName}'

// ACR names cannot contain dashes.
var acrName = toLower(replace('${namePrefix}${environmentName}acr', '-', ''))
var storageName = toLower(replace('${namePrefix}${environmentName}stg', '-', ''))
var kvName = '${tagPrefix}-kv'
var lawName = '${tagPrefix}-law'
var appiName = '${tagPrefix}-appi'
var envName = '${tagPrefix}-aca-env'
var appName = '${tagPrefix}-web'
var uamiName = '${tagPrefix}-uami'

var tags = {
  app: 'onsig'
  env: environmentName
  managedBy: 'bicep'
}

// ─── User-assigned managed identity ──────────────────────────────────────────
resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: uamiName
  location: location
  tags: tags
}

// ─── Log Analytics + App Insights ────────────────────────────────────────────
resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: lawName
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appi 'Microsoft.Insights/components@2020-02-02' = {
  name: appiName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: law.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ─── Azure Container Registry ────────────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// Grant the UAMI rights to pull from ACR.
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, uami.id, acrPullRoleId)
  scope: acr
  properties: {
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
  }
}

// ─── Storage Account (Blob — documents) ──────────────────────────────────────
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: { defaultAction: 'Allow', bypass: 'AzureServices' }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 30 }
    containerDeleteRetentionPolicy: { enabled: true, days: 30 }
  }
}

resource docsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'onsig-documents'
  properties: { publicAccess: 'None' }
}

// Grant UAMI write access to blobs (for signed PDFs + audit ZIPs).
var blobContribRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe' // Storage Blob Data Contributor
resource blobContrib 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, uami.id, blobContribRoleId)
  scope: storage
  properties: {
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', blobContribRoleId)
  }
}

// ─── Key Vault ───────────────────────────────────────────────────────────────
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: { name: 'standard', family: 'A' }
    enableRbacAuthorization: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 30
    publicNetworkAccess: 'Enabled'
  }
}

// Grant UAMI read access to secrets.
var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
resource kvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(kv.id, uami.id, kvSecretsUserRoleId)
  scope: kv
  properties: {
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
  }
}

// ─── Container Apps Environment ──────────────────────────────────────────────
resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: law.properties.customerId
        sharedKey: law.listKeys().primarySharedKey
      }
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// ─── The actual app ──────────────────────────────────────────────────────────
//
// Secrets are wired by name only; the pipeline writes real values to Key Vault
// and the ACA secret references point at them. We never paste secrets here.
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${uami.id}': {} }
  }
  properties: {
    managedEnvironmentId: env.id
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3001
        transport: 'auto'
        allowInsecure: false
        traffic: [
          { latestRevision: true, weight: 100 }
        ]
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: uami.id
        }
      ]
      secrets: [
        // Placeholder secrets so the first deployment doesn't fail. The
        // pipeline overwrites these from Key Vault on every subsequent rev.
        { name: 'postgres-url', value: 'set-via-pipeline' }
        { name: 'jwt-secret', value: 'set-via-pipeline' }
        { name: 'resend-api-key', value: 'set-via-pipeline' }
        { name: 'storage-conn', value: 'set-via-pipeline' }
        { name: 'appi-conn', value: appi.properties.ConnectionString }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: initialImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3001' }
            { name: 'POSTGRES_URL', secretRef: 'postgres-url' }
            { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
            { name: 'RESEND_API_KEY', secretRef: 'resend-api-key' }
            { name: 'AZURE_STORAGE_CONNECTION_STRING', secretRef: 'storage-conn' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', secretRef: 'appi-conn' }
            { name: 'NEXT_PUBLIC_APP_URL', value: 'https://${appName}.${env.properties.defaultDomain}' }
          ]
          probes: [
            // Startup: allows up to 60s for the Next.js process to boot,
            // initialize DB pool, and warm App Insights. Without this, slow
            // cold starts can trip the liveness probe and cause flapping.
            {
              type: 'Startup'
              httpGet: { path: '/api/health/live', port: 3001 }
              initialDelaySeconds: 5
              periodSeconds: 5
              timeoutSeconds: 3
              failureThreshold: 12
            }
            {
              type: 'Liveness'
              httpGet: { path: '/api/health/live', port: 3001 }
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
            // Readiness gates traffic — pulled out of rotation if it fails
            // even once. Points at the deeper /api/health (DB check) so a
            // dead DB connection takes the replica out of the LB for the
            // next request, instead of failing user requests.
            {
              type: 'Readiness'
              httpGet: { path: '/api/health', port: 3001 }
              initialDelaySeconds: 5
              periodSeconds: 15
              timeoutSeconds: 5
              failureThreshold: 2
              successThreshold: 1
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
  dependsOn: [acrPull]
}

// ─── Outputs (used by pipeline) ──────────────────────────────────────────────
output acrLoginServer string = acr.properties.loginServer
output containerAppName string = app.name
output containerAppUrl string = 'https://${app.properties.configuration.ingress.fqdn}'
output keyVaultName string = kv.name
output managedIdentityClientId string = uami.properties.clientId
output managedIdentityResourceId string = uami.id
output appInsightsConnectionString string = appi.properties.ConnectionString
output storageAccountName string = storage.name
