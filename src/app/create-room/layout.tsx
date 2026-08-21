import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Snipe Match - Custom Football Auction Room',
  description:
    'Create a custom multiplayer Snipe match room. Customize budget ($100M-$200M), squad size (11v11 or 5v5), and player pools (Active, Global, Premier League, Legends).',
  keywords: [
    'Create Football Auction Room',
    'Custom Football Draft',
    'Snipe 11v11 Room',
    'Futsal 5v5 Room',
    'Football Strategy Multiplayer',
  ],
  alternates: {
    canonical: '/create-room',
  },
  openGraph: {
    title: 'Create Snipe Match | ExtraTime Football Strategy',
    description:
      'Set the rules, choose budget and squad formation, and invite rival managers with a private room code.',
    images: ['/ExtraTimeLogo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Snipe Match | ExtraTime',
    description: 'Customize match rules and draft legendary squads in real-time.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function CreateRoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
