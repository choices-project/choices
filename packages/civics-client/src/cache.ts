type Cache = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
};

class MemoryCache implements Cache {
  private map = new Map<string, { v: string; exp: number }>();
  async get(key: string) {
    const hit = this.map.get(key);
    if (!hit) return null;
    if (Date.now() > hit.exp) { this.map.delete(key); return null; }
    return hit.v;
  }
  async set(key: string, value: string, ttlSec: number) {
    this.map.set(key, { v: value, exp: Date.now() + ttlSec * 1000 });
  }
}

export function createCache(): Cache {
  // Later: if (process.env.REDIS_URL) return new RedisCache(process.env.REDIS_URL!)
  return new MemoryCache();
}
