import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getResidentYear, formatDate } from '@/lib/utils'
import PasswordChange from '@/components/profile/PasswordChange'
import AppCard from '@/components/ui/AppCard'
import InfoRow from '@/components/ui/InfoRow'

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, residanat_start_date, promotion')
    .eq('id', user.id)
    .single()

  const year = getResidentYear(profile?.residanat_start_date)

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-5 md:p-8">
      <BackLink href="/resident" />

      <ProfileSection title="Mes informations">
        <InfoRow label="Nom complet" value={profile?.full_name || '-'} />
      </ProfileSection>

      <ProfileSection title="Mon année">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoCard label="Année actuelle" value={`A${year}`} />
          <InfoCard label="Promotion" value={profile?.promotion || '-'} />
          <InfoCard
            label="Début résidanat"
            value={profile?.residanat_start_date ? formatDate(profile.residanat_start_date) : '-'}
          />
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
    <Link
      href={href}
      className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md"
      style={{ color: 'var(--color-navy)' }}
    >
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

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold" style={{ color: 'var(--color-navy)' }}>
        {value}
      </p>
    </div>
  )
}

