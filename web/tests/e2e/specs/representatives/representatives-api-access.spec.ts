/**
 * Representatives API Access Comprehensive Tests
 *
 * Tests for representatives data access functionality:
 * - Direct API endpoints querying representatives_core
 * - Google API lookup integration
 * - End-to-end flow: address lookup → jurisdiction → representatives query
 *
 * Created: January 10, 2026
 */

import { test, expect } from '@playwright/test';

test.describe('Representatives API Access Tests', () => {
  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  test.describe('Direct API Endpoints', () => {
    test('GET /api/representatives queries representatives_core successfully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=10`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('representatives');
      expect(Array.isArray(data.data.representatives)).toBe(true);

      // Verify structure of representative objects
      if (data.data.representatives.length > 0) {
        const rep = data.data.representatives[0];
        expect(rep).toHaveProperty('id');
        expect(rep).toHaveProperty('name');
        expect(rep).toHaveProperty('office');
        expect(rep).toHaveProperty('level');
        expect(rep).toHaveProperty('state');
      }
    });

    test('GET /api/representatives filters by state', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?state=CA&limit=5`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.success && data.data.representatives.length > 0) {
        // All representatives should be from CA
        data.data.representatives.forEach((rep: any) => {
          expect(rep.state).toBe('CA');
        });
      }
    });

    test('GET /api/representatives filters by district', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?state=CA&district=12&limit=5`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.success && data.data.representatives.length > 0) {
        // All representatives should match district
        data.data.representatives.forEach((rep: any) => {
          expect(rep.state).toBe('CA');
          expect(rep.district).toBe('12');
        });
      }
    });

    test('GET /api/representatives filters by level', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?level=federal&limit=5`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.success && data.data.representatives.length > 0) {
        data.data.representatives.forEach((rep: any) => {
          expect(rep.level).toBe('federal');
        });
      }
    });

    test('GET /api/representatives filters by OCD division ID', async ({ request }) => {
      // First get a representative with division IDs
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=10`);
      const listData = await listResponse.json();

      if (listData.success && listData.data.representatives.length > 0) {
        const repWithDivision = listData.data.representatives.find((r: any) =>
          Array.isArray(r.division_ids) && r.division_ids.length > 0
        );

        if (repWithDivision) {
          const divisionId = repWithDivision.division_ids[0];
          const filterResponse = await request.get(
            `${baseUrl}/api/representatives?ocd_division_id=${encodeURIComponent(divisionId)}&limit=5`
          );

          expect(filterResponse.ok()).toBeTruthy();
          const filterData = await filterResponse.json();

          if (filterData.success && filterData.data.representatives.length > 0) {
            // At least one representative should have this division ID
            const hasDivision = filterData.data.representatives.some((r: any) =>
              Array.isArray(r.division_ids) && r.division_ids.includes(divisionId)
            );
            expect(hasDivision).toBe(true);
          }
        }
      }
    });

    test('GET /api/v1/civics/by-state queries representatives_core successfully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/civics/by-state?state=CA&level=federal&limit=5`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('representatives');
      expect(Array.isArray(data.data.representatives)).toBe(true);
    });

    test('GET /api/v1/civics/representative/[id] queries representatives_core successfully', async ({ request }) => {
      // First get a representative ID
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=1`);
      const listData = await listResponse.json();

      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        const detailResponse = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}`);

        expect(detailResponse.ok()).toBeTruthy();
        const detailData = await detailResponse.json();

        expect(detailData).toHaveProperty('success');
        expect(detailData.success).toBe(true);
        expect(detailData).toHaveProperty('data');
        expect(detailData.data).toHaveProperty('representative');
        expect(detailData.data.representative.id).toBe(String(repId));
      }
    });

    test('GET /api/v1/civics/representative/[id] returns 404 for invalid ID', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/civics/representative/999999999`);

      expect(response.status()).toBe(404);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Google API Lookup Integration', () => {
    test('POST /api/v1/civics/address-lookup returns jurisdiction', async ({ request }) => {
      // Skip if Google API key not configured
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      test.skip(!apiKey, 'GOOGLE_CIVIC_API_KEY not configured');

      const response = await request.post(`${baseUrl}/api/v1/civics/address-lookup`, {
        data: {
          address: '123 Main St, Springfield, IL 62704'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('jurisdiction');

      const jurisdiction = data.data.jurisdiction;
      expect(jurisdiction).toHaveProperty('state');
      expect(typeof jurisdiction.state).toBe('string');
    });

    test('End-to-end: Address lookup → Representatives query', async ({ request }) => {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      test.skip(!apiKey, 'GOOGLE_CIVIC_API_KEY not configured');

      // Step 1: Lookup address to get jurisdiction
      const lookupResponse = await request.post(`${baseUrl}/api/v1/civics/address-lookup`, {
        data: {
          address: '123 Main St, Springfield, IL 62704'
        }
      });

      expect(lookupResponse.ok()).toBeTruthy();
      const lookupData = await lookupResponse.json();
      expect(lookupData.success).toBe(true);

      const jurisdiction = lookupData.data.jurisdiction;
      expect(jurisdiction).toHaveProperty('state');

      // Step 2: Query representatives based on jurisdiction
      const params = new URLSearchParams();
      params.append('state', jurisdiction.state);
      if (jurisdiction.district) {
        params.append('district', jurisdiction.district);
      }
      params.append('limit', '10');

      const repsResponse = await request.get(`${baseUrl}/api/representatives?${params.toString()}`);
      expect(repsResponse.ok()).toBeTruthy();

      const repsData = await repsResponse.json();
      expect(repsData.success).toBe(true);
      expect(repsData.data).toHaveProperty('representatives');
      expect(Array.isArray(repsData.data.representatives)).toBe(true);

      // Verify representatives match jurisdiction
      if (repsData.data.representatives.length > 0) {
        repsData.data.representatives.forEach((rep: any) => {
          expect(rep.state).toBe(jurisdiction.state);
          if (jurisdiction.district && rep.district) {
            expect(rep.district).toBe(jurisdiction.district);
          }
        });
      }
    });

    test('findByLocation flow: Address → Google lookup → Representatives', async ({ request }) => {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      test.skip(!apiKey, 'GOOGLE_CIVIC_API_KEY not configured');

      // This simulates what findByLocation does:
      // 1. Call address-lookup to get jurisdiction
      // 2. Use jurisdiction to query representatives

      const address = '1600 Pennsylvania Avenue NW, Washington, DC 20500';

      // Step 1: Address lookup
      const lookupResponse = await request.post(`${baseUrl}/api/v1/civics/address-lookup`, {
        data: { address }
      });

      expect(lookupResponse.ok()).toBeTruthy();
      const lookupData = await lookupResponse.json();
      expect(lookupData.success).toBe(true);

      const jurisdiction = lookupData.data.jurisdiction;

      // Step 2: Query representatives with jurisdiction filters
      const params = new URLSearchParams();
      params.append('state', jurisdiction.state);
      if (jurisdiction.district) params.append('district', jurisdiction.district);
      if (jurisdiction.ocd_division_id) params.append('ocd_division_id', jurisdiction.ocd_division_id);
      params.append('limit', '20');

      const repsResponse = await request.get(`${baseUrl}/api/representatives?${params.toString()}`);
      expect(repsResponse.ok()).toBeTruthy();

      const repsData = await repsResponse.json();
      expect(repsData.success).toBe(true);
      expect(repsData.data.representatives.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Access Verification', () => {
    test('representatives_core table is accessible via API', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=1`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      // Should not get RLS error
      expect(data.success).toBe(true);
      expect(data.error).toBeUndefined();
    });

    test('representatives endpoint returns active representatives only', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=50`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.success && data.data.representatives.length > 0) {
        // All representatives should be active
        data.data.representatives.forEach((rep: any) => {
          expect(rep.is_active).toBe(true);
        });

        // Should not include test data
        data.data.representatives.forEach((rep: any) => {
          expect(rep.name?.toLowerCase()).not.toContain('test');
        });
      }
    });

    test('representatives endpoint includes related data (photos, contacts, social)', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=5`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      if (data.success && data.data.representatives.length > 0) {
        const rep = data.data.representatives[0];

        // Should have structure for related data (may be empty arrays)
        expect(rep).toHaveProperty('photos');
        expect(rep).toHaveProperty('contacts');
        expect(rep).toHaveProperty('social_media');
        expect(rep).toHaveProperty('division_ids');
        expect(Array.isArray(rep.photos)).toBe(true);
        expect(Array.isArray(rep.contacts)).toBe(true);
        expect(Array.isArray(rep.social_media)).toBe(true);
        expect(Array.isArray(rep.division_ids)).toBe(true);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles missing state parameter gracefully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/civics/by-state`);

      // Should return validation error
      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
    });

    test('handles invalid representative ID gracefully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/civics/representative/invalid-id`);

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
    });

    test('handles empty search results gracefully', async ({ request }) => {
      // Query for a state/district combination that likely doesn't exist
      const response = await request.get(`${baseUrl}/api/representatives?state=XX&district=999&limit=10`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('representatives');
      expect(Array.isArray(data.data.representatives)).toBe(true);
      // Should return empty array, not error
      expect(data.data.representatives.length).toBe(0);
    });
  });

  test.describe('Performance & Pagination', () => {
    test('pagination works correctly', async ({ request }) => {
      const page1 = await request.get(`${baseUrl}/api/representatives?limit=5&offset=0`);
      const page2 = await request.get(`${baseUrl}/api/representatives?limit=5&offset=5`);

      expect(page1.ok()).toBeTruthy();
      expect(page2.ok()).toBeTruthy();

      const data1 = await page1.json();
      const data2 = await page2.json();

      if (data1.success && data2.success && data1.data.total > 5) {
        // Should have different representatives (if enough data)
        const ids1 = data1.data.representatives.map((r: any) => r.id);
        const ids2 = data2.data.representatives.map((r: any) => r.id);

        // IDs should be different (no overlap for different pages)
        const overlap = ids1.filter((id: any) => ids2.includes(id));
        expect(overlap.length).toBe(0);

        // Should indicate hasMore correctly
        expect(data1.data.hasMore).toBe(data1.data.total > 5);
      }
    });

    test('response time is reasonable', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${baseUrl}/api/representatives?limit=20`);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(response.ok()).toBeTruthy();
      // Should respond within 5 seconds (allows for network latency)
      expect(duration).toBeLessThan(5000);
    });
  });

  test.describe('RLS Policy Verification', () => {
    test('anonymous users can read representatives', async ({ request }) => {
      // Make request without auth headers (anonymous)
      const response = await request.get(`${baseUrl}/api/representatives?limit=1`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      // Should succeed due to public read RLS policy
      expect(data.success).toBe(true);
      expect(data.error).toBeUndefined();
    });

    test('representatives data is publicly accessible', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/civics/by-state?state=CA&limit=5`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      // Should succeed without authentication
      expect(data.success).toBe(true);
    });
  });
});

