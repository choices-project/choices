/**
 * GovInfo MCP Service
 * 
 * Service wrapper for GovInfo MCP (Model Context Protocol) server
 * Provides access to U.S. government documents including bills, laws, regulations
 * 
 * ⚠️ SERVER-ONLY: This service MUST only be used in API routes and server actions.
 * It is NOT safe for client-side use and will throw if accessed from the client.
 * 
 * MCP tools are only available in agent/server context, not to end users.
 * 
 * Note: 'use server' directive removed - this is a service class, not a server action.
 * Runtime checks ensure server-only usage.
 * 
 * @author Choices Platform Team
 * @date 2026-01-25
 */

import { logger } from '@/lib/utils/logger';

// Runtime assertion to prevent client-side usage
function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'GovInfo MCP Service is server-only and cannot be used in client components. ' +
      'Use API routes or server actions instead.'
    );
  }
}

const MCP_SERVER = 'project-0-Choices-govinfo';

export type BillContentFormat = 'html' | 'xml' | 'pdf' | 'text';

export type BillSearchFilters = {
  collection?: 'BILLS' | 'PLAW' | 'USCODE' | 'STATUTE' | 'CREC' | 'COMPS';
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  congress?: number;
  page_size?: number; // 1-100, default 50
  offset_mark?: string;
};

export type BillPackage = {
  packageId: string;
  packageLink: string;
  title: string;
  lastModified: string;
  packageType: string;
  [key: string]: unknown;
};

export type BillSearchResult = {
  packages: BillPackage[];
  nextPage?: string;
  count?: number;
};

export type BillContent = {
  packageId: string;
  content: string;
  format: BillContentFormat;
  metadata?: Record<string, unknown>;
};

export type BillSummary = {
  packageId: string;
  title: string;
  summary?: string;
  lastModified: string;
  download?: Array<{ type: string; link: string }>;
  [key: string]: unknown;
};

export type RelatedPackage = {
  packageId: string;
  relationship: string;
  title?: string;
  [key: string]: unknown;
};

/**
 * GovInfo REST API Client (Primary Implementation)
 * 
 * Uses GovInfo REST API directly for server-side access to government documents.
 * This is the primary implementation - MCP can be added as an enhancement later.
 * 
 * The GovInfo API provides the same data as MCP but via standard HTTP REST API.
 */
class GovInfoRestClient {
  private apiKey: string;
  private baseUrl = 'https://api.govinfo.gov';
  private timeout = 30000; // 30 seconds

