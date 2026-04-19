/**
 * Minimal representatives list payload for Playwright route mocks (CI without real Supabase).
 */

const timestamp = () => new Date().toISOString();

export const E2E_MOCK_REPRESENTATIVE = {
  id: 90001,
  name: 'Taylor Chen',
  party: 'Independent',
  office: 'State Assembly',
  level: 'state' as const,
  state: 'CA',
  district: '15',
  data_quality_score: 95,
  verification_status: 'verified' as const,
  data_sources: ['e2e-fixture'],
  created_at: timestamp(),
  updated_at: timestamp(),
};

/** Matches `successResponse` shape from `GET /api/representatives`. */
export function buildE2ERepresentativesListPayload() {
  return {
    success: true,
    data: {
      representatives: [E2E_MOCK_REPRESENTATIVE],
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    },
  };
}
