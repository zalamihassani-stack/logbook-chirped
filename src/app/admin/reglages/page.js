import { createClient } from '@/lib/supabase/server'
import ReglagesClient from './ReglagesClient'

export default async function ReglagesPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('app_settings').select('*').eq('id', 1).maybeSingle()

  return (
    <div className="p-5 md:p-8">
      <ReglagesClient initialSettings={settings ?? {}} />
    </div>
  )
}
