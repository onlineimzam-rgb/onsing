# Azure deployment (alternative / archived)

OnSig şu an **Fly.io**'da production'da çalışıyor — bkz. [docs/DEPLOY.md](../../docs/DEPLOY.md).

Bu klasör Azure Container Apps ile alternatif bir deployment'ı tutuyor. Aşağıdaki
senaryolarda işe yarayabilir:

- **Kurumsal müşteri Azure'da olmamızı şart koşar** (KVKK + Azure sözleşmesi)
- **Vercel/Fly traffic patlama** ile pahalılaşırsa — Azure ACA Consumption planı
  belirli ölçekten sonra Fly'dan ucuzlaşır
- **Microsoft Partner Network kredisi** alırsak

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `main.bicep` | Tüm Azure kaynakları (RG, ACR, ACA, Key Vault, App Insights, Blob) |
| `main.parameters.prod.json` | Region, replica, CPU/memory ayarları |
| `bootstrap.ps1` | Tek komut kurulum scripti |
| `azure-pipelines.yml` | Azure DevOps pipeline (5 stage) |

## Yeniden aktive etmek için

1. Microsoft Azure subscription aç ([portal.azure.com](https://portal.azure.com))
2. `cd infra/azure && pwsh ./bootstrap.ps1 -ResourceGroup onsig-prod -Location westeurope`
3. Azure DevOps project + service connection oluştur
4. `azure-pipelines.yml`'yi backend root'una taşı ve pipeline'a bağla

Detaylı rehber: bu klasörü [eski DEPLOY.md commit'inde](https://github.com/candarli/uzman-gm/blob/HEAD~5/onsig/docs/DEPLOY.md)
bulabilirsin.
