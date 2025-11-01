import { POST } from '@/app/api/security/monitoring/clear/route'

jest.mock('@/lib/rate-limiting/upstash-rate-limiter', () => ({
  upstashRateLimiter: { clearRateLimit: jest.fn().mockResolvedValue(true) }
}))

const makeReq = (body: any, key?: string) =>
  new Request('http://localhost/api/security/monitoring/clear', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(key ? { 'x-admin-key': key } : {})
    },
    body: JSON.stringify(body)
  })

describe('POST /api/security/monitoring/clear', () => {
  const OLD_KEY = process.env.ADMIN_MONITORING_KEY
  beforeAll(() => { process.env.ADMIN_MONITORING_KEY = 'test-admin-key' })
  afterAll(() => { process.env.ADMIN_MONITORING_KEY = OLD_KEY })

  it('rejects without admin key', async () => {
    const res = await POST(makeReq({ ip: '1.2.3.4', endpoint: '/api/feeds' }))
    expect(res.status).toBe(401)
  })

  it('400 on missing fields', async () => {
    const res = await POST(makeReq({}, 'test-admin-key'))
    expect(res.status).toBe(400)
  })

  it('clears with valid admin key', async () => {
    const res = await POST(makeReq({ ip: '1.2.3.4', endpoint: '/api/feeds' }, 'test-admin-key'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ success: true })
  })
})


