import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://extratime.app';
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${baseUrl}?lang=en`,
          ar: `${baseUrl}?lang=ar`,
        },
      },
    },
    {
      url: `${baseUrl}/rank`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/rank?lang=en`,
          ar: `${baseUrl}/rank?lang=ar`,
        },
      },
    },
    {
      url: `${baseUrl}/packs`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/packs?lang=en`,
          ar: `${baseUrl}/packs?lang=ar`,
        },
      },
    },
    {
      url: `${baseUrl}/create-room`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/create-room?lang=en`,
          ar: `${baseUrl}/create-room?lang=ar`,
        },
      },
    },
    {
      url: `${baseUrl}/join-room`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/join-room?lang=en`,
          ar: `${baseUrl}/join-room?lang=ar`,
        },
      },
    },
  ];
}
