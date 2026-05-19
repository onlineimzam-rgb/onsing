# OnSig — deployment

Bu doc bir **navigasyon kapısı**. Asıl talimatlar platform alt-klasörlerinde.

```
onsig/
├── docs/DEPLOY.md                ← buradasın
├── infra/
│   ├── fly/        ← ACTIVE      → Fly.io kurulum + günlük operasyon
│   │   └── bootstrap.md
│   └── azure/      ← ARCHIVED    → Azure Container Apps (gelecekte tekrar)
│       ├── README.md
│       ├── main.bicep
│       ├── main.parameters.prod.json
│       ├── bootstrap.ps1
│       └── azure-pipelines.yml
└── .github/workflows/fly-deploy.yml   ← otomatik CI/CD
```

## Üretim mimarisi

```
GitHub repo (main branch)
   │
   ▼ push
GitHub Actions  (validate → deploy → smoke)
   │
   ▼ flyctl deploy --remote-only
Fly.io  (Frankfurt, FRA region)
   ├── 1 × shared-cpu-1x 1GB always-on
   ├── secrets ← Fly secret store (encrypted)
   ├── logs   → flyctl logs + Grafana (free tier ileride)
   └── HTTPS  → automatic Let's Encrypt cert
              + fly.dev wildcard (anında çalışır)
              + app.onsig.com.tr (DNS bağlanınca)
   │
   ▼
Neon Postgres  (eu-central-1, ayrı production project)
Resend         (email API, EU region)
```

## Hızlı başlangıç (özet)

İlk kurulum: `infra/fly/bootstrap.md` rehberini takip et.

Günlük operasyon:

```bash
# Deploy
git push origin main          # ← CI otomatik halleder
# veya manuel
flyctl deploy --remote-only

# Canlı log
flyctl logs --app onsig-prod

# Yeni env
flyctl secrets set FOO=bar    # otomatik redeploy

# Önceki versiyona dön
flyctl releases               # liste
flyctl deploy --image registry.fly.io/onsig-prod:<v-N>
```

## Phase yol haritası

| Phase | Kapsam | Durum |
|---|---|---|
| **Phase 1** | Tek container app+admin+marketing, Fly.io, .fly.dev URL, Neon, Resend | ✅ hazır |
| **Phase 2** | Custom domain (`onsig.com.tr` + `app.` `admin.`), Cloudflare DNS, Fly managed cert | bekliyor |
| **Phase 3** | Marketing'i ayrı host'a (Cloudflare Pages → ücretsiz), CDN, region-pin | bekliyor |
| **Phase 4** | Worker process (audit zip async), TSA timestamping, Sentry replacement | sonra |

## Maliyet özeti (Phase 1, aylık)

| Servis | Plan | Aylık |
|---|---|---|
| Fly.io app | 1×1GB always-on, FRA | $5.70 |
| Fly.io bandwidth | ~10 GB outbound | $1.94 |
| Neon Postgres | Free tier (0.5 GB) | $0 |
| Resend email | Free (100/gün, 3k/ay) | $0 |
| **Toplam** | | **~$8/ay** |

Trafik 100k req/ay'a çıkarsa: ~$15–20/ay.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| `flyctl deploy` build hatası `argon2` | Dockerfile `bookworm-slim` kullanıyor mu? (Alpine'da çalışmaz) |
| `/api/health` `db.ok: false` | `flyctl secrets list` ile `POSTGRES_URL` set mi? |
| Cold start gibi davranıyor | `fly.toml`'da `min_machines_running = 1` mi? `auto_stop_machines = false` mu? |
| GitHub Actions deploy stage fail | `FLY_API_TOKEN` secret eklendi mi? Geçerli mi? (`flyctl auth token` ile yenile) |
| Migration hatası → rollout abort | `release_command` log'una bak: `flyctl logs --app onsig-prod` |
| Custom domain SSL pending | DNS propagate olmamış olabilir, 15 dk bekle veya `dig app.onsig.com.tr` |

## İleri seviye

- **Multi-region**: `flyctl regions add ist fra ams` ile İstanbul + Amsterdam ekle.
- **Grafana Cloud Free**: Fly metrics endpoint'i (`:9091/metrics`) Prometheus scrape ile bağlanır → ücretsiz dashboard.
- **Tigris Object Storage**: Fly'ın S3-uyumlu store'u ($0.015/GB/ay) — Azure Blob yerine geçebilir.
- **Fly Postgres**: Managed Postgres'i Fly'a da taşınabilir ama Neon'un free tier'ı + branching özelliği için tercih edilmedi.

## Geri Azure'a dönmek

Eğer ileride Azure'a geçmek istersek:

```
infra/azure/
├── README.md              ← bu klasörü oku
├── main.bicep             ← Bicep IaC
└── bootstrap.ps1          ← tek komutluk kurulum
```

Geçiş süresi ~45 dk. Aynı Dockerfile, aynı env'ler, aynı kod.
