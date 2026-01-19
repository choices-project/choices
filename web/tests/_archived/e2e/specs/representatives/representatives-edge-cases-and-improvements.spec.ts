/**
 * Representatives Edge Cases & Implementation Improvement Tests
 * 
 * Tests that challenge the implementation and identify areas for improvement:
 * - Parameter validation and sanitization
 * - Query optimization
 * - Data consistency
 * - Performance under load
 * - Boundary conditions
 * 
 * Created: January 10, 2026
 */

import { test, expect } from '@playwright/test';

test.describe('Representatives Edge Cases & Improvements', () => {
  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  test.describe('Parameter Validation & Sanitization', () => {
    test('limit parameter is clamped to valid range', async ({ request }) => {
      // Test with extremely large limit
      const largeLimitResponse = await request.get(`${baseUrl}/api/representatives?limit=999999`);
      
      expect(largeLimitResponse.ok()).toBeTruthy();
      const largeData = await largeLimitResponse.json();
      
      if (largeData.success) {
        // Should be clamped to reasonable maximum (e.g., 100)
        expect(largeData.data.representatives.length).toBeLessThanOrEqual(100);
        expect(largeData.data.limit).toBeLessThanOrEqual(100);
      }
      
      // Test with zero limit
      const zeroLimitResponse = await request.get(`${baseUrl}/api/representatives?limit=0`);
      
      // Should either default to minimum or return error
      const zeroStatus = zeroLimitResponse.status();
      expect([200, 400, 422]).toContain(zeroStatus);
      
      if (zeroLimitResponse.ok()) {
        const zeroData = await zeroLimitResponse.json();
        if (zeroData.success) {
          expect(zeroData.data.limit).toBeGreaterThanOrEqual(1);
        }
      }
      
      // Test with negative limit
      const negativeLimitResponse = await request.get(`${baseUrl}/api/representatives?limit=-10`);
      
      const negativeStatus = negativeLimitResponse.status();
      expect([200, 400, 422]).toContain(negativeStatus);
    });

    test('offset parameter is validated', async ({ request }) => {
      // Test with negative offset
      const negativeOffsetResponse = await request.get(`${baseUrl}/api/representatives?offset=-10&limit=10`);
      
      const status = negativeOffsetResponse.status();
      expect([200, 400, 422]).toContain(status);
      
      if (negativeOffsetResponse.ok()) {
        const data = await negativeOffsetResponse.json();
        if (data.success) {
          expect(data.data.page).toBeGreaterThanOrEqual(1);
        }
      }
      
      // Test with extremely large offset (may fail due to database limits, which is acceptable)
      const largeOffsetResponse = await request.get(`${baseUrl}/api/representatives?offset=999999&limit=10`);
      
      // Should either return empty results or error gracefully
      if (largeOffsetResponse.ok()) {
        const largeData = await largeOffsetResponse.json();
        if (largeData.success) {
          // Should return empty results if offset exceeds total
          expect(Array.isArray(largeData.data.representatives)).toBe(true);
          expect(largeData.data.hasMore).toBe(false);
        }
      } else {
        // Error response is acceptable for extremely large offsets
        expect(largeOffsetResponse.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test('search parameter is sanitized against injection', async ({ request }) => {
      const injectionAttempts = [
        "'; DROP TABLE representatives_core; --",
        "' OR '1'='1",
        "<script>alert('xss')</script>",
        "'; SELECT * FROM representatives_core WHERE '1'='1",
        "${process.env.SECRET}",
        "{{7*7}}",
      ];

      for (const attempt of injectionAttempts) {
        const response = await request.get(`${baseUrl}/api/representatives?search=${encodeURIComponent(attempt)}&limit=10`);
        
        // Should not crash or return 500
        expect(response.status()).not.toBe(500);
        
        // Should either return empty results or sanitized results
        if (response.ok()) {
          const data = await response.json();
          expect(data.success).toBe(true);
          expect(Array.isArray(data.data.representatives)).toBe(true);
        }
      }
    });

    test('state parameter validates USPS codes', async ({ request }) => {
      // Valid state code
      const validResponse = await request.get(`${baseUrl}/api/representatives?state=CA&limit=5`);
      expect(validResponse.ok()).toBeTruthy();
      
      // Invalid state code (not 2 letters)
      const invalidResponse = await request.get(`${baseUrl}/api/representatives?state=California&limit=5`);
      
      // Should either handle gracefully or return empty results
      expect(invalidResponse.status()).not.toBe(500);
      
      if (invalidResponse.ok()) {
        const data = await invalidResponse.json();
        expect(data.success).toBe(true);
      }
      
      // Empty state code
      const emptyResponse = await request.get(`${baseUrl}/api/representatives?state=&limit=5`);
      expect(emptyResponse.status()).not.toBe(500);
    });

    test('level parameter validates enum values', async ({ request }) => {
      const validLevels = ['federal', 'state', 'local'];
      
      for (const level of validLevels) {
        const response = await request.get(`${baseUrl}/api/representatives?level=${level}&limit=5`);
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
      }
      
      // Invalid level
      const invalidResponse = await request.get(`${baseUrl}/api/representatives?level=invalid&limit=5`);
      
      // Should either return empty results or ignore invalid value
      expect(invalidResponse.status()).not.toBe(500);
    });
  });

  test.describe('Data Consistency & Integrity', () => {
    test('representative IDs are unique across pagination', async ({ request }) => {
      const page1Response = await request.get(`${baseUrl}/api/representatives?limit=20&offset=0`);
      const page2Response = await request.get(`${baseUrl}/api/representatives?limit=20&offset=20`);
      const page3Response = await request.get(`${baseUrl}/api/representatives?limit=20&offset=40`);
      
      expect(page1Response.ok()).toBeTruthy();
      expect(page2Response.ok()).toBeTruthy();
      expect(page3Response.ok()).toBeTruthy();
      
      const page1Data = await page1Response.json();
      const page2Data = await page2Response.json();
      const page3Data = await page3Response.json();
      
      if (page1Data.success && page2Data.success && page3Data.success) {
        const page1Ids = new Set(page1Data.data.representatives.map((r: any) => r.id));
        const page2Ids = new Set(page2Data.data.representatives.map((r: any) => r.id));
        const page3Ids = new Set(page3Data.data.representatives.map((r: any) => r.id));
        
        // Check for overlaps
        const page1Page2Overlap = [...page1Ids].filter(id => page2Ids.has(id));
        const page1Page3Overlap = [...page1Ids].filter(id => page3Ids.has(id));
        const page2Page3Overlap = [...page2Ids].filter(id => page3Ids.has(id));
        
        expect(page1Page2Overlap.length).toBe(0);
        expect(page1Page3Overlap.length).toBe(0);
        expect(page2Page3Overlap.length).toBe(0);
        
        // Check for duplicates within same page
        expect(page1Ids.size).toBe(page1Data.data.representatives.length);
        expect(page2Ids.size).toBe(page2Data.data.representatives.length);
        expect(page3Ids.size).toBe(page3Data.data.representatives.length);
      }
    });

    test('total count is consistent across pagination', async ({ request }) => {
      const page1Response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=0`);
      const page2Response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=10`);
      
      expect(page1Response.ok()).toBeTruthy();
      expect(page2Response.ok()).toBeTruthy();
      
      const page1Data = await page1Response.json();
      const page2Data = await page2Response.json();
      
      if (page1Data.success && page2Data.success) {
        // Total should be the same
        expect(page1Data.data.total).toBe(page2Data.data.total);
        
        // Page numbers should be sequential
        expect(page1Data.data.page).toBe(1);
        expect(page2Data.data.page).toBe(2);
      }
    });

    test('hasMore flag is accurate for all pages', async ({ request }) => {
      let offset = 0;
      let hasMore = true;
      let previousTotal: number | null = null;
      
      while (hasMore && offset < 100) { // Limit to prevent infinite loop
        const response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=${offset}`);
        expect(response.ok()).toBeTruthy();
        
        const data = await response.json();
        if (data.success) {
          // Total should remain constant
          if (previousTotal !== null) {
            expect(data.data.total).toBe(previousTotal);
          }
          previousTotal = data.data.total;
          
          // hasMore should be accurate
          const expectedHasMore = (offset + 10) < (data.data.total ?? 0);
          expect(data.data.hasMore).toBe(expectedHasMore);
          
          hasMore = data.data.hasMore;
          offset += 10;
        } else {
          break;
        }
      }
    });

    test('data_quality_score ordering is consistent', async ({ request }) => {
      // Get multiple pages and verify sorting is consistent
      const page1Response = await request.get(`${baseUrl}/api/representatives?limit=30&offset=0`);
      const page2Response = await request.get(`${baseUrl}/api/representatives?limit=30&offset=30`);
      
      expect(page1Response.ok()).toBeTruthy();
      expect(page2Response.ok()).toBeTruthy();
      
      const page1Data = await page1Response.json();
      const page2Data = await page2Response.json();
      
      if (page1Data.success && page2Data.success) {
        const allReps = [...page1Data.data.representatives, ...page2Data.data.representatives];
        
        // Check sorting order
        for (let i = 1; i < allReps.length; i++) {
          const prevScore = allReps[i - 1].data_quality_score ?? 0;
          const currScore = allReps[i].data_quality_score ?? 0;
          
          // Should be descending by score, or equal (then sorted by name)
          expect(prevScore).toBeGreaterThanOrEqual(currScore);
          
          if (prevScore === currScore) {
            // If scores are equal, should be sorted by name (ascending)
            const prevName = (allReps[i - 1].name || '').toLowerCase();
            const currName = (allReps[i].name || '').toLowerCase();
            expect(prevName <= currName).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Query Optimization & Performance', () => {
    test('filters reduce query result set appropriately', async ({ request }) => {
      // Get total without filters
      const allResponse = await request.get(`${baseUrl}/api/representatives?limit=1`);
      const allData = await allResponse.json();
      
      // Get filtered results
      const filteredResponse = await request.get(`${baseUrl}/api/representatives?state=CA&level=federal&limit=1`);
      const filteredData = await filteredResponse.json();
      
      expect(allResponse.ok()).toBeTruthy();
      expect(filteredResponse.ok()).toBeTruthy();
      
      if (allData.success && filteredData.success) {
        // Filtered total should be less than or equal to unfiltered total
        expect(filteredData.data.total).toBeLessThanOrEqual(allData.data.total);
      }
    });

    test('search query is case-insensitive', async ({ request }) => {
      const lowerResponse = await request.get(`${baseUrl}/api/representatives?search=smith&limit=10`);
      const upperResponse = await request.get(`${baseUrl}/api/representatives?search=SMITH&limit=10`);
      const mixedResponse = await request.get(`${baseUrl}/api/representatives?search=SmItH&limit=10`);
      
      expect(lowerResponse.ok()).toBeTruthy();
      expect(upperResponse.ok()).toBeTruthy();
      expect(mixedResponse.ok()).toBeTruthy();
      
      const lowerData = await lowerResponse.json();
      const upperData = await upperResponse.json();
      const mixedData = await mixedResponse.json();
      
      if (lowerData.success && upperData.success && mixedData.success) {
        // Results should be the same (or very similar) regardless of case
        const lowerIds = new Set(lowerData.data.representatives.map((r: any) => r.id));
        const upperIds = new Set(upperData.data.representatives.map((r: any) => r.id));
        const mixedIds = new Set(mixedData.data.representatives.map((r: any) => r.id));
        
        // Should have significant overlap if results exist
        if (lowerIds.size > 0) {
          const lowerUpperOverlap = [...lowerIds].filter(id => upperIds.has(id));
          const lowerMixedOverlap = [...lowerIds].filter(id => mixedIds.has(id));
          
          // At least 80% overlap (allowing for slight variations in ordering)
          expect(lowerUpperOverlap.length / lowerIds.size).toBeGreaterThan(0.8);
          expect(lowerMixedOverlap.length / lowerIds.size).toBeGreaterThan(0.8);
        }
      }
    });

    test('multiple filters combined efficiently', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(
        `${baseUrl}/api/representatives?state=CA&level=federal&party=Democratic&district=12&limit=20`
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success) {
        // Should respond quickly even with multiple filters
        expect(duration).toBeLessThan(2000);
        
        // All results should match all filters
        data.data.representatives.forEach((rep: any) => {
          expect(rep.state).toBe('CA');
          expect(rep.level).toBe('federal');
          expect(rep.party?.toLowerCase()).toContain('democratic');
          expect(rep.district).toBe('12');
        });
      }
    });

    test('related data queries are efficient', async ({ request }) => {
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=10`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        // Test detail endpoint with all includes
        const startTime = Date.now();
        const detailResponse = await request.get(
          `${baseUrl}/api/v1/civics/representative/${repId}?include=fec,votes,contact,divisions`
        );
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(detailResponse.ok()).toBeTruthy();
        
        // Should load all related data within reasonable time
        expect(duration).toBeLessThan(3000);
      }
    });
  });

  test.describe('Boundary Conditions', () => {
    test('handles empty database gracefully', async ({ request }) => {
      // This test verifies behavior when no data exists
      // May need special setup or may naturally pass if database has data
      const response = await request.get(`${baseUrl}/api/representatives?state=XX&limit=10`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.representatives).toEqual([]);
      expect(data.data.total).toBe(0);
      expect(data.data.hasMore).toBe(false);
    });

    test('handles single representative result', async ({ request }) => {
      // Find a filter that returns exactly one result
      const response = await request.get(`${baseUrl}/api/representatives?limit=1`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length === 1) {
        // Should return single result correctly
        expect(data.data.representatives.length).toBe(1);
        expect(data.data.total).toBeGreaterThanOrEqual(1);
        expect(data.data.hasMore).toBe(data.data.total > 1);
      }
    });

    test('handles maximum page correctly', async ({ request }) => {
      // Get total count
      const firstResponse = await request.get(`${baseUrl}/api/representatives?limit=10&offset=0`);
      const firstData = await firstResponse.json();
      
      if (firstData.success && firstData.data.total > 0) {
        const total = firstData.data.total;
        const lastPageOffset = Math.floor(total / 10) * 10;
        
        const lastPageResponse = await request.get(`${baseUrl}/api/representatives?limit=10&offset=${lastPageOffset}`);
        const lastPageData = await lastPageResponse.json();
        
        expect(lastPageResponse.ok()).toBeTruthy();
        
        if (lastPageData.success) {
          // Should have hasMore: false
          expect(lastPageData.data.hasMore).toBe(false);
          
          // Page number should be correct
          const expectedPage = Math.floor(lastPageOffset / 10) + 1;
          expect(lastPageData.data.page).toBe(expectedPage);
        }
      }
    });

    test('handles edge case offset values', async ({ request }) => {
      // First get the total count
      const firstResponse = await request.get(`${baseUrl}/api/representatives?limit=1&offset=0`);
      const firstData = await firstResponse.json();
      
      if (firstData.success && firstData.data.total > 0) {
        const total = firstData.data.total;
        // Test with offset equal to total
        const response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=${total}`);
        
        // Should either return empty results or error gracefully (Supabase may have limits)
        if (response.ok()) {
          const data = await response.json();
          if (data.success) {
            // Should return empty results
            expect(data.data.representatives.length).toBe(0);
            expect(data.data.hasMore).toBe(false);
          }
        } else {
          // Error is acceptable for offset equal to or exceeding total
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      }
    });
  });

  test.describe('OCD Division Edge Cases', () => {
    test('handles missing OCD division ID gracefully', async ({ request }) => {
      // Request with ocd_division_id that doesn't exist
      const response = await request.get(
        `${baseUrl}/api/representatives?ocd_division_id=${encodeURIComponent('ocd-division/country:us/state:xx/cd:999')}&limit=10`
      );
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      // Should return empty results, not error
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.representatives)).toBe(true);
      expect(data.data.representatives.length).toBe(0);
      expect(data.data.total).toBe(0);
    });

    test('OCD division ID with special characters is handled', async ({ request }) => {
      // OCD IDs can contain colons, slashes, etc.
      const specialChars = [
        'ocd-division/country:us/state:ca/cd:12',
        'ocd-division/country:us/state:ny',
      ];
      
      for (const ocdId of specialChars) {
        const response = await request.get(
          `${baseUrl}/api/representatives?ocd_division_id=${encodeURIComponent(ocdId)}&limit=10`
        );
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    test('OCD division filter works with other filters', async ({ request }) => {
      // Get a representative with division IDs
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=20`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repWithDivision = listData.data.representatives.find((r: any) => 
          Array.isArray(r.division_ids) && r.division_ids.length > 0
        );
        
        if (repWithDivision) {
          const divisionId = repWithDivision.division_ids[0];
          
          // Combine with state filter
          const combinedResponse = await request.get(
            `${baseUrl}/api/representatives?ocd_division_id=${encodeURIComponent(divisionId)}&state=${repWithDivision.state}&limit=10`
          );
          
          expect(combinedResponse.ok()).toBeTruthy();
          const combinedData = await combinedResponse.json();
          
          expect(combinedData.success).toBe(true);
          
          // All results should match both filters
          if (combinedData.data.representatives.length > 0) {
            combinedData.data.representatives.forEach((rep: any) => {
              expect(rep.state).toBe(repWithDivision.state);
              expect(Array.isArray(rep.division_ids) && rep.division_ids.includes(divisionId)).toBe(true);
            });
          }
        }
      }
    });
  });
});

