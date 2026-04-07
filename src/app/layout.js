import './globals.css'

export const metadata = {
  title: 'Logbook Chirurgie Pédiatrique',
  description: 'Application de suivi des actes chirurgicaux pédiatriques',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LCP',
  },
  formatDetection: { telephone: false },
}

export const viewport = {
  themeColor: '#0D2B4E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LCP" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('SW registered', reg.scope); })
                  .catch(function(err) { console.log('SW error', err); });
              });
            }
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
