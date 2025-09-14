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
