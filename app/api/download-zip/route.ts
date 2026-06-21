import { NextRequest } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const images: { url: string; name: string }[] = body.images ?? []

  if (!images.length) return new Response('No images', { status: 400 })

  const zip = new JSZip()

  await Promise.all(
    images.map(async (img, i) => {
      try {
        const res = await fetch(img.url, { headers: { 'User-Agent': 'YTF-CRM/1.0' } })
        if (res.ok) {
          zip.file(img.name || `image_${i + 1}.jpg`, await res.arrayBuffer())
        }
      } catch { /* skip failed */ }
    })
  )

  const zipData = await zip.generateAsync({ type: 'arraybuffer' })

  return new Response(zipData, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="ytf_batch_${Date.now()}.zip"`,
    },
  })
}
