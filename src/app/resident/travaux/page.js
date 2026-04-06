import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TravauxClient from './TravauxClient'

export default async function TravauxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: travaux }, { data: types }] = await Promise.all([
    supabase.from('travaux_scientifiques')
      .select('id, title, journal_or_event, year, authors, doi_or_url, status, type_id, travail_types(name, color_hex)')
      .eq('resident_id', user.id).order('year', { ascending: false }),
    supabase.from('travail_types').select('id, name, color_hex').eq('is_active', true).order('display_order'),
  ])

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <TravauxClient initialTravaux={travaux ?? []} types={types ?? []} />
    </div>
  )
}
