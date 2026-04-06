import { createClient } from '@/lib/supabase/server'
import GestesManagement from './GestesManagement'

export default async function GestesPage() {
  const supabase = await createClient()
  const [{ data: procedures }, { data: categories }] = await Promise.all([
    supabase.from('procedures')
      .select('id, procedure_code, name, pathologie, category_id, is_active, procedure_objectives(year, required_level, min_count)')
      .eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name, color_hex').order('display_order'),
  ])

  return (
    <div className="p-5 md:p-8">
      <GestesManagement initialProcedures={procedures ?? []} initialCategories={categories ?? []} />
    </div>
  )
}
