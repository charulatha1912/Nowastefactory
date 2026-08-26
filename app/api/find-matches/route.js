// app/api/find-matches/route.js
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
 
const MATERIAL_VALUE_PER_KG = {
  metal_A: 35, metal_B: 22, metal_C: 10,
  textile_A: 18, textile_B: 12, textile_C: 6,
  packaging_A: 15, packaging_B: 9, packaging_C: 4,
}
const LOGISTICS_COST_PER_KM_PER_KG = 0.8
 
function estimateMaterialValue(material, grade, quantityKg) {
  const key = `${material}_${grade}`
  const perKg = MATERIAL_VALUE_PER_KG[key] || 5
  return perKg * quantityKg
}
 
export async function POST(request) {
  const { listingId } = await request.json()
 
  const { data: listing } = await supabase
    .from('scrap_listings').select('*').eq('id', listingId).single()
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
 
  const { data: seller } = await supabase
    .from('profiles').select('cluster_id').eq('id', listing.seller_id).single()
 
  const { data: buyers } = await supabase
    .from('profiles').select('*').eq('role', 'buyer').eq('cluster_id', seller?.cluster_id)
 
  const matches = []
  for (const buyer of buyers || []) {
    const distanceKm = 5 // placeholder - real distance lookup is a future upgrade
    const estimatedMaterialValue = estimateMaterialValue(listing.material, listing.grade, listing.quantity_kg)
    const estimatedLogisticsCost = distanceKm * listing.quantity_kg * LOGISTICS_COST_PER_KM_PER_KG
    const viabilityPass = estimatedLogisticsCost < estimatedMaterialValue
 
    const explanation = viabilityPass
      ? `Estimated material value ₹${estimatedMaterialValue.toFixed(0)} exceeds estimated logistics cost ₹${estimatedLogisticsCost.toFixed(0)} - viable.`
      : `Estimated logistics cost ₹${estimatedLogisticsCost.toFixed(0)} would exceed material value ₹${estimatedMaterialValue.toFixed(0)} - not recommended.`
 
    const { data: match } = await supabase.from('matches').insert({
      listing_id: listingId, buyer_id: buyer.id, distance_km: distanceKm,
      estimated_logistics_cost: estimatedLogisticsCost,
      estimated_material_value: estimatedMaterialValue,
      viability_pass: viabilityPass, explanation, status: 'suggested',
    }).select().single()
 
    if (viabilityPass) matches.push({ matchId: match.id, buyerId: buyer.id, explanation })
  }
 
  return NextResponse.json({ matches })
}
