import { NextResponse } from 'next/server';

// Proxy Umami Cloud script to avoid ad blockers
export async function GET() {
  try {
    const response = await fetch('https://cloud.umami.is/script.js', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UmamiProxy/1.0)',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch script', { status: 502 });
    }

    const script = await response.text();

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch {
    return new NextResponse('Failed to fetch script', { status: 502 });
  }
}
