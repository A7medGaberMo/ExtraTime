import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Card Collection & Pack Opening Arena',
  description:
    'Browse the full ExtraTime football player database with Ultimate, Gold, Silver, Bronze, and Icon tier cards. Test pack opening odds and card collections.',
  keywords: [
    'Football Cards Collection',
    'FIFA Player Cards',
    'Football Pack Opening Simulator',
    'Football Legends Database',
    'ExtraTime Card Gallery',
  ],
  alternates: {
    canonical: '/packs',
  },
  openGraph: {
    title: 'Card Collection & Pack Opening Arena | ExtraTime',
    description:
      'Explore active superstars and legendary icons. Open virtual card cases across all rarity tiers.',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Card Collection and Packs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Card Collection & Pack Opening Arena | ExtraTime',
    description:
      'Explore active superstars and legendary icons. Open virtual card cases across all rarity tiers.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return children;
}

