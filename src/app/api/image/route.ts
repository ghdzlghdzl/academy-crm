import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('q') || 'education';

  // Try multiple free image sources in order
  const sources = [
    // Pollinations AI - free, no key
    `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword + ', professional photo, high quality')}?width=480&height=360&seed=${hashCode(keyword)}&nologo=true`,
    // Fallback: Lorem Picsum with keyword-based seed
    `https://picsum.photos/seed/${encodeURIComponent(keyword)}/480/360`,
  ];

  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }
    } catch {
      continue;
    }
  }

  // Final fallback: return a simple SVG placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e0e7ff"/>
        <stop offset="100%" style="stop-color:#c7d2fe"/>
      </linearGradient>
    </defs>
    <rect width="480" height="360" fill="url(#g)"/>
    <text x="240" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#6366f1">${keyword}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
