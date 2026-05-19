/**
 * Plain-text contract templates (matbu uyumlu).
 *
 * Originally derived from the CUGM `lib/contracts/templates.ts` set; all
 * brokerage/tenant references have been lifted out into `ContractRenderContext`.
 *
 * The text output is what the signer sees in the public sign page and is also
 * the body that gets re-rendered into HTML/PDF.
 */

import type { AnyTemplateKey, ContractFormState, RealEstateTemplateKey } from './types'
import type { ContractRenderContext } from './context'

const LINE = '................................................................'

export function v(input: string | null | undefined, fallback: string = LINE): string {
  const t = (input ?? '').toString().trim()
  return t.length ? t : fallback
}

export function contractTitle(key: AnyTemplateKey, override?: string): string {
  switch (key) {
    case 'kira':
      return 'KİRA SÖZLEŞMESİ'
    case 'yetki':
      return 'EMLAK KOMİSYONCUSU İLE MAL SAHİBİ ARASINDA YAPILAN YETKİ SÖZLEŞMESİ'
    case 'alim-satim':
      return 'GAYRİMENKUL SATIŞ SÖZLEŞMESİ'
    case 'yer-gosterme':
      return 'GAYRİMENKUL YER GÖSTERME TUTANAĞI VE KOMİSYON SÖZLEŞMESİ'
    case 'custom':
      return (override && override.trim()) || 'ÖZEL SÖZLEŞME'
  }
}

/** Merge form values with tenant defaults from ctx (form wins if non-empty). */
function effectiveCourt(f: ContractFormState, ctx: ContractRenderContext): string {
  return v(f.competentCourt, ctx.competentCourt || LINE)
}
function effectiveLicense(f: ContractFormState, ctx: ContractRenderContext): string {
  return v(f.brokerageLicenseNo, ctx.brokerageLicenseNo || LINE)
}

export function buildContractText(form: ContractFormState, ctx: ContractRenderContext): string {
  switch (form.templateKey) {
    case 'kira':
      return buildKira(form, ctx)
    case 'yetki':
      return buildYetki(form, ctx)
    case 'alim-satim':
      return buildAlimSatim(form, ctx)
    case 'yer-gosterme':
      return buildYerGosterme(form, ctx)
    case 'custom':
      return buildCustom(form, ctx)
  }
}

function buildCustom(f: ContractFormState, _ctx: ContractRenderContext): string {
  const title = (f.customTitle ?? '').trim() || 'ÖZEL SÖZLEŞME'
  const body = (f.customBody ?? '').trim() || '(Sözleşme metni boş — düzenleyerek içerik ekleyin.)'
  return `
══════════════════════════════════════════════════════════════
${title.toUpperCase()}
══════════════════════════════════════════════════════════════

${body}
`.trim()
}

