import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Snipe Match - Enter Room Code',
  description:
    'Join an existing ExtraTime Snipe match using a 6-digit match code. Challenge friends in real-time secret bid auctions.',
  alternates: {
    canonical: '/join-room',
  },
  openGraph: {
    title: 'Join Snipe Match | ExtraTime',
    description: 'Enter your match code and compete in real-time football draft duels.',
    images: ['/ExtraTimeLogo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join Snipe Match | ExtraTime',
    description: 'Enter your match code and compete in real-time football draft duels.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function JoinRoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
