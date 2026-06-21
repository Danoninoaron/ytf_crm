import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { prompt, model, apiKey, apiType, customEndpoint, systemPrompt, aspectRatio } = body

  if (!apiKey?.trim()) {
    return Response.json({ ok: false, error: 'No hay API key configurada. Ve a la página de APIs.' }, { status: 400 })
  }

  const fullPrompt = systemPrompt?.trim()
    ? `${systemPrompt.trim()}\n\n${prompt}`
    : prompt

  try {
    let imageBase64: string
    let mimeType: string

    if (apiType === 'vertex') {
      const { projectId, region = 'us-central1' } = body
      const base = customEndpoint?.trim() || `https://${region}-aiplatform.googleapis.com`
      const endpoint = `${base}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict`

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: { sampleCount: 1, aspectRatio: aspectRatio || '1:1' }
        }),
        signal: AbortSignal.timeout(60000)
      })

      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        return Response.json({ ok: false, error: (e as { error?: { message?: string } }).error?.message || `Vertex error ${r.status}` }, { status: r.status })
      }

      const d = await r.json()
      const pred = d.predictions?.[0]
      imageBase64 = pred?.bytesBase64Encoded ?? pred?.imageBytes
      mimeType = 'image/png'
    } else {
      // Google AI Studio
      const base = customEndpoint?.trim() || 'https://generativelanguage.googleapis.com'
      const endpoint = `${base}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        }),
        signal: AbortSignal.timeout(60000)
      })

      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        const msg = (e as { error?: { message?: string } }).error?.message || `Error ${r.status}`
        const code = r.status
        if (code === 429) return Response.json({ ok: false, error: 'Rate limit alcanzado. Reduce la concurrencia o espera.', code }, { status: 429 })
        if (code === 401 || code === 403) return Response.json({ ok: false, error: 'API key inválida o sin permisos.', code }, { status: code })
        return Response.json({ ok: false, error: msg, code }, { status: code })
      }

      const d = await r.json()
      const candidate = d.candidates?.[0]
      const imgPart = candidate?.content?.parts?.find((p: Record<string, unknown>) => p.inlineData)

      if (!imgPart?.inlineData) {
        const textPart = candidate?.content?.parts?.find((p: Record<string, unknown>) => p.text)
        const reason = (textPart?.text as string) || candidate?.finishReason || 'No image in response'
        return Response.json({ ok: false, error: `La API no devolvió imagen: ${reason}` }, { status: 500 })
      }

      imageBase64 = (imgPart.inlineData as { data: string }).data
      mimeType = (imgPart.inlineData as { mimeType: string }).mimeType || 'image/png'
    }

    if (!imageBase64) {
      return Response.json({ ok: false, error: 'Respuesta vacía de la API' }, { status: 500 })
    }

    // Save to disk and return URL
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
    const id = randomUUID()
    const filename = `${id}.${ext}`
    const dir = join(process.cwd(), 'public', 'generated')

    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), Buffer.from(imageBase64, 'base64'))

    return Response.json({
      ok: true,
      imageUrl: `/generated/${filename}`,
      imageId: id,
      mimeType,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error inesperado'
    if (msg.includes('timeout') || msg.includes('abort') || msg.includes('TimeoutError')) {
      return Response.json({ ok: false, error: 'Timeout: la API tardó más de 60s en responder.' }, { status: 504 })
    }
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
