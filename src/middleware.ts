import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Prevent indexing of sensitive routes without advertising them in robots.txt
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

// Only match sensitive areas
export const config = {
  matcher: [
    '/api/:path*',
    '/yonetim/:path*',
    '/hesabim/:path*',
    '/sepet',
    '/payment/:path*',
  ],
}
