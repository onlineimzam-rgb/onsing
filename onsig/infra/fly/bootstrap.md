# Fly.io — first-time bootstrap

Tahmini süre: **20 dakika** (hesap açma dahil).

---

## 1. Hesap + ödeme

1. https://fly.io/app/sign-up → GitHub veya email ile kayıt.
2. **Billing** → kredi kartı ekle. (Aylık tahmini fatura: **$5–8**. Free tier kalktı ama gerçek tüketim çok düşük.)
3. (Opsiyonel) "Hobby" plan'da kal — production için "Pay-as-you-go" da yeterli.

## 2. flyctl CLI

```powershell
# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

```bash
# macOS / Linux
curl -L https://fly.io/install.sh | sh
```

Login:
```bash
flyctl auth login
flyctl auth whoami
```

## 3. App'i oluştur

```bash
cd onsig/backend

# İnteraktif olmadan, fly.toml'un üzerine yazmadan, app kayıt et:
flyctl apps create onsig-prod --org personal

# (Org adın farklıysa `flyctl orgs list` ile bul.)
```

> **app adı uniq**: `onsig-prod` Fly genelinde benzersiz olmak zorunda. Çakışırsa `onsig-prod-bt` gibi takı ekle ve `fly.toml`'da `app = "..."` satırını güncelle.

## 4. Secret'ları push et

Aşağıdaki değerleri **bir kez** yaz; Fly bunları şifreli olarak saklar, deploy'larda her makine env olarak alır.

```bash
flyctl secrets set \
  POSTGRES_URL='postgresql://NEON_USER:NEON_PASS@HOST-pooler.eu-central-1.aws.neon.tech/onsig?sslmode=require' \
  POSTGRES_URL_NON_POOLING='postgresql://NEON_USER:NEON_PASS@HOST.eu-central-1.aws.neon.tech/onsig?sslmode=require' \
  JWT_SECRET="$(openssl rand -base64 48)" \
  RESEND_API_KEY='re_...' \
  MAIL_FROM='OnSig <noreply@onsig.dev>' \
  --app onsig-prod
```

PowerShell muadili:

```powershell
$jwt = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

flyctl secrets set `
  POSTGRES_URL='postgresql://...' `
  POSTGRES_URL_NON_POOLING='postgresql://...' `
  JWT_SECRET="$jwt" `
  RESEND_API_KEY='re_...' `
  MAIL_FROM='OnSig <noreply@onsig.dev>' `
  --app onsig-prod
```

Doğrula:

```bash
flyctl secrets list --app onsig-prod
```

## 5. Production Neon DB

`docs/DEPLOY.md § 4` ile aynı:

1. https://console.neon.tech → **New project** → `onsig-prod`, region `eu-central-1`.
2. Database adı: `onsig`. Default branch: `main`.
3. **Connection details** → iki URL'yi al → `flyctl secrets set` ile yaz.

İlk schema'yı **lokal makinenden** push et (tek seferlik):

```bash
cd onsig/backend
$env:POSTGRES_URL = '<direct/non-pooling URL>'
npm run db:push
```

Sonraki release'lerde `release_command` (drizzle migrate) otomatik çalışacak.

## 6. İlk deploy

```bash
cd onsig/backend
flyctl deploy --remote-only
```

`--remote-only` Fly'ın builder'ında docker build'i yapar — laptopun ısınmaz, 1 GB image upload etmek zorunda değilsin.

İlk build ~5 dakika sürer (node_modules + native compile). Sonraki build'ler 60–90 sn (layer cache).

Bittiğinde URL:

```
https://onsig-prod.fly.dev
```

## 7. Doğrulama

```bash
# Health
curl https://onsig-prod.fly.dev/api/health/live    # → ok
curl https://onsig-prod.fly.dev/api/health         # → JSON with db.ok=true

# Smoke
node scripts/smoke-prod.mjs https://onsig-prod.fly.dev

# Logs (canlı)
flyctl logs --app onsig-prod

# Status
flyctl status --app onsig-prod
```

## 8. GitHub Actions

1. GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - `FLY_API_TOKEN` = `flyctl auth token` çıktısı

2. `main`'e push → `.github/workflows/fly-deploy.yml` otomatik çalışır.

---

## Operasyon — günlük komutlar

| İstek | Komut |
|---|---|
| Yeni deploy | `flyctl deploy` |
| Logs (canlı) | `flyctl logs` |
| Pod listesi | `flyctl status` |
| Yeniden başlat | `flyctl machine restart <id>` |
| Secret değiştir | `flyctl secrets set KEY=val` (yeni deploy tetikler) |
| Secret okuma | `flyctl ssh console -C "printenv KEY"` |
| Önceki versiyon | `flyctl releases` → `flyctl deploy --image registry.fly.io/onsig-prod:<old-tag>` |
| SSH | `flyctl ssh console` |
| Geçici scale | `flyctl scale count 2` |
| Custom domain | `flyctl certs add app.onsig.com.tr` |

## Maliyet izleme

```bash
flyctl orgs apps onsig-prod   # bu ay tüketim
```

Fly Dashboard → Billing → Usage → her servis için detaylı breakdown.

Tahmini aylık:
- 1 × shared-cpu-1x 1GB always-on: $5.70
- Outbound bandwidth (~10 GB MVP): $1.94
- IPv4 anycast: $0 (IPv6 ücretsiz, IPv4 ek $2 isteğe bağlı)
- **Toplam**: ~$6–8/ay

Trafik 100k req/ay'a çıkarsa: ~$15–20/ay.
