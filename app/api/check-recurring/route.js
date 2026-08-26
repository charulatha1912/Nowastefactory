// app/api/check-recurring/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
 
export async function POST() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
 
  const { data: wasteEvents } = await supabase
    .from('waste_events').select('*, incidents(root_cause)')
    .gte('created_at', ninetyDaysAgo).not('net_waste_loss', 'is', null)
 
  const grouped = {}
  for (const event of wasteEvents || []) {
    const cause = event.incidents?.root_cause
    if (!cause) continue
    if (!grouped[cause]) grouped[cause] = { count: 0, totalLoss: 0 }
    grouped[cause].count += 1
    grouped[cause].totalLoss += event.net_waste_loss || 0
  }
 
  let flagged = 0
  for (const [rootCause, stats] of Object.entries(grouped)) {
    if (stats.count >= 3 && stats.totalLoss > 0) {
      await supabase.from('recommendations').insert({
        root_cause: rootCause, occurrence_count: stats.count,
        total_net_waste_loss: stats.totalLoss,
        suggested_action: `"${rootCause}" occurred ${stats.count} times, ₹${stats.totalLoss.toFixed(0)} realized net loss. Review the SOP for this cause.`,
      })
      flagged++
    }
  }
  return NextResponse.json({ flaggedCount: flagged })
}
