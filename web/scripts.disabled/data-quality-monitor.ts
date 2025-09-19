import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

type DataQualityReport = {
  totalRecords: number;
  bySource: Record<string, {
    count: number;
    avgQualityScore: number;
    lastVerified: string;
    issues: string[];
  }>;
  byLevel: Record<string, {
    count: number;
    avgQualityScore: number;
    coverage: string;
  }>;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

async function generateDataQualityReport(): Promise<DataQualityReport> {
  console.log('📊 Generating data quality report...');
  
  // Get all representatives with source tracking
  const { data: representatives, error } = await supabase
    .from('civics_representatives')
    .select('*');
  
  if (error) {
    throw new Error(`Failed to fetch representatives: ${error.message}`);
  }
  
  if (!representatives || representatives.length === 0) {
    return {
      totalRecords: 0,
      bySource: {},
      byLevel: {},
      overallHealth: 'poor',
      recommendations: ['No data found - run seeding scripts first']
    };
  }
  
  // Analyze by data source
  const bySource: Record<string, any> = {};
  const byLevel: Record<string, any> = {};
  
  for (const rep of representatives) {
    const source = rep.data_source || 'unknown';
    const level = rep.level || 'unknown';
    
    // Initialize source tracking
    if (!bySource[source]) {
      bySource[source] = {
        count: 0,
        qualityScores: [],
        lastVerified: null,
        issues: []
      };
    }
    
    // Initialize level tracking
    if (!byLevel[level]) {
      byLevel[level] = {
        count: 0,
        qualityScores: [],
        coverage: ''
      };
    }
    
    // Count and collect quality scores
    bySource[source].count++;
    byLevel[level].count++;
    
    if (rep.data_quality_score) {
      bySource[source].qualityScores.push(rep.data_quality_score);
      byLevel[level].qualityScores.push(rep.data_quality_score);
    }
    
    // Track most recent verification
    if (rep.last_verified) {
      const verified = new Date(rep.last_verified);
      if (!bySource[source].lastVerified || verified > new Date(bySource[source].lastVerified)) {
        bySource[source].lastVerified = rep.last_verified;
      }
    }
    
    // Identify issues
    if (!rep.contact_email && !rep.contact_phone && !rep.contact_website) {
      bySource[source].issues.push('Missing contact information');
    }
    
    if (rep.data_quality_score && rep.data_quality_score < 80) {
      bySource[source].issues.push('Low data quality score');
    }
    
    const lastVerified = rep.last_verified ? new Date(rep.last_verified) : null;
    if (lastVerified) {
      const daysSinceVerified = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVerified > 90) {
        bySource[source].issues.push('Data not verified in 90+ days');
      }
    }
  }
  
  // Calculate averages and clean up data
  for (const source in bySource) {
    const sourceData = bySource[source];
    sourceData.avgQualityScore = sourceData.qualityScores.length > 0 
      ? Math.round(sourceData.qualityScores.reduce((a: number, b: number) => a + b, 0) / sourceData.qualityScores.length)
      : 0;
    delete sourceData.qualityScores;
    sourceData.issues = [...new Set(sourceData.issues)]; // Remove duplicates
  }
  
  for (const level in byLevel) {
    const levelData = byLevel[level];
    levelData.avgQualityScore = levelData.qualityScores.length > 0 
      ? Math.round(levelData.qualityScores.reduce((a: number, b: number) => a + b, 0) / levelData.qualityScores.length)
      : 0;
    delete levelData.qualityScores;
    
    // Set coverage expectations
    if (level === 'federal') {
      levelData.coverage = `${levelData.count}/535 representatives (${Math.round(levelData.count/535*100)}%)`;
    } else if (level === 'state') {
      levelData.coverage = `${levelData.count} state legislators across 50 states`;
    } else if (level === 'local') {
      levelData.coverage = `${levelData.count} local officials (San Francisco only)`;
    }
  }
  
  // Calculate overall health
  const avgQualityScore = representatives.reduce((sum, rep) => sum + (rep.data_quality_score || 0), 0) / representatives.length;
  let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  
  if (avgQualityScore >= 90) overallHealth = 'excellent';
  else if (avgQualityScore >= 80) overallHealth = 'good';
  else if (avgQualityScore >= 70) overallHealth = 'fair';
  else overallHealth = 'poor';
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (avgQualityScore < 90) {
    recommendations.push('Improve data quality scores - target 90+ for all sources');
  }
  
  const staleSources = Object.entries(bySource).filter(([_, data]) => {
    if (!data.lastVerified) return true;
    const daysSinceVerified = (Date.now() - new Date(data.lastVerified).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceVerified > 30;
  });
  
  if (staleSources.length > 0) {
    recommendations.push(`Update stale data sources: ${staleSources.map(([source]) => source).join(', ')}`);
  }
  
  const sourcesWithIssues = Object.entries(bySource).filter(([_, data]) => data.issues.length > 0);
  if (sourcesWithIssues.length > 0) {
    recommendations.push(`Address data quality issues in: ${sourcesWithIssues.map(([source]) => source).join(', ')}`);
  }
  
  if (byLevel.local && byLevel.local.count < 10) {
    recommendations.push('Expand local government coverage beyond San Francisco');
  }
  
  return {
    totalRecords: representatives.length,
    bySource,
    byLevel,
    overallHealth,
    recommendations
  };
}

async function printDataQualityReport() {
  try {
    const report = await generateDataQualityReport();
    
    console.log('\n📊 CIVICS DATA QUALITY REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 OVERALL HEALTH: ${report.overallHealth.toUpperCase()}`);
    console.log(`📊 Total Records: ${report.totalRecords}`);
    
    console.log('\n🏛️ BY GOVERNMENT LEVEL:');
    for (const [level, data] of Object.entries(report.byLevel)) {
      console.log(`  ${level.toUpperCase()}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Avg Quality: ${data.avgQualityScore}/100`);
      console.log(`    Coverage: ${data.coverage}`);
    }
    
    console.log('\n🔍 BY DATA SOURCE:');
    for (const [source, data] of Object.entries(report.bySource)) {
      console.log(`  ${source.toUpperCase()}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Avg Quality: ${data.avgQualityScore}/100`);
      console.log(`    Last Verified: ${data.lastVerified || 'Never'}`);
      if (data.issues.length > 0) {
        console.log(`    Issues: ${data.issues.join(', ')}`);
      }
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error generating data quality report:', error);
  }
}

// Run the report
printDataQualityReport().catch(console.error);

