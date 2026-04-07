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
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