function buildKira(f: ContractFormState, ctx: ContractRenderContext): string {
  const mah = v(f.mahalle || f.propertyAddress.split(',')[0])
  const sok = v(f.sokakVeNo)
  const daire = v(f.daireBlok)
  const cins = v(f.kiralananCinsi || f.propertyInfo)
  return `
══════════════════════════════════════════════════════════════
                         KİRA SÖZLEŞMESİ
══════════════════════════════════════════════════════════════

ÜST BİLGİLER
────────────────────────────────────────
Mahallesi                  : ${mah}
Sokağı ve Numarası         : ${sok}
Dairesi                    : ${daire}
Kiralanan Şeyin Cinsi      : ${cins}

Kiraya Verenin Adı Soyadı/Ünvanı           : ${v(f.ownerName)}
Kiraya Verenin T.C Kimlik No.su / Vergi No : ${v(f.ownerTc)}
Kiraya Verenin İkametgah Adresi            : ${v(f.ownerHomeAddress || f.propertyAddress)}

Kiracının Adı Soyadı/Ünvanı                : ${v(f.customerName)}
Kiracının T.C Kimlik No.su / Vergi No      : ${v(f.customerTc)}
Kiracının İkametgah Adresi                 : ${v(f.customerHomeAddress)}
Kiracının İşyeri Adresi                    : ${v(f.customerWorkAddress)}
Telefon (Kiracı)                           : ${v(f.customerPhone)}

Kiralanan Şey İle Beraber Teslim Olunan Demirbaş Eşyanın Beyanı
${v(f.demirbasBeyani)}

Kiralanan Şeyin Şimdiki Durumu
${v(f.kiralananDurumu)}

Kiralanan Şeyin Ne İçin Kullanılacağı
${v(f.kullanimAmaci)}

Kira Müddeti                             : ${v(f.kiraYili)} yıl
Kiranın Başlangıç Tarihi                 : ${v(f.leaseStartDate || f.contractDate)}
Kiranın Bitiş Tarihi (varsa)             : ${v(f.leaseEndDate)}
Kiranın Ne Şekilde Ödeneceği             : ${v(f.paymentMethod)}
Bir Aylık Kira Karşılığı                 : ${v(f.monthlyRent)}
Bir Yıllık Kira Karşılığı                : ${v(f.yearlyRent)}
Kira ödemesi (HUSUSİ ŞART)               : Kiracı kira bedelini en geç ait olduğu ayın ilk ${v(f.paymentDayOfMonth)} gününde ve her ay peşin olarak ödemeyi taahhüt eder.

Kiracı peşinat olarak ${v(f.advanceLandlord)} mal sahibine vermiştir.
Kiracı depozit olarak ${v(f.depositAmount)} mal sahibine vermiştir.
Kiracı kontrat bitiminde kira bedelini …………………………… göre %${v(f.rentIncreasePercent)} oranında artırmayı şimdiden kabul ve taahhüt eder.

HUSUSİ ŞARTLAR
────────────────────────────────────────
${v(f.specialTerms)}

STANDART HÜKÜMLER (MATBU ÖZETİ)
────────────────────────────────────────
1) Kiracı kat mülkiyeti kanununa uymayı aynen kabul ve taahhüt eder.
2) Kiracı kiralananı kısmen veya tamamen başkasına devir ve ciro edemez.
3) Kiracı kiralanan gayrimenkulde mal sahibinin haberi ve izni olmadan tadilat yapamaz.
4) Elektrik, Su, Doğalgaz, Kalorifer, Apartmana ait giderler ile Çevre Temizlik Vergisi kiracıya aittir.
5) Kiracı apartman yönetiminin alacağı kararlara aynen uyacaktır.
6) Kontrat tarihine kadar olan tüm gider ve borçlar kiracıya aittir.
7) Kontrat tarihinden sonra tahakkuk eden tüm gider ve borçlar kiracıya aittir.
8) Kiralanan gayrimenkule tahakkuk edecek stopaj vergisi kiracıya aittir.
9) Aynı dönem içerisinde kira bedelinin iki ay arka arkaya ödenmemesi halinde, ödenmeyen aydan itibaren kontrat süresi sonuna kadar olan kira bedelleri muacceliyet kazanır.
10) Kiracı mal sahibine vermiş olduğu peşinat ve depozitten faiz veya fazlalık talep edemez; depoziti tamirata mahsup edemez.
11) Kiracı tahliye ederken vermiş olduğu zarar ve ziyana ait meblağ ile birlikte hususları saklıdır.
12) Kiracı kiralananı boşaltmak istediği takdirde en az bir ay evvelinden mal sahibine ulaşacak şekilde bildirmeyi taahhüt eder.
13) İşbu kontrat ${v(f.contractArticleCount)} maddeden ibaret olup ${v(f.contractCopyCount)} nüsha düzenlenip muhataplara verilmiştir.
14) İhtilaf halinde ${effectiveCourt(f, ctx)} Mahkemeleri ve İcra Daireleri yetkilidir.
15) Taraflarca yazılı adresler kanuni ikametgah olarak kabul edilir; adres değişikliği yazılı bildirilmezse kontrattaki adrese tebligat muteber sayılır.
16) Kefilin kefaleti müşterek ve müteselsil olup kefilin bilgisi: ${v(f.kefilName)}.

İmza sahipleri yukarıdaki hususları okuyup kabul etmişlerdir.
`.trim()
}

