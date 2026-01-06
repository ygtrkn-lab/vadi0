import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() || ''
  if (!q) return new NextResponse('Missing query parameter `q`', { status: 400 })

  const ua = request.headers.get('user-agent') || ''
  const lower = ua.toLowerCase()

  // Simple iOS detection
  const isIOS = /iphone|ipad|ipod/.test(lower)

  // Prefer Apple Maps on iOS devices, otherwise use Google Maps search URL
  const apple = `https://maps.apple.com/?q=${encodeURIComponent(q)}`
  const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

  const target = isIOS ? apple : google

  return NextResponse.redirect(target)
}