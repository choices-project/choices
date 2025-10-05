/**
 * FREE APIs Data Types Audit
 * 
 * Audit the exact data types we're getting from each FREE API to ensure
 * we're applying all appropriate data transformations during ingestion.
 */

import { type NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Import existing API clients
import { GoogleCivicClient } from '@/lib/integrations/google-civic/client';
import { OpenStatesClient } from '@/lib/integrations/open-states/client';
import { CongressGovClient } from '@/lib/integrations/congress-gov/client';
import { FECClient } from '@/lib/integrations/fec/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auditing FREE APIs Data Types...');
    
    const auditResults = {
      timestamp: new Date().toISOString(),
      apis: {} as Record<string, any>,
      summary: {
        totalApis: 5,
        auditedApis: 0,
        dataTypesDiscovered: 0,
        transformationOpportunities: 0
      }
    };

    // Audit 1: Google Civic API Data Types
    console.log('🔍 Auditing Google Civic API data types...');
    try {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (apiKey) {
        const client = new GoogleCivicClient({ apiKey });
        const result = await client.lookupAddress('1600 Pennsylvania Avenue NW, Washington, DC 20500');
        
        const dataTypes = analyzeDataTypes('Google Civic', result);
        auditResults.apis.googleCivic = {
          status: 'audited',
          dataTypes,
          sampleData: {
            representatives: result.representatives.length,
            district: result.district,
            state: result.state,
            confidence: result.confidence
          }
        };
        auditResults.summary.auditedApis++;
        auditResults.summary.dataTypesDiscovered += dataTypes.totalFields;
        auditResults.summary.transformationOpportunities += dataTypes.transformationOpportunities;
      } else {
        auditResults.apis.googleCivic = {
          status: 'skipped',
          reason: 'API key not configured'
        };
      }
    } catch (error) {
      auditResults.apis.googleCivic = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Audit 2: OpenStates API Data Types
    console.log('🔍 Auditing OpenStates API data types...');
    try {
      const client = new OpenStatesClient({ apiKey: 'test-key' });
      const legislators = await client.getLegislators({ state: 'ca', active: true });
      
      const dataTypes = analyzeDataTypes('OpenStates', legislators);
      auditResults.apis.openStates = {
        status: 'audited',
        dataTypes,
        sampleData: {
          legislators: legislators.length,
          sampleLegislator: legislators[0] ? {
            name: legislators[0].name,
            party: legislators[0].party,
            chamber: legislators[0].chamber
          } : null
        }
      };
      auditResults.summary.auditedApis++;
      auditResults.summary.dataTypesDiscovered += dataTypes.totalFields;
      auditResults.summary.transformationOpportunities += dataTypes.transformationOpportunities;
    } catch (error) {
      auditResults.apis.openStates = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Audit 3: Congress.gov API Data Types
    console.log('🔍 Auditing Congress.gov API data types...');
    try {
      const apiKey = process.env.CONGRESS_GOV_API_KEY;
      if (apiKey) {
        const client = new CongressGovClient({ apiKey });
        const members = await client.getMembers();
        
        const dataTypes = analyzeDataTypes('Congress.gov', members);
        auditResults.apis.congressGov = {
          status: 'audited',
          dataTypes,
          sampleData: {
            members: members.length,
            sampleMember: members[0] ? {
              bioguideId: members[0].bioguideId,
              fullName: members[0].fullName,
              party: members[0].party
            } : null
          }
        };
        auditResults.summary.auditedApis++;
        auditResults.summary.dataTypesDiscovered += dataTypes.totalFields;
        auditResults.summary.transformationOpportunities += dataTypes.transformationOpportunities;
      } else {
        auditResults.apis.congressGov = {
          status: 'skipped',
          reason: 'API key not configured'
        };
      }
    } catch (error) {
      auditResults.apis.congressGov = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Audit 4: FEC API Data Types
    console.log('🔍 Auditing FEC API data types...');
    try {
      const apiKey = process.env.FEC_API_KEY;
      if (apiKey) {
        const client = new FECClient({ apiKey });
        const candidates = await client.getCandidates({ cycle: 2024 });
        
        const dataTypes = analyzeDataTypes('FEC', candidates);
        auditResults.apis.fec = {
          status: 'audited',
          dataTypes,
          sampleData: {
            candidates: Array.isArray(candidates) ? candidates.length : 0,
            sampleCandidate: Array.isArray(candidates) && candidates[0] ? {
              candidate_id: candidates[0].candidate_id,
              name: candidates[0].name,
              party: candidates[0].party
            } : null
          }
        };
        auditResults.summary.auditedApis++;
        auditResults.summary.dataTypesDiscovered += dataTypes.totalFields;
        auditResults.summary.transformationOpportunities += dataTypes.transformationOpportunities;
      } else {
        auditResults.apis.fec = {
          status: 'skipped',
          reason: 'API key not configured'
        };
      }
    } catch (error) {
      auditResults.apis.fec = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Audit 5: Wikipedia API Data Types
    console.log('🔍 Auditing Wikipedia API data types...');
    try {
      const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Joe_Biden');
      const data = await response.json();
      
      const dataTypes = analyzeDataTypes('Wikipedia', data);
      auditResults.apis.wikipedia = {
        status: 'audited',
        dataTypes,
        sampleData: {
          title: data.title,
          extract: data.extract?.substring(0, 100) + '...',
          thumbnail: data.thumbnail ? 'Available' : 'Not available'
        }
      };
      auditResults.summary.auditedApis++;
      auditResults.summary.dataTypesDiscovered += dataTypes.totalFields;
      auditResults.summary.transformationOpportunities += dataTypes.transformationOpportunities;
    } catch (error) {
      auditResults.apis.wikipedia = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      ok: true,
      message: 'FREE APIs data types audit completed',
      results: auditResults
    });

  } catch (error) {
    console.error('❌ FREE APIs data types audit failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'FREE APIs data types audit failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze data types from API response
 */
function analyzeDataTypes(apiName: string, data: any): any {
  const fields = extractAllFields(data);
  const dataTypes = categorizeFields(fields);
  const transformationOpportunities = identifyTransformationOpportunities(fields);
  
  return {
    totalFields: fields.length,
    dataTypes,
    transformationOpportunities,
    fields: fields.slice(0, 20), // Show first 20 fields
    recommendations: generateRecommendations(apiName, fields, transformationOpportunities)
  };
}

/**
 * Extract all fields from nested object
 */
function extractAllFields(obj: any, prefix = ''): Array<{path: string, type: string, value: any}> {
  const fields: Array<{path: string, type: string, value: any}> = [];
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        fields.push(...extractAllFields(item, `${prefix}[${index}]`));
      } else {
        fields.push({
          path: `${prefix}[${index}]`,
          type: typeof item,
          value: item
        });
      }
    });
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        fields.push(...extractAllFields(value, fullPath));
      } else {
        fields.push({
          path: fullPath,
          type: typeof value,
          value: value
        });
      }
    });
  } else {
    fields.push({
      path: prefix,
      type: typeof obj,
      value: obj
    });
  }
  
  return fields;
}

