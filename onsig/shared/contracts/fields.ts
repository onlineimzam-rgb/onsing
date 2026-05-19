/**
 * Form metadata — field labels, input types and template-specific groupings.
 *
 * Shared between the admin "yeni sözleşme" wizard, the detail page summary
 * table and (future) the mobile app. Sözleşme motoru bağımsız kalsın diye
 * burada UI-katmanı bilgileri tutulur (label, ipucu, grup başlığı).
 */

import type { AnyTemplateKey, ContractFormState } from './types'

export type FieldType = 'text' | 'date' | 'textarea' | 'tel' | 'number'

export interface FieldMeta {
  name: keyof ContractFormState
  label: string
  type?: FieldType
  hint?: string
  /** Optional formatter for display in summary tables. */
  format?: 'date' | 'percent' | 'currency'
  /** Used by the form wizard for textareas; default is 3. */
  rows?: number
  /** Optional placeholder shown when the field is empty. */
  placeholder?: string
}

export interface FieldGroup {
  title: string
  fields: FieldMeta[]
}

const F = {
  contractDate: { name: 'contractDate', label: 'Sözleşme tarihi', type: 'date' } as FieldMeta,
  leaseStartDate: { name: 'leaseStartDate', label: 'Kira başlangıç tarihi', type: 'date' } as FieldMeta,
  leaseEndDate: { name: 'leaseEndDate', label: 'Kira bitiş tarihi', type: 'date' } as FieldMeta,
  authorityStartDate: { name: 'authorityStartDate', label: 'Yetki başlangıç tarihi', type: 'date' } as FieldMeta,
  authorityEndDate: { name: 'authorityEndDate', label: 'Yetki bitiş tarihi', type: 'date' } as FieldMeta,
  authorityYears: { name: 'authorityYears', label: 'Yetki süresi açıklaması' } as FieldMeta,
  authorityCopies: { name: 'authorityCopies', label: 'Yetki nüsha sayısı' } as FieldMeta,

  ownerName: { name: 'ownerName', label: 'Mal sahibi / kiraya veren — Ad Soyad' } as FieldMeta,
  ownerTc: { name: 'ownerTc', label: 'Mal sahibi T.C. No' } as FieldMeta,
  ownerPhone: { name: 'ownerPhone', label: 'Mal sahibi telefon', type: 'tel' } as FieldMeta,
  ownerHomeAddress: { name: 'ownerHomeAddress', label: 'Mal sahibi ev adresi', type: 'textarea' } as FieldMeta,
  ownerWorkAddress: { name: 'ownerWorkAddress', label: 'Mal sahibi iş adresi', type: 'textarea' } as FieldMeta,

  customerName: { name: 'customerName', label: 'Müşteri (kiracı/alıcı/gezen) — Ad Soyad' } as FieldMeta,
  customerTc: { name: 'customerTc', label: 'Müşteri T.C. No' } as FieldMeta,
  customerPhone: { name: 'customerPhone', label: 'Müşteri telefon', type: 'tel' } as FieldMeta,
  customerHomeAddress: { name: 'customerHomeAddress', label: 'Müşteri ev adresi', type: 'textarea' } as FieldMeta,
  customerWorkAddress: { name: 'customerWorkAddress', label: 'Müşteri iş adresi', type: 'textarea' } as FieldMeta,

  propertyAddress: { name: 'propertyAddress', label: 'Gayrimenkul adresi', type: 'textarea' } as FieldMeta,
  propertyInfo: { name: 'propertyInfo', label: 'Gayrimenkul cinsi / nitelik' } as FieldMeta,
  mahalle: { name: 'mahalle', label: 'Mahallesi' } as FieldMeta,
  sokakVeNo: { name: 'sokakVeNo', label: 'Sokak ve numarası' } as FieldMeta,
  daireBlok: { name: 'daireBlok', label: 'Daire / Blok' } as FieldMeta,
  kiralananCinsi: { name: 'kiralananCinsi', label: 'Kiralanan şeyin cinsi' } as FieldMeta,
  adaNo: { name: 'adaNo', label: 'Ada no' } as FieldMeta,
  paftaNo: { name: 'paftaNo', label: 'Pafta no' } as FieldMeta,
  parselNo: { name: 'parselNo', label: 'Parsel no' } as FieldMeta,

  kiraYili: { name: 'kiraYili', label: 'Kira süresi (yıl)' } as FieldMeta,
  monthlyRent: { name: 'monthlyRent', label: 'Aylık kira' } as FieldMeta,
  yearlyRent: { name: 'yearlyRent', label: 'Yıllık kira' } as FieldMeta,
  paymentDayOfMonth: { name: 'paymentDayOfMonth', label: 'Ödeme günü' } as FieldMeta,
  paymentMethod: { name: 'paymentMethod', label: 'Ödeme yöntemi', type: 'textarea' } as FieldMeta,
  depositAmount: { name: 'depositAmount', label: 'Depozit' } as FieldMeta,
  advanceLandlord: { name: 'advanceLandlord', label: 'Peşinat' } as FieldMeta,
  rentIncreasePercent: { name: 'rentIncreasePercent', label: 'Kira artış oranı (%)' } as FieldMeta,
  kefilName: { name: 'kefilName', label: 'Kefil adı' } as FieldMeta,
  contractCopyCount: { name: 'contractCopyCount', label: 'Nüsha sayısı' } as FieldMeta,
  contractArticleCount: { name: 'contractArticleCount', label: 'Madde sayısı' } as FieldMeta,

  salePrice: { name: 'salePrice', label: 'Satış bedeli' } as FieldMeta,
  buyerAdvanceToSeller: { name: 'buyerAdvanceToSeller', label: 'Alıcıdan alınan kapora' } as FieldMeta,
  commissionSellerPct: { name: 'commissionSellerPct', label: 'Satıcı komisyon oranı (%)' } as FieldMeta,
  commissionBuyerPct: { name: 'commissionBuyerPct', label: 'Alıcı komisyon oranı (%)' } as FieldMeta,

  minAskPrice: { name: 'minAskPrice', label: 'Asgari değer' } as FieldMeta,
  maxAskPrice: { name: 'maxAskPrice', label: 'Azami değer' } as FieldMeta,
  purposeSaleRent: { name: 'purposeSaleRent', label: 'Amaç (satış/kiralama)' } as FieldMeta,
  directDealPenalty: { name: 'directDealPenalty', label: 'Doğrudan işlem cezası' } as FieldMeta,
  withdrawalPenaltyAmount: { name: 'withdrawalPenaltyAmount', label: 'Vazgeçme cezası' } as FieldMeta,

  shownPropertiesList: { name: 'shownPropertiesList', label: 'Gösterilen taşınmazlar listesi', type: 'textarea' } as FieldMeta,
  commissionPctSale: { name: 'commissionPctSale', label: 'Komisyon oranı satış (%)' } as FieldMeta,
  commissionRentEquivalent: { name: 'commissionRentEquivalent', label: 'Kira komisyonu' } as FieldMeta,
  yerGostermeCopies: { name: 'yerGostermeCopies', label: 'Yer gösterme nüsha sayısı' } as FieldMeta,

  specialTerms: { name: 'specialTerms', label: 'Özel şartlar', type: 'textarea' } as FieldMeta,

  // Custom / blank
  customTitle: { name: 'customTitle', label: 'Sözleşme başlığı' } as FieldMeta,
  customBody: {
    name: 'customBody',
    label: 'Sözleşme metni',
    type: 'textarea',
    rows: 16,
    placeholder:
      'Örn:\n1) Taraflar bu sözleşme ile ...\n2) Hizmet bedeli ...\n3) Süre ve fesih ...\n4) İhtilaf halinde İSTANBUL Mahkemeleri yetkilidir.',
    hint: 'Madde madde yazabilirsiniz. Bu metin imza sayfasında ve PDF\'te aynen görünür.',
  } as FieldMeta,
  customSignerCount: {
    name: 'customSignerCount',
    label: 'Kaç imzacı olacak?',
    type: 'number',
    hint: '1 ile 4 arası.',
  } as FieldMeta,
} as const

