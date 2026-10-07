import type { Metadata } from 'next';
import '@/styles/game-hub.css';

export const metadata: Metadata = {
  title: 'Draft - Live 1v1 Football Squad Draft',
  description:
    'Pick real players in turns, link club, league, and nation chemistry, and build your best starting XI in head-to-head draft showdowns.',
  keywords: [
    'Pro Draft Football',
    'Tactical Football Draft',
    'ExtraTime Draft',
    '1v1 Draft Derby',
    'Squad Chemistry Builder',
  ],
  alternates: {
    canonical: '/draft',
  },
  openGraph: {
    type: 'website',
    url: '/draft',
    title: 'Draft | Live 1v1 Squad Draft Arena | ExtraTime',
    description:
      'Pick real players in turns, build your best XI, and defeat rivals in tactical 1v1 draft showdowns.',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Pro Draft Arena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft | Live 1v1 Squad Draft Arena',
    description:
      'Build your ultimate starting XI and outsmart your rival in ExtraTime Draft.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function DraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-game="draft" className="contents">
      {children}
    </div>
  );
}
