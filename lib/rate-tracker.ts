const KEY = 'ytf_crm_rate_calls'

type CallEntry = { ts: number; model: string }

function getCalls(): CallEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const calls: CallEntry[] = JSON.parse(raw)
    // Keep only last 24h
    const cutoff = Date.now() - 86400000
    return calls.filter(c => c.ts > cutoff)
  } catch { return [] }
}

export function recordApiCall(model = 'unknown') {
  if (typeof window === 'undefined') return
  const calls = getCalls()
  calls.push({ ts: Date.now(), model })
  localStorage.setItem(KEY, JSON.stringify(calls))
}

export function getRateStats() {
  const calls = getCalls()
  const now = Date.now()
  const rpm = calls.filter(c => c.ts > now - 60000).length
  const rpd = calls.filter(c => c.ts > now - 86400000).length
  return { rpm, rpd }
}
