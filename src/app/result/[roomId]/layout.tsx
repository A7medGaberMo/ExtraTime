import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Match Results & Squad Overview | ExtraTime',
  description: 'View the final match score, tactical formations, and player signings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
