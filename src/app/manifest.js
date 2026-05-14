export default function manifest() {
  return {
    id: '/',
    name: 'Logbook Chirurgie P\u00e9diatrique',
    short_name: 'LCP',
    description: 'Application de suivi des actes chirurgicaux p\u00e9diatriques',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: 'var(--color-navy)',
    theme_color: 'var(--color-navy)',
    categories: ['medical', 'education'],
    icons: [
      {
        src: '/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
