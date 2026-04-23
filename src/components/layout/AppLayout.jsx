'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials, ROLE_LABELS } from '@/lib/utils'
import {
  LayoutDashboard, Users, Scissors, Database, Settings,
  ClipboardList, Activity, Target, BookOpen,
  Plus, History, FlaskConical, LogOut, UserCircle,
} from 'lucide-react'
import PWAInstallBanner from '@/components/ui/PWAInstallBanner'

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
    { label: 'Suivi',      icon: Activity,        path: '/enseignant/suivi' },
    { label: 'Accueil',    icon: LayoutDashboard, path: '/enseignant', home: true },
    { label: 'Gestes',     icon: Scissors,        path: '/enseignant/gestes' },
    { label: 'Objectifs',  icon: Target,          path: '/enseignant/objectifs' },
  ],
  resident: [
    { label: 'Progression', icon: BookOpen,       path: '/resident/progression' },
    { label: 'Historique', icon: History,         path: '/resident/historique' },
    { label: 'Accueil',    icon: LayoutDashboard, path: '/resident', home: true },
    { label: 'Travaux',    icon: FlaskConical,    path: '/resident/travaux' },
    { label: 'Profil',     icon: UserCircle,      path: '/resident/profil' },
  ],
}

export default function AppLayout({ profile, children, badges = {} }) {
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
        <div className="flex flex-col items-center pt-6 pb-5 px-4 border-b border-white/10">
          <img src="/logo.png" alt="LCP" className="w-16 h-16 object-contain mb-2" />
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
            const badgeKey = path.split('/').pop()
            const badgeCount = badges[badgeKey] ?? 0
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
                <div className="relative flex-shrink-0">
                  <Icon size={18} strokeWidth={1.75} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
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

      {/* ── Header mobile ── */}
      <header
        className="fixed top-0 left-0 right-0 flex md:hidden items-center justify-between px-4 h-12 z-40 border-b"
        style={{ backgroundColor: '#0D2B4E', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="LCP" className="w-7 h-7 object-contain" />
          <span className="text-white text-xs font-medium truncate max-w-[160px]">
            {profile?.full_name ?? '—'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Déconnexion
        </button>
      </header>

      <PWAInstallBanner />

      {/* ── Contenu ── */}
      <main className="flex-1 overflow-y-auto pb-20 pt-12 md:pt-0 md:pb-0">
        {children}
      </main>

      {/* ── FAB Nouveau geste (résident, mobile) ── */}
      {role === 'resident' && (
        <a
          href="/resident/nouveau"
          className="fixed md:hidden z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
          style={{
            bottom: '72px',
            right: '16px',
            backgroundColor: '#0D2B4E',
            color: 'white',
          }}
        >
          <Plus size={18} strokeWidth={2} />
          <span className="text-sm font-medium">Nouveau geste</span>
        </a>
      )}

      {/* ── Bottom nav mobile ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex md:hidden border-t z-50"
        style={{ backgroundColor: '#0D2B4E', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        {navItems.map(({ label, icon: Icon, path, home }) => {
          const active = isActive(path)
          const badgeKey = path.split('/').pop()
          const badgeCount = badges[badgeKey] ?? 0
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
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 relative"
              style={{ color: active ? '#7BB8E8' : 'rgba(255,255,255,0.5)' }}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2 : 1.75} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
