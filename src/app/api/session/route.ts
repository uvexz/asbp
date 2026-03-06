import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasS3Config } from '@/app/actions/settings';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json(
      { user: null, isAdmin: false, hasS3: false },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const isAdmin = session.user.role === 'admin';
  const hasS3 = isAdmin ? await hasS3Config() : false;

  return NextResponse.json(
    {
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image ?? null,
        role: session.user.role,
      },
      isAdmin,
      hasS3,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
