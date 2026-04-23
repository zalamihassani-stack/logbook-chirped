import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInitials } from '@/lib/utils'
import PasswordChange from '@/components/profile/PasswordChange'

export default async function EnseignantProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl space-y-4 p-5 md:p-8">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: '#E8F4FC', color: '#0D2B4E' }}
          >
            {getInitials(profile?.full_name)}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#0D2B4E' }}>{profile?.full_name}</h1>
            <p className="text-sm text-slate-500">Enseignant</p>
            <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <PasswordChange />
    </div>
  )
}
