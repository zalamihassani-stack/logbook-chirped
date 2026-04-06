import { createClient } from '@/lib/supabase/server'
import DonneesClient from './DonneesClient'

export default async function DonneesPage() {
  const supabase = await createClient()
  const { data: residents } = await supabase
    .from('profiles').select('id, full_name').eq('role', 'resident').order('full_name')

  return (
    <div className="p-5 md:p-8">
      <DonneesClient residents={residents ?? []} />
    </div>
  )
}
