import type { Metadata, Viewport } from 'next';
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Noto_Kufi_Arabic,
  Rajdhani,
  Anton,
  Bebas_Neue,
  Amiri,
  Felipa,
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

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-amiri',
});

const felipa = Felipa({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-felipa',
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
    default: 'ExtraTime | Tactical Football Arena',
    template: '%s | ExtraTime',
  },
  description:
    'Tactical football strategy: snipe star players with secret bids and order legends by official records.',
  keywords: [
    'ExtraTime Football',
    'Snipe Auction',
    'Rank Football Trivia',
    'Tactical Squad Builder',
    'Football Player Cards',
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
    title: 'ExtraTime | Tactical Football Arena',
    description:
      'Snipe star players with secret bids and order legends by official records.',
    siteName: 'ExtraTime',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Tactical Football Arena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExtraTime | Tactical Football Arena',
    description: 'Snipe star players with secret bids and order legends by official records.',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Felipa&family=Story+Script&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexArabic.variable} ${notoKufiArabic.variable} ${rajdhani.variable} ${anton.variable} ${bebas.variable} ${amiri.variable} ${felipa.variable} bg-background text-foreground selection:bg-lime selection:text-background flex min-h-screen flex-col justify-between overflow-x-hidden font-sans antialiased`}
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
