import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://extratime.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/rank', '/packs', '/create-room', '/join-room'],
        disallow: ['/auction/', '/room/', '/result/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
