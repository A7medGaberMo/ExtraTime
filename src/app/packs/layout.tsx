import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Player Cards & Packs | ExtraTime',
  description: 'Browse the full player database and test tier card pack drops in ExtraTime.',
  openGraph: {
    title: 'Player Cards & Packs | ExtraTime',
    description: 'Browse players and open card packs across all tiers in ExtraTime.',
    images: ['/ExtraTimeLogo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Player Cards & Packs | ExtraTime',
    description: 'Browse players and open card packs across all tiers in ExtraTime.',
  },
};

export default function PacksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
