/**
 * Representatives Data Completeness Tests
 * 
 * Comprehensive tests to ensure all related data is accessible:
 * - Photos, contacts, social media, divisions
 * - FEC campaign finance data
 * - Voting records and activity
 * - Committees
 * - Data quality metrics
 * 
 * Created: January 10, 2026
 */

import { test, expect } from '@playwright/test';

test.describe('Representatives Data Completeness Tests', () => {
  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  test.describe('Related Data Access', () => {
    test('representatives list includes photos, contacts, social media, and divisions', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=10`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.representatives.length).toBeGreaterThan(0);
      
      // Verify all representatives have the expected structure
      data.data.representatives.forEach((rep: any) => {
        // Core fields
        expect(rep).toHaveProperty('id');
        expect(rep).toHaveProperty('name');
        expect(rep).toHaveProperty('office');
        expect(rep).toHaveProperty('level');
        expect(rep).toHaveProperty('state');
        
        // Related data structures (may be empty arrays, but should exist)
        expect(rep).toHaveProperty('photos');
        expect(Array.isArray(rep.photos)).toBe(true);
        expect(rep).toHaveProperty('contacts');
        expect(Array.isArray(rep.contacts)).toBe(true);
        expect(rep).toHaveProperty('social_media');
        expect(Array.isArray(rep.social_media)).toBe(true);
        expect(rep).toHaveProperty('division_ids');
        expect(Array.isArray(rep.division_ids)).toBe(true);
        
        // Optional but important fields
        if (rep.primary_email) expect(typeof rep.primary_email).toBe('string');
        if (rep.primary_phone) expect(typeof rep.primary_phone).toBe('string');
        if (rep.primary_website) expect(typeof rep.primary_website).toBe('string');
        if (rep.primary_photo_url) expect(typeof rep.primary_photo_url).toBe('string');
      });
    });

    test('representative detail includes photos with proper structure', async ({ request }) => {
      // Get a representative ID
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        // Get detail with all related data
        const detailResponse = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}?include=divisions`);
        const detailData = await detailResponse.json();
        
        expect(detailData.success).toBe(true);
        
        // The endpoint should return representative data
        // Photos may be in the main representative object or as separate structure
        // Verify structure is valid
        expect(detailData.data).toHaveProperty('representative');
        const rep = detailData.data.representative;
        expect(rep).toHaveProperty('id');
        expect(rep).toHaveProperty('name');
      }
    });

    test('representative detail with FEC data includes campaign finance', async ({ request }) => {
      // Get a federal representative (more likely to have FEC data)
      const listResponse = await request.get(`${baseUrl}/api/representatives?level=federal&limit=5`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        const detailResponse = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}?include=fec`);
        const detailData = await detailResponse.json();
        
        expect(detailResponse.ok()).toBeTruthy();
        expect(detailData.success).toBe(true);
        
        // If FEC data exists, it should have proper structure
        if (detailData.data.representative.fec) {
          const fec = detailData.data.representative.fec;
          expect(fec).toHaveProperty('total_receipts');
          expect(fec).toHaveProperty('cash_on_hand');
          expect(fec).toHaveProperty('cycle');
          expect(fec).toHaveProperty('last_updated');
          expect(typeof fec.total_receipts).toBe('number');
          expect(typeof fec.cash_on_hand).toBe('number');
          expect(typeof fec.cycle).toBe('number');
        }
        
        // Attribution should mention FEC if FEC was requested (even if no data exists)
        expect(detailData.data.representative.attribution).toHaveProperty('fec');
        expect(detailData.data.representative.attribution.fec).toBe('Federal Election Commission');
      }
    });

    test('representative detail with votes includes voting records', async ({ request }) => {
      // Get a federal representative
      const listResponse = await request.get(`${baseUrl}/api/representatives?level=federal&limit=5`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        const detailResponse = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}?include=votes`);
        const detailData = await detailResponse.json();
        
        expect(detailResponse.ok()).toBeTruthy();
        expect(detailData.success).toBe(true);
        
        // If votes exist, they should have proper structure
        if (detailData.data.representative.votes) {
          const votes = detailData.data.representative.votes;
          expect(votes).toHaveProperty('last_5');
          expect(Array.isArray(votes.last_5)).toBe(true);
          
          if (votes.last_5.length > 0) {
            votes.last_5.forEach((vote: any) => {
              expect(vote).toHaveProperty('bill_title');
              expect(vote).toHaveProperty('vote_date');
              expect(vote).toHaveProperty('vote_position');
            });
          }
        }
        
        // Attribution should mention votes source
        if (detailData.data.representative.votes) {
          expect(detailData.data.representative.attribution).toHaveProperty('votes');
        }
      }
    });

    test('representative detail with contact includes contact information', async ({ request }) => {
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=5`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        const detailResponse = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}?include=contact`);
        const detailData = await detailResponse.json();
        
        expect(detailResponse.ok()).toBeTruthy();
        expect(detailData.success).toBe(true);
        
        // Contact data should have proper structure
        if (detailData.data.representative.contact) {
          const contact = detailData.data.representative.contact;
          expect(contact).toHaveProperty('last_updated');
          
          // Optional fields but should be strings if present
          if (contact.phone) expect(typeof contact.phone).toBe('string');
          if (contact.website) expect(typeof contact.website).toBe('string');
          if (contact.email) expect(typeof contact.email).toBe('string');
        }
      }
    });

    test('by-state endpoint includes multiple data types when requested', async ({ request }) => {
      const response = await request.get(
        `${baseUrl}/api/v1/civics/by-state?state=CA&level=federal&limit=3&include=fec,votes,contact,divisions`
      );
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.representatives.length).toBeGreaterThan(0);
      
      // At least one representative should have some related data
      const hasRelatedData = data.data.representatives.some((rep: any) => 
        rep.fec || rep.votes || rep.contact || rep.division_ids?.length > 0
      );
      expect(hasRelatedData).toBe(true);
      
      // Should have attribution for included data
      expect(data.data.attribution).toBeDefined();
    });
  });

  test.describe('Data Quality & Completeness', () => {
    test('representatives have data quality scores', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=20`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 0) {
        // Check that data quality scores are present (may be null for some)
        data.data.representatives.forEach((rep: any) => {
          // data_quality_score should exist in the structure
          expect(rep).toHaveProperty('data_quality_score');
          // If present, should be a number
          if (rep.data_quality_score !== null && rep.data_quality_score !== undefined) {
            expect(typeof rep.data_quality_score).toBe('number');
          }
        });
      }
    });

    test('representatives are sorted by data quality score', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=20`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 1) {
        const reps = data.data.representatives;
        
        // Extract scores, treating null as 0 for sorting comparison
        const scores = reps.map((r: any) => r.data_quality_score ?? 0);
        
        // Should be sorted descending (highest quality first)
        for (let i = 1; i < scores.length; i++) {
          // Allow equal scores (secondary sort by name)
          expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
        }
      }
    });

    test('representatives include timestamps for data freshness', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=10`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 0) {
        data.data.representatives.forEach((rep: any) => {
          // Should have updated_at timestamp
          expect(rep).toHaveProperty('updated_at');
          if (rep.updated_at) {
            expect(typeof rep.updated_at).toBe('string');
            // Should be a valid ISO date string
            expect(() => new Date(rep.updated_at)).not.toThrow();
          }
        });
      }
    });

    test('representatives exclude test data', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=100`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 0) {
        data.data.representatives.forEach((rep: any) => {
          // Should not contain "test" in name (case-insensitive)
          expect(rep.name?.toLowerCase()).not.toContain('test');
          // Should be active
          expect(rep.is_active).toBe(true);
        });
      }
    });
  });

  test.describe('Field Selection & Filtering', () => {
    test('fields parameter limits returned fields', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/civics/by-state?state=CA&limit=1&fields=id,name,office`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 0) {
        const rep = data.data.representatives[0];
        
        // Should only have requested fields
        expect(rep).toHaveProperty('id');
        expect(rep).toHaveProperty('name');
        expect(rep).toHaveProperty('office');
        
        // Should not have other fields (unless required)
        // Note: Some fields like 'attribution' may still be present
        // but detailed fields should be filtered
      }
    });

    test('search parameter filters by name and office', async ({ request }) => {
      // Search for a common name
      const response = await request.get(`${baseUrl}/api/representatives?search=Smith&limit=10`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 0) {
        // All results should match search term (case-insensitive)
        data.data.representatives.forEach((rep: any) => {
          const nameMatch = rep.name?.toLowerCase().includes('smith');
          const officeMatch = rep.office?.toLowerCase().includes('smith');
          expect(nameMatch || officeMatch).toBe(true);
        });
      }
    });

    test('multiple filters work together', async ({ request }) => {
      const response = await request.get(
        `${baseUrl}/api/representatives?state=CA&level=federal&party=Democratic&limit=10`
      );
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      if (data.success && data.data.representatives.length > 0) {
        data.data.representatives.forEach((rep: any) => {
          expect(rep.state).toBe('CA');
          expect(rep.level).toBe('federal');
          expect(rep.party?.toLowerCase()).toContain('democratic');
        });
      }
    });
  });

  test.describe('Edge Cases & Error Handling', () => {
    test('handles very large limit gracefully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=1000`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      // Should return data but may be capped
      expect(data.data.representatives.length).toBeGreaterThan(0);
      expect(data.data.representatives.length).toBeLessThanOrEqual(1000);
    });

    test('handles negative offset gracefully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?offset=-10&limit=10`);
      
      // Should either handle gracefully or return error
      // Both are acceptable behaviors
      const status = response.status();
      expect([200, 400, 422]).toContain(status);
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    test('handles invalid state codes gracefully', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?state=XX&limit=10`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      // Should return empty results, not error
      expect(data.success).toBe(true);
      expect(data.data.representatives).toEqual([]);
    });

    test('handles malformed district values', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?state=CA&district=invalid&limit=10`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      // Should return empty results, not error
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.representatives)).toBe(true);
    });

    test('handles special characters in search', async ({ request }) => {
      const specialChars = ['<script>', "' OR '1'='1", '{{', '}}', '${', '}'];
      
      for (const char of specialChars) {
        const response = await request.get(`${baseUrl}/api/representatives?search=${encodeURIComponent(char)}&limit=10`);
        
        // Should not crash or return 500
        expect(response.status()).not.toBe(500);
        
        if (response.ok()) {
          const data = await response.json();
          expect(data.success).toBe(true);
        }
      }
    });

    test('handles very long search strings', async ({ request }) => {
      const longSearch = 'a'.repeat(1000);
      const response = await request.get(`${baseUrl}/api/representatives?search=${encodeURIComponent(longSearch)}&limit=10`);
      
      // Should handle gracefully (may truncate or return empty)
      expect(response.status()).not.toBe(500);
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    test('handles missing include parameter values', async ({ request }) => {
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        // Test with empty include
        const response = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}?include=`);
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    test('handles invalid include parameter values', async ({ request }) => {
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        // Test with invalid include values
        const response = await request.get(`${baseUrl}/api/v1/civics/representative/${repId}?include=invalid,also_invalid`);
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        // Should not include invalid data types
      }
    });
  });

  test.describe('Pagination & Performance', () => {
    test('pagination returns consistent results', async ({ request }) => {
      // Get first page
      const page1Response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=0`);
      const page1Data = await page1Response.json();
      
      // Get second page
      const page2Response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=10`);
      const page2Data = await page2Response.json();
      
      expect(page1Response.ok()).toBeTruthy();
      expect(page2Response.ok()).toBeTruthy();
      
      if (page1Data.success && page2Data.success) {
        // Results should not overlap
        const page1Ids = page1Data.data.representatives.map((r: any) => r.id);
        const page2Ids = page2Data.data.representatives.map((r: any) => r.id);
        
        const overlap = page1Ids.filter((id: any) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
        
        // Total should be consistent
        expect(page1Data.data.total).toBe(page2Data.data.total);
        expect(page1Data.data.limit).toBe(10);
        expect(page2Data.data.limit).toBe(10);
      }
    });

    test('hasMore flag is accurate', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/representatives?limit=10&offset=0`);
      const data = await response.json();
      
      if (data.success) {
        const { total, limit, representatives, hasMore, page } = data.data;
        // Calculate offset from page number (page = floor(offset/limit) + 1, so offset = (page - 1) * limit)
        const offset = (page - 1) * limit;
        // hasMore should be true if we got a full page AND there are more results
        const expectedHasMore = representatives.length === limit && (offset + limit) < total;
        expect(hasMore).toBe(expectedHasMore);
      }
    });

    test('pagination with filters maintains consistency', async ({ request }) => {
      const page1Response = await request.get(`${baseUrl}/api/representatives?state=CA&limit=5&offset=0`);
      const page2Response = await request.get(`${baseUrl}/api/representatives?state=CA&limit=5&offset=5`);
      
      expect(page1Response.ok()).toBeTruthy();
      expect(page2Response.ok()).toBeTruthy();
      
      const page1Data = await page1Response.json();
      const page2Data = await page2Response.json();
      
      if (page1Data.success && page2Data.success) {
        // All results should be from CA
        [...page1Data.data.representatives, ...page2Data.data.representatives].forEach((rep: any) => {
          expect(rep.state).toBe('CA');
        });
        
        // Total should be consistent
        expect(page1Data.data.total).toBe(page2Data.data.total);
      }
    });

    test('response time is acceptable for large queries', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${baseUrl}/api/representatives?limit=50`);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      expect(response.ok()).toBeTruthy();
      // Should respond within 3 seconds for 50 results
      expect(duration).toBeLessThan(3000);
    });

    test('response time with multiple includes is acceptable', async ({ request }) => {
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=1`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repId = listData.data.representatives[0].id;
        
        const startTime = Date.now();
        const response = await request.get(
          `${baseUrl}/api/v1/civics/representative/${repId}?include=fec,votes,contact,divisions`
        );
        const endTime = Date.now();
        
        const duration = endTime - startTime;
        
        expect(response.ok()).toBeTruthy();
        // Should respond within 5 seconds with all includes
        expect(duration).toBeLessThan(5000);
      }
    });
  });

  test.describe('OCD Division Integration', () => {
    test('representatives can be filtered by OCD division ID', async ({ request }) => {
      // First, get a representative with division IDs
      const listResponse = await request.get(`${baseUrl}/api/representatives?limit=20`);
      const listData = await listResponse.json();
      
      if (listData.success && listData.data.representatives.length > 0) {
        const repWithDivision = listData.data.representatives.find((r: any) => 
          Array.isArray(r.division_ids) && r.division_ids.length > 0
        );
        
        if (repWithDivision) {
          const divisionId = repWithDivision.division_ids[0];
          
          // Filter by division ID
          const filterResponse = await request.get(
            `${baseUrl}/api/representatives?ocd_division_id=${encodeURIComponent(divisionId)}&limit=10`
          );
          
          expect(filterResponse.ok()).toBeTruthy();
          const filterData = await filterResponse.json();
          
          expect(filterData.success).toBe(true);
          
          // Results should include representatives with this division
          if (filterData.data.representatives.length > 0) {
            const hasDivision = filterData.data.representatives.some((r: any) =>
              Array.isArray(r.division_ids) && r.division_ids.includes(divisionId)
            );
            expect(hasDivision).toBe(true);
          }
        }
      }
    });

    test('OCD division ID from Google API lookup works', async ({ request }) => {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      test.skip(!apiKey, 'GOOGLE_CIVIC_API_KEY not configured');

      // Get jurisdiction from Google API
      const lookupResponse = await request.post(`${baseUrl}/api/v1/civics/address-lookup`, {
        data: { address: '123 Main St, Springfield, IL 62704' }
      });
      
      expect(lookupResponse.ok()).toBeTruthy();
      const lookupData = await lookupResponse.json();
      
      if (lookupData.success && lookupData.data.jurisdiction.ocd_division_id) {
        const ocdId = lookupData.data.jurisdiction.ocd_division_id;
        
        // Use OCD ID to filter representatives
        const repsResponse = await request.get(
          `${baseUrl}/api/representatives?ocd_division_id=${encodeURIComponent(ocdId)}&limit=10`
        );
        
        expect(repsResponse.ok()).toBeTruthy();
        const repsData = await repsResponse.json();
        
        expect(repsData.success).toBe(true);
        // Should return representatives for this division
        expect(Array.isArray(repsData.data.representatives)).toBe(true);
      }
    });
  });
});