/**
 * Categorize fields by type
 */
function categorizeFields(fields: Array<{path: string, type: string, value: any}>): Record<string, number> {
  const types: Record<string, number> = {};
  
  fields.forEach(field => {
    types[field.type] = (types[field.type] || 0) + 1;
  });
  
  return types;
}

/**
 * Identify transformation opportunities
 */
function identifyTransformationOpportunities(fields: Array<{path: string, type: string, value: any}>): string[] {
  const opportunities: string[] = [];
  
  fields.forEach(field => {
    // Check for date fields
    if (field.path.toLowerCase().includes('date') || field.path.toLowerCase().includes('time')) {
      opportunities.push(`Date normalization: ${field.path}`);
    }
    
    // Check for URL fields
    if (field.path.toLowerCase().includes('url') || field.path.toLowerCase().includes('link')) {
      opportunities.push(`URL validation: ${field.path}`);
    }
    
    // Check for email fields
    if (field.path.toLowerCase().includes('email') || field.path.toLowerCase().includes('mail')) {
      opportunities.push(`Email validation: ${field.path}`);
    }
    
    // Check for phone fields
    if (field.path.toLowerCase().includes('phone') || field.path.toLowerCase().includes('tel')) {
      opportunities.push(`Phone normalization: ${field.path}`);
    }
    
    // Check for name fields
    if (field.path.toLowerCase().includes('name') || field.path.toLowerCase().includes('title')) {
      opportunities.push(`Name standardization: ${field.path}`);
    }
    
    // Check for address fields
    if (field.path.toLowerCase().includes('address') || field.path.toLowerCase().includes('location')) {
      opportunities.push(`Address normalization: ${field.path}`);
    }
  });
  
  return opportunities;
}

/**
 * Generate recommendations for data transformations
 */
function generateRecommendations(apiName: string, fields: Array<{path: string, type: string, value: any}>, opportunities: string[]): string[] {
  const recommendations: string[] = [];
  
  // Check for missing transformations
  const hasDates = fields.some(f => f.path.toLowerCase().includes('date'));
  const hasUrls = fields.some(f => f.path.toLowerCase().includes('url'));
  const hasEmails = fields.some(f => f.path.toLowerCase().includes('email'));
  const hasPhones = fields.some(f => f.path.toLowerCase().includes('phone'));
  
  if (hasDates) {
    recommendations.push('Implement date standardization and timezone handling');
  }
  
  if (hasUrls) {
    recommendations.push('Add URL validation and normalization');
  }
  
  if (hasEmails) {
    recommendations.push('Implement email validation and normalization');
  }
  
  if (hasPhones) {
    recommendations.push('Add phone number normalization and validation');
  }
  
  // Check for rich data opportunities
  const hasSocialMedia = fields.some(f => f.path.toLowerCase().includes('social') || f.path.toLowerCase().includes('twitter') || f.path.toLowerCase().includes('facebook'));
  if (hasSocialMedia) {
    recommendations.push('Extract and normalize social media handles');
  }
  
  const hasPhotos = fields.some(f => f.path.toLowerCase().includes('photo') || f.path.toLowerCase().includes('image'));
  if (hasPhotos) {
    recommendations.push('Implement photo URL validation and quality scoring');
  }
  
  return recommendations;
}
