export default function manifest() {
  return {
    name: 'Logbook Chirurgie Pédiatrique',
    short_name: 'LCP',
    description: 'Application de suivi des actes chirurgicaux pédiatriques',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0D2B4E',
    theme_color: '#0D2B4E',
    categories: ['medical', 'education'],
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
