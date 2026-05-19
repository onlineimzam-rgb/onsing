/**
 * Registry — central catalog of available templates per sector.
 * New sectors plug in here without touching CRUD or render code.
 */

import {
  GENERAL_TEMPLATES,
  REAL_ESTATE_TEMPLATES,
  ROLES_BY_TEMPLATE,
  type AnyTemplateKey,
  type GeneralTemplateKey,
  type RealEstateTemplateKey,
  type Sector,
  type SignerRole,
} from './types'

export interface TemplateDescriptor {
  sector: Sector
  key: AnyTemplateKey
  label: string
  roles: ReadonlyArray<SignerRole>
}

export const TEMPLATES: ReadonlyArray<TemplateDescriptor> = [
  ...REAL_ESTATE_TEMPLATES.map((t) => ({
    sector: 'real-estate' as const,
    key: t.key as AnyTemplateKey,
    label: t.label,
    roles: ROLES_BY_TEMPLATE[t.key],
  })),
  // The blank/custom template lives in the "other" sector so the picker can show
  // it alongside the real-estate cards without being misclassified.
  ...GENERAL_TEMPLATES.map((t) => ({
    sector: 'other' as const,
    key: t.key as AnyTemplateKey,
    label: t.label,
    roles: ROLES_BY_TEMPLATE[t.key],
  })),
]

export function listTemplates(sector?: Sector): TemplateDescriptor[] {
  return TEMPLATES.filter((t) => (sector ? t.sector === sector : true)).map((t) => ({ ...t }))
}

export function findTemplate(sector: Sector, key: string): TemplateDescriptor | null {
  return TEMPLATES.find((t) => t.sector === sector && t.key === (key as AnyTemplateKey)) ?? null
}

export function findTemplateByKey(key: string): TemplateDescriptor | null {
  return TEMPLATES.find((t) => t.key === (key as AnyTemplateKey)) ?? null
}

export function isRealEstateKey(key: string): key is RealEstateTemplateKey {
  return REAL_ESTATE_TEMPLATES.some((t) => t.key === key)
}

export function isCustomKey(key: string): key is GeneralTemplateKey {
  return GENERAL_TEMPLATES.some((t) => t.key === key)
}
