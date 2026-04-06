'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials, ROLE_LABELS } from '@/lib/utils'
import {
  LayoutDashboard, Users, Scissors, Database, Settings,
  ClipboardList, UserCheck, Target, BookOpen,
  PlusCircle, History, FlaskConical, LogOut,
} from 'lucide-react'

const NAV = {
  admin: [
    { label: 'Accueil',      icon: LayoutDashboard, path: '/admin' },
    { label: 'Utilisateurs', icon: Users,           path: '/admin/utilisateurs' },
    { label: 'Gestes',       icon: Scissors,        path: '/admin/gestes' },
    { label: 'Données',      icon: Database,        path: '/admin/donnees' },
    { label: 'Réglages',     icon: Settings,        path: '/admin/reglages' },
  ],
  enseignant: [
    { label: 'Demandes',   icon: ClipboardList,   path: '/enseignant/demandes' },
    { label: 'Résidents',  icon: UserCheck,       path: '/enseignant/residents' },
    { label: 'Accueil',    icon: LayoutDashboard, path: '/enseignant', home: true },
    { label: 'Gestes',     icon: Scissors,        path: '/enseignant/gestes' },
    { label: 'Objectifs',  icon: Target,          path: '/enseignant/objectifs' },
  ],
  resident: [
    { label: 'Accueil',     icon: LayoutDashboard, path: '/resident' },
    { label: 'Référentiel', icon: BookOpen,        path: '/resident/referentiel' },
    { label: 'Nouveau',     icon: PlusCircle,      path: '/resident/nouveau' },
    { label: 'Historique',  icon: History,         path: '/resident/historique' },
    { label: 'Travaux',     icon: FlaskConical,    path: '/resident/travaux' },
  ],
}

export default function AppLayout({ profile, children }) {
  const pathname = usePathname()
  const router = useRouter()
  const role = profile?.role ?? 'resident'
  const navItems = NAV[role] ?? []

  function isActive(path) {
    if (path === '/admin' || path === '/enseignant' || path === '/resident') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#E8F4FC' }}>

      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 w-60 h-screen sticky top-0"
        style={{ backgroundColor: '#0D2B4E' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center pt-7 pb-5 px-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/15">
            <span className="text-white font-bold text-sm tracking-wider">LCP</span>
          </div>
          <p className="text-white font-semibold text-sm text-center leading-snug">
            Logbook Chirurgie<br />Pédiatrique
          </p>
        </div>

        {/* Profil */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: '#7BB8E8', color: '#0D2B4E' }}
            >
              {getInitials(profile?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name ?? '—'}</p>
              <p className="text-xs" style={{ color: '#7BB8E8' }}>{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                href={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-colors"
                style={active
                  ? { backgroundColor: '#7BB8E8', color: '#0D2B4E', fontWeight: 600 }
                  : { color: 'rgba(255,255,255,0.72)' }
                }
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Déconnexion */}
        <div className="px-2 pb-6">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            <LogOut size={18} strokeWidth={1.75} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex md:hidden border-t z-50"
        style={{ backgroundColor: '#0D2B4E', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        {navItems.map(({ label, icon: Icon, path, home }) => {
          const active = isActive(path)
          if (home) {
            return (
              <Link
                key={path}
                href={path}
                className="flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 relative"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg border-2"
                  style={{
                    backgroundColor: active ? '#7BB8E8' : '#2563eb',
                    borderColor: '#0D2B4E',
                  }}
                >
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} color="white" />
                </div>
                <span className="text-[10px] leading-none" style={{ color: active ? '#7BB8E8' : 'rgba(255,255,255,0.7)' }}>
                  {label}
                </span>
              </Link>
            )
          }
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5"
              style={{ color: active ? '#7BB8E8' : 'rgba(255,255,255,0.5)' }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
