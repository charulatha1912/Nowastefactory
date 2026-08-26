'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
 
export default function KnowledgeVault() {
  const [machines, setMachines] = useState([])
  const [machineId, setMachineId] = useState('')
  const [transcript, setTranscript] = useState('')
  const [symptom, setSymptom] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [fix, setFix] = useState('')
  const [tools, setTools] = useState('')
  const [status, setStatus] = useState('')
  const [recording, setRecording] = useState(false)
 
  useEffect(() => {
    supabase.from('machines').select('*').then(({ data }) => setMachines(data || []))
  }, [])
 
  function extractFields(text) {
    const lower = text.toLowerCase()
    const causeMatch = lower.match(/(?:because|due to|caused by)\s+(.+?)(?:\.|,|$)/)
    const fixMatch = lower.match(/(?:fixed by|solved by|resolved by|fixed it by)\s+(.+?)(?:\.|,|$)/)
    setRootCause(causeMatch ? causeMatch[1].trim() : '')
    setFix(fixMatch ? fixMatch[1].trim() : '')
    setSymptom(text.split(/[.!?]/)[0].trim())
  }
 
  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatus('Voice recognition not supported here - type the transcript manually below.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-IN'
    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + ' '
      setTranscript(text.trim())
      extractFields(text.trim())
    }
    recognition.start()
    setRecording(true)
  }
 
  async function submit() {
    if (!machineId || !transcript) {
      setStatus('Pick a machine and record or type a transcript first.')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('incidents').insert({
      machine_id: machineId, transcript, symptom, root_cause: rootCause, fix, tools,
      status: 'unverified', reported_by: user?.id,
    })
    setStatus('Submitted - waiting for supervisor verification.')
  }
 
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Record an Incident</h1>
      <select className="border p-2 w-full mb-3" value={machineId} onChange={e => setMachineId(e.target.value)}>
        <option value="">Select machine</option>
        {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-3" onClick={startRecording}>
        {recording ? 'Recording...' : '🎤 Start Recording'}
      </button>
      <textarea className="border p-2 w-full mb-3" rows={4} value={transcript}
        onChange={e => { setTranscript(e.target.value); extractFields(e.target.value) }}
        placeholder="Transcript (or type manually)" />
      <input className="border p-2 w-full mb-2" value={symptom} onChange={e => setSymptom(e.target.value)} placeholder="Symptom" />
      <input className="border p-2 w-full mb-2" value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Root cause" />
      <input className="border p-2 w-full mb-2" value={fix} onChange={e => setFix(e.target.value)} placeholder="Fix" />
      <input className="border p-2 w-full mb-3" value={tools} onChange={e => setTools(e.target.value)} placeholder="Tools used" />
      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={submit}>Submit for Review</button>
      <p className="mt-2 text-sm">{status}</p>
    </div>
  )
}
