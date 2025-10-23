/**
 * API Helper for E2E Tests
 * 
 * Provides consistent API call handling with proper timeouts and error handling
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

export class ApiHelper {
  private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
  private static readonly RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds

  /**
   * Make a GET request with proper timeout and retry logic
   */
  static async get(
    page: any, 
    url: string, 
    options: { timeout?: number; retries?: number } = {}
  ): Promise<{ response: any; success: boolean; error?: string }> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const retries = options.retries || this.RETRY_ATTEMPTS;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔌 API GET ${url} (attempt ${attempt}/${retries})`);
        const response = await page.request.get(url, { timeout });
        
        if (response.status() >= 200 && response.status() < 300) {
          console.log(`✅ API GET ${url}: ${response.status()}`);
          return { response, success: true };
        } else {
          console.log(`⚠️ API GET ${url}: ${response.status()}`);
          if (attempt === retries) {
            return { response, success: false, error: `HTTP ${response.status()}` };
          }
        }
      } catch (error) {
        console.log(`❌ API GET ${url} failed (attempt ${attempt}/${retries}):`, error);
        if (attempt === retries) {
          return { response: null, success: false, error: String(error) };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    return { response: null, success: false, error: 'Max retries exceeded' };
  }

  /**
   * Make a POST request with proper timeout and retry logic
   */
  static async post(
    page: any, 
    url: string, 
    data: any, 
    options: { timeout?: number; retries?: number } = {}
  ): Promise<{ response: any; success: boolean; error?: string }> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const retries = options.retries || this.RETRY_ATTEMPTS;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔌 API POST ${url} (attempt ${attempt}/${retries})`);
        const response = await page.request.post(url, { 
          data,
          timeout 
        });
        
        if (response.status() >= 200 && response.status() < 300) {
          console.log(`✅ API POST ${url}: ${response.status()}`);
          return { response, success: true };
        } else {
          console.log(`⚠️ API POST ${url}: ${response.status()}`);
          if (attempt === retries) {
            return { response, success: false, error: `HTTP ${response.status()}` };
          }
        }
      } catch (error) {
        console.log(`❌ API POST ${url} failed (attempt ${attempt}/${retries}):`, error);
        if (attempt === retries) {
          return { response: null, success: false, error: String(error) };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    return { response: null, success: false, error: 'Max retries exceeded' };
  }

  /**
   * Make a PUT request with proper timeout and retry logic
   */
  static async put(
    page: any, 
    url: string, 
    data: any, 
    options: { timeout?: number; retries?: number } = {}
  ): Promise<{ response: any; success: boolean; error?: string }> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const retries = options.retries || this.RETRY_ATTEMPTS;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔌 API PUT ${url} (attempt ${attempt}/${retries})`);
        const response = await page.request.put(url, { 
          data,
          timeout 
        });
        
        if (response.status() >= 200 && response.status() < 300) {
          console.log(`✅ API PUT ${url}: ${response.status()}`);
          return { response, success: true };
        } else {
          console.log(`⚠️ API PUT ${url}: ${response.status()}`);
          if (attempt === retries) {
            return { response, success: false, error: `HTTP ${response.status()}` };
          }
        }
      } catch (error) {
        console.log(`❌ API PUT ${url} failed (attempt ${attempt}/${retries}):`, error);
        if (attempt === retries) {
          return { response: null, success: false, error: String(error) };
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    return { response: null, success: false, error: 'Max retries exceeded' };
  }

  /**
   * Test API connectivity with basic health check
   */
  static async testConnectivity(page: any): Promise<boolean> {
    console.log('🔍 Testing API connectivity...');
    
    const result = await this.get(page, '/api/health', { timeout: 10000 });
    if (result.success) {
      console.log('✅ API connectivity confirmed');
      return true;
    } else {
      console.log('❌ API connectivity failed:', result.error);
      return false;
    }
  }
}

