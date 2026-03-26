// =============================================================================
// Sigil CMS — Azure Bicep IaC Template
// Deploys: Container Apps Environment, 3 Container Apps, PostgreSQL Flexible Server, ACR
//
// Usage:
//   az deployment group create \
//     --resource-group sigil-rg \
//     --template-file deploy/azure/bicep/main.bicep \
//     --parameters dbPassword='<password>' jwtSecret='<secret>'
// =============================================================================

@description('Location for all resources')
param location string = resourceGroup().location

@description('PostgreSQL admin password')
@secure()
param dbPassword string

@description('JWT signing secret')
@secure()
param jwtSecret string

@description('Seed API key for bootstrap')
@secure()
param seedApiKey string = newGuid()

@description('Container image tag')
param imageTag string = 'latest'

@description('Renderer site slug')
param siteSlug string = 'default'

@description('Renderer site name')
param siteName string = 'My Site'

var prefix = 'sigil'
var acrName = '${prefix}acr${uniqueString(resourceGroup().id)}'
var dbServerName = '${prefix}-pgserver'
var dbName = 'sigil'
var dbUser = 'sigiladmin'
var envName = '${prefix}-env'

// ---- Container Registry -----------------------------------------------------

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ---- PostgreSQL Flexible Server ---------------------------------------------

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: dbServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: dbUser
    administratorLoginPassword: dbPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: pgServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---- Log Analytics Workspace ------------------------------------------------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ---- Container Apps Environment ---------------------------------------------

resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ---- Sigil API Container App ------------------------------------------------

var databaseUrl = 'postgresql://${dbUser}:${dbPassword}@${pgServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'

resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-api'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'seed-api-key'
          value: seedApiKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'sigil-api'
          image: '${acr.properties.loginServer}/sigil-api:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3000' }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
            { name: 'SEED_API_KEY', secretRef: 'seed-api-key' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3000
              }
              periodSeconds: 30
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// ---- Sigil Admin Container App ----------------------------------------------

resource adminApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-admin'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'sigil-admin'
          image: '${acr.properties.loginServer}/sigil-admin:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'VITE_API_URL', value: 'https://${apiApp.properties.configuration.ingress.fqdn}' }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
      }
    }
  }
}

// ---- Sigil Renderer Container App -------------------------------------------

resource rendererApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-renderer'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'sigil-renderer'
          image: '${acr.properties.loginServer}/sigil-renderer:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'PORT', value: '3000' }
            { name: 'API_URL', value: 'https://${apiApp.properties.configuration.ingress.fqdn}/api/v1/public' }
            { name: 'SITE_SLUG', value: siteSlug }
            { name: 'SITE_NAME', value: siteName }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
      }
    }
  }
}

// ---- Outputs ----------------------------------------------------------------

output apiUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'
output adminUrl string = 'https://${adminApp.properties.configuration.ingress.fqdn}'
output rendererUrl string = 'https://${rendererApp.properties.configuration.ingress.fqdn}'
output acrLoginServer string = acr.properties.loginServer
output dbServer string = pgServer.properties.fullyQualifiedDomainName
