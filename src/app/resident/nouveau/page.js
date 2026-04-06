import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import NouveauForm from './NouveauForm'
import { getResidentYear } from '@/lib/utils'

export default async function NouveauPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('residanat_start_date').eq('id', user.id).single()
  const year = getResidentYear(profile?.residanat_start_date)

  // admin client pour bypasser RLS sur la liste des profils
  const [{ data: procedures }, { data: enseignants }, { data: residents }, { data: objectives }] = await Promise.all([
    supabase.from('procedures').select('id, name, category_id, categories(name, color_hex)').eq('is_active', true).order('name'),
    admin.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true).neq('id', user.id).order('full_name'),
    supabase.from('procedure_objectives').select('procedure_id').eq('year', year),
  ])

  const objectiveProcedureIds = new Set((objectives ?? []).map(o => o.procedure_id))

  const proceduresWithTag = (procedures ?? []).map(p => ({
    ...p,
    isObjectif: objectiveProcedureIds.has(p.id),
  }))

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <NouveauForm
        procedures={proceduresWithTag}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
        residentYear={year}
      />
    </div>
  )
}
