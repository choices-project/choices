/* eslint-env k6 */
import { sleep, check } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<1'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const URL = `${BASE}/api/v1/civics/address-lookup`;

export default function civicsSmokeTest() {
  const payload = JSON.stringify({ address: '1600 Pennsylvania Ave NW, Washington, DC' });
  const params = { headers: { 'content-type': 'application/json' } };

  const res = http.post(URL, payload, params);
  check(res, {
    '200 OK': r => r.status === 200,
    'has data': r => JSON.parse(r.body).data,
  });

  sleep(1);
}
