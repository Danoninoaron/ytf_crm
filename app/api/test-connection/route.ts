import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { apiKey, apiType, projectId, region, customEndpoint } = body

  if (!apiKey || !apiKey.trim()) {
    return Response.json({ ok: false, error: 'No hay API key configurada.' }, { status: 400 })
  }

  const start = Date.now()

  try {
    if (apiType === 'ai_studio') {
      const base = customEndpoint?.trim() || 'https://generativelanguage.googleapis.com'
      const r = await fetch(
        `${base}/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        { headers: { 'User-Agent': 'YTF-CRM/1.0' }, signal: AbortSignal.timeout(8000) }
      )
      const latency = Date.now() - start
      if (r.ok) return Response.json({ ok: true, latency })
      const err = await r.json().catch(() => ({}))
      return Response.json({ ok: false, error: (err as { error?: { message?: string } }).error?.message || `Error ${r.status}` }, { status: 400 })
    }

    // Vertex AI: test listing models via REST
    const endpoint = customEndpoint?.trim() || `https://${region || 'us-central1'}-aiplatform.googleapis.com`
    const r = await fetch(`${endpoint}/v1/projects/${projectId}/locations/${region || 'us-central1'}/publishers/google/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': 'YTF-CRM/1.0' },
      signal: AbortSignal.timeout(8000)
    })
    const latency = Date.now() - start
    if (r.ok) return Response.json({ ok: true, latency })
    return Response.json({ ok: false, error: `Vertex error ${r.status}` }, { status: 400 })
  } catch (e: unknown) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : 'Timeout o red inaccesible' }, { status: 500 })
  }
}
