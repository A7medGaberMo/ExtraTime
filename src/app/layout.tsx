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
  title: 'ExtraTime | Live Multiplayer Football Auction & Draft Game',
  description: 'Draft legendary football icons in real-time escalating auctions (Hidden Bid). Complete squads with 11P and 5P futsal formations, tactical Scout & Spy perks, and underdog budget bonuses!',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logos/et-logo-primary.svg',
  },
  openGraph: {
    title: 'ExtraTime | Live Multiplayer Football Auction Game',
    description: 'Draft legendary icons in real-time auctions with live turn timers, tactical perks, and 11P/5P pitch formations.',
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
