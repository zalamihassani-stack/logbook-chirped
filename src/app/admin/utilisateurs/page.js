import { createClient } from '@/lib/supabase/server'
import UserManagement from './UserManagement'

export default async function UtilisateursPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, promotion, residanat_start_date, is_active')
    .order('full_name')

  return (
    <div className="p-5 md:p-8">
      <UserManagement initialUsers={users ?? []} />
    </div>
  )
}
