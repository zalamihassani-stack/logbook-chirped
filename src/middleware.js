import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const ROLE_HOME = { admin: '/admin', enseignant: '/enseignant', resident: '/resident' }

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchit la session (ne pas supprimer)
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Route login : si connecté, rediriger vers l'espace du rôle
  if (pathname === '/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const dest = ROLE_HOME[profile?.role] ?? '/resident'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Racine : rediriger selon connexion
  if (pathname === '/') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    return NextResponse.redirect(new URL(ROLE_HOME[profile?.role] ?? '/login', request.url))
  }

  // Routes protégées : non connecté → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Vérification de rôle sur les préfixes /admin, /enseignant, /resident
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL(ROLE_HOME[profile?.role] ?? '/login', request.url))
  }
  if (pathname.startsWith('/enseignant') && profile?.role !== 'enseignant') {
    return NextResponse.redirect(new URL(ROLE_HOME[profile?.role] ?? '/login', request.url))
  }
  if (pathname.startsWith('/resident') && profile?.role !== 'resident') {
    return NextResponse.redirect(new URL(ROLE_HOME[profile?.role] ?? '/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
