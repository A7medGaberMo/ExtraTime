import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rank Challenge - Football Trivia & Hierarchy Duel',
  description:
    'Order 5 clubs, superstars, historic seasons, and tournament records by accurate official metrics in 45-second rounds. Play Solo Sprint or live 1v1 Duels.',
  keywords: [
    'Football Rank Game',
    'Football Trivia Arena',
    'UCL Records Ranking',
    'Ballon dOr Ranking Game',
    'Football Stats Hierarchy',
    '1v1 Football Trivia Duel',
  ],
  alternates: {
    canonical: '/rank',
  },
  openGraph: {
    type: 'website',
    url: '/rank',
    title: 'Rank Challenge | Football Trivia & Hierarchy Duel | ExtraTime',
    description:
      'Order 5 clubs, superstars, and tournament records by official metrics in 45s rounds. Compete in Solo Sprint or 1v1 Duels.',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Rank Challenge Football Trivia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rank Challenge | Football Trivia & Hierarchy Duel',
    description:
      'Test your football IQ by ordering clubs, seasons, and icons by official records.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function RankLayout({ children }: { children: React.ReactNode }) {
  return children;
}
