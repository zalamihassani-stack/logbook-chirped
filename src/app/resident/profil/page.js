import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getResidentYear, formatDate } from '@/lib/utils'
import PasswordChange from '@/components/profile/PasswordChange'

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
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          Mes informations
        </p>
        <div className="space-y-3">
          <InfoRow label="Nom complet" value={profile?.full_name || '-'} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          Mon année
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoCard label="Année actuelle" value={`A${year}`} />
          <InfoCard label="Promotion" value={profile?.promotion || '-'} />
          <InfoCard
            label="Début résidanat"
            value={profile?.residanat_start_date ? formatDate(profile.residanat_start_date) : '-'}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
          Mon compte
        </p>
        <div className="space-y-4">
          <InfoRow label="Adresse email" value={user.email || '-'} />
          <hr className="border-slate-100" />
          <PasswordChange />
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
        {value}
      </p>
    </div>
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
