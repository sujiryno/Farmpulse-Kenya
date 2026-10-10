'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MultiSelect } from '@/components/ui/multi-select' // or simple checkboxes

export default function OutbreakAlerts() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [counties, setCounties] = useState<string[]>([])
  const [poultryTypes, setPoultryTypes] = useState<string[]>([])
  const supabase = createClient()
  
  const countyOptions = ['Nairobi', 'Kiambu', 'Nakuru', 'Eldoret', 'Kisumu', 'Mombasa']
  const poultryOptions = ['broiler', 'layer', 'kienyeji']
  
  async function sendAlert() {
    const { error } = await supabase.from('outbreak_alerts').insert({
      title,
      message,
      counties: counties.length ? counties : null,
      poultry_types: poultryTypes.length ? poultryTypes : null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString()
    })
    if (!error) {
      alert('Alert sent! (will appear in farmers\' health tips)')
      setTitle(''); setMessage(''); setCounties([]); setPoultryTypes([])
    } else {
      alert('Error: ' + error.message)
    }
  }
  
  return (
    <div className="space-y-4 max-w-xl">
      <h1>Create Outbreak Alert</h1>
      <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea placeholder="Message (detailed advice)" rows={4} value={message} onChange={e => setMessage(e.target.value)} />
      <div>
        <label>Target counties (leave empty for all)</label>
        <MultiSelect options={countyOptions} value={counties} onChange={setCounties} />
      </div>
      <div>
        <label>Target poultry types (leave empty for all)</label>
        <MultiSelect options={poultryOptions} value={poultryTypes} onChange={setPoultryTypes} />
      </div>
      <Button onClick={sendAlert}>Publish Alert</Button>
    </div>
  )
}