function buildYetki(f: ContractFormState, ctx: ContractRenderContext): string {
  return `
══════════════════════════════════════════════════════════════
${contractTitle('yetki')}
══════════════════════════════════════════════════════════════

SÖZLEŞME SÜRESİ BAŞLANGIÇ : ${v(f.authorityStartDate || f.contractDate)}
SÖZLEŞME SÜRESİ BİTİŞ     : ${v(f.authorityEndDate)}
Sözleşme süresi (açıklama): ${v(f.authorityYears)}
(Mal sahibi ile komisyoncu arasında ${v(f.authorityCopies)} nüsha)

MAL SAHİBİNİN ÜNVANI/ADI SOYADI : ${v(f.ownerName)}
T.C.NO                          : ${v(f.ownerTc)}
İŞ ADRESİ                       : ${v(f.ownerWorkAddress)}
İKAMETGAHI                      : ${v(f.ownerHomeAddress)}
TELEFON/FAX                     : ${v(f.ownerPhone)}

TAŞINMAZIN TÜRÜ                  : ${v(f.propertyInfo)}
İL / İLÇE / MAHALLE / SOKAK / NO : ${v(f.propertyAddress)}
ADA NO: ${v(f.adaNo)}   PAFTA: ${v(f.paftaNo)}   PARSEL: ${v(f.parselNo)}
TAŞINMAZA BİÇİLEN AZAMİ DEĞER    : ${v(f.maxAskPrice)}
TAŞINMAZA BİÇİLEN ASGARİ DEĞER   : ${v(f.minAskPrice)}

EMLAK KOMİSYONCUSU: ${ctx.brokerName}
Adres: ${ctx.brokerAddress}
Tel: ${ctx.brokerPhone}
E-posta: ${ctx.brokerEmail}
İşletme Yetki Belgesi / Oda Sicil No: ${effectiveLicense(f, ctx)}

MADDELER
────────────────────────────────────────
1) Mal sahibi ile emlak komisyoncusu yukarıda belirtilen gayrimenkulün ${v(f.purposeSaleRent)} işleminde aracılık edilmesi için anlaşmışlardır.

2) Emlak komisyoncusu gayrimenkul ile ilgili olarak satış/kira işlemi amacıyla masrafı kendine ait olmak üzere basın ve sair medyaya ilan vermek suretiyle tanıtım faaliyetlerinde bulunma hakkına sahiptir.

3) İşbu sözleşme ile verilen özel yetki ile müşteri gayrimenkul ile ilgili olarak kendisine gelen tüm başvuruları ${ctx.brokerName} emlak komisyonculuğuna bildirmeyi ve doğrudan işlemde bulunması halinde ${v(f.directDealPenalty)} bedeli emlak komisyoncusuna peşin ödemeyi taahhüt eder.

4) Sözleşme yukarıda yazılı bitim tarihinden 15 gün önce taraflardan herhangi birinin yazılı fesih bildirimi karşı tarafa ulaşmadıkça aynı şart ve koşullarda aynı süre ile kendini yeniler.

5) Mal sahibi işlemden vazgeçmesi halinde ${v(f.withdrawalPenaltyAmount)} TL komisyon alacağının doğacağını kabul ve peşin ödemeyi taahhüt eder.

6) Komisyoncu tarafından alıcı/kiracı bulunmasına rağmen müşteri satmayı/kiralamayı reddeder veya aktin tamamlanmasına mani olursa satış bedeli üzerinden ${v(f.directDealPenalty)} emlak komisyoncusuna peşin ödemeyi kabul ve taahhüt eder.

7) İşbu ${v(f.authorityCopies)} nüshadan oluşan sözleşmenin uygulanmasından doğacak uyuşmazlıklarda ${effectiveCourt(f, ctx)} Mahkeme ve İcra Daireleri yetkilidir.

ÖZEL ŞARTLAR
────────────────────────────────────────
${v(f.specialTerms)}
`.trim()
}

function buildAlimSatim(f: ContractFormState, ctx: ContractRenderContext): string {
  return `
══════════════════════════════════════════════════════════════
${contractTitle('alim-satim')}
══════════════════════════════════════════════════════════════

CİNSİ              : ${v(f.propertyInfo)}
ADRESİ             : ${v(f.propertyAddress)}
TAPU BİLGİLERİ     : ADA: ${v(f.adaNo)}   PAFTA: ${v(f.paftaNo)}   PARSEL: ${v(f.parselNo)}

SATICININ VEYA VEKİLİNİN
ADI-SOYADI / T.C NO : ${v(f.ownerName)} / ${v(f.ownerTc)}
İŞ ADRESİ           : ${v(f.ownerWorkAddress)}
EV ADRESİ           : ${v(f.ownerHomeAddress)}
TELEFON NO          : ${v(f.ownerPhone)}

ALICININ VEYA VEKİLİNİN
ADI-SOYADI / T.C.NO : ${v(f.customerName)} / ${v(f.customerTc)}
İŞ ADRESİ           : ${v(f.customerWorkAddress)}
EV ADRESİ           : ${v(f.customerHomeAddress)}
TELEFON NO          : ${v(f.customerPhone)}

İŞLETME YETKİ BELGESİ NO / ODA SİCİL NO: ${effectiveLicense(f, ctx)}
EMLAK KOMİSYONCUSU: ${ctx.brokerName}
Adres: ${ctx.brokerAddress}

MADDELER
────────────────────────────────────────
1) Yukarıda adres ve tapu kayıtları bulunan gayrimenkulü ${v(f.salePrice)} bedelle satıcı satmayı, alıcı almayı ve gayrimenkulü alım satımda emlak komisyoncusunun aracılık hizmetini tamamladığını kabul etmişlerdir.

2) Alıcıdan bu satışa mahsuben ${v(f.buyerAdvanceToSeller)} kapora olarak alınmıştır. Geriye kalan bedel aşağıdaki özel şartlarda açıklandığı şekilde ödenecektir.

3) A) İşbu akdin imzasından sonra alıcı gayrimenkulü almaktan vazgeçerse anlaşma anında satışa mahsuben verdiği bedeli geri almayacaktır.
   B) Satıcı vazgeçerse, satışa mahsuben aldığı bedelin iki katını alıcıya vermeyi kabul ve taahhüt eder.

4) İşbu sözleşmeye aracılık eden emlak komisyoncusuna satış bedelinin %${v(f.commissionSellerPct)} oranında satıcıdan ve yine aynı meblağ üzerinden %${v(f.commissionBuyerPct)} oranında aracılık ücretinin, akdin imzasından itibaren ve en geç tapuda ferağ anında komisyon ücreti olarak peşin ödemeyi alıcı ve satıcı kabul ve taahhüt etmiştir.

5) İşbu akdin imzasından sonra gayrimenkulu satıcı satmaktan vazgeçerse veya alıcı almaktan vazgeçerse cayan taraf hem kendi ödeyeceği ve hem de diğer tarafın ödeyeceği komisyon ücretinin tamamını emlak komisyoncusuna cayma anında peşin ödemeyi kabul ve taahhüt eder.

6) Taraflar işbu sözleşmede yer alan bilgilerin kendileri tarafından beyan edildiğini ve doğruluğunu kabul etmekte olup, belirtilen iletişim bilgilerinin tebligata esas alınmasını kabul eder.

7) İşbu akit satıcı, alıcı ve emlak komisyoncusu arasında yukarıda belirtilen ve aşağıdaki özel şartlarla birlikte geçerlidir. Doğabilecek uyuşmazlıklarda ${effectiveCourt(f, ctx)} Mahkemeleri ve İcra Daireleri yetkilidir.

8) Özel Şartlar:
${v(f.specialTerms)}
`.trim()
}

