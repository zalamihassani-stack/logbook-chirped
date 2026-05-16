'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials, ROLE_LABELS } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Scissors,
  Database,
  Settings,
  ClipboardList,
  Activity,
  Target,
  BookOpen,
  History,
  FlaskConical,
  LogOut,
  UserCircle,
  Plus,
} from 'lucide-react'
import PWAInstallBanner from '@/components/ui/PWAInstallBanner'
import PushNotifications from '@/components/pwa/PushNotifications'

const NAV = {
  admin: [
    { label: 'Accueil', icon: LayoutDashboard, path: '/admin' },
    { label: 'Utilisateurs', icon: Users, path: '/admin/utilisateurs' },
    { label: 'Gestes', icon: Scissors, path: '/admin/gestes' },
    { label: 'Données', icon: Database, path: '/admin/donnees' },
    { label: 'Réglages', icon: Settings, path: '/admin/reglages' },
  ],
  enseignant: [
    { label: 'Demandes', icon: ClipboardList, path: '/enseignant/demandes' },
    { label: 'Suivi', icon: Activity, path: '/enseignant/suivi' },
    { label: 'Accueil', icon: LayoutDashboard, path: '/enseignant', home: true },
    { label: 'Travaux', icon: FlaskConical, path: '/enseignant/travaux' },
    { label: 'Objectifs', icon: Target, path: '/enseignant/objectifs' },
  ],
  resident: [
    { label: 'Progression', icon: BookOpen, path: '/resident/progression' },
    { label: 'Mes actes', icon: History, path: '/resident/historique' },
    { label: 'Accueil', icon: LayoutDashboard, path: '/resident', home: true },
    { label: 'Travaux', icon: FlaskConical, path: '/resident/travaux' },
    { label: 'Référentiel', icon: Scissors, path: '/resident/referentiel' },
  ],
}

function useNavScroll(mainRef) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    let last = 0
    function onScroll() {
      const current = el.scrollTop
      if (Math.abs(current - last) < 4) return
      setHidden(current > last && current > 50)
      last = current
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [mainRef])
  return hidden
}

export default function AppLayout({ profile, children, badges = {} }) {
  const pathname = usePathname()
  const router = useRouter()
  const mainRef = useRef(null)
  const navHidden = useNavScroll(mainRef)
  const role = profile?.role ?? 'resident'
  const navItems = NAV[role] ?? []
  const profilePath = role === 'admin' ? '/admin/reglages' : role === 'resident' ? '/resident/profil' : role === 'enseignant' ? '/enseignant/profil' : null

  function isActive(path) {
    if (path === '/admin' || path === '/enseignant' || path === '/resident') return pathname === path
    return pathname.startsWith(path)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-ice">
      <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col bg-navy md:flex">
        <div className="flex flex-col items-center border-b border-white/10 px-4 pb-5 pt-6">
          <img src="/logo.png" alt="LCP" className="mb-2 h-16 w-16 object-contain" />
          <p className="text-center text-sm font-semibold leading-snug text-white">
            Logbook Chirurgie
            <br />
            Pédiatrique
          </p>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-navy">
              {getInitials(profile?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name ?? '-'}</p>
              <p className="text-xs text-sky">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(path)
            const badgeKey = path.split('/').pop()
            const badgeCount = badges[badgeKey] ?? 0
            return (
              <Link key={path} href={path}
                className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? 'bg-sky text-navy font-semibold' : 'text-white/70'}`}>
                <div className="relative flex-shrink-0">
                  <Icon size={18} strokeWidth={1.75} />
                  {badgeCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-2 pb-6">
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/10">
            <LogOut size={18} strokeWidth={1.75} />
            Déconnexion
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-white/10 bg-navy px-4 md:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="LCP" className="h-7 w-7 object-contain" />
          <span className="max-w-[160px] truncate text-xs font-medium text-white">{profile?.full_name ?? '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          {role === 'enseignant' && <PushNotifications compact />}
          {profilePath && (
            <Link href={profilePath} aria-label="Profil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/80">
              <UserCircle size={18} strokeWidth={1.75} />
            </Link>
          )}
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-white/65 transition-colors">
            <LogOut size={14} strokeWidth={1.75} />
            Déconnexion
          </button>
        </div>
      </header>

      <PWAInstallBanner />

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 pt-12 md:pb-0 md:pt-0">
        {profilePath && (
          <div className="sticky top-0 z-30 hidden justify-end gap-3 px-5 pt-4 md:flex md:px-8">
            {role === 'enseignant' && <PushNotifications />}
            <Link href={profilePath} aria-label="Profil"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
              <UserCircle size={20} strokeWidth={1.75} />
            </Link>
          </div>
        )}
        {children}
      </main>

      {role === 'resident' && !pathname.includes('/nouveau') && !pathname.includes('/modifier') && (
        <Link
          href="/resident/nouveau"
          aria-label="Ajouter un acte"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
          style={{ backgroundColor: 'var(--color-navy)' }}
        >
          <Plus size={24} strokeWidth={2.5} className="text-white" />
        </Link>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-navy md:hidden transition-transform duration-300 ${navHidden ? 'translate-y-full' : 'translate-y-0'}`}>
        {navItems.map(({ label, icon: Icon, path, home }) => {
          const active = isActive(path)
          const badgeKey = path.split('/').pop()
          const badgeCount = badges[badgeKey] ?? 0

          if (home) {
            return (
              <Link key={path} href={path} className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5">
                <div className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-navy shadow-lg ${active ? 'bg-sky' : 'bg-blue-600'}`}>
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} color="white" />
                </div>
                <span className={`text-[10px] leading-none ${active ? 'text-sky' : 'text-white/70'}`}>{label}</span>
              </Link>
            )
          }

          return (
            <Link key={path} href={path} className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 ${active ? 'text-sky' : 'text-white/50'}`}>
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2 : 1.75} />
                {badgeCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
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
