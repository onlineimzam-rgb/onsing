export const CONTRACT_TYPES = [
  { id: 'kira', label: 'Kira Sözleşmesi (Matbu uyumlu)' },
  { id: 'yetki', label: 'Yetki Sözleşmesi (Mal Sahibi – Komisyoncu)' },
  { id: 'alim-satim', label: 'Gayrimenkul Satış Sözleşmesi' },
  { id: 'yer-gosterme', label: 'Yer Gösterme Tutanağı ve Komisyon Sözleşmesi' },
] as const

export type ContractType = (typeof CONTRACT_TYPES)[number]['id']

/** PDF/matbu alanları + uzaktan imza için ortak alanlar */
export interface ContractFormState {
  contractType: ContractType
  /** İhtilâf için yetkili mahkeme (PDF’te DENİZLİ geçiyor; varsayılan İZMİR) */
  competentCourt: string
  /** İşletme yetki belgesi / oda sicil no */
  brokerageLicenseNo: string
  contractDate: string
  leaseStartDate: string
  leaseEndDate: string
  authorityStartDate: string
  authorityEndDate: string

  ownerName: string
  ownerPhone: string
  ownerTc: string
  ownerHomeAddress: string
  ownerWorkAddress: string

  customerName: string
  customerPhone: string
  customerTc: string
  customerHomeAddress: string
  customerWorkAddress: string

  /** Gayrimenkul */
  propertyAddress: string
  propertyInfo: string
  mahalle: string
  sokakVeNo: string
  daireBlok: string
  kiralananCinsi: string
  adaNo: string
  paftaNo: string
  parselNo: string

  /** Kira */
  demirbasBeyani: string
  kiralananDurumu: string
  kullanimAmaci: string
  kiraYili: string
  paymentDayOfMonth: string
  paymentMethod: string
  monthlyRent: string
  yearlyRent: string
  advanceLandlord: string
  depositAmount: string
  rentIncreasePercent: string
  contractArticleCount: string
  contractCopyCount: string
  kefilName: string

  /** Alım satım / komisyon */
  salePrice: string
  buyerAdvanceToSeller: string
  commissionSellerPct: string
  commissionBuyerPct: string

  /** Yetki sözleşmesi */
  purposeSaleRent: string
  directDealPenalty: string
  withdrawalPenaltyAmount: string
  authorityYears: string
  authorityCopies: string
  minAskPrice: string
  maxAskPrice: string

  /** Yer gösterme */
  shownPropertiesList: string
  commissionPctSale: string
  commissionRentEquivalent: string
  yerGostermeCopies: string

  specialTerms: string
}

export const EMPTY_CONTRACT_FORM: ContractFormState = {
  contractType: 'kira',
  competentCourt: 'İZMİR',
  brokerageLicenseNo: '',
  contractDate: '',
  leaseStartDate: '',
  leaseEndDate: '',
  authorityStartDate: '',
  authorityEndDate: '',

  ownerName: '',
  ownerPhone: '',
  ownerTc: '',
  ownerHomeAddress: '',
  ownerWorkAddress: '',

  customerName: '',
  customerPhone: '',
  customerTc: '',
  customerHomeAddress: '',
  customerWorkAddress: '',

  propertyAddress: '',
  propertyInfo: '',
  mahalle: '',
  sokakVeNo: '',
  daireBlok: '',
  kiralananCinsi: '',
  adaNo: '',
  paftaNo: '',
  parselNo: '',

  demirbasBeyani: '',
  kiralananDurumu: '',
  kullanimAmaci: '',
  kiraYili: '',
  paymentDayOfMonth: '',
  paymentMethod: '',
  monthlyRent: '',
  yearlyRent: '',
  advanceLandlord: '',
  depositAmount: '',
  rentIncreasePercent: '',
  contractArticleCount: '',
  contractCopyCount: '',
  kefilName: '',

  salePrice: '',
  buyerAdvanceToSeller: '',
  commissionSellerPct: '',
  commissionBuyerPct: '',

  purposeSaleRent: 'satış ve/veya kiralama',
  directDealPenalty: '',
  withdrawalPenaltyAmount: '',
  authorityYears: '',
  authorityCopies: '',
  minAskPrice: '',
  maxAskPrice: '',

  shownPropertiesList: '',
  commissionPctSale: '',
  commissionRentEquivalent: '',
  yerGostermeCopies: '',

  specialTerms: '',
}
