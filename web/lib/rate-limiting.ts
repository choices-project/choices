/**
 * Rate Limiting and API Monitoring
 * 
 * Ensures we never abuse any APIs and respect all rate limits
 * 
 * Created: 2025-10-05
 * Status: Critical for production use
 */

export interface RateLimit {
  daily: number;
  perMinute: number;
  delay: number; // milliseconds between requests
}

export interface APIUsage {
  api: string;
  requestsToday: number;
  requestsThisMinute: number;
  lastRequest: Date;
  rateLimit: RateLimit;
}

// Actual published rate limits - using real limits for efficiency
export const RATE_LIMITS: Record<string, RateLimit> = {
  openStates: { 
    daily: 250, // Actual limit
    perMinute: 10, // Actual limit
    delay: 6000 // 6 seconds between requests (conservative for 10/min)
  },
  congressGov: { 
    daily: 5000, // Actual limit
    perMinute: 100, // Actual limit
    delay: 600 // 0.6 seconds between requests (conservative for 100/min)
  },
  fec: { 
    daily: 1000, // Actual limit
    perMinute: 60, // Actual limit
    delay: 1000 // 1 second between requests (conservative for 60/min)
  },
  googleCivic: { 
    daily: 100000, // Actual limit
    perMinute: 1000, // Actual limit
    delay: 60 // 60ms between requests (conservative for 1000/min)
  },
  legiscan: { 
    daily: 1000, // Actual limit
    perMinute: 60, // Actual limit
    delay: 1000 // 1 second between requests (conservative for 60/min)
  }
};

// Track API usage
const apiUsage: Record<string, APIUsage> = {};

export function canMakeRequest(api: string): boolean {
  const usage = apiUsage[api];
  const limit = RATE_LIMITS[api];
  
  if (!usage || !limit) return true;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  
  // Check daily limit
  if (usage.lastRequest >= today && usage.requestsToday >= limit.daily) {
    return false;
  }
  
  // Check per-minute limit
  if (usage.lastRequest >= thisMinute && usage.requestsThisMinute >= limit.perMinute) {
    return false;
  }
  
  return true;
}

export function recordRequest(api: string): void {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  
  if (!apiUsage[api]) {
    apiUsage[api] = {
      api,
      requestsToday: 0,
      requestsThisMinute: 0,
      lastRequest: now,
      rateLimit: RATE_LIMITS[api]
    };
  }
  
  const usage = apiUsage[api];
  
  // Reset counters if needed
  if (usage.lastRequest < today) {
    usage.requestsToday = 0;
  }
  if (usage.lastRequest < thisMinute) {
    usage.requestsThisMinute = 0;
  }
  
  usage.requestsToday++;
  usage.requestsThisMinute++;
  usage.lastRequest = now;
}

export function getRequiredDelay(api: string): number {
  const usage = apiUsage[api];
  const limit = RATE_LIMITS[api];
  
  if (!usage || !limit) return limit?.delay || 1000;
  
  const now = new Date();
  const timeSinceLastRequest = now.getTime() - usage.lastRequest.getTime();
  
  // If we haven't waited long enough, return remaining delay
  if (timeSinceLastRequest < limit.delay) {
    return limit.delay - timeSinceLastRequest;
  }
  
  return 0;
}

export function getAPIStatus(): Record<string, APIUsage> {
  return { ...apiUsage };
}

export function getRateLimitStatus(): Record<string, { canMakeRequest: boolean; delayNeeded: number; usage: APIUsage }> {
  const status: Record<string, { canMakeRequest: boolean; delayNeeded: number; usage: APIUsage }> = {};
  
  for (const api of Object.keys(RATE_LIMITS)) {
    status[api] = {
      canMakeRequest: canMakeRequest(api),
      delayNeeded: getRequiredDelay(api),
      usage: apiUsage[api] || {
        api,
        requestsToday: 0,
        requestsThisMinute: 0,
        lastRequest: new Date(0),
        rateLimit: RATE_LIMITS[api]
      }
    };
  }
  
  return status;
}

export async function waitForRateLimit(api: string): Promise<void> {
  const delay = getRequiredDelay(api);
  if (delay > 0) {
    console.log(`⏳ Waiting ${delay}ms for ${api} rate limit...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export function logAPIUsage(): void {
  console.log('\n📊 API Usage Status:');
  const status = getRateLimitStatus();
  
  for (const [api, info] of Object.entries(status)) {
    const { canMakeRequest, delayNeeded, usage } = info;
    const statusIcon = canMakeRequest ? '✅' : '❌';
    const delayText = delayNeeded > 0 ? ` (wait ${Math.ceil(delayNeeded/1000)}s)` : '';
    
    console.log(`  ${statusIcon} ${api}: ${usage.requestsToday}/${usage.rateLimit.daily} today, ${usage.requestsThisMinute}/${usage.rateLimit.perMinute} this minute${delayText}`);
  }
}
