import type { Metadata } from 'next';
import '@/styles/game-hub.css';

export const metadata: Metadata = {
  title: 'Bank - High-Stakes Football Trivia Arena',
  description:
    'Answer football trivia in streaks to double points up to 2,048. Bank your vault before one miss wipes it all.',
  keywords: [
    'Football Bank Trivia',
    'Football Streak Game',
    'Double or Nothing Football',
    'Live 1v1 Football Quiz',
    'ExtraTime Bank Arena',
  ],
  alternates: {
    canonical: '/bank',
  },
  openGraph: {
    type: 'website',
    url: '/bank',
    title: 'Bank | High-Stakes Football Trivia Arena | ExtraTime',
    description:
      'Answer football trivia in streaks to double points. Bank your vault before one miss wipes it all.',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Bank High-Stakes Trivia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bank | High-Stakes Football Trivia Arena',
    description:
      'Answer football trivia in streaks to double points. Bank your vault before one miss wipes it all.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-game="bank" className="contents">
      {children}
    </div>
  );
}
