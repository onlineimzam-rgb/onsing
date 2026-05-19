import { NextResponse, type NextRequest } from 'next/server'
import { ensureCrmAndSalesSchema, sql } from '@/lib/db'
import { isAuthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureCrmAndSalesSchema()

    const [
      counters,
      thisMonthSales,
      recentLeads,
      upcomingTasks,
      monthlySalesSeries,
      stagesBreakdown,
      leadIntents,
      contracts,
    ] = await Promise.all([
      sql(`
        SELECT
          (SELECT COUNT(*)::int FROM properties WHERE status = 'aktif') AS active_properties,
          (SELECT COUNT(*)::int FROM leads WHERE created_at >= NOW() - INTERVAL '7 days') AS leads_7d,
          (SELECT COUNT(*)::int FROM leads WHERE created_at >= NOW() - INTERVAL '30 days') AS leads_30d,
          (SELECT COUNT(*)::int FROM valuation_requests WHERE created_at >= NOW() - INTERVAL '30 days') AS valuations_30d,
          (SELECT COUNT(*)::int FROM contracts WHERE created_at >= NOW() - INTERVAL '30 days') AS contracts_30d,
          (SELECT COUNT(*)::int FROM sales_transactions WHERE stage = 'tamamlandi') AS sales_completed,
          (SELECT COUNT(*)::int FROM sales_transactions) AS sales_total,
          (SELECT COUNT(*)::int FROM crm_tasks WHERE status = 'acik') AS tasks_open,
          (SELECT COUNT(*)::int FROM crm_tasks WHERE status = 'acik' AND due_at IS NOT NULL AND due_at < NOW()) AS tasks_overdue
      `),
      sql(`
        SELECT currency, commission_currency,
               COALESCE(SUM(sale_price), 0) AS sale_sum,
               COALESCE(SUM(commission_amount), 0) AS commission_sum,
               COALESCE(SUM(CASE WHEN invoice_issued THEN commission_amount ELSE 0 END), 0) AS invoiced_sum,
               COUNT(*)::int AS cnt
          FROM sales_transactions
         WHERE COALESCE(sale_completed_at, created_at::date) >= date_trunc('month', NOW())
         GROUP BY currency, commission_currency
      `),
      sql(`
        SELECT id, name, phone, email, intent, district, category, status, created_at
          FROM leads
         ORDER BY created_at DESC
         LIMIT 8
      `),
      sql(`
        SELECT id, title, due_at, priority, related_kind, related_label, status
          FROM crm_tasks
         WHERE status = 'acik'
         ORDER BY (due_at IS NULL), due_at ASC
         LIMIT 8
      `),
      sql(`
        SELECT to_char(date_trunc('month', COALESCE(sale_completed_at, created_at::date)), 'YYYY-MM') AS month,
               COALESCE(SUM(sale_price), 0) AS sale_sum,
               COALESCE(SUM(commission_amount), 0) AS commission_sum,
               COUNT(*)::int AS cnt
          FROM sales_transactions
         WHERE COALESCE(sale_completed_at, created_at::date) >= (date_trunc('month', NOW()) - INTERVAL '5 months')
         GROUP BY 1
         ORDER BY 1 ASC
      `),
      sql(`
        SELECT stage, COUNT(*)::int AS cnt
          FROM sales_transactions
         GROUP BY stage
      `),
      sql(`
        SELECT intent, COUNT(*)::int AS cnt
          FROM leads
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY intent
      `),
      sql(`
        SELECT status, COUNT(*)::int AS cnt
          FROM contracts
         GROUP BY status
      `),
    ])

    return NextResponse.json({
      counters: (counters as any[])[0] || null,
      thisMonthSales,
      recentLeads,
      upcomingTasks,
      monthlySalesSeries,
      stagesBreakdown,
      leadIntents,
      contracts,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
