import { MetadataRoute } from 'next';
import { getCachedSitemapPosts, getCachedSitemapTags } from '@/lib/cache-layer';

// Force dynamic generation - sitemap needs database access
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Static pages (always included)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/memo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  try {
    // Get all published posts (cached)
    const publishedPosts = await getCachedSitemapPosts();

    // Dynamic post pages
    const postPages: MetadataRoute.Sitemap = publishedPosts
      .filter((post) => post.postType === 'post' || post.postType === 'page')
      .map((post) => ({
        url: `${baseUrl}/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: post.postType === 'page' ? 0.9 : 0.8,
      }));

    // Get all tags (cached)
    const allTags = await getCachedSitemapTags();

    const tagPages: MetadataRoute.Sitemap = allTags.map((tag) => ({
      url: `${baseUrl}/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...postPages, ...tagPages];
  } catch (error) {
    // If database is unavailable, return only static pages
    console.error('Sitemap generation error:', error);
    return staticPages;
  }
}