function buildYerGosterme(f: ContractFormState, ctx: ContractRenderContext): string {
  const props = v(f.shownPropertiesList || f.propertyAddress)
  return `
══════════════════════════════════════════════════════════════
${contractTitle('yer-gosterme')}
══════════════════════════════════════════════════════════════

TARİH: ${v(f.contractDate)}

GÖRÜLEN TAŞINMAZLARIN NİTELİĞİ / ADRESİ / FİYAT
────────────────────────────────────────
${props}

TAŞINMAZI GEZEN / GÖREN
ADI SOYADI / T.C. NO : ${v(f.customerName)} / ${v(f.customerTc)}
ADRES                : ${v(f.customerHomeAddress)}
TELEFON              : ${v(f.customerPhone)}

EMLAK KOMİSYONCUSU: ${ctx.brokerName}
Adres: ${ctx.brokerAddress}
Tel: ${ctx.brokerPhone}
YETKİ BELGESİ NO / FİRMA ODA SİCİL NO: ${effectiveLicense(f, ctx)}

MADDELER
────────────────────────────────────────
1) Yukarıda adres ve fiyatları belirtilen taşınmazlar, emlak komisyoncusu tarafından alıcı-kiracı tarafa gezdirilip gösterilmiştir.

2) Sözleşmeye konu kendisine yer gösterilen taraf, bu taşınmazlardan birini emlak komisyoncusu olmaksızın mülk sahibi ile irtibata geçmeyeceğini ve işbu sözleşmenin tanzim tarihinden itibaren 6 ay içinde kendi adına satın alır veya taşınmaz bu kişinin eşi, usul veya füruu, kayınpederi, kayınvalidesi, hala, dayı, teyze gibi kan veya sıhri hısımları ya da iş ortağınca satın alındığı/kiralandığı yahut ayni veya şahsi hakla takyid ettirdiği takdirde durumu derhal bildirmek ve emlak komisyoncusuna satış bedelinin %${v(f.commissionPctSale)} oranında komisyonu / bir aylık kira bedeli olarak ${v(f.commissionRentEquivalent)}, tapudaki ferağ veya kira tarihinden itibaren nakden ödemekle yükümlüdür.

3) Komisyonun ferağ tarihinde ödenmemesi halinde akdin karşı tarafı, tapudaki ferağ tarihinden / kira tarihinden itibaren aylık akdi %10 faizi ödemekle yükümlüdür.

4) Taşınmazın birden fazla kişi tarafından satın alınması veya kiralanması halinde bu kişiler ödemekle yükümlü oldukları komisyon bedelinden müştereken ve müteselsilen sorumludur.

5) Yer gösterilen karşı taraf sözleşmeye esas kişisel bilgileri kendisinin beyan ettiğini ve doğruluğu kabul ve taahhüt eder.

6) İşbu ${v(f.yerGostermeCopies)} nüshadan oluşan sözleşmeden doğabilecek her türlü ihtilafta ${effectiveCourt(f, ctx)} Mahkeme ve İcra Daireleri yetkilidir.

ÖZEL ŞARTLAR
────────────────────────────────────────
${v(f.specialTerms)}
`.trim()
}
