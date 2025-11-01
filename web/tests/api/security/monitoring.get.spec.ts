import { GET } from '@/app/api/security/monitoring/route'

jest.mock('@/lib/rate-limiting/upstash-rate-limiter', () => ({
  upstashRateLimiter: {
    getMetrics: jest.fn().mockResolvedValue({
      totalViolations: 3,
      violationsLastHour: 2,
      violationsByEndpoint: new Map<string, number>([['/api/feeds', 2], ['/api/health', 1]]),
      topViolatingIPs: [{ ip: '1.2.3.4', count: 2 }]
    }),
    getAllViolations: jest.fn().mockResolvedValue([
      { ip: '1.2.3.4', endpoint: '/api/feeds', timestamp: Date.now(), count: 2, maxRequests: 100 }
    ])
  }
}))

const makeReq = (key?: string) =>
  new Request('http://localhost/api/security/monitoring', {
    headers: key ? { 'x-admin-key': key } : {}
  })

describe('GET /api/security/monitoring', () => {
  const OLD_KEY = process.env.ADMIN_MONITORING_KEY
  beforeAll(() => { process.env.ADMIN_MONITORING_KEY = 'test-admin-key' })
  afterAll(() => { process.env.ADMIN_MONITORING_KEY = OLD_KEY })

  it('rejects without admin key', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns metrics with valid admin key', async () => {
    const res = await GET(makeReq('test-admin-key'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.metrics.totalViolations).toBe(3)
  })
})


