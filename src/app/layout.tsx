import type { Metadata, Viewport } from 'next';
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Noto_Kufi_Arabic,
  Rajdhani,
  Anton,
  Bebas_Neue,
} from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { ToastProvider } from '@/components/shared/toast';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-sans',
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-ibm-arabic',
});

const notoKufiArabic = Noto_Kufi_Arabic({
  weight: ['400', '600', '700', '900'],
  subsets: ['arabic'],
  variable: '--font-noto-arabic',
});

const rajdhani = Rajdhani({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
});

const anton = Anton({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-anton',
});

const bebas = Bebas_Neue({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-bebas',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://extratime.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ExtraTime | Live Multiplayer Football Snipe & Rank Arena',
    template: '%s | ExtraTime Football Strategy',
  },
  description:
    'Draft legendary football icons in real-time Snipe auctions and compete in official Rank trivia duels. Build winning 11v11 and 5v5 futsal squads with tactical Scout & Spy perks.',
  keywords: [
    'Snipe Football Game',
    'ExtraTime Draft Engine',
    'Multiplayer Football Auction',
    'Rank Football Trivia',
    'Tactical Football Squad Builder',
    'Football Player Cards',
    'Futsal 5v5 Tactical Match',
    'UCL Trivia Ranking',
    'Ballon dOr Stats Game',
    'Football Strategy Game',
    'Live Secret Bid Auction',
  ],
  authors: [{ name: 'ExtraTime Media' }],
  creator: 'ExtraTime',
  publisher: 'ExtraTime',
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/?lang=en',
      'ar-EG': '/?lang=ar',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [{ url: '/ETIcon.png?v=2', type: 'image/png' }, { url: '/favicon.ico?v=2' }],
    shortcut: '/ETIcon.png?v=2',
    apple: '/ETIcon.png?v=2',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'ExtraTime | Live Multiplayer Football Snipe & Rank Arena',
    description:
      'Snipe legendary icons in real-time auctions with live turn timers, tactical perks, and 11v11 / 5v5 pitch formations.',
    siteName: 'ExtraTime',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Live Multiplayer Football Snipe & Rank Arena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExtraTime | Live Football Snipe Game',
    description: 'Real-time secret bid auctions, tactical pitch management, and dynamic perks.',
    images: ['/ExtraTimeLogo.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#app`,
      name: 'ExtraTime',
      url: siteUrl,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      description:
        'Draft legendary football icons in real-time Snipe auctions and compete in official Rank trivia duels.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      genre: ['Sports Game', 'Strategy Game', 'Trivia'],
      screenshot: `${siteUrl}/ExtraTimeLogo.png`,
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'ExtraTime',
      url: siteUrl,
      logo: `${siteUrl}/ETIcon.png`,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark overflow-x-hidden">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexArabic.variable} ${notoKufiArabic.variable} ${rajdhani.variable} ${anton.variable} ${bebas.variable} bg-background text-foreground selection:bg-lime selection:text-background flex min-h-screen flex-col justify-between overflow-x-hidden font-sans antialiased`}
      >
        <ConvexClientProvider>
          <I18nProvider>
            <ToastProvider>
              <Header />
              <main className="animate-fade-in mx-auto w-full max-w-7xl flex-1 px-3.5 py-6 pb-24 sm:px-6 md:py-8 md:pb-8">
                {children}
              </main>
              <Footer />
              <MobileNav />
            </ToastProvider>
          </I18nProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
