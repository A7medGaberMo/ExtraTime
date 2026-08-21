import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExtraTime | Live Multiplayer Football Strategy & Trivia',
    short_name: 'ExtraTime',
    description:
      'Draft legendary football icons in real-time Snipe auctions and compete in official Rank trivia duels.',
    start_url: '/',
    display: 'standalone',
    background_color: '#060a12',
    theme_color: '#95e810',
    icons: [
      {
        src: '/ETIcon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/ExtraTimeLogo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['games', 'sports', 'entertainment'],
  };
}
