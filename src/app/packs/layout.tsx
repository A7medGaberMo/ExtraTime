import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExtraTime Pack Store & Arena | Open Authentic Football Player Packs',
  description: 'Open authentic ExtraTime tier packs (ICON, HERO, Master, Elite+, Elite) to draw legendary football stars directly from real-time database card draws.',
  openGraph: {
    title: 'ExtraTime Pack Arena | Collect Legendary Player Packs',
    description: 'Open ICON, HERO, Master, Elite+, and Elite tier packs in ExtraTime. Draw world-class football stars and inspect live random card showcases.',
    images: ['/ExtraTimeLogo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExtraTime Pack Arena | Collect Legendary Player Packs',
    description: 'Open ICON, HERO, Master, Elite+, and Elite tier packs in ExtraTime. Draw world-class football stars.',
  },
};

export default function PacksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
