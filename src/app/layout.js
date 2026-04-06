import './globals.css'

export const metadata = {
  title: 'Logbook Chirurgie Pédiatrique',
  description: 'Application de suivi des actes chirurgicaux pédiatriques',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
