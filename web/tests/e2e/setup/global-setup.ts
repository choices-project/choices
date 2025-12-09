import type { FullConfig } from '@playwright/test'

const ensureEnv = (key: string, fallback: string) => {
  if (!process.env[key]) {
    process.env[key] = fallback
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildUrl = (baseUrl: string, path: string) => new URL(path, baseUrl).toString()

async function waitForServer(baseUrl: string, timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  const healthUrl = buildUrl(baseUrl, '/api/health')
  let lastError: unknown

  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl, { cache: 'no-store' })
      if (response.ok) {
        return
      }
      lastError = new Error(`Healthcheck responded with status ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await sleep(1_000)
  }

  throw new Error(
    `[globalSetup] Timed out waiting for Next.js dev server at ${healthUrl}: ${String(lastError)}`
  )
}

async function warmHarnessRoutes(baseUrl: string) {
  const harnessRoutes = ['/e2e/feedback']
  for (const route of harnessRoutes) {
    const url = buildUrl(baseUrl, route)
    try {
      await fetch(url, { cache: 'no-store' })
      console.info(`[globalSetup] Warmed route ${url}`)
    } catch (error) {
      console.warn(`[globalSetup] Failed to warm ${url}`, error)
    }
  }
}

export default async function globalSetup(_: FullConfig) {
  ensureEnv('NEXT_PUBLIC_ENABLE_E2E_HARNESS', '1')
  const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
  ensureEnv('PLAYWRIGHT_BASE_URL', baseUrl)

  try {
    await waitForServer(baseUrl)
    await warmHarnessRoutes(baseUrl)
  } catch (error) {
    console.warn('[globalSetup] Continuing despite warmup failure:', error)
  }
}

