import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url')
  const filename = request.nextUrl.searchParams.get('name') || 'image.jpg'

  if (!imageUrl) return new Response('Missing url', { status: 400 })

  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': 'YTF-CRM/1.0' } })
    if (!res.ok) return new Response('Upstream failed', { status: 502 })
    const data = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch {
    return new Response('Download failed', { status: 500 })
  }
}
