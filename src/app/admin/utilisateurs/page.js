import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import UserManagement from './UserManagement'

export default async function UtilisateursPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, service, promotion, residanat_start_date, is_active')
    .order('full_name')

  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emailById = new Map((authUsers?.users ?? []).map((user) => [user.id, user.email]))
  const enrichedUsers = (users ?? []).map((user) => ({
    ...user,
    email: emailById.get(user.id) ?? '',
  }))

  return (
    <div className="p-5 md:p-8">
      <UserManagement initialUsers={enrichedUsers} />
    </div>
  )
}
