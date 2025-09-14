export async function startRecording(seconds: number, output?: string) {
  const res = await fetch('/api/record', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(output ? { seconds, output } : { seconds }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `http ${res.status}`)
  return json
}

export async function extractCanvas(baseUrl: string, accessToken: string) {
  const r = await fetch(`api/canvas/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ baseUrl, accessToken })
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.ok) throw new Error(j.error || 'canvas extract failed')
  return j as { ok: boolean; gcs_path: string; courses?: number }
}