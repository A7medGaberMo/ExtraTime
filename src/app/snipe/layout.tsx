import type { Metadata } from 'next';
import '@/styles/snipe-hub.css';

export const metadata: Metadata = {
  title: 'Snipe - Live Football Auction & Secret Bid Duels',
  description:
    'Draft marquee stars with secret sealed bids in Snipe auctions. Read the room, outsmart your rivals, and build an unbeatable starting XI.',
  keywords: [
    'Snipe Football Auction',
    'Secret Bid Football Game',
    'ExtraTime Snipe',
    'Tactical Football Draft',
    '1v1 Football Auction Arena',
  ],
  alternates: {
    canonical: '/snipe',
  },
  openGraph: {
    type: 'website',
    url: '/snipe',
    title: 'Snipe | Live Football Auction Arena | ExtraTime',
    description:
      'Place hidden bids, read the competition, and build a stronger XI in live tactical football auctions.',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Snipe Football Auction Arena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snipe | Live Football Auction Arena',
    description:
      'Outsmart rivals with hidden bids and draft your ultimate starting XI in ExtraTime Snipe.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function SnipeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-game="snipe" className="contents">
      {children}
    </div>
  );
}
