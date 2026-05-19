import { SITE_CONFIG } from '@/lib/config'
import type { ContractFormState, ContractType } from './types'

const LINE = '................................................................'

export function value(v: string, fallback: string = LINE) {
  const t = v?.trim()
  return t && t.length > 0 ? t : fallback
}

const BORCLAR_KANUNU_UYARI =
  '"Türk Borçlar Kanunu çerçevesinde matbu olarak basılan bu sözleşmede taraflarca belirlenen özel hükümler, imza sahipleri yönünden bağlayıcı ve geçerlidir."'

export function buildContractText(form: ContractFormState): string {
  const broker = SITE_CONFIG.name
  const brokerAddr = SITE_CONFIG.address.full

  switch (form.contractType) {
    case 'kira':
      return buildKira(form)
    case 'yetki':
      return buildYetki(form, broker, brokerAddr)
    case 'alim-satim':
      return buildAlimSatim(form, broker, brokerAddr)
    case 'yer-gosterme':
      return buildYerGosterme(form, broker, brokerAddr)
  }
}

export function contractTitle(type: ContractType): string {
  switch (type) {
    case 'kira':
      return 'KİRA SÖZLEŞMESİ'
    case 'yetki':
      return 'EMLAK KOMİSYONCUSU İLE MAL SAHİBİ ARASINDA YAPILAN YETKİ SÖZLEŞMESİ'
    case 'alim-satim':
      return 'GAYRİMENKUL SATIŞ SÖZLEŞMESİ'
    case 'yer-gosterme':
      return 'GAYRİMENKUL YER GÖSTERME TUTANAĞI VE KOMİSYON SÖZLEŞMESİ'
    default:
      return 'SÖZLEŞME'
  }
}

function buildKira(f: ContractFormState): string {
  const mah = value(f.mahalle || f.propertyAddress.split(',')[0])
  const sok = value(f.sokakVeNo)
  const daire = value(f.daireBlok)
  const cins = value(f.kiralananCinsi || f.propertyInfo)

  return `
${BORCLAR_KANUNU_UYARI}

══════════════════════════════════════════════════════════════
                         KİRA SÖZLEŞMESİ
══════════════════════════════════════════════════════════════

Gelir Vergisi Kanununa göre: Tüccar, Serbest Meslek Erbabı ve Çiftçiler, ticari, mesleki ve zirai işleri ile ilgili olarak yaptıkları kira ödemelerinden Kanunca belirtilen oranlarda stopaj tevkifatı yaparak vergi dairesine yatıracaklardır.

ÜST BİLGİLER
────────────────────────────────────────
Mahallesi                  : ${mah}
Sokağı ve Numarası       : ${sok}
Dairesi                    : ${daire}
Kiralanan Şeyin Cinsi      : ${cins}

Kiraya Verenin Adı Soyadı/Ünvanı           : ${value(f.ownerName)}
Kiraya Verenin T.C Kimlik No.su / Vergi No : ${value(f.ownerTc)}
Kiraya Verenin İkametgah Adresi           : ${value(f.ownerHomeAddress || f.propertyAddress)}

Kiracının Adı Soyadı/Ünvanı               : ${value(f.customerName)}
Kiracının T.C Kimlik No.su / Vergi No      : ${value(f.customerTc)}
Kiracının İkametgah Adresi                : ${value(f.customerHomeAddress)}
Kiracının İşyeri Adresi                   : ${value(f.customerWorkAddress)}
Telefon (Kiracı)                           : ${value(f.customerPhone)}

Kiralanan Şey İle Beraber Teslim Olunan Demirbaş Eşyanın Beyanı
${value(f.demirbasBeyani)}

Kiralanan Şeyin Şimdiki Durumu
${value(f.kiralananDurumu)}

Kiralanan Şeyin Ne İçin Kullanılacağı
${value(f.kullanimAmaci)}

Kira Müddeti                             : ${value(f.kiraYili)} yıl
Kiranın Başlangıç Tarihi                 : ${value(f.leaseStartDate || f.contractDate)}
Kiranın Bitiş Tarihi (varsa)             : ${value(f.leaseEndDate)}
Kiranın Ne Şekilde Ödeneceği            : ${value(f.paymentMethod)}
Bir Aylık Kira Karşılığı                 : ${value(f.monthlyRent)}
Bir Yıllık Kira Karşılığı               : ${value(f.yearlyRent)}
Kira ödemesi (HUSUSİ ŞART)              : Kiracı kira bedelini en geç ait olduğu ayın ilk ${value(f.paymentDayOfMonth)} gününde ve her ay peşin olarak ödemeyi taahhüt eder.

Kiracı peşinat olarak ${value(f.advanceLandlord)} mal sahibine vermiştir.
Kiracı depozit olarak ${value(f.depositAmount)} mal sahibine vermiştir.
Kiracı kontrat bitiminde kira bedelini …………………………… göre %${value(f.rentIncreasePercent)} oranında artırmayı şimdiden kabul ve taahhüt eder.

HUSUSİ ŞARTLAR
────────────────────────────────────────
${value(f.specialTerms)}

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
9) Aynı dönem içerisinde kira bedelinin iki ay arka arkaya ödenmemesi halinde, ödenmeyen aydan itibaren kontrat süresi sonuna kadar olan kira bedelleri muacceliyet kazanır; elektrik, su, doğalgaz, telefon borçları mal sahibi tarafından depoziteden mahsup edilir.
10) Kiracı mal sahibine vermiş olduğu peşinat ve depozitten faiz veya fazlalık talep edemez; depoziti tamirata mahsup edemez.
11) Kiracı tahliye ederken vermiş olduğu zarar ve ziyana ait meblağ ile birlikte … hususları saklıdır.
12) Kiracı kiralananı boşaltmak istediği takdirde en az bir ay evvelinden mal sahibine ulaşacak şekilde bildirmeyi taahhüt eder.
13) İşbu kontrat ${value(f.contractArticleCount)} maddeden ibaret olup ${value(f.contractCopyCount)} nüsha düzenlenip muhataplara verilmiştir.
14) İhtilaf halinde ${value(f.competentCourt)} Mahkemeleri ve İcra Daireleri yetkilidir.
15) Taraflarca yazılı adresler kanuni ikametgah olarak kabul edilir; adres değişikliği yazılı bildirilmezse kontrattaki adrese tebligat muteber sayılır.
16) Kefilin kefaleti müşterek ve müteselsil olup kefilin bilgisi: ${value(f.kefilName)}.

İmza sahipleri yukarıdaki hususları okuyup kabul etmişlerdir.

KİRAYA VEREN                              KEFİL                        KİRACI
İsim: ${value(f.ownerName)}               ${value(f.kefilName)}        ${value(f.customerName)}
`.trim()
}

