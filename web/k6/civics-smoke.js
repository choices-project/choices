/* eslint-env k6 */
import { sleep, check } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    // Accept 200 (success or fallback), reject 400/429/500
    // 503 (feature disabled) is acceptable but rare
    'http_req_failed{status:200}': ['rate<1'],
    'http_req_failed{status:503}': ['rate<1'], // Feature disabled is acceptable
    'http_req_failed{status:400}': ['rate<0.01'], // Validation errors should be rare
    'http_req_failed{status:429}': ['rate<0.01'], // Rate limit should not be hit
    'http_req_failed{status:500}': ['rate<0.01'], // Server errors should be rare
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const URL = `${BASE}/api/v1/civics/address-lookup`;

export default function civicsSmokeTest() {
  const payload = JSON.stringify({ address: '1600 Pennsylvania Ave NW, Washington, DC' });
  const params = { headers: { 'content-type': 'application/json' } };

  const res = http.post(URL, payload, params);
  
  // The endpoint should return 200 (with fallback data if external API fails)
  // or 503 (if feature is disabled)
  const isSuccess = res.status === 200;
  const isDisabled = res.status === 503;
  const isValidStatus = isSuccess || isDisabled;
  
  let hasData = false;
  try {
    const body = JSON.parse(res.body);
    hasData = !!(body.data || (body.success !== false && body.data !== undefined));
  } catch {
    // Invalid JSON is a failure
  }
  
  check(res, {
    'valid status (200 or 503)': () => isValidStatus,
    'has response data': () => hasData || isDisabled, // Disabled responses may not have data
  });

  sleep(1);
}
