import { Feed } from 'feed';
import { getCachedFeedPosts, getCachedSettings } from '@/lib/cache-layer';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { getLocale } from 'next-intl/server';

export const dynamic = 'force-static';
export const revalidate = 300;

const FEED_LANGUAGE_BY_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
};

function getFeedLanguage(locale: string) {
  const resolvedLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  return FEED_LANGUAGE_BY_LOCALE[resolvedLocale];
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  let settings: Awaited<ReturnType<typeof getCachedSettings>>;
  let posts: Awaited<ReturnType<typeof getCachedFeedPosts>>;

  try {
    settings = await getCachedSettings();
    posts = await getCachedFeedPosts(20);
  } catch (error) {
    console.error('Feed generation error:', error);
    settings = {
      siteTitle: 'Blog',
      siteDescription: '',
    } as Awaited<ReturnType<typeof getCachedSettings>>;
    posts = [];
  }

  const locale = await getLocale();

  const feed = new Feed({
    title: settings.siteTitle || 'Blog',
    description: settings.siteDescription || '',
    id: baseUrl,
    link: baseUrl,
    language: getFeedLanguage(locale),
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
