/**
 * OnSig contract engine — public API.
 *
 * Backend route handlers should import from this module rather than reaching
 * into individual files; this keeps the surface stable as we grow new sectors.
 */

export * from './types'
export * from './context'
export { buildContractText, contractTitle, v as fillValue } from './templates'
export { renderContractHtml, contractStyleTag, type SignatureMark, type RenderHtmlOptions } from './render-html'
export {
  listTemplates,
  findTemplate,
  findTemplateByKey,
  isRealEstateKey,
  isCustomKey,
  TEMPLATES,
} from './registry'
export {
  GROUPS_BY_TEMPLATE,
  fieldListFor,
  type FieldGroup,
  type FieldMeta,
  type FieldType,
} from './fields'
