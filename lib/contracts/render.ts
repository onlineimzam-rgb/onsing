import { SITE_CONFIG } from '@/lib/config'
import type { ContractFormState, ContractType } from './types'
import { contractTitle } from './templates'

const LINE_FALLBACK = '............................................................'

function v(input?: string | null, fallback: string = LINE_FALLBACK): string {
  const t = (input || '').toString().trim()
  return t.length ? t : fallback
}

const BORCLAR_KANUNU_UYARI =
  '"Türk Borçlar Kanunu çerçevesinde matbu olarak basılan bu sözleşmede taraflarca belirlenen özel hükümler, imza sahipleri yönünden bağlayıcı ve geçerlidir."'

export type SignerKey =
  | 'kiraya-veren'
  | 'kefil'
  | 'kiraci'
  | 'satici'
  | 'alici'
  | 'komisyoncu'
  | 'mal-sahibi'
  | 'yer-goren'

export interface ContractSignatureInfo {
  role: SignerKey
  dataUrl?: string | null
  signedName?: string | null
  signedAt?: string | Date | null
}

type Section =
  | { type: 'banner'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'kvRows'; heading?: string; rows: Array<[string, string]> }
  | { type: 'articles'; heading: string; items: string[] }
  | { type: 'freeText'; heading: string; text: string }
  | {
      type: 'signatures'
      columns: { key: SignerKey; label: string; line2?: string }[]
    }

