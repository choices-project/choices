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
const GOVINFO_RETRY_MAX = 3;
const GOVINFO_RETRY_BASE_MS = 1000;

/** 30-day TTL for bill summary/content (bills don't change after publication). */
const GOVINFO_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const GOVINFO_CACHE_MAX_ENTRIES = 500;

type CacheEntry<T> = { data: T; expires: number };

const govinfoSummaryCache = new Map<string, CacheEntry<BillSummary>>();
const govinfoContentCache = new Map<string, CacheEntry<BillContent>>();

function getCachedSummary(packageId: string): BillSummary | null {
  const entry = govinfoSummaryCache.get(packageId);
  if (!entry || Date.now() > entry.expires) {
    if (entry) govinfoSummaryCache.delete(packageId);
    return null;
  }
  return entry.data;
}

function setCachedSummary(packageId: string, data: BillSummary): void {
  if (govinfoSummaryCache.size >= GOVINFO_CACHE_MAX_ENTRIES) {
    const first = govinfoSummaryCache.keys().next().value;
    if (first) govinfoSummaryCache.delete(first);
  }
  govinfoSummaryCache.set(packageId, { data, expires: Date.now() + GOVINFO_CACHE_TTL_MS });
}

function getCachedContent(packageId: string, format: string): BillContent | null {
  const key = `${packageId}:${format}`;
  const entry = govinfoContentCache.get(key);
  if (!entry || Date.now() > entry.expires) {
    if (entry) govinfoContentCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedContent(packageId: string, format: string, data: BillContent): void {
  const key = `${packageId}:${format}`;
  if (govinfoContentCache.size >= GOVINFO_CACHE_MAX_ENTRIES) {
    const first = govinfoContentCache.keys().next().value;
    if (first) govinfoContentCache.delete(first);
  }
  govinfoContentCache.set(key, { data, expires: Date.now() + GOVINFO_CACHE_TTL_MS });
}

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

  /** Retry fetch on 429 or 5xx with exponential backoff. */
  private async fetchWithRetry(
    attemptFn: () => Promise<Response>,
    ctx: { endpoint?: string; label?: string }
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= GOVINFO_RETRY_MAX; attempt++) {
      try {
        const response = await attemptFn();
        if (response.ok) {
          return response;
        }
        const status = response.status;
        const retryable = status === 429 || (status >= 500 && status < 600);
        const errorText = await response.text().catch(() => 'Unknown error');
        lastError = new Error(`GovInfo API error: ${status} ${errorText}`);
        logger.warn('GovInfo API request failed', {
          ...ctx,
          status,
          attempt: attempt + 1,
          maxRetries: GOVINFO_RETRY_MAX
        });
        if (!retryable || attempt === GOVINFO_RETRY_MAX) {
          throw lastError;
        }
        const delay = GOVINFO_RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('GovInfo API error:')) {
          throw e;
        }
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt === GOVINFO_RETRY_MAX) {
          throw lastError;
        }
        const delay = GOVINFO_RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError ?? new Error('GovInfo API request failed');
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    try {
      logger.debug('Making GovInfo API request', { endpoint, hasApiKey: !!this.apiKey });

      const response = await this.fetchWithRetry(
        () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          return fetch(url.toString(), {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'User-Agent': 'Choices-Platform/1.0'
            },
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
        },
        { endpoint }
      );

      const data = (await response.json()) as T;
      logger.debug('GovInfo API request successful', { endpoint, status: response.status });
      return data;
    } catch (error) {
      logger.error('GovInfo API request error', {
        endpoint,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * POST /search — GovInfo Search API requires POST with JSON body.
   * Uses Lucene-style query (collection:X AND congress:Y AND publishdate:>=... AND query).
   * X-Api-Key header per GovInfo Search convention.
   */
  private async makeSearchRequest<T>(body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/search`;

    try {
      logger.debug('Making GovInfo Search API request', { hasApiKey: !!this.apiKey });

      const response = await this.fetchWithRetry(
        () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          return fetch(url, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'Choices-Platform/1.0',
              'X-Api-Key': this.apiKey
            },
            body: JSON.stringify(body),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));
        },
        { label: 'search' }
      );

      const data = (await response.json()) as T;
      logger.debug('GovInfo Search API request successful', { status: response.status });
      return data;
    } catch (error) {
      logger.error('GovInfo Search API request error', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /** Build Lucene-style query string from filters (matches Python MCP search_packages). */
  private buildSearchQuery(args: {
    query: string;
    collection?: string;
    congress?: number | null;
    doc_class?: string;
    title?: string;
    start_date?: string;
    end_date?: string;
    title_number?: string;
    section?: string;
    law_type?: string;
    law_number?: string;
  }): string {
    let q = args.query?.trim() || '*';
    if (args.collection) {
      q = `collection:${args.collection} AND ${q}`;
    }
    if (args.congress != null) {
      q = `congress:${args.congress} AND ${q}`;
    }
    if (args.doc_class) {
      q = `docClass:${args.doc_class} AND ${q}`;
    }
    if (args.title) {
      q = `title:"${args.title.replace(/"/g, '\\"')}" AND ${q}`;
    }
    if (args.start_date) {
      q = `publishdate:>=${args.start_date} AND ${q}`;
    }
    if (args.end_date) {
      q = `publishdate:<=${args.end_date} AND ${q}`;
    }
    if (args.title_number) {
      q = `titlenum:${args.title_number} AND ${q}`;
    }
    if (args.section) {
      q = `section:${args.section} AND ${q}`;
    }
    if (args.law_type) {
      q = `lawtype:${args.law_type} AND ${q}`;
    }
    if (args.law_number) {
      q = `lawnum:${args.law_number} AND ${q}`;
    }
    return q;
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
      // For text-based formats, fetch as text with retry
      if (contentType === 'html' || contentType === 'xml' || contentType === 'text') {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.set('api_key', this.apiKey);

        const response = await this.fetchWithRetry(
          () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            return fetch(url.toString(), {
              headers: {
                Accept: contentType === 'html' ? 'text/html' : contentType === 'xml' ? 'application/xml' : 'text/plain',
                'User-Agent': 'Choices-Platform/1.0'
              },
              signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
          },
          { endpoint: `/packages/${packageId}/${format}` }
        );

        const content = await response.text();
        return { result: content };
      } else {
        // For PDF or other binary, use makeRequest which has retry
        const content = await this.makeRequest<string>(endpoint);
        return { result: content };
      }
    } catch (error) {
      logger.warn('Failed to get package content', {
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
    const collection = (args.collection as string) || 'BILLS';
    const pageSize = Math.min(100, Math.max(1, Number(args.page_size) || 50));
    const offsetMark = (args.offset_mark as string) || '*';

    const searchArgs: {
      query: string;
      collection?: string;
      congress?: number | null;
      start_date?: string;
      end_date?: string;
    } = { query: (args.query as string) || '', collection };
    if (args.congress != null) searchArgs.congress = args.congress as number | null;
    if ((args.start_date as string) !== undefined) searchArgs.start_date = (args.start_date as string) || '';
    if ((args.end_date as string) !== undefined) searchArgs.end_date = (args.end_date as string) || '';
    const query = this.buildSearchQuery(searchArgs);

    try {
      const data = await this.makeSearchRequest<{
        packages?: BillPackage[];
        nextPage?: string;
        count?: number;
      }>({
        query,
        pageSize: String(pageSize),
        offsetMark,
        resultLevel: 'default',
        sorts: [{ field: 'score', sortOrder: 'DESC' }]
      });

      const packages = (data.packages || []) as BillPackage[];
      return {
        result: {
          packages,
          nextPage: data.nextPage,
          count: data.count ?? packages.length
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
    // GovInfo Related API: GET /related/{accessId}; optionally GET /related/{accessId}/{collection} for package lists
    const listUrl = `/related/${packageId}`;
    try {
      const list = await this.makeRequest<{
        relatedId?: string;
        relationships?: Array<{
          relationship: string;
          collection: string;
          relationshipLink: string;
        }>;
      }>(listUrl);

      const rels = list.relationships || [];
      const billsRel = rels.find((r) => r.collection === 'BILLS');

      if (billsRel) {
        const resultsUrl = `/related/${packageId}/BILLS`;
        try {
          const data = await this.makeRequest<{
            results?: Array<{
              packageId?: string;
              title?: string;
              lastModified?: string;
            }>;
          }>(resultsUrl);
          const results = data.results || [];
          const packages: RelatedPackage[] = results.map((r) => ({
            packageId: r.packageId || '',
            relationship: billsRel.relationship,
            ...(r.title !== undefined && r.title !== '' ? { title: r.title } : {}),
          }));
          return { result: { packages } };
        } catch (followErr) {
          logger.warn('Failed to fetch BILLS related results, using relationship list', {
            packageId,
            error: followErr instanceof Error ? followErr.message : String(followErr)
          });
        }
      }

      const packages: RelatedPackage[] = rels.map((r) => ({
        packageId: r.relationshipLink,
        relationship: r.relationship,
        title: r.relationship
      }));
      return { result: { packages } };
    } catch (error) {
      logger.warn('Failed to get related packages', {
        packageId,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: { packages: [] } };
    }
  }

  private async searchStatutes(args: Record<string, unknown>): Promise<{ result?: unknown }> {
    const collection = (args.collection as string) || 'USCODE';
    const pageSize = Math.min(100, Math.max(1, Number(args.page_size) || 50));
    const offsetMark = (args.offset_mark as string) || '*';

    const searchArgs: {
      query: string;
      collection?: string;
      congress?: number | null;
      title_number?: string;
      section?: string;
      start_date?: string;
      end_date?: string;
    } = { query: (args.query as string) || '', collection };
    if (args.congress != null) searchArgs.congress = args.congress as number | null;
    if ((args.title_number as string) !== undefined) searchArgs.title_number = (args.title_number as string) || '';
    if ((args.section as string) !== undefined) searchArgs.section = (args.section as string) || '';
    if ((args.start_date as string) !== undefined) searchArgs.start_date = (args.start_date as string) || '';
    if ((args.end_date as string) !== undefined) searchArgs.end_date = (args.end_date as string) || '';
    const query = this.buildSearchQuery(searchArgs);

    try {
      const data = await this.makeSearchRequest<{ packages?: BillPackage[]; count?: number }>({
        query,
        pageSize: String(pageSize),
        offsetMark,
        resultLevel: 'default',
        sorts: [{ field: 'score', sortOrder: 'DESC' }]
      });
      const packages = data.packages || [];
      return {
        result: { packages, count: data.count ?? packages.length }
      };
    } catch (error) {
      logger.warn('GovInfo statutes search failed', {
        query: args.query,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: { packages: [], count: 0 } };
    }
  }

  private async getPublicLawsByCongress(args: Record<string, unknown>): Promise<{ result?: unknown }> {
    const congress = args.congress as number;
    const pageSize = Math.min(100, Math.max(1, Number(args.page_size) || 50));
    const offsetMark = (args.offset_mark as string) || '*';

    const searchArgs: {
      query: string;
      collection?: string;
      congress?: number | null;
      law_type?: string;
      law_number?: string;
      start_date?: string;
      end_date?: string;
    } = { query: '*', collection: 'PLAW', congress };
    if ((args.law_type as string) !== undefined) searchArgs.law_type = (args.law_type as string) || '';
    if ((args.law_number as string) !== undefined) searchArgs.law_number = (args.law_number as string) || '';
    if ((args.start_date as string) !== undefined) searchArgs.start_date = (args.start_date as string) || '';
    if ((args.end_date as string) !== undefined) searchArgs.end_date = (args.end_date as string) || '';
    const query = this.buildSearchQuery(searchArgs);

    try {
      const data = await this.makeSearchRequest<{ packages?: BillPackage[]; count?: number }>({
        query,
        pageSize: String(pageSize),
        offsetMark,
        resultLevel: 'default',
        sorts: [{ field: 'publishdate', sortOrder: 'DESC' }]
      });
      const packages = data.packages || [];
      return {
        result: { packages, count: data.count ?? packages.length }
      };
    } catch (error) {
      logger.warn('GovInfo public laws search failed', {
        congress,
        error: error instanceof Error ? error.message : String(error)
      });
      return { result: { packages: [], count: 0 } };
    }
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
   * Always checks package summary first to verify format availability.
   * Results are cached 30 days.
   */
  async getBillContent(
    packageId: string,
    format: BillContentFormat = 'html'
  ): Promise<BillContent | null> {
    assertServerOnly();
    try {
      const cached = getCachedContent(packageId, format);
      if (cached) return cached;

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

      const billContent: BillContent = {
        packageId,
        content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
        format: useFormat as BillContentFormat,
        metadata: {
          requestedFormat: format,
          actualFormat: useFormat,
          availableFormats
        }
      };
      setCachedContent(packageId, useFormat, billContent);
      return billContent;
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
   * Get package summary/metadata. Results are cached 30 days.
   */
  async getPackageSummary(packageId: string): Promise<BillSummary | null> {
    assertServerOnly();
    try {
      const cached = getCachedSummary(packageId);
      if (cached) return cached;

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

      const billSummary: BillSummary = {
        packageId,
        title: (summary.title as string) || packageId,
        lastModified: (summary.lastModified as string) || new Date().toISOString(),
        ...(summary.summary !== undefined && { summary: summary.summary as string }),
        ...(summary.download !== undefined && { download: summary.download as Array<{ type: string; link: string }> }),
        ...summary
      };
      setCachedSummary(packageId, billSummary);
      return billSummary;
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
          congress: filters.congress ?? null,
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
      const nextPage = searchResult.nextPage as string | undefined;

      return {
        packages,
        count: packages.length,
        ...(nextPage !== undefined && nextPage !== '' && { nextPage }),
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