function buildYetki(f: ContractFormState, broker: string, brokerAddr: string): string {
  const ilLine = value(f.propertyAddress)

  return `
${BORCLAR_KANUNU_UYARI}

══════════════════════════════════════════════════════════════
${contractTitle('yetki')}
══════════════════════════════════════════════════════════════

SÖZLEŞME SÜRESİ BAŞLANGIÇ : ${value(f.authorityStartDate || f.contractDate)}
SÖZLEŞME SÜRESİ BİTİŞ    : ${value(f.authorityEndDate)}
Sözleşme süresi (açıklama): ${value(f.authorityYears)}
(Mal sahibi ile komisyoncu arasında ${value(f.authorityCopies)} nüsha)

MAL SAHİBİNİN ÜNVANI/ADI SOYADI : ${value(f.ownerName)}
T.C.NO                           : ${value(f.ownerTc)}
İŞ ADRESİ                        : ${value(f.ownerWorkAddress)}
İKAMETGAHI                       : ${value(f.ownerHomeAddress)}
TELEFON/FAX                      : ${value(f.ownerPhone)}

TAŞINMAZIN TÜRÜ                  : ${value(f.propertyInfo)}
İL / İLÇE / MAHALLE / SOKAK / NO : ${ilLine}
ADA NO: ${value(f.adaNo)}   PAFTA: ${value(f.paftaNo)}   PARSEL: ${value(f.parselNo)}
TAŞINMAZA BİÇİLEN AZAMİ DEĞER    : ${value(f.maxAskPrice)}
TAŞINMAZA BİÇİLEN ASGARİ DEĞER    : ${value(f.minAskPrice)}

EMLAK KOMİSYONCUSU: ${broker}
Adres: ${brokerAddr}
Tel: ${SITE_CONFIG.phoneDisplay}
E-posta: ${SITE_CONFIG.email}
İşletme Yetki Belgesi / Oda Sicil No: ${value(f.brokerageLicenseNo)}

MADDELER
────────────────────────────────────────
1) Mal sahibi ile emlak komisyoncusu yukarıda belirtilen gayrimenkulün ${value(f.purposeSaleRent)} işleminde aracılık edilmesi için anlaşmışlardır.

2) Emlak komisyoncusu gayrimenkul ile ilgili olarak satış/kira işlemi amacıyla masrafı kendine ait olmak üzere basın ve sair medyaya ilan vermek suretiyle tanıtım faaliyetlerinde bulunma hakkına sahiptir. Müşteri bununla ilgili herhangi bir ödeme yapmayacaktır. Müşteri ${broker} emlak komisyonculuğuna işbu sözleşmeden doğan hak ve yükümlülüklerini yerine getirebilmesi için gayrimenkule daima giriş imkanı tanımayı kabul ve taahhüt eder.

3) İşbu sözleşme ile verilen özel yetki ile müşteri gayrimenkul ile ilgili olarak kendisine gelen tüm başvuruları ${broker} emlak komisyonculuğuna bildirmeyi ve böyle kişi ve kuruluşlarla kendisinin doğrudan işlemde bulunması halinde ${value(f.directDealPenalty)} bedeli emlak komisyoncusuna derhal ve peşin ödemeyi taahhüt eder.

4) Sözleşme yukarıda yazılı bitim tarihinden 15 gün önce taraflardan herhangi birinin yazılı fesih bildirimi karşı tarafa ulaşmadıkça aynı şart ve koşullarda aynı süre ile kendini yeniler.

5) Mal sahibi, işlemin gerçekleştirilmesi için emlak komisyoncusu tarafından şekli işlemlere (sözleşme akti, mülk sahibi ile tanıştırma, IBAN paylaşımı, yer gösterme, ilan vb.) başlandıktan sonra işlemden vazgeçmesi halinde ${value(f.withdrawalPenaltyAmount)} TL komisyon alacağının doğacağını kabul ve peşin ödemeyi taahhüt eder.

6) Komisyoncu tarafından alıcı/kiracı bulunmasına rağmen müşteri satmayı/kiralamayı reddeder veya aktin tamamlanmasına mani olursa veya 3. kişilere satar/kiralarsa satış bedeli/bir yıllık kira bedeli üzerinden ${value(f.directDealPenalty)} emlak komisyoncusuna peşin ödemeyi kabul ve taahhüt eder. Temerrüt halinde komisyon üzerinden aylık %10 temerrüt faizi mal sahibi tarafından ödenir.

7) İşbu ${value(f.authorityCopies)} nüshadan oluşan sözleşmenin uygulanmasından doğacak uyuşmazlıklarda ${value(f.competentCourt)} Mahkeme ve İcra Daireleri yetkilidir.

ÖZEL ŞARTLAR
────────────────────────────────────────
${value(f.specialTerms)}

EMLAK KOMİSYONCUSU / TEMSİLEN          MAL SAHİBİ VEYA YETKİLİ İMZA
${broker}
Yetki Belgesi No: ${value(f.brokerageLicenseNo)}
`.trim()
}

