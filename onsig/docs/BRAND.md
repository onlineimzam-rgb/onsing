# OnSig — Marka & Tasarım Sistemi (Taslak)

> Bu taslak ilk turdaki tasarım yönünü belirler; isim/logo onayından sonra kesinleşir.

## Marka

- **İsim adayları:** `OnSig` · `İmza.app` · `SignBox` · `İmzala` · `Akıllı İmza`
- **Tagline (TR):** “Sözleşme dakikalar içinde, imza her yerden.”
- **Tagline (EN):** “Contracts in minutes, signed from anywhere.”
- **Ton:** Güvenilir + modern + sade. Hukuki ağırlık değil, **akıcı dil**.

## Renk paleti (öneri)

| Rol | HEX | Kullanım |
|---|---|---|
| Primary | `#5A3DF5` | Düğmeler, bağlantı, marka |
| Primary deep | `#3320B5` | Header, vurgular |
| Accent | `#10B981` | Başarı, imzalandı |
| Warn | `#F59E0B` | Bekleyen oturum |
| Danger | `#E11D48` | Hata, iptal |
| Slate-950 | `#0F172A` | Ana metin |
| Slate-500 | `#64748B` | İkincil metin |
| Bg | `#F8FAFC` | Açık arkaplan |

## Tipografi

- **Display:** Plus Jakarta Sans (heading) — Inter (body) alternatif.
- **Mono:** JetBrains Mono (referans no, hash, audit detay).
- Mobil için **Inter** + sistem fontu fallback.

## Logo yön taslağı

- Kalın yuvarlatılmış **“S”** veya **kalem ucu + tik** karması.
- Logo işaret + “OnSig” monogram yazı (geometric sans).
- Karanlık ve aydınlık varyant zorunlu.

## UI bileşen prensipleri

- Her sayfada üst banner yerine **mobile-first kart layout**.
- İmza ekranında **kalem ucu pulsing** animasyonu, “Parmağınızla aşağıya imzalayın” açıklaması.
- Tüm CTA’lar **48px** dokunma alanı (mobil dostu).
- Sözleşme metni **scroll-spy** + “En alta indim” onayı **etkin**leşmeden imza butonu pasif.
