import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PasswordChange from '@/components/profile/PasswordChange'
import AppCard from '@/components/ui/AppCard'
import InfoRow from '@/components/ui/InfoRow'

export default async function AdminProfilPage() {
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
    <div className="mx-auto max-w-2xl space-y-4 p-5 md:p-8">
      <ProfileSection title="Mes informations">
        <div className="space-y-3">
          <InfoRow label="Nom complet" value={profile?.full_name || '-'} />
          <InfoRow label="Rôle" value="Administrateur" />
        </div>
      </ProfileSection>

      <ProfileSection title="Mon compte">
        <div className="space-y-4">
          <InfoRow label="Adresse email" value={user.email || '-'} />
          <hr className="border-slate-100" />
          <PasswordChange />
        </div>
      </ProfileSection>
    </div>
  )
}

function ProfileSection({ title, children }) {
  return (
    <AppCard as="section" className="p-5">
      <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
        {title}
      </p>
      {children}
    </AppCard>
  )
}