function buildAlimSatim(f: ContractFormState, broker: string, brokerAddr: string): string {
  return `
══════════════════════════════════════════════════════════════
${contractTitle('alim-satim')}
══════════════════════════════════════════════════════════════

CİNSİ              : ${value(f.propertyInfo)}
ADRESİ             : ${value(f.propertyAddress)}
TAPU BİLGİLERİ     : ADA: ${value(f.adaNo)}   PAFTA: ${value(f.paftaNo)}   PARSEL: ${value(f.parselNo)}

SATICININ VEYA VEKİLİNİN
ADI-SOYADI / T.C NO : ${value(f.ownerName)} / ${value(f.ownerTc)}
İŞ ADRESİ           : ${value(f.ownerWorkAddress)}
EV ADRESİ           : ${value(f.ownerHomeAddress)}
TELEFON NO          : ${value(f.ownerPhone)}

ALICININ VEYA VEKİLİNİN
ADI-SOYADI / T.C.NO : ${value(f.customerName)} / ${value(f.customerTc)}
İŞ ADRESİ           : ${value(f.customerWorkAddress)}
EV ADRESİ           : ${value(f.customerHomeAddress)}
TELEFON NO          : ${value(f.customerPhone)}

İŞLETME YETKİ BELGESİ NO / ODA SİCİL NO: ${value(f.brokerageLicenseNo)}
EMLAK KOMİSYONCUSU: ${broker}
Adres: ${brokerAddr}

MADDELER
────────────────────────────────────────
1) Yukarıda adres ve tapu kayıtları bulunan gayrimenkulü ${value(f.salePrice)} bedelle satıcı satmayı, alıcı almayı ve gayrimenkulü alım satımda emlak komisyoncusunun aracılık hizmetini tamamladığını kabul etmişlerdir.

2) Alıcıdan bu satışa mahsuben ${value(f.buyerAdvanceToSeller)} kapora olarak alınmıştır. Geriye kalan bedel aşağıdaki özel şartlarda açıklandığı şekilde ödenecektir.

3) A) İşbu akdin imzasından sonra alıcı gayrimenkulü almaktan vazgeçerse anlaşma anında satışa mahsuben verdiği bedeli geri almayacaktır.
   B) Satıcı vazgeçerse, satışa mahsuben aldığı bedelin iki katını alıcıya vermeyi kabul ve taahhüt eder.

4) İşbu sözleşmeye aracılık eden emlak komisyoncusuna satış bedelinin %${value(f.commissionSellerPct)} oranında satıcıdan ve yine aynı meblağ üzerinden %${value(f.commissionBuyerPct)} oranında aracılık ücretinin, akdin imzasından itibaren ve en geç tapuda ferağ anında komisyon ücreti olarak peşin ödemeyi alıcı ve satıcı kabul ve taahhüt etmiştir.

5) İşbu akdin imzasından sonra gayrimenkulu satıcı satmaktan vazgeçerse veya alıcı almaktan vazgeçerse cayan taraf hem kendi ödeyeceği ve hem de diğer tarafın ödeyeceği komisyon ücretinin tamamını emlak komisyoncusuna cayma anında peşin ödemeyi kabul ve taahhüt eder.

6) Taraflar işbu sözleşmede yer alan bilgilerin kendileri tarafından beyan edildiğini ve doğruluğunu kabul etmekte olup, belirtilen iletişim bilgilerinin tebligata esas alınmasını kabul eder.

7) İşbu akit satıcı, alıcı ve emlak komisyoncusu arasında yukarıda belirtilen ve aşağıdaki özel şartlarla birlikte geçerlidir. Doğabilecek uyuşmazlıklarda ${value(f.competentCourt)} Mahkemeleri ve İcra Daireleri yetkilidir.

8) Özel Şartlar:
${value(f.specialTerms)}

ALICI                                SATICI                         EMLAK KOMİSYONCUSU / TEMSİLEN
`.trim()
}