export function defaultSignerRoleForType(type: ContractType): SignerKey {
  switch (type) {
    case 'kira':
      return 'kiraci'
    case 'yetki':
      return 'mal-sahibi'
    case 'alim-satim':
      return 'alici'
    case 'yer-gosterme':
      return 'yer-goren'
    default:
      return 'kiraci'
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function nl2br(input: string): string {
  return escapeHtml(input).replace(/\n/g, '<br />')
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('tr-TR')
  } catch {
    return String(d)
  }
}

function kiraSections(f: ContractFormState): Section[] {
  const mah = v(f.mahalle || (f.propertyAddress.split(',')[0] ?? ''))
  return [
    { type: 'banner', text: BORCLAR_KANUNU_UYARI },
    {
      type: 'paragraph',
      text:
        'Gelir Vergisi Kanununa göre: Tüccar, Serbest Meslek Erbabı ve Çiftçiler, ticari, mesleki ve zirai işleri ile ilgili olarak yaptıkları kira ödemelerinden Kanunca belirtilen oranlarda stopaj tevkifatı yaparak vergi dairesine yatıracaklardır.',
    },
    {
      type: 'kvRows',
      heading: 'Taşınmaz Bilgileri',
      rows: [
        ['Mahallesi', mah],
        ['Sokağı ve Numarası', v(f.sokakVeNo)],
        ['Dairesi', v(f.daireBlok)],
        ['Kiralanan Şeyin Cinsi', v(f.kiralananCinsi || f.propertyInfo)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Kiraya Veren',
      rows: [
        ['Adı Soyadı / Ünvanı', v(f.ownerName)],
        ['T.C. Kimlik No / Vergi No', v(f.ownerTc)],
        ['İkametgah Adresi', v(f.ownerHomeAddress || f.propertyAddress)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Kiracı',
      rows: [
        ['Adı Soyadı / Ünvanı', v(f.customerName)],
        ['T.C. Kimlik No / Vergi No', v(f.customerTc)],
        ['İkametgah Adresi', v(f.customerHomeAddress)],
        ['İşyeri Adresi', v(f.customerWorkAddress)],
        ['Telefon', v(f.customerPhone)],
      ],
    },
    {
      type: 'freeText',
      heading: 'Kiralanan Şey İle Beraber Teslim Olunan Demirbaş Eşyanın Beyanı',
      text: v(f.demirbasBeyani, '—'),
    },
    {
      type: 'freeText',
      heading: 'Kiralanan Şeyin Şimdiki Durumu',
      text: v(f.kiralananDurumu, '—'),
    },
    {
      type: 'freeText',
      heading: 'Kiralanan Şeyin Ne İçin Kullanılacağı',
      text: v(f.kullanimAmaci, '—'),
    },
    {
      type: 'kvRows',
      heading: 'Kira Koşulları',
      rows: [
        ['Kira Müddeti', `${v(f.kiraYili)} yıl`],
        ['Kiranın Başlangıç Tarihi', v(f.leaseStartDate || f.contractDate)],
        ['Kiranın Bitiş Tarihi (varsa)', v(f.leaseEndDate)],
        ['Ödeme Şekli', v(f.paymentMethod)],
        ['Aylık Kira Karşılığı', v(f.monthlyRent)],
        ['Yıllık Kira Karşılığı', v(f.yearlyRent)],
        ['Mal Sahibine Verilen Peşinat', v(f.advanceLandlord)],
        ['Mal Sahibine Verilen Depozit', v(f.depositAmount)],
        ['Artış Oranı', `%${v(f.rentIncreasePercent)}`],
      ],
    },
    {
      type: 'paragraph',
      text: `Kira ödemesi (HUSUSİ ŞART): Kiracı kira bedelini en geç ait olduğu ayın ilk ${v(
        f.paymentDayOfMonth
      )} gününde ve her ay peşin olarak ödemeyi taahhüt eder.`,
    },
    {
      type: 'articles',
      heading: 'Standart Hükümler (Matbu Özeti)',
      items: [
        'Kiracı kat mülkiyeti kanununa uymayı aynen kabul ve taahhüt eder.',
        'Kiracı kiralananı kısmen veya tamamen başkasına devir ve ciro edemez.',
        'Kiracı kiralanan gayrimenkulde mal sahibinin haberi ve izni olmadan tadilat yapamaz.',
        'Elektrik, Su, Doğalgaz, Kalorifer, Apartmana ait giderler ile Çevre Temizlik Vergisi kiracıya aittir.',
        'Kiracı apartman yönetiminin alacağı kararlara aynen uyacaktır.',
        'Kontrat tarihine kadar olan tüm gider ve borçlar kiracıya aittir.',
        'Kontrat tarihinden sonra tahakkuk eden tüm gider ve borçlar kiracıya aittir.',
        'Kiralanan gayrimenkule tahakkuk edecek stopaj vergisi kiracıya aittir.',
        'Aynı dönem içerisinde kira bedelinin iki ay arka arkaya ödenmemesi halinde, ödenmeyen aydan itibaren kontrat süresi sonuna kadar olan kira bedelleri muacceliyet kazanır; elektrik, su, doğalgaz, telefon borçları mal sahibi tarafından depoziteden mahsup edilir.',
        'Kiracı mal sahibine vermiş olduğu peşinat ve depozitten faiz veya fazlalık talep edemez; depoziti tamirata mahsup edemez.',
        'Kiracı tahliye ederken vermiş olduğu zarar ve ziyana ait meblağ ile birlikte ilgili hususlar saklıdır.',
        'Kiracı kiralananı boşaltmak istediği takdirde en az bir ay evvelinden mal sahibine ulaşacak şekilde bildirmeyi taahhüt eder.',
        `İşbu kontrat ${v(f.contractArticleCount)} maddeden ibaret olup ${v(
          f.contractCopyCount
        )} nüsha düzenlenip muhataplara verilmiştir.`,
        `İhtilaf halinde ${v(f.competentCourt)} Mahkemeleri ve İcra Daireleri yetkilidir.`,
        'Taraflarca yazılı adresler kanuni ikametgah olarak kabul edilir; adres değişikliği yazılı bildirilmezse kontrattaki adrese tebligat muteber sayılır.',
        `Kefilin kefaleti müşterek ve müteselsil olup kefilin bilgisi: ${v(f.kefilName)}.`,
      ],
    },
    { type: 'freeText', heading: 'HUSUSİ ŞARTLAR', text: v(f.specialTerms, '—') },
    {
      type: 'signatures',
      columns: [
        { key: 'kiraya-veren', label: 'KİRAYA VEREN', line2: v(f.ownerName, '') },
        { key: 'kefil', label: 'KEFİL', line2: v(f.kefilName, '') },
        { key: 'kiraci', label: 'KİRACI', line2: v(f.customerName, '') },
      ],
    },
  ]
}

function yetkiSections(f: ContractFormState): Section[] {
  const broker = SITE_CONFIG.name
  const brokerAddr = SITE_CONFIG.address.full
  return [
    { type: 'banner', text: BORCLAR_KANUNU_UYARI },
    {
      type: 'kvRows',
      heading: 'Sözleşme Süresi',
      rows: [
        ['Sözleşme Süresi Başlangıç', v(f.authorityStartDate || f.contractDate)],
        ['Sözleşme Süresi Bitiş', v(f.authorityEndDate)],
        ['Süre Açıklaması', v(f.authorityYears)],
        ['Nüsha', `${v(f.authorityCopies)} nüsha (mal sahibi ile komisyoncu arasında)`],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Mal Sahibi',
      rows: [
        ['Ünvanı / Adı Soyadı', v(f.ownerName)],
        ['T.C. Kimlik No', v(f.ownerTc)],
        ['İş Adresi', v(f.ownerWorkAddress)],
        ['İkametgahı', v(f.ownerHomeAddress)],
        ['Telefon / Fax', v(f.ownerPhone)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Taşınmaz Bilgileri',
      rows: [
        ['Türü', v(f.propertyInfo)],
        ['Adresi (İl / İlçe / Mahalle / Sokak / No)', v(f.propertyAddress)],
        ['Ada / Pafta / Parsel', `${v(f.adaNo)} / ${v(f.paftaNo)} / ${v(f.parselNo)}`],
        ['Azami Değer (Talep)', v(f.maxAskPrice)],
        ['Asgari Değer (Talep)', v(f.minAskPrice)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Emlak Komisyoncusu',
      rows: [
        ['Ünvan', broker],
        ['Adres', brokerAddr],
        ['Telefon', SITE_CONFIG.phoneDisplay],
        ['E-posta', SITE_CONFIG.email],
        ['Yetki Belgesi / Oda Sicil No', v(f.brokerageLicenseNo)],
      ],
    },
    {
      type: 'articles',
      heading: 'Maddeler',
      items: [
        `Mal sahibi ile emlak komisyoncusu yukarıda belirtilen gayrimenkulün ${v(
          f.purposeSaleRent
        )} işleminde aracılık edilmesi için anlaşmışlardır.`,
        `Emlak komisyoncusu gayrimenkul ile ilgili olarak satış/kira işlemi amacıyla masrafı kendine ait olmak üzere basın ve sair medyaya ilan vermek suretiyle tanıtım faaliyetlerinde bulunma hakkına sahiptir. Müşteri bununla ilgili herhangi bir ödeme yapmayacaktır. Müşteri ${broker} emlak komisyonculuğuna işbu sözleşmeden doğan hak ve yükümlülüklerini yerine getirebilmesi için gayrimenkule daima giriş imkanı tanımayı kabul ve taahhüt eder.`,
        `İşbu sözleşme ile verilen özel yetki ile müşteri gayrimenkul ile ilgili olarak kendisine gelen tüm başvuruları ${broker} emlak komisyonculuğuna bildirmeyi ve böyle kişi ve kuruluşlarla kendisinin doğrudan işlemde bulunması halinde ${v(
          f.directDealPenalty
        )} bedeli emlak komisyoncusuna derhal ve peşin ödemeyi taahhüt eder.`,
        'Sözleşme yukarıda yazılı bitim tarihinden 15 gün önce taraflardan herhangi birinin yazılı fesih bildirimi karşı tarafa ulaşmadıkça aynı şart ve koşullarda aynı süre ile kendini yeniler.',
        `Mal sahibi, işlemin gerçekleştirilmesi için emlak komisyoncusu tarafından şekli işlemlere (sözleşme akti, mülk sahibi ile tanıştırma, IBAN paylaşımı, yer gösterme, ilan vb.) başlandıktan sonra işlemden vazgeçmesi halinde ${v(
          f.withdrawalPenaltyAmount
        )} TL komisyon alacağının doğacağını kabul ve peşin ödemeyi taahhüt eder.`,
        `Komisyoncu tarafından alıcı/kiracı bulunmasına rağmen müşteri satmayı/kiralamayı reddeder veya aktin tamamlanmasına mani olursa veya 3. kişilere satar/kiralarsa satış bedeli / bir yıllık kira bedeli üzerinden ${v(
          f.directDealPenalty
        )} emlak komisyoncusuna peşin ödemeyi kabul ve taahhüt eder. Temerrüt halinde komisyon üzerinden aylık %10 temerrüt faizi mal sahibi tarafından ödenir.`,
        `İşbu ${v(f.authorityCopies)} nüshadan oluşan sözleşmenin uygulanmasından doğacak uyuşmazlıklarda ${v(
          f.competentCourt
        )} Mahkeme ve İcra Daireleri yetkilidir.`,
      ],
    },
    { type: 'freeText', heading: 'ÖZEL ŞARTLAR', text: v(f.specialTerms, '—') },
    {
      type: 'signatures',
      columns: [
        { key: 'komisyoncu', label: 'EMLAK KOMİSYONCUSU / TEMSİLEN', line2: broker },
        { key: 'mal-sahibi', label: 'MAL SAHİBİ', line2: v(f.ownerName, '') },
      ],
    },
  ]
}

function alimSatimSections(f: ContractFormState): Section[] {
  const broker = SITE_CONFIG.name
  const brokerAddr = SITE_CONFIG.address.full
  return [
    {
      type: 'kvRows',
      heading: 'Gayrimenkul Bilgileri',
      rows: [
        ['Cinsi', v(f.propertyInfo)],
        ['Adresi', v(f.propertyAddress)],
        ['Ada / Pafta / Parsel', `${v(f.adaNo)} / ${v(f.paftaNo)} / ${v(f.parselNo)}`],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Satıcı / Vekili',
      rows: [
        ['Adı Soyadı / T.C. No', `${v(f.ownerName)} / ${v(f.ownerTc)}`],
        ['İş Adresi', v(f.ownerWorkAddress)],
        ['Ev Adresi', v(f.ownerHomeAddress)],
        ['Telefon', v(f.ownerPhone)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Alıcı / Vekili',
      rows: [
        ['Adı Soyadı / T.C. No', `${v(f.customerName)} / ${v(f.customerTc)}`],
        ['İş Adresi', v(f.customerWorkAddress)],
        ['Ev Adresi', v(f.customerHomeAddress)],
        ['Telefon', v(f.customerPhone)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Emlak Komisyoncusu',
      rows: [
        ['Ünvan', broker],
        ['Adres', brokerAddr],
        ['Yetki Belgesi / Oda Sicil No', v(f.brokerageLicenseNo)],
      ],
    },
    {
      type: 'articles',
      heading: 'Maddeler',
      items: [
        `Yukarıda adres ve tapu kayıtları bulunan gayrimenkulü ${v(
          f.salePrice
        )} bedelle satıcı satmayı, alıcı almayı ve gayrimenkulü alım satımda emlak komisyoncusunun aracılık hizmetini tamamladığını kabul etmişlerdir.`,
        `Alıcıdan bu satışa mahsuben ${v(
          f.buyerAdvanceToSeller
        )} kapora olarak alınmıştır. Geriye kalan bedel aşağıdaki özel şartlarda açıklandığı şekilde ödenecektir.`,
        'A) İşbu akdin imzasından sonra alıcı gayrimenkulü almaktan vazgeçerse anlaşma anında satışa mahsuben verdiği bedeli geri almayacaktır.\nB) Satıcı vazgeçerse, satışa mahsuben aldığı bedelin iki katını alıcıya vermeyi kabul ve taahhüt eder.',
        `İşbu sözleşmeye aracılık eden emlak komisyoncusuna satış bedelinin %${v(
          f.commissionSellerPct
        )} oranında satıcıdan ve yine aynı meblağ üzerinden %${v(
          f.commissionBuyerPct
        )} oranında aracılık ücretinin, akdin imzasından itibaren ve en geç tapuda ferağ anında komisyon ücreti olarak peşin ödemeyi alıcı ve satıcı kabul ve taahhüt etmiştir.`,
        'İşbu akdin imzasından sonra gayrimenkulu satıcı satmaktan vazgeçerse veya alıcı almaktan vazgeçerse cayan taraf hem kendi ödeyeceği ve hem de diğer tarafın ödeyeceği komisyon ücretinin tamamını emlak komisyoncusuna cayma anında peşin ödemeyi kabul ve taahhüt eder.',
        'Taraflar işbu sözleşmede yer alan bilgilerin kendileri tarafından beyan edildiğini ve doğruluğunu kabul etmekte olup, belirtilen iletişim bilgilerinin tebligata esas alınmasını kabul eder.',
        `İşbu akit satıcı, alıcı ve emlak komisyoncusu arasında yukarıda belirtilen ve aşağıdaki özel şartlarla birlikte geçerlidir. Doğabilecek uyuşmazlıklarda ${v(
          f.competentCourt
        )} Mahkemeleri ve İcra Daireleri yetkilidir.`,
      ],
    },
    { type: 'freeText', heading: 'ÖZEL ŞARTLAR', text: v(f.specialTerms, '—') },
    {
      type: 'signatures',
      columns: [
        { key: 'alici', label: 'ALICI', line2: v(f.customerName, '') },
        { key: 'satici', label: 'SATICI', line2: v(f.ownerName, '') },
        { key: 'komisyoncu', label: 'EMLAK KOMİSYONCUSU', line2: broker },
      ],
    },
  ]
}

function yerGostermeSections(f: ContractFormState): Section[] {
  const broker = SITE_CONFIG.name
  const brokerAddr = SITE_CONFIG.address.full
  return [
    { type: 'banner', text: BORCLAR_KANUNU_UYARI },
    {
      type: 'kvRows',
      heading: 'Genel',
      rows: [['Tarih', v(f.contractDate)]],
    },
    {
      type: 'freeText',
      heading: 'Görülen Taşınmazların Niteliği / Adresi / Fiyatı',
      text: v(f.shownPropertiesList || f.propertyAddress, '—'),
    },
    {
      type: 'kvRows',
      heading: 'Taşınmazı Gezen / Gören',
      rows: [
        ['Adı Soyadı / T.C. No', `${v(f.customerName)} / ${v(f.customerTc)}`],
        ['Adres', v(f.customerHomeAddress)],
        ['Telefon', v(f.customerPhone)],
      ],
    },
    {
      type: 'kvRows',
      heading: 'Emlak Komisyoncusu',
      rows: [
        ['Ünvan', broker],
        ['Adres', brokerAddr],
        ['Telefon', SITE_CONFIG.phoneDisplay],
        ['Yetki Belgesi / Oda Sicil No', v(f.brokerageLicenseNo)],
      ],
    },
    {
      type: 'articles',
      heading: 'Maddeler',
      items: [
        'Yukarıda adres ve fiyatları belirtilen taşınmazlar, emlak komisyoncusu tarafından alıcı-kiracı tarafa gezdirilip gösterilmiştir.',
        `Sözleşmeye konu kendisine yer gösterilen taraf, bu taşınmazlardan birini emlak komisyoncusu olmaksızın mülk sahibi ile irtibata geçmeyeceğini ve işbu sözleşmenin tanzim tarihinden itibaren 6 ay içinde kendi adına satın alır veya taşınmaz bu kişinin eşi, usul veya füruu, kayınpederi, kayınvalidesi, hala, dayı, teyze gibi kan veya sıhri hısımları ve yahut iş ortağınca satın alındığı/kiralandığı yahut ayni veya şahsi hakla takyid ettirdiği takdirde durumu derhal bildirmek ve emlak komisyoncusuna satış bedelinin %${v(
          f.commissionPctSale
        )} oranında komisyonu / bir aylık kira bedeli olarak ${v(
          f.commissionRentEquivalent
        )}, tapudaki ferağ veya kira tarihinden itibaren nakden ödemekle yükümlüdür.`,
        'Komisyonun ferağ tarihinde ödenmemesi halinde akdin karşı tarafı, tapudaki ferağ tarihinden / kira tarihinden itibaren aylık akdi %10 faizi ödemekle yükümlüdür.',
        'Taşınmazın birden fazla kişi tarafından satın alınması veya kiralanması halinde bu kişiler ödemekle yükümlü oldukları komisyon bedelinden müştereken ve müteselsilen sorumludur.',
        'Yer gösterilen karşı taraf sözleşmeye esas kişisel bilgileri kendisinin beyan ettiğini ve doğruluğu kabul ve taahhüt eder.',
        `İşbu ${v(f.yerGostermeCopies)} nüshadan oluşan sözleşmeden doğabilecek her türlü ihtilafta ${v(
          f.competentCourt
        )} Mahkeme ve İcra Daireleri yetkilidir.`,
      ],
    },
    { type: 'freeText', heading: 'ÖZEL ŞARTLAR', text: v(f.specialTerms, '—') },
    {
      type: 'signatures',
      columns: [
        { key: 'yer-goren', label: 'TAŞINMAZI GEZEN / GÖREN', line2: v(f.customerName, '') },
        { key: 'komisyoncu', label: 'EMLAK KOMİSYONCUSU', line2: broker },
      ],
    },
  ]
}

function sectionsFor(form: ContractFormState): Section[] {
  switch (form.contractType) {
    case 'kira':
      return kiraSections(form)
    case 'yetki':
      return yetkiSections(form)
    case 'alim-satim':
      return alimSatimSections(form)
    case 'yer-gosterme':
      return yerGostermeSections(form)
    default:
      return []
  }
}

function renderSections(sections: Section[], signatures: ContractSignatureInfo[]): string {
  const parts: string[] = []
  for (const s of sections) {
    switch (s.type) {
      case 'banner':
        parts.push(`<div class="cdoc-banner">${escapeHtml(s.text)}</div>`)
        break
      case 'paragraph':
        parts.push(`<p class="cdoc-para">${nl2br(s.text)}</p>`)
        break
      case 'kvRows': {
        const heading = s.heading ? `<h2 class="cdoc-h2">${escapeHtml(s.heading)}</h2>` : ''
        const rows = s.rows
          .map(
            ([k, val]) =>
              `<tr><td class="cdoc-lbl">${escapeHtml(k)}</td><td class="cdoc-val">${escapeHtml(
                val
              )}</td></tr>`
          )
          .join('')
        parts.push(`${heading}<table class="cdoc-info"><tbody>${rows}</tbody></table>`)
        break
      }
      case 'articles': {
        const items = s.items.map((t) => `<li>${nl2br(t)}</li>`).join('')
        parts.push(
          `<div class="cdoc-block cdoc-article-block"><h2 class="cdoc-h2">${escapeHtml(
            s.heading
          )}</h2><ol class="cdoc-articles">${items}</ol></div>`
        )
        break
      }
      case 'freeText': {
        parts.push(
          `<h2 class="cdoc-h2">${escapeHtml(s.heading)}</h2><div class="cdoc-free">${nl2br(
            s.text || '—'
          )}</div>`
        )
        break
      }
      case 'signatures': {
        const cols = s.columns
          .map((c) => {
            const sig = signatures.find((sg) => sg.role === c.key)
            const sigImg = sig?.dataUrl
              ? `<img class="cdoc-sig-img" src="${sig.dataUrl}" alt="İmza" />`
              : `<div class="cdoc-sig-empty">İmza alanı</div>`
            const sigName = sig?.signedName ? escapeHtml(sig.signedName) : ''
            const sigDate = sig?.signedAt
              ? `<div class="cdoc-sig-date">${escapeHtml(formatDate(sig.signedAt))}</div>`
              : ''
            return `
              <div class="cdoc-sig-col${sig?.dataUrl ? ' is-signed' : ''}">
                <div class="cdoc-sig-role">${escapeHtml(c.label)}</div>
                ${c.line2 ? `<div class="cdoc-sig-line2">${escapeHtml(c.line2)}</div>` : ''}
                <div class="cdoc-sig-box">${sigImg}</div>
                ${sigName ? `<div class="cdoc-sig-name">${sigName}</div>` : ''}
                ${sigDate}
              </div>
            `
          })
          .join('')
        parts.push(
          `<div class="cdoc-signatures cdoc-cols-${s.columns.length}">${cols}</div>`
        )
        break
      }
    }
  }
  return parts.join('\n')
}

const CONTRACT_CSS = `
.cdoc-wrap { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #0a1224; font-size: 12.5px; line-height: 1.55; background: #fff; }
.cdoc-wrap *, .cdoc-wrap *:before, .cdoc-wrap *:after { box-sizing: border-box; }
.cdoc-wrap .cdoc-head { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 12px; }
.cdoc-wrap img.cdoc-logo { height: 54px; width: auto; max-width: 220px; object-fit: contain; }
.cdoc-wrap h1.cdoc-title { text-align: center; font-size: 18px; font-weight: 800; margin: 0 0 4px; letter-spacing: 0.02em; color: #0a1224; }
.cdoc-wrap .cdoc-subtitle { text-align: center; font-size: 11px; color: #475569; margin-bottom: 16px; }
.cdoc-wrap .cdoc-banner { background: #fffbeb; border: 1px solid #fcd34d; color: #78350f; padding: 8px 12px; border-radius: 8px; font-style: italic; margin: 10px 0 14px; font-size: 11.5px; }
.cdoc-wrap .cdoc-para { margin: 8px 0; }
.cdoc-wrap .cdoc-block { break-inside: auto; page-break-inside: auto; }
.cdoc-wrap h2.cdoc-h2 { font-size: 12.5px; margin: 14px 0 6px; color: #0a1224; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 700; }
.cdoc-wrap table.cdoc-info { width: 100%; border-collapse: collapse; table-layout: fixed; }
.cdoc-wrap table.cdoc-info td { padding: 6px 10px; vertical-align: top; border-bottom: 1px dashed #cbd5e1; font-size: 12px; word-break: break-word; }
.cdoc-wrap table.cdoc-info td.cdoc-lbl { width: 40%; font-weight: 600; color: #334155; background: #f8fafc; }
.cdoc-wrap ol.cdoc-articles { padding-left: 22px; margin: 8px 0 0; }
.cdoc-wrap ol.cdoc-articles li { padding: 2px 0; margin-bottom: 6px; text-align: justify; }
.cdoc-wrap .cdoc-free { white-space: pre-wrap; padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; min-height: 30px; }
.cdoc-wrap .cdoc-signatures { display: grid; gap: 14px; margin-top: 44px; }
.cdoc-wrap .cdoc-cols-2 { grid-template-columns: 1fr 1fr; }
.cdoc-wrap .cdoc-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
.cdoc-wrap .cdoc-sig-col { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 10px 8px; text-align: center; background: #fff; page-break-inside: avoid; }
.cdoc-wrap .cdoc-sig-col.is-signed { border-color: #16a34a; background: #f0fdf4; }
.cdoc-wrap .cdoc-sig-role { font-size: 10.5px; letter-spacing: 0.08em; font-weight: 800; color: #475569; text-transform: uppercase; }
.cdoc-wrap .cdoc-sig-line2 { font-size: 12px; font-weight: 700; margin: 2px 0 6px; color: #0a1224; }
.cdoc-wrap .cdoc-sig-box { min-height: 92px; display: flex; align-items: center; justify-content: center; }
.cdoc-wrap .cdoc-sig-empty { color: #94a3b8; font-size: 11px; font-style: italic; }
.cdoc-wrap img.cdoc-sig-img { max-height: 90px; max-width: 100%; object-fit: contain; }
.cdoc-wrap .cdoc-sig-name { font-size: 12px; font-weight: 700; color: #15803d; margin-top: 4px; }
.cdoc-wrap .cdoc-sig-date { font-size: 10.5px; color: #64748b; }
@media print {
  @page { size: A4; margin: 13mm 12mm 14mm; }
  html, body { width: 210mm; background: #fff !important; margin: 0 !important; padding: 0 !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cdoc-wrap { width: 100%; max-width: 186mm; margin: 0 auto; padding: 0 !important; font-size: 11.7px; line-height: 1.42; }
  .cdoc-wrap .cdoc-head { margin-bottom: 8px; }
  .cdoc-wrap img.cdoc-logo { height: 42px; }
  .cdoc-wrap h1.cdoc-title { font-size: 16px; margin-bottom: 2px; }
  .cdoc-wrap .cdoc-subtitle { font-size: 10px; margin-bottom: 8px; }
  .cdoc-wrap h2.cdoc-h2 { margin: 10px 0 5px; page-break-after: avoid; break-after: avoid; }
  .cdoc-wrap table.cdoc-info { page-break-inside: avoid; break-inside: avoid; }
  .cdoc-wrap table.cdoc-info tr { page-break-inside: avoid; break-inside: avoid; }
  .cdoc-wrap table.cdoc-info td { padding: 4px 8px; font-size: 11.2px; }
  .cdoc-wrap ol.cdoc-articles { margin-top: 5px; padding-left: 18px; }
  .cdoc-wrap ol.cdoc-articles li {
    padding: 0;
    margin-bottom: 4px;
    page-break-inside: avoid;
    break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  .cdoc-wrap .cdoc-free { page-break-inside: avoid; break-inside: avoid; padding: 6px 8px; }
  .cdoc-wrap .cdoc-signatures { margin-top: 14mm; }
  .cdoc-wrap .cdoc-signatures, .cdoc-wrap .cdoc-sig-col { page-break-inside: avoid; break-inside: avoid; }
}
`

export interface RenderOptions {
  signatures?: ContractSignatureInfo[]
  /** true ise tam HTML belgesi (DOCTYPE+head+body) + otomatik print scripti döner. */
  standalone?: boolean
  /** standalone=true iken otomatik yazdırma açılmasın */
  noAutoPrint?: boolean
}

export function contractStyleTag(): string {
  return `<style>${CONTRACT_CSS}</style>`
}

export function renderContractHtml(form: ContractFormState, opts: RenderOptions = {}): string {
  const title = contractTitle(form.contractType)
  const signatures = opts.signatures || []
  const sections = sectionsFor(form)

  const inner = `
    <div class="cdoc-wrap">
      <div class="cdoc-head">
        <img class="cdoc-logo" src="/logo-dark.png" alt="${escapeHtml(SITE_CONFIG.name)}" />
        <div>
          <h1 class="cdoc-title">${escapeHtml(title)}</h1>
          <div class="cdoc-subtitle">${escapeHtml(SITE_CONFIG.name)} · ${escapeHtml(
            SITE_CONFIG.phoneDisplay
          )} · ${escapeHtml(SITE_CONFIG.email)}</div>
        </div>
      </div>
      ${renderSections(sections, signatures)}
    </div>
  `

  if (!opts.standalone) {
    return contractStyleTag() + inner
  }

  const printScript = opts.noAutoPrint
    ? ''
    : '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},350);});</script>'

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(
    title
  )}</title>${contractStyleTag()}<style>body{margin:0;background:#fff;padding:0;}</style></head>
<body>${inner}${printScript}</body></html>`
}
