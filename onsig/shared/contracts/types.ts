/**
 * OnSig — Contract type definitions (sector-independent core).
 *
 * Each contract is identified by a `sector + templateKey` pair. The MVP ships
 * the `real-estate` sector; new sectors (freelance, business, ...) plug in by
 * appending to `SECTORS` and registering their templates in `registry.ts`.
 */

export const SECTORS = ['real-estate', 'freelance', 'business', 'education', 'health', 'other'] as const
export type Sector = (typeof SECTORS)[number]

/** Built-in real-estate templates (1:1 port of CUGM matbu set). */
export const REAL_ESTATE_TEMPLATES = [
  { key: 'kira', label: 'Kira Sözleşmesi (Matbu uyumlu)' },
  { key: 'yetki', label: 'Yetki Sözleşmesi (Mal Sahibi – Komisyoncu)' },
  { key: 'alim-satim', label: 'Gayrimenkul Satış Sözleşmesi' },
  { key: 'yer-gosterme', label: 'Yer Gösterme Tutanağı ve Komisyon Sözleşmesi' },
] as const
export type RealEstateTemplateKey = (typeof REAL_ESTATE_TEMPLATES)[number]['key']

/** Sector-agnostic "blank" template — the user provides their own body. */
export const GENERAL_TEMPLATES = [
  { key: 'custom', label: 'Özel Sözleşme (Boş şablon)' },
] as const
export type GeneralTemplateKey = (typeof GENERAL_TEMPLATES)[number]['key']

/** Union of every built-in template key. */
export type AnyTemplateKey = RealEstateTemplateKey | GeneralTemplateKey

export type SignerRole =
  | 'kiraya-veren'
  | 'kiraci'
  | 'kefil'
  | 'mal-sahibi'
  | 'komisyoncu'
  | 'satici'
  | 'alici'
  | 'yer-goren'
  | 'imzaci-1'
  | 'imzaci-2'
  | 'imzaci-3'
  | 'imzaci-4'

export const SIGNER_ROLE_LABELS: Record<SignerRole, string> = {
  'kiraya-veren': 'Kiraya Veren',
  kiraci: 'Kiracı',
  kefil: 'Kefil',
  'mal-sahibi': 'Mal Sahibi',
  komisyoncu: 'Emlak Komisyoncusu',
  satici: 'Satıcı',
  alici: 'Alıcı',
  'yer-goren': 'Taşınmazı Gezen',
  'imzaci-1': '1. İmzacı',
  'imzaci-2': '2. İmzacı',
  'imzaci-3': '3. İmzacı',
  'imzaci-4': '4. İmzacı',
}

/** Signer roles per template. Each role corresponds to one sign session. */
export const ROLES_BY_TEMPLATE: Record<AnyTemplateKey, ReadonlyArray<SignerRole>> = {
  kira: ['kiraya-veren', 'kiraci', 'kefil'],
  yetki: ['mal-sahibi', 'komisyoncu'],
  'alim-satim': ['satici', 'alici', 'komisyoncu'],
  'yer-gosterme': ['yer-goren', 'komisyoncu'],
  // Custom contracts may have up to 4 signers; the form decides which roles are
  // actually used by listing only the chosen ones in its create-session UI.
  custom: ['imzaci-1', 'imzaci-2', 'imzaci-3', 'imzaci-4'],
}

/**
 * Universal form schema used by all real-estate templates.
 * Fields that don't apply to a given template stay empty — renderer ignores them.
 */
export interface ContractFormState {
  templateKey: AnyTemplateKey

  // ── Custom / blank template
  customTitle?: string
  customBody?: string
  customSignerCount?: string // "1".."4" (string so it matches the rest of the form)

  // Tenant-overridable defaults (renderer falls back to tenant settings).
  competentCourt: string
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

  propertyAddress: string
  propertyInfo: string
  mahalle: string
  sokakVeNo: string
  daireBlok: string
  kiralananCinsi: string
  adaNo: string
  paftaNo: string
  parselNo: string

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

  salePrice: string
  buyerAdvanceToSeller: string
  commissionSellerPct: string
  commissionBuyerPct: string

  purposeSaleRent: string
  directDealPenalty: string
  withdrawalPenaltyAmount: string
  authorityYears: string
  authorityCopies: string
  minAskPrice: string
  maxAskPrice: string

  shownPropertiesList: string
  commissionPctSale: string
  commissionRentEquivalent: string
  yerGostermeCopies: string

  specialTerms: string
}

export const EMPTY_CONTRACT_FORM: ContractFormState = {
  templateKey: 'kira',
  customTitle: '',
  customBody: '',
  customSignerCount: '2',
  competentCourt: '',
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
