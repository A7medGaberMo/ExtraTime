import type { Metadata } from 'next';
import { Sora, Inter, Rajdhani, Anton, Bebas_Neue, Inter_Tight } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const rajdhani = Rajdhani({ 
  weight: ['400', '500', '600', '700'], 
  subsets: ['latin'], 
  variable: '--font-rajdhani' 
});
const anton = Anton({ weight: ['400'], subsets: ['latin'], variable: '--font-anton' });
const bebas = Bebas_Neue({ weight: ['400'], subsets: ['latin'], variable: '--font-bebas' });
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight' });

export const metadata: Metadata = {
  title: {
    default: 'ExtraTime | Live Multiplayer Football Auction & Draft Arena',
    template: '%s | ExtraTime Football Draft',
  },
  description: 'Draft legendary football icons in real-time escalating auctions (Hidden Bid). Build winning 11v11 and 5v5 futsal squads with tactical Scout & Spy perks and dynamic budget strategy.',
  keywords: [
    'Football Draft Game',
    'Multiplayer Football Auction',
    'Hidden Bid Football',
    'Tactical Football Squad Builder',
    'Football Player Cards',
    'ExtraTime Draft Engine',
    'Football Manager Online',
  ],
  authors: [{ name: 'ExtraTime Media' }],
  creator: 'ExtraTime',
  publisher: 'ExtraTime',
  icons: {
    icon: [
      { url: '/ETIcon.png?v=2', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
    ],
    shortcut: '/ETIcon.png?v=2',
    apple: '/ETIcon.png?v=2',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://extratime.app',
    title: 'ExtraTime | Live Multiplayer Football Auction Arena',
    description: 'Draft legendary icons in real-time auctions with live turn timers, tactical perks, and 11v11 / 5v5 pitch formations.',
    siteName: 'ExtraTime',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Live Multiplayer Football Auction & Draft Arena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExtraTime | Live Football Auction Game',
    description: 'Real-time blind auctions, tactical pitch management, and dynamic perks.',
    images: ['/ExtraTimeLogo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.variable} ${inter.variable} ${rajdhani.variable} ${anton.variable} ${bebas.variable} ${interTight.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col selection:bg-lime selection:text-background`}>
        <ConvexClientProvider>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
