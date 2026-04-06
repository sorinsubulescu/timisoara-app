import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const isTransitStandalone = process.env.NEXT_PUBLIC_STANDALONE_TRANSIT === 'true';

function redirectToTransit(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/transit';
  url.search = '';
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  if (!isTransitStandalone) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname === '/' ||
    pathname === '/events' ||
    pathname.startsWith('/events/') ||
    pathname === '/dining' ||
    pathname.startsWith('/dining/') ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/')
  ) {
    return redirectToTransit(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/events/:path*', '/dining/:path*', '/profile/:path*'],
};