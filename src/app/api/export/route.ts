import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, comments, tags, postsTags, media, navItems, settings, users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  const includeMedia = searchParams.get('includeMedia') === 'true';
  const includeUsers = searchParams.get('includeUsers') === 'true';
  const includeSettings = searchParams.get('includeSettings') === 'true';

  try {
    const [
      postsData,
      commentsData,
      tagsData,
      postsTagsData,
      navItemsData,
      mediaData,
      usersData,
      settingsData,
    ] = await Promise.all([
      db.select().from(posts),
      db.select().from(comments),
      db.select().from(tags),
      db.select().from(postsTags),
      db.select().from(navItems),
      includeMedia ? db.select().from(media) : Promise.resolve([]),
      includeUsers ? db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        bio: users.bio,
        website: users.website,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users) : Promise.resolve([]),
      includeSettings ? db.select({
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        allowRegistration: settings.allowRegistration,
      }).from(settings) : Promise.resolve([]),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        posts: postsData,
        comments: commentsData,
        tags: tagsData,
        postsTags: postsTagsData,
        navItems: navItemsData,
        ...(includeMedia && { media: mediaData }),
        ...(includeUsers && { users: usersData }),
        ...(includeSettings && { settings: settingsData[0] || null }),
      },
    };

    const filename = `blog-export-${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
