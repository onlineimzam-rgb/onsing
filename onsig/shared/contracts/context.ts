/**
 * Render context — tenant-bound fields that get inlined into the contract body.
 *
 * The renderer is fed a `ContractRenderContext` so templates remain pure
 * functions (no module-scope coupling to a specific tenant or brokerage).
 */

export interface ContractRenderContext {
  /** Display name of the brokerage / company (e.g. "Çandarlı Uzman Gayrimenkul"). */
  brokerName: string
  /** Full address, single line — used in template headers. */
  brokerAddress: string
  /** Phone (display formatted). */
  brokerPhone: string
  brokerEmail: string
  /** Brokerage operating license / chamber registry number. */
  brokerageLicenseNo: string
  /** Competent court for disputes (default fallback if form.competentCourt empty). */
  competentCourt: string
}

export const DEFAULT_CTX_FALLBACK: ContractRenderContext = {
  brokerName: 'OnSig',
  brokerAddress: '',
  brokerPhone: '',
  brokerEmail: '',
  brokerageLicenseNo: '',
  competentCourt: 'İSTANBUL',
}
