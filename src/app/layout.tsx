import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Sans_Arabic, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { ToastProvider } from '@/components/shared/toast';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MainWrapper } from '@/components/layout/main-wrapper';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
});

// DIN-style condensed — authentic FUT/EA FC card typography
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://extratime.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ExtraTime | Secret Bids & Rank Duels',
    template: '%s | ExtraTime',
  },
  description:
    'Draft stars with secret sealed bids and order football legends by official records.',
  keywords: [
    'ExtraTime Football',
    'Snipe Secret Bid',
    'Rank Trivia Duel',
    'Tactical Football Arena',
  ],
  authors: [{ name: 'ExtraTime' }],
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
    title: 'ExtraTime | Secret Bids & Rank Duels',
    description:
      'Draft stars with secret sealed bids and order football legends by official records.',
    siteName: 'ExtraTime',
    images: [
      {
        url: '/ExtraTimeLogo.png',
        width: 1200,
        height: 630,
        alt: 'ExtraTime Football Arena',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExtraTime | Secret Bids & Rank Duels',
    description: 'Draft stars with secret sealed bids and order football legends by official records.',
    images: ['/ExtraTimeLogo.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'ExtraTime',
      description:
        'Live multiplayer tactical football drafts and official record trivia rank arena.',
      publisher: {
        '@type': 'Organization',
        name: 'ExtraTime',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/ExtraTimeLogo.png`,
        },
      },
      inLanguage: ['en-US', 'ar-EG'],
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#app`,
      name: 'ExtraTime',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`dark ${inter.variable} ${plexArabic.variable} ${barlowCondensed.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="bg-background text-foreground selection:bg-lime selection:text-background flex min-h-screen flex-col justify-between overflow-x-hidden font-sans antialiased"
      >
        <ConvexClientProvider>
          <I18nProvider>
            <ToastProvider>
              <Header />
              <MainWrapper>
                {children}
              </MainWrapper>
              <Footer />
            </ToastProvider>
          </I18nProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
