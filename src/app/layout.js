import './globals.css'
import SWRegister from '@/components/pwa/SWRegister'

export const metadata = {
  title: 'Logbook Chirurgie P\u00e9diatrique',
  description: 'Application de suivi des actes chirurgicaux p\u00e9diatriques',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LCP',
  },
  formatDetection: { telephone: false },
}

export const viewport = {
  themeColor: 'var(--color-navy)',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LCP" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <SWRegister />
        {children}
      </body>
    </html>
  )
}