export const GROUPS_BY_TEMPLATE: Record<AnyTemplateKey, FieldGroup[]> = {
  kira: [
    { title: 'Sözleşme', fields: [F.contractDate, F.leaseStartDate, F.leaseEndDate, F.kiraYili] },
    { title: 'Kiraya Veren', fields: [F.ownerName, F.ownerTc, F.ownerPhone, F.ownerHomeAddress] },
    { title: 'Kiracı', fields: [F.customerName, F.customerTc, F.customerPhone, F.customerHomeAddress] },
    { title: 'Gayrimenkul', fields: [F.propertyAddress, F.mahalle, F.sokakVeNo, F.daireBlok, F.kiralananCinsi] },
    {
      title: 'Mali',
      fields: [
        F.monthlyRent,
        F.yearlyRent,
        F.paymentDayOfMonth,
        F.paymentMethod,
        F.depositAmount,
        F.advanceLandlord,
        F.rentIncreasePercent,
      ],
    },
    { title: 'Kefil & Nüsha', fields: [F.kefilName, F.contractCopyCount, F.contractArticleCount] },
    { title: 'Özel Şartlar', fields: [F.specialTerms] },
  ],
  yetki: [
    { title: 'Sözleşme', fields: [F.contractDate, F.authorityStartDate, F.authorityEndDate, F.authorityYears, F.authorityCopies] },
    { title: 'Mal Sahibi', fields: [F.ownerName, F.ownerTc, F.ownerPhone, F.ownerHomeAddress, F.ownerWorkAddress] },
    {
      title: 'Gayrimenkul',
      fields: [F.propertyAddress, F.propertyInfo, F.adaNo, F.paftaNo, F.parselNo, F.minAskPrice, F.maxAskPrice],
    },
    { title: 'Cezai Şartlar', fields: [F.purposeSaleRent, F.directDealPenalty, F.withdrawalPenaltyAmount] },
    { title: 'Özel Şartlar', fields: [F.specialTerms] },
  ],
  'alim-satim': [
    { title: 'Sözleşme', fields: [F.contractDate] },
    {
      title: 'Gayrimenkul',
      fields: [F.propertyInfo, F.propertyAddress, F.adaNo, F.paftaNo, F.parselNo],
    },
    { title: 'Satıcı', fields: [F.ownerName, F.ownerTc, F.ownerPhone, F.ownerHomeAddress, F.ownerWorkAddress] },
    { title: 'Alıcı', fields: [F.customerName, F.customerTc, F.customerPhone, F.customerHomeAddress, F.customerWorkAddress] },
    { title: 'Mali', fields: [F.salePrice, F.buyerAdvanceToSeller, F.commissionSellerPct, F.commissionBuyerPct] },
    { title: 'Özel Şartlar', fields: [F.specialTerms] },
  ],
  'yer-gosterme': [
    { title: 'Sözleşme', fields: [F.contractDate, F.yerGostermeCopies] },
    { title: 'Gezen / Gören', fields: [F.customerName, F.customerTc, F.customerPhone, F.customerHomeAddress] },
    { title: 'Gösterilen Taşınmazlar', fields: [F.shownPropertiesList] },
    { title: 'Komisyon', fields: [F.commissionPctSale, F.commissionRentEquivalent] },
    { title: 'Özel Şartlar', fields: [F.specialTerms] },
  ],
  custom: [
    { title: 'İçerik', fields: [F.customTitle, F.customBody] },
    { title: 'İmzacılar', fields: [F.customSignerCount] },
  ],
}

/** Flat list of fields used by the form wizard (preserves group order). */
export function fieldListFor(templateKey: AnyTemplateKey): FieldMeta[] {
  return GROUPS_BY_TEMPLATE[templateKey].flatMap((g) => g.fields)
}
