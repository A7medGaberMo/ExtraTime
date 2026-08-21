import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Snipe Auction Matchday | ExtraTime',
  description: 'Live secret bid auction matchday in progress with real-time timers and tactical perks.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuctionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
