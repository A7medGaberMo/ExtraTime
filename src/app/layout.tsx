import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Noto_Sans_Arabic,
  Barlow_Condensed,
  Sora,
  Plus_Jakarta_Sans,
  Changa,
  Lalezar,
  Reem_Kufi,
  Noto_Kufi_Arabic,
  Cairo,
} from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { ToastProvider } from '@/components/shared/toast';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/layout/header';
import { MainWrapper } from '@/components/layout/main-wrapper';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-arabic',
  display: 'swap',
});

// DIN-style condensed — authentic FUT/EA FC card typography
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const changa = Changa({
  subsets: ['arabic'],
  weight: ['500', '600', '700'],
  variable: '--font-changa',
  display: 'swap',
});

const lalezar = Lalezar({
  subsets: ['arabic'],
  weight: ['400'],
  variable: '--font-lalezar',
  display: 'swap',
});

const reemKufi = Reem_Kufi({
  subsets: ['arabic'],
  weight: ['500', '600', '700'],
  variable: '--font-reem-kufi',
  display: 'swap',
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['600', '700'],
  variable: '--font-noto-kufi',
  display: 'swap',
});

const cairoArabic = Cairo({
  subsets: ['arabic'],
  weight: ['900'],
  variable: '--font-cairo-arabic',
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
    icon: [{ url: '/ETIcon.png?v=2', type: 'image/png' }],
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
    description:
      'Draft stars with secret sealed bids and order football legends by official records.',
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
      className={`dark ${inter.variable} ${notoSansArabic.variable} ${barlowCondensed.variable} ${sora.variable} ${plusJakarta.variable} ${changa.variable} ${lalezar.variable} ${reemKufi.variable} ${notoKufiArabic.variable} ${cairoArabic.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-canvas text-foreground selection:bg-brand selection:text-canvas flex min-h-screen w-full max-w-[100vw] flex-col justify-between overflow-x-hidden font-sans antialiased">
        <ConvexClientProvider>
          <I18nProvider>
            <ToastProvider>
              <Header />
              <MainWrapper>{children}</MainWrapper>
            </ToastProvider>
          </I18nProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
