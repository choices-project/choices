import { test, expect } from '@playwright/test'

test.describe('Civics API Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000'

  test.describe('Health and Status Endpoints', () => {
    test('GET /api/health should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status')
      expect(data.status).toBe('ok')
      
      // Check CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*')
    })

    test('GET /api/health/civics should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health/civics`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status')
    })
  })

  test.describe('Civics Representatives Endpoints', () => {
    test('GET /api/civics/by-state should return 400 without state parameter', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/civics/by-state`)
      expect(response.status()).toBe(400)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('State parameter required')
    })

    test('GET /api/civics/by-state should return 200 with state parameter', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/civics/by-state?state=CA`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      
      // Check CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*')
    })

    test('GET /api/civics/local/la should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/civics/local/la`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /api/civics/local/sf should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/civics/local/sf`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /api/civics/representative/[id] should return 200 for valid ID', async ({ request }) => {
      // First get a list of representatives to find a valid ID
      const listResponse = await request.get(`${baseURL}/api/civics/by-state`)
      expect(listResponse.status()).toBe(200)
      
      const representatives = await listResponse.json()
      if (representatives.length > 0) {
        const firstRep = representatives[0]
        const repId = firstRep.id || firstRep.representative_id
        
        if (repId) {
          const response = await request.get(`${baseURL}/api/civics/representative/${repId}`)
          expect(response.status()).toBe(200)
          
          const data = await response.json()
          expect(data).toHaveProperty('id')
        }
      }
    })
  })

  test.describe('V1 Civics API Endpoints', () => {
    test('GET /api/v1/civics/by-state should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/civics/by-state`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /api/v1/civics/coverage-dashboard should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/civics/coverage-dashboard`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('coverage')
    })

    test('GET /api/v1/civics/heatmap should return 200', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/civics/heatmap`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('POST /api/v1/civics/address-lookup should handle location lookup', async ({ request }) => {
      const testLocation = {
        lat: 37.7749,
        lon: -122.4194,
        address: 'San Francisco, CA'
      }

      const response = await request.post(`${baseURL}/api/v1/civics/address-lookup`, {
        data: testLocation
      })
      
      // Should return 200 or 404 (if feature is disabled)
      expect([200, 404]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('jurisdictionIds')
        expect(Array.isArray(data.jurisdictionIds)).toBe(true)
      }
    })
  })

  test.describe('Contact and Communication Endpoints', () => {
    test('GET /api/civics/contact/[id] should return 200 for valid ID', async ({ request }) => {
      // First get a list of representatives to find a valid ID
      const listResponse = await request.get(`${baseURL}/api/civics/by-state`)
      expect(listResponse.status()).toBe(200)
      
      const representatives = await listResponse.json()
      if (representatives.length > 0) {
        const firstRep = representatives[0]
        const repId = firstRep.id || firstRep.representative_id
        
        if (repId) {
          const response = await request.get(`${baseURL}/api/civics/contact/${repId}`)
          expect(response.status()).toBe(200)
          
          const data = await response.json()
          expect(data).toHaveProperty('representative')
        }
      }
    })

    test('POST /api/civics/contact/[id] should handle communication', async ({ request }) => {
      // First get a list of representatives to find a valid ID
      const listResponse = await request.get(`${baseURL}/api/civics/by-state`)
      expect(listResponse.status()).toBe(200)
      
      const representatives = await listResponse.json()
      if (representatives.length > 0) {
        const firstRep = representatives[0]
        const repId = firstRep.id || firstRep.representative_id
        
        if (repId) {
          const testMessage = {
            subject: 'Test Message',
            body: 'This is a test message for API testing',
            type: 'email'
          }

          const response = await request.post(`${baseURL}/api/civics/contact/${repId}`, {
            data: testMessage
          })
          
          // Should return 200 or 401 (if authentication required)
          expect([200, 401, 403]).toContain(response.status())
        }
      }
    })
  })

  test.describe('Error Handling', () => {
    test('GET /api/civics/representative/invalid-id should return 404', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/civics/representative/invalid-id`)
      expect(response.status()).toBe(404)
    })

    test('GET /api/civics/contact/invalid-id should return 404', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/civics/contact/invalid-id`)
      expect(response.status()).toBe(404)
    })

    test('POST /api/v1/civics/address-lookup with invalid data should return 400', async ({ request }) => {
      const invalidData = {
        invalid: 'data'
      }

      const response = await request.post(`${baseURL}/api/v1/civics/address-lookup`, {
        data: invalidData
      })
      
      expect([400, 404]).toContain(response.status())
    })
  })

  test.describe('Performance and Response Times', () => {
    test('Civics endpoints should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now()
      
      const response = await request.get(`${baseURL}/api/civics/by-state`)
      expect(response.status()).toBe(200)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000)
    })

    test('Health endpoints should respond quickly', async ({ request }) => {
      const startTime = Date.now()
      
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000)
    })
  })
})