function buildYerGosterme(f: ContractFormState, broker: string, brokerAddr: string): string {
  const props = value(f.shownPropertiesList || f.propertyAddress)

  return `
${BORCLAR_KANUNU_UYARI}

══════════════════════════════════════════════════════════════
${contractTitle('yer-gosterme')}
══════════════════════════════════════════════════════════════

TARİH: ${value(f.contractDate)}

GÖRÜLEN TAŞINMAZLARIN NİTELİĞİ / ADRESİ / FİYAT
────────────────────────────────────────
${props}

TAŞINMAZI GEZEN / GÖREN
ADI SOYADI / T.C. NO : ${value(f.customerName)} / ${value(f.customerTc)}
ADRES               : ${value(f.customerHomeAddress)}
TELEFON             : ${value(f.customerPhone)}

EMLAK KOMİSYONCUSU: ${broker}
Adres: ${brokerAddr}
Tel: ${SITE_CONFIG.phoneDisplay}
YETKİ BELGESİ NO / FİRMA ODA SİCİL NO: ${value(f.brokerageLicenseNo)}

MADDELER
────────────────────────────────────────
1) Yukarıda adres ve fiyatları belirtilen taşınmazlar, emlak komisyoncusu tarafından alıcı-kiracı tarafa gezdirilip gösterilmiştir.

2) Sözleşmeye konu kendisine yer gösterilen taraf, bu taşınmazlardan birini emlak komisyoncusu olmaksızın mülk sahibi ile irtibata geçmeyeceğini ve işbu sözleşmenin tanzim tarihinden itibaren 6 ay içinde kendi adına satın alır veya taşınmaz bu kişinin eşi, usul veya füruu, kayınpederi, kayınvalidesi, hala, dayı, teyze gibi kan veya sıhri hısımları ve yahut iş ortağınca satın alındığı/kiralandığı yahut ayni veya şahsi hakla takyid ettirdiği takdirde durumu derhal bildirmek ve emlak komisyoncusuna satış bedelinin %${value(f.commissionPctSale)} oranında komisyonu / bir aylık kira bedeli olarak ${value(f.commissionRentEquivalent)}, tapudaki ferağ veya kira tarihinden itibaren nakden ödemekle yükümlüdür.

3) Komisyonun ferağ tarihinde ödenmemesi halinde akdin karşı tarafı, tapudaki ferağ tarihinden / kira tarihinden itibaren aylık akdi %10 faizi ödemekle yükümlüdür.

4) Taşınmazın birden fazla kişi tarafından satın alınması veya kiralanması halinde bu kişiler ödemekle yükümlü oldukları komisyon bedelinden müştereken ve müteselsilen sorumludur.

5) Yer gösterilen karşı taraf sözleşmeye esas kişisel bilgileri kendisinin beyan ettiğini ve doğruluğu kabul ve taahhüt eder.

6) İşbu ${value(f.yerGostermeCopies)} nüshadan oluşan sözleşmeden doğabilecek her türlü ihtilafta ${value(f.competentCourt)} Mahkeme ve İcra Daireleri yetkilidir.

ÖZEL ŞARTLAR
────────────────────────────────────────
${value(f.specialTerms)}

TAŞINMAZI GEZEN / GÖREN                    EMLAK KOMİSYONCUSU / TEMSİLEN
`.trim()
}
