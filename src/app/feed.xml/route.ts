import { Feed } from 'feed';
import { getCachedFeedPosts, getCachedSettings } from '@/lib/cache-layer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const settings = await getCachedSettings();
  const posts = await getCachedFeedPosts(20);

  const feed = new Feed({
    title: settings.siteTitle || 'Blog',
    description: settings.siteDescription || '',
    id: baseUrl,
    link: baseUrl,
    language: 'zh-CN',
    favicon: `${baseUrl}/favicon-32x32.png`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${baseUrl}/feed.xml`,
      atom: `${baseUrl}/feed.xml`,
    },
    author: {
      name: settings.siteTitle || 'Blog',
      link: baseUrl,
    },
  });

  for (const post of posts) {
    const postUrl = `${baseUrl}/${post.slug}`;
    const pubDate = new Date(post.publishedAt || post.createdAt);

    feed.addItem({
      title: post.title,
      id: postUrl,
      link: postUrl,
      description: post.content.slice(0, 280) + (post.content.length > 280 ? '...' : ''),
      content: post.content,
      author: [
        {
          name: post.author?.name || 'Anonymous',
          link: post.author?.website || undefined,
        },
      ],
      date: pubDate,
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
