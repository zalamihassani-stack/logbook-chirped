import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PasswordChange from '@/components/profile/PasswordChange'
import AppCard from '@/components/ui/AppCard'
import InfoRow from '@/components/ui/InfoRow'

export default async function EnseignantProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, pendingInitialTravaux, pendingFinalTravaux, finalValidatedTravaux] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('encadrant_id', user.id).eq('validation_status', 'pending_initial'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('encadrant_id', user.id).eq('validation_status', 'pending_final'),
    supabase.from('travaux_scientifiques').select('id', { count: 'exact', head: true }).eq('encadrant_id', user.id).eq('validation_status', 'final_validated'),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-5 md:p-8">
      <BackLink href="/enseignant" />

      <ProfileSection title="Mes informations">
        <div className="space-y-3">
          <InfoRow label="Nom complet" value={profile?.full_name || '-'} />
          <InfoRow label="Rôle" value="Enseignant" />
        </div>
      </ProfileSection>

      <ProfileSection title="Validation des travaux encadrés">
        <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
          <ProfileStat label="Initiale à faire" value={pendingInitialTravaux.count ?? 0} href="/enseignant/travaux?validation=pending_initial" bg="var(--color-warning-light)" color="var(--color-warning)" />
          <ProfileStat label="Finale à faire" value={pendingFinalTravaux.count ?? 0} href="/enseignant/travaux?validation=pending_final" bg="#ffedd5" color="#9a3412" />
          <ProfileStat label="Finale faite" value={finalValidatedTravaux.count ?? 0} href="/enseignant/travaux?validation=final_validated" bg="var(--color-success-light)" color="var(--color-success)" />
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

function BackLink({ href }) {
  return (
    <Link href={href} className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md" style={{ color: 'var(--color-navy)' }}>
      <ArrowLeft size={16} />
      Retour
    </Link>
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

function ProfileStat({ label, value, href, bg, color }) {
  return (
    <Link href={href} className="rounded-xl p-4 transition hover:opacity-90" style={{ backgroundColor: bg }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: `${color}cc` }}>{label}</p>
    </Link>
  )
}