  constructor() {
    const apiKey = process.env.GOVINFO_API_KEY || 
                   process.env.GPO_API_KEY || 
                   process.env.GOVINFO_APIKEY ||
                   process.env.GOVINFO_KEY;
    
    if (!apiKey) {
      logger.warn('GovInfo API key not found - bill content features will be limited');
    }
    
    this.apiKey = apiKey || '';
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<{ result?: unknown }> {
    assertServerOnly();
    
    if (!this.apiKey) {
      logger.warn('GovInfo API key not configured', { toolName });
      return { result: null };
    }

    try {
      // Map MCP tool names to GovInfo API endpoints
      switch (toolName) {
        case 'packages_get_package_content':
          return await this.getPackageContent(
            args.package_id as string,
            (args.content_type as string) || 'html'
          );
        
        case 'packages_get_package_summary':
          return await this.getPackageSummary(args.package_id as string);
        
        case 'search_search_packages':
          return await this.searchPackages(args);
        
        case 'related_get_related_packages':
          return await this.getRelatedPackages(args.package_id as string);
        
        case 'statutes_search_statutes':
          return await this.searchStatutes(args);
        
        case 'statutes_get_public_laws_by_congress':
          return await this.getPublicLawsByCongress(args);
        
        default:
          logger.warn('Unknown MCP tool name', { toolName });
          return { result: null };
      }
    } catch (error) {
      logger.error('GovInfo API call failed', {
        toolName,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: null };
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      logger.debug('Making GovInfo API request', {
        endpoint,
        hasApiKey: !!this.apiKey
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Choices-Platform/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.warn('GovInfo API request failed', {
          endpoint,
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`GovInfo API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      logger.debug('GovInfo API request successful', {
        endpoint,
        status: response.status
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error('GovInfo API request error', {
        endpoint,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async getPackageContent(packageId: string, contentType: string): Promise<{ result?: unknown }> {
    // GovInfo API: Get package content in specified format
    // Endpoints: /packages/{packageId}/htm, /packages/{packageId}/xml, etc.
    const formatMap: Record<string, string> = {
      'html': 'htm',
      'xml': 'xml',
      'pdf': 'pdf',
      'text': 'txt'
    };
    
    const format = formatMap[contentType] || 'htm';
    const endpoint = `/packages/${packageId}/${format}`;
    
    try {
      // For text-based formats, fetch as text
      if (contentType === 'html' || contentType === 'xml' || contentType === 'text') {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.set('api_key', this.apiKey);
        
        const response = await fetch(url.toString(), {
          headers: {
            'Accept': contentType === 'html' ? 'text/html' : contentType === 'xml' ? 'application/xml' : 'text/plain',
            'User-Agent': 'Choices-Platform/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        return { result: content };
      } else {
        // For PDF or other binary, would need different handling
        const content = await this.makeRequest<string>(endpoint);
        return { result: content };
      }
    } catch (error) {
      logger.warn('Failed to get package content, trying summary', {
        packageId,
        contentType,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback: return null if content not available
      return { result: null };
    }
  }

  private async getPackageSummary(packageId: string): Promise<{ result?: unknown }> {
    const endpoint = `/packages/${packageId}/summary`;
    try {
      const data = await this.makeRequest<Record<string, unknown>>(endpoint);
      return { result: data };
    } catch (error) {
      logger.warn('Failed to get package summary', {
        packageId,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: null };
    }
  }

  private async searchPackages(args: Record<string, unknown>): Promise<{ result?: unknown }> {
    // GovInfo search API: /search
    const endpoint = '/search';
    const params: Record<string, unknown> = {
      query: args.query || '',
      collection: args.collection || 'BILLS',
      pageSize: args.page_size || 50,
      offsetMark: args.offset_mark || '*'
    };
    
    if (args.start_date) params.startDate = args.start_date;
    if (args.end_date) params.endDate = args.end_date;
    
    try {
      const data = await this.makeRequest<{ packages?: BillPackage[]; nextPage?: string }>(endpoint, params);
      // Transform to match expected format
      return { 
        result: {
          packages: (data.packages || []) as BillPackage[],
          nextPage: data.nextPage,
          count: (data.packages || []).length
        }
      };
    } catch (error) {
      logger.warn('GovInfo search failed', {
        query: args.query,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: { packages: [], count: 0 } };
    }
  }

  private async getRelatedPackages(packageId: string): Promise<{ result?: unknown }> {
    // GovInfo related packages API
    const endpoint = `/packages/${packageId}/related`;
    try {
      const data = await this.makeRequest<{ packages?: unknown[] }>(endpoint);
      return { result: { packages: data.packages || [] } };
    } catch (error) {
      logger.warn('Failed to get related packages', {
        packageId,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: { packages: [] } };
    }
  }

  private async searchStatutes(args: Record<string, unknown>): Promise<{ result?: unknown }> {
    const endpoint = '/search';
    const params: Record<string, unknown> = {
      query: args.query || '',
      collection: args.collection || 'USCODE',
      pageSize: args.page_size || 50
    };
    
    if (args.congress) params.congress = args.congress;
    if (args.title_number) params.titleNumber = args.title_number;
    if (args.section) params.section = args.section;
    if (args.start_date) params.startDate = args.start_date;
    if (args.end_date) params.endDate = args.end_date;
    
    const data = await this.makeRequest(endpoint, params);
    return { result: data };
  }

  private async getPublicLawsByCongress(args: Record<string, unknown>): Promise<{ result?: unknown }> {
    const endpoint = '/search';
    const params: Record<string, unknown> = {
      collection: 'PLAW',
      congress: args.congress,
      pageSize: args.page_size || 50
    };
    
    if (args.law_type) params.lawType = args.law_type;
    if (args.law_number) params.lawNumber = args.law_number;
    if (args.start_date) params.startDate = args.start_date;
    if (args.end_date) params.endDate = args.end_date;
    
    const data = await this.makeRequest(endpoint, params);
    return { result: data };
  }
}

// Create singleton REST client
const govInfoRestClient = new GovInfoRestClient();

/**
 * MCP Tool Call Wrapper
 * 
 * Uses GovInfo REST API as primary implementation.
 * MCP can be added as enhancement later for agent-specific features.
 */
async function callMCPTool(params: {
  server: string;
  toolName: string;
  arguments: Record<string, unknown>;
}): Promise<{ result?: unknown }> {
  assertServerOnly();
  
  // Use REST API client (works from any server context)
  return await govInfoRestClient.callTool(params.toolName, params.arguments);
}

export class GovInfoMCPService {
  /**
   * Get bill content in specified format
   * Always checks package summary first to verify format availability
   */
  async getBillContent(
    packageId: string,
    format: BillContentFormat = 'html'
  ): Promise<BillContent | null> {
    assertServerOnly();
    try {
      // First, get package summary to check available formats
      const summary = await this.getPackageSummary(packageId);
      
      if (!summary) {
        logger.warn('Package summary not found', { packageId });
        return null;
      }

      // Check if requested format is available
      const availableFormats = summary.download?.map((d: { type: string }) => d.type) || [];
      const requestedFormat = format;
      
      // Fallback to HTML if requested format not available
      const useFormat = availableFormats.includes(requestedFormat) 
        ? requestedFormat 
        : availableFormats.includes('html') 
          ? 'html' 
          : availableFormats[0] || 'html';

      if (!availableFormats.includes(useFormat)) {
        logger.warn('No suitable format available', { 
          packageId, 
          requested: format, 
          available: availableFormats 
        });
        return null;
      }

      const result = await callMCPTool({
        server: MCP_SERVER,
        toolName: 'packages_get_package_content',
        arguments: {
          package_id: packageId,
          content_type: useFormat
        }
      });

      if (!result || !result.result) {
        logger.warn('No content returned', { packageId, format: useFormat });
        return null;
      }

      return {
        packageId,
        content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
        format: useFormat as BillContentFormat,
        metadata: {
          requestedFormat: format,
          actualFormat: useFormat,
          availableFormats
        }
      };
    } catch (error) {
      logger.error('Failed to get bill content', { 
        packageId, 
        format, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  }

  /**
   * Get package summary/metadata
   */
  async getPackageSummary(packageId: string): Promise<BillSummary | null> {
    assertServerOnly();
    try {
      const result = await callMCPTool({
        server: MCP_SERVER,
        toolName: 'packages_get_package_summary',
        arguments: {
          package_id: packageId
        }
      });

      if (!result || !result.result) {
        return null;
      }

      const summary = result.result as Record<string, unknown>;
      
      return {
        packageId,
        title: (summary.title as string) || packageId,
        summary: summary.summary as string | undefined,
        lastModified: (summary.lastModified as string) || new Date().toISOString(),
        download: summary.download as Array<{ type: string; link: string }> | undefined,
        ...summary
      };
    } catch (error) {
      logger.error('Failed to get package summary', { 
        packageId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  }

  /**
   * Search for bills/packages
   */
  async searchBills(
    query: string,
    filters: BillSearchFilters = {}
  ): Promise<BillSearchResult> {
    assertServerOnly();
    try {
      const result = await callMCPTool({
        server: MCP_SERVER,
        toolName: 'search_search_packages',
        arguments: {
          query,
          collection: filters.collection || 'BILLS',
          start_date: filters.start_date || '',
          end_date: filters.end_date || '',
          page_size: filters.page_size || 50,
          offset_mark: filters.offset_mark || '*'
        }
      });

      if (!result || !result.result) {
        return { packages: [] };
      }

      const searchResult = result.result as Record<string, unknown> | null;
      if (!searchResult) {
        return { packages: [] };
      }
      const packages = (searchResult.packages as BillPackage[]) || [];
      const nextPage = (searchResult.nextPage as string | undefined) || undefined;

      return {
        packages,
        nextPage,
        count: packages.length
      };
    } catch (error) {
      logger.error('Failed to search bills', { 
        query, 
        filters, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return { packages: [] };
    }
  }

  /**
   * Get related packages (amendments, related bills, etc.)
   */
  async getRelatedBills(packageId: string): Promise<RelatedPackage[]> {
    assertServerOnly();
    try {
      const result = await callMCPTool({
        server: MCP_SERVER,
        toolName: 'related_get_related_packages',
        arguments: {
          package_id: packageId
        }
      });

      if (!result || !result.result) {
        return [];
      }

      const relatedResult = result.result as Record<string, unknown> | null;
      if (!relatedResult) {
        return [];
      }
      return (relatedResult.packages as RelatedPackage[]) || [];
    } catch (error) {
      logger.error('Failed to get related bills', { 
        packageId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  }

  /**
   * Search Congressional Record
   */
  async searchCongressionalRecord(
    query: string,
    filters: Omit<BillSearchFilters, 'collection'> = {}
  ): Promise<BillSearchResult> {
    assertServerOnly();
    return this.searchBills(query, {
      ...filters,
      collection: 'CREC'
    });
  }

  /**
   * Search statutes (US Code, Public Laws, etc.)
   */
  async searchStatutes(
    query: string,
    collection: 'USCODE' | 'STATUTE' | 'PLAW' | 'COMPS' = 'USCODE',
    filters: {
      congress?: number;
      title_number?: string;
      section?: string;
      start_date?: string;
      end_date?: string;
      page_size?: number;
    } = {}
  ): Promise<BillSearchResult> {
    assertServerOnly();
    try {
      const result = await callMCPTool({
        server: MCP_SERVER,
        toolName: 'statutes_search_statutes',
        arguments: {
          query,
          collection,
          congress: filters.congress || null,
          title_number: filters.title_number || '',
          section: filters.section || '',
          start_date: filters.start_date || '',
          end_date: filters.end_date || '',
          page_size: filters.page_size || 50
        }
      });

      if (!result || !result.result) {
        return { packages: [] };
      }

      const searchResult = result.result as Record<string, unknown>;
      const packages = (searchResult.packages as BillPackage[]) || [];

      return {
        packages,
        count: packages.length
      };
    } catch (error) {
      logger.error('Failed to search statutes', { 
        query, 
        collection, 
        filters, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return { packages: [] };
    }
  }

  /**
   * Get public laws by Congress
   */
  async getPublicLawsByCongress(
    congress: number,
    filters: {
      law_type?: 'public' | 'private';
      law_number?: string;
      start_date?: string;
      end_date?: string;
      page_size?: number;
    } = {}
  ): Promise<BillSearchResult> {
    assertServerOnly();
    try {
      const result = await callMCPTool({
        server: MCP_SERVER,
        toolName: 'statutes_get_public_laws_by_congress',
        arguments: {
          congress,
          law_type: filters.law_type || '',
          law_number: filters.law_number || '',
          start_date: filters.start_date || '',
          end_date: filters.end_date || '',
          page_size: filters.page_size || 50
        }
      });

      if (!result || !result.result) {
        return { packages: [] };
      }

      const searchResult = result.result as Record<string, unknown>;
      const packages = (searchResult.packages as BillPackage[]) || [];

      return {
        packages,
        count: packages.length
      };
    } catch (error) {
      logger.error('Failed to get public laws', { 
        congress, 
        filters, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return { packages: [] };
    }
  }
}

// Export singleton instance
export const govInfoMCPService = new GovInfoMCPService();
