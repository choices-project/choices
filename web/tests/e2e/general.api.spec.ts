import { test, expect } from '@playwright/test'

test.describe('General API Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000'

  test.describe('Authentication Endpoints', () => {
    test('GET /api/auth/me should return 401 when not authenticated', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/auth/me`)
      expect(response.status()).toBe(401)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Not authenticated')
      
      // Check CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*')
    })

    test('POST /api/auth/login should return 400 with invalid credentials', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/login`, {
        data: {
          email: 'invalid@example.com',
          password: 'invalid'
        }
      })
      expect(response.status()).toBe(400)
    })

    test('POST /api/auth/register should return 400 with invalid data', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/register`, {
        data: {
          email: 'invalid-email',
          password: '123'
        }
      })
      expect(response.status()).toBe(400)
    })
  })

  test.describe('Public Endpoints', () => {
    test('GET /api/health should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status')
      expect(data.status).toBe('ok')
      
      // Check CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*')
    })

    test('GET /api/stats/public should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/stats/public`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('totalPolls')
      expect(typeof data.totalPolls).toBe('number')
    })

    test('GET /api/trending-polls should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/trending-polls`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('Polls API', () => {
    test('GET /api/polls should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/polls`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      
      // Check CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*')
    })

    test('GET /api/polls/trending should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/polls/trending`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('Protected Endpoints', () => {
    test('GET /api/dashboard should return 401 when not authenticated', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/dashboard`)
      expect(response.status()).toBe(401)
    })

    test('GET /api/profile should return 401 when not authenticated', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/profile`)
      expect(response.status()).toBe(401)
    })

    test('POST /api/polls should return 401 when not authenticated', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/polls`, {
        data: {
          title: 'Test Poll',
          description: 'Test Description'
        }
      })
      expect(response.status()).toBe(401)
    })
  })

  test.describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/nonexistent`)
      expect(response.status()).toBe(404)
    })

    test('POST /api/polls/invalid-id/vote should return 404', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/polls/invalid-id/vote`, {
        data: { choice: 'option1' }
      })
      expect(response.status()).toBe(404)
    })
  })

  test.describe('Content Type and Headers', () => {
    test('API responses should have correct content type', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const contentType = response.headers()['content-type']
      expect(contentType).toContain('application/json')
    })

    test('API responses should include CORS headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const headers = response.headers()
      // CORS headers should be present
      expect(headers).toHaveProperty('access-control-allow-origin')
    })
  })

  test.describe('Rate Limiting and Performance', () => {
    test('Multiple requests should be handled efficiently', async ({ request }) => {
      const promises = Array.from({ length: 5 }, () => 
        request.get(`${baseURL}/api/health`)
      )
      
      const responses = await Promise.all(promises)
      
      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })
    })

    test('API should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now()
      
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000)
    })
  })
})
