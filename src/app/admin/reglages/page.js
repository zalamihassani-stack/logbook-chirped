import { createClient } from '@/lib/supabase/server'
import { getAppSettings } from '@/lib/app-settings'
import ReglagesClient from './ReglagesClient'

export default async function ReglagesPage() {
  const supabase = await createClient()
  const { settings, missingTable } = await getAppSettings(supabase)

  return (
    <div className="p-5 md:p-8">
      <ReglagesClient initialSettings={settings} missingSettingsTable={missingTable} />
    </div>
  )
}
