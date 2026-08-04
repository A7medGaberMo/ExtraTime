import type { Metadata } from 'next';

export interface PageSeoConfig {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const DEFAULT_SEO = {
  siteName: 'ExtraTime — Ultimate Football Draft & Auction Duel',
  defaultTitle: 'ExtraTime — Ultimate Football Draft & Auction Duel',
  defaultDescription:
    'Draft real player cards, activate tactical perks, outbid rivals in real-time hidden auctions, and build high-chemistry squads in ExtraTime.',
  siteUrl: 'https://extratime.app',
  ogImage: '/icon.png',
  twitterHandle: '@extratimeapp',
};

export function constructMetadata({
  title,
  description,
  path = '',
  ogImage = DEFAULT_SEO.ogImage,
  noIndex = false,
}: PageSeoConfig): Metadata {
  const fullTitle = title === DEFAULT_SEO.defaultTitle ? title : `${title} | ExtraTime`;
  const url = `${DEFAULT_SEO.siteUrl}${path}`;

  return {
    title: fullTitle,
    description: description || DEFAULT_SEO.defaultDescription,
    keywords: [
      'Football Draft',
      'Auction Duel',
      'Tactical Perks',
      'Ultimate Team',
      'Real-time Football Game',
      'Hidden Bidding',
      'Squad Chemistry',
      'ExtraTime',
    ],
    authors: [{ name: 'ExtraTime Team' }],
    creator: 'ExtraTime',
    metadataBase: new URL(DEFAULT_SEO.siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: description || DEFAULT_SEO.defaultDescription,
      url,
      siteName: DEFAULT_SEO.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description || DEFAULT_SEO.defaultDescription,
      images: [ogImage],
      creator: DEFAULT_SEO.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
  };
}
