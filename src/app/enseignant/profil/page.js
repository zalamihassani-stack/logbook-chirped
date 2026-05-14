import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import PasswordChange from '@/components/profile/PasswordChange'

export default async function EnseignantProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, pendingInitialTravaux, pendingFinalTravaux, finalValidatedTravaux] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('travaux_scientifiques')
      .select('id', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'pending_initial'),
    supabase
      .from('travaux_scientifiques')
      .select('id', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'pending_final'),
    supabase
      .from('travaux_scientifiques')
      .select('id', { count: 'exact', head: true })
      .eq('encadrant_id', user.id)
      .eq('validation_status', 'final_validated'),
  ])

  return (
    <div className="max-w-2xl space-y-4 p-5 md:p-8">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: 'var(--color-ice)', color: 'var(--color-navy)' }}
          >
            {getInitials(profile?.full_name)}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>{profile?.full_name}</h1>
            <p className="text-sm text-slate-500">Enseignant</p>
            <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>Validation des travaux encadrés</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <ProfileStat
            label="Initiale à faire"
            value={pendingInitialTravaux.count ?? 0}
            href="/enseignant/travaux?validation=pending_initial"
            bg="var(--color-warning-light)"
            color="var(--color-warning)"
          />
          <ProfileStat
            label="Finale à faire"
            value={pendingFinalTravaux.count ?? 0}
            href="/enseignant/travaux?validation=pending_final"
            bg="#ffedd5"
            color="#9a3412"
          />
          <ProfileStat
            label="Finale faite"
            value={finalValidatedTravaux.count ?? 0}
            href="/enseignant/travaux?validation=final_validated"
            bg="var(--color-success-light)"
            color="var(--color-success)"
          />
        </div>
      </div>

      <PasswordChange />
    </div>
  )
}

function ProfileStat({ label, value, href, bg, color }) {
  return (
    <Link href={href} className="rounded-xl p-3 transition hover:opacity-90" style={{ backgroundColor: bg }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: `${color}cc` }}>{label}</p>
    </Link>
  )
}
