'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
 
export default function Verify() {
  const [incidents, setIncidents] = useState([])
 
  async function load() {
    const { data } = await supabase.from('incidents').select('*').eq('status', 'unverified')
    setIncidents(data || [])
  }
  useEffect(() => { load() }, [])
 
  async function approve(incident, material, quantityKg, productionValueLost) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('incidents').update({ status: 'verified', verified_by: user?.id }).eq('id', incident.id)
    await supabase.from('waste_events').insert({
      incident_id: incident.id, machine_id: incident.machine_id,
      material, quantity_kg: quantityKg, defect_summary: incident.root_cause,
      production_value_lost: productionValueLost,
    })
    load()
  }
 
  async function reject(id) {
    await supabase.from('incidents').update({ status: 'rejected' }).eq('id', id)
    load()
  }
 
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Incidents Awaiting Verification</h1>
      {incidents.map(inc => (
        <IncidentCard key={inc.id} incident={inc} onApprove={approve} onReject={reject} />
      ))}
    </div>
  )
}
 
function IncidentCard({ incident, onApprove, onReject }) {
  const [material, setMaterial] = useState('')
  const [qty, setQty] = useState('')
  const [value, setValue] = useState('')
  return (
    <div className="border p-4 mb-3 rounded">
      <p><strong>Symptom:</strong> {incident.symptom}</p>
      <p><strong>Root cause:</strong> {incident.root_cause}</p>
      <p><strong>Fix:</strong> {incident.fix}</p>
      <input className="border p-1 w-full mt-2" placeholder="Material" value={material} onChange={e => setMaterial(e.target.value)} />
      <input className="border p-1 w-full mt-1" placeholder="Quantity (kg)" value={qty} onChange={e => setQty(e.target.value)} />
      <input className="border p-1 w-full mt-1" placeholder="Production value lost (₹)" value={value} onChange={e => setValue(e.target.value)} />
      <div className="mt-2">
        <button className="bg-green-600 text-white px-3 py-1 rounded mr-2"
          onClick={() => onApprove(incident, material, parseFloat(qty), parseFloat(value))}>Approve</button>
        <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => onReject(incident.id)}>Reject</button>
      </div>
    </div>
  )
}
