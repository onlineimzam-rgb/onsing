import OpenAI from 'openai'
import type { ValuationRequest } from '@/lib/db'

export type ValuationAiDraft = {
  value_min: number | null
  value_max: number | null
  unit_price_min: number | null
  unit_price_max: number | null
  marketing_time: string
  market_position: string
  methodology: string
  expert_opinion: string
  region_comment: string
  risks: string[]
  comparables_comment: string
  report_text: string
}

function toNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function createValuationDraft(req: ValuationRequest): Promise<ValuationAiDraft> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY tanımlı değil')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const comparables = Array.isArray(req.comparables) ? req.comparables : []

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Türkiye gayrimenkul danışmanlığı için değerleme raporu taslağı hazırlayan dikkatli bir asistansın. Kesin hüküm verme; adminin kontrol edeceği öneri üret. Sadece geçerli JSON döndür.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          instruction:
            'Aşağıdaki değerleme talebi için yapılandırılmış rapor taslağı üret. Değer bandını ancak veriler makulse öner; emin değilsen null bırak ve metinde nedenini belirt.',
          required_json_keys: [
            'value_min',
            'value_max',
            'unit_price_min',
            'unit_price_max',
            'marketing_time',
            'market_position',
            'methodology',
            'expert_opinion',
            'region_comment',
            'risks',
            'comparables_comment',
            'report_text',
          ],
          request: {
            name: req.name,
            address: req.address,
            city: req.city,
            district: req.district,
            neighborhood: req.neighborhood,
            property_type: req.property_type,
            area_m2: req.area_m2,
            lot_m2: req.lot_m2,
            rooms: req.rooms,
            year_built: req.year_built,
            parcel: { ada_no: req.ada_no, parsel_no: req.parsel_no, pafta_no: req.pafta_no },
            manual_property_info: req.manual_property_info,
            customer_notes: req.notes,
            existing_estimated_value: req.estimated_value,
            comparables,
          },
        }),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw) as Record<string, unknown>
  return {
    value_min: toNumber(parsed.value_min),
    value_max: toNumber(parsed.value_max),
    unit_price_min: toNumber(parsed.unit_price_min),
    unit_price_max: toNumber(parsed.unit_price_max),
    marketing_time: String(parsed.marketing_time || ''),
    market_position: String(parsed.market_position || ''),
    methodology: String(parsed.methodology || ''),
    expert_opinion: String(parsed.expert_opinion || ''),
    region_comment: String(parsed.region_comment || ''),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    comparables_comment: String(parsed.comparables_comment || ''),
    report_text: String(parsed.report_text || ''),
  }
}
