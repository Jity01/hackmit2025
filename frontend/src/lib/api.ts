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

export async function authenticateDrive(opts: { signal?: AbortSignal } = {}) {
  const r = await fetch(`api/authenticate_drive`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: opts.signal,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `http ${r.status}`)
  return j as { authenticated: boolean }
}

export async function migrateDrive(opts: { signal?: AbortSignal } = {}) {
  const r = await fetch(`api/migrate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: opts.signal,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.ok === false) throw new Error(j.error || `http ${r.status}`)
  return j // shape depends on your backend (e.g., {ok:true, count:...})
}

export async function listVault(path = '') {
  const r = await fetch('/api/vault/list', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.ok === false) throw new Error(j.error || `http ${r.status}`)
  return j as {
    ok: boolean
    path: string
    folders: { name: string; path: string; count: number }[]
    files: { name: string; path: string }[]
  }
}

export function previewUrl(path: string) {
  return `/api/vault/preview?path=${encodeURIComponent(path)}`
}
