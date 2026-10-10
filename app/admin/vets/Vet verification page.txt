'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function VetVerification() {
  const [vets, setVets] = useState<any[]>([])
  const supabase = createClient()
  
  useEffect(() => {
    fetchPendingVets()
  }, [])
  
  async function fetchPendingVets() {
    const { data } = await supabase
      .from('vets')
      .select('*')
      .eq('verified', false)
      .order('created_at', { ascending: false })
    setVets(data || [])
  }
  
  async function verifyVet(id: number, verified: boolean) {
    await supabase
      .from('vets')
      .update({ verified, verified_at: new Date().toISOString() })
      .eq('id', id)
    fetchPendingVets()
  }
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vet Verification</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>County</TableHead>
            <TableHead>KVB Number</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vets.map(vet => (
            <TableRow key={vet.id}>
              <TableCell>{vet.name}</TableCell>
              <TableCell>{vet.phone}</TableCell>
              <TableCell>{vet.county}</TableCell>
              <TableCell>{vet.kvb_number}</TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" onClick={() => verifyVet(vet.id, true)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => verifyVet(vet.id, false)}>Reject</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}