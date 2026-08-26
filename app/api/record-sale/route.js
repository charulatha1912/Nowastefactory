// app/api/record-sale/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
 
export async function POST(request) {
  const { listingId, wasteEventId, buyerId, actualPrice, actualQuantityKg } = await request.json()
 
  await supabase.from('transactions').insert({
    listing_id: listingId, waste_event_id: wasteEventId, buyer_id: buyerId,
    actual_price: actualPrice, actual_quantity_kg: actualQuantityKg,
  })
 
  const { data: wasteEvent } = await supabase
    .from('waste_events').select('production_value_lost').eq('id', wasteEventId).single()
 
  const netWasteLoss = (wasteEvent?.production_value_lost || 0) - actualPrice
 
  await supabase.from('waste_events').update({
    recovered_value: actualPrice, net_waste_loss: netWasteLoss,
  }).eq('id', wasteEventId)
 
  await supabase.from('scrap_listings').update({ status: 'sold' }).eq('id', listingId)
 
  return NextResponse.json({ netWasteLoss })
}
