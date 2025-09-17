// scripts/_shared/http.ts
import { setTimeout as sleep } from 'node:timers/promises'
import fs from 'node:fs/promises'
import path from 'node:path'

const CACHE_FILE = path.join(process.cwd(), 'scripts', '.etag-cache.json')

async function readCache(): Promise<Record<string,string>> {
  try { return JSON.parse(await fs.readFile(CACHE_FILE, 'utf8')) } catch { return {} }
}
async function writeCache(cache: Record<string,string>) {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
}

export type FetchETagResult = { status: 200 | 304, etag?: string | null, text?: string }

export async function fetchWithETag(url: string, init: RequestInit = {}, retries = 3): Promise<FetchETagResult> {
  const cache = await readCache()
  const etag = cache[url]
  const headers = new Headers(init.headers)
  headers.set('User-Agent', 'Choices-Civics/1.0 (+ingest)')
  if (etag) headers.set('If-None-Match', etag)

  let lastErr: unknown
  for (let i=0;i<=retries;i++){
    try {
      const res = await fetch(url, { ...init, headers })
      if (res.status === 304) return { status: 304, etag }
      if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
      const nextEtag = res.headers.get('etag')
      const text = await res.text()
      if (nextEtag) { cache[url] = nextEtag; await writeCache(cache) }
      return { status: 200, etag: nextEtag, text }
    } catch (err) {
      lastErr = err
      if (i === retries) break
      await sleep(250 * (i+1)) // backoff
    }
  }
  throw lastErr
}
