import './globals.css'

export const metadata = {
  title: 'Logbook Chirurgie Pédiatrique',
  description: 'Application de suivi des actes chirurgicaux pédiatriques',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LCP',
  },
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
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
              })
            }
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
