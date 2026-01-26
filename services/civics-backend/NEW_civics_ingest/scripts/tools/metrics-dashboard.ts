#!/usr/bin/env node
/**
 * Ingestion metrics dashboard.
 * 
 * Provides comprehensive metrics on:
 * - Coverage statistics (FEC IDs, finance data, activity, committees)
 * - Data freshness metrics
 * - API usage tracking
 * - Data quality distribution
 * 
 * Usage:
 *   npm run tools:metrics:dashboard [--format=table|json]
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';
import { getOpenStatesUsageStats } from '../../clients/openstates.js';

interface Metrics {
  representatives: {
    total: number;
    active: number;
    inactive: number;
    historical: number;
    byLevel: {
      federal: number;
      state: number;
      local: number;
    };
  };
  identifiers: {
    openstates: { count: number; percent: number };
    bioguide: { count: number; percent: number };
    fec: { count: number; percent: number };
    canonical: { count: number; percent: number };
  };
  dataQuality: {
    average: number;
    min: number;
    max: number;
    high: number; // >= 80
    medium: number; // 50-79
    low: number; // < 50
  };
  coverage: {
    contacts: { count: number; percent: number };
    photos: { count: number; percent: number };
    social: { count: number; percent: number };
    finance: { count: number; percent: number };
    activity: { count: number; percent: number };
    committees: { count: number; percent: number };
  };
  freshness: {
    updatedToday: number;
    updatedThisWeek: number;
    updatedThisMonth: number;
    stale: number; // > 90 days
  };
  apiUsage: {
    openstates: {
      dailyRequests: number;
      dailyLimit: number;
      remaining: number;
      resetAt?: string;
    };
  };
}

async function collectMetrics(): Promise<Metrics> {
  const client = getSupabaseClient();
  
  // Representative counts
  const { count: totalCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true });
  
  const { count: activeCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  const { count: inactiveCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inactive');
  
  const { count: historicalCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'historical');
  
  const { count: federalCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'federal')
    .eq('status', 'active');
  
  const { count: stateCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'state')
    .eq('status', 'active');
  
  const { count: localCount } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'local')
    .eq('status', 'active');
  
  // Identifier coverage
  const { count: withOpenstates } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .not('openstates_id', 'is', null)
    .eq('status', 'active');
  
  const { count: withBioguide } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .not('bioguide_id', 'is', null)
    .eq('status', 'active');
  
  const { count: withFec } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .not('fec_id', 'is', null)
    .eq('status', 'active');
  
  const { count: withCanonical } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .not('canonical_id', 'is', null)
    .eq('status', 'active');
  
  // Data quality
  const { data: qualityData } = await client
    .from('representatives_core')
    .select('data_quality_score')
    .eq('status', 'active');
  
  const scores = qualityData?.map(r => r.data_quality_score ?? 0) || [];
  const avgQuality = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const minQuality = scores.length > 0 ? Math.min(...scores) : 0;
  const maxQuality = scores.length > 0 ? Math.max(...scores) : 0;
  const highQuality = scores.filter(s => s >= 80).length;
  const mediumQuality = scores.filter(s => s >= 50 && s < 80).length;
  const lowQuality = scores.filter(s => s < 50).length;
  
  // Coverage - Use direct queries
  const { count: contactsCount } = await client
    .from('representative_contacts')
    .select('representative_id', { count: 'exact', head: true });
  
  const { count: photosCount } = await client
    .from('representative_photos')
    .select('representative_id', { count: 'exact', head: true });
  
  const { count: socialCount } = await client
    .from('representative_social_media')
    .select('representative_id', { count: 'exact', head: true });
  
  const { count: financeCount } = await client
    .from('representative_campaign_finance')
    .select('representative_id', { count: 'exact', head: true });
  
  const { count: activityCount } = await client
    .from('representative_activity')
    .select('representative_id', { count: 'exact', head: true });
  
  const { count: committeesCount } = await client
    .from('representative_committees')
    .select('representative_id', { count: 'exact', head: true })
    .eq('is_current', true);
  
  // Freshness
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const staleDate = new Date(today);
  staleDate.setDate(staleDate.getDate() - 90);
  
  const { count: updatedToday } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('updated_at', today.toISOString());
  
  const { count: updatedThisWeek } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('updated_at', weekAgo.toISOString());
  
  const { count: updatedThisMonth } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('updated_at', monthAgo.toISOString());
  
  const { count: stale } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('updated_at', staleDate.toISOString());
  
  // API usage
  const openstatesStats = getOpenStatesUsageStats();
  
  const total = totalCount || 0;
  const active = activeCount || 0;
  
  return {
    representatives: {
      total,
      active,
      inactive: inactiveCount || 0,
      historical: historicalCount || 0,
      byLevel: {
        federal: federalCount || 0,
        state: stateCount || 0,
        local: localCount || 0,
      },
    },
    identifiers: {
      openstates: {
        count: withOpenstates || 0,
        percent: active > 0 ? Math.round((withOpenstates || 0) / active * 100) : 0,
      },
      bioguide: {
        count: withBioguide || 0,
        percent: active > 0 ? Math.round((withBioguide || 0) / active * 100) : 0,
      },
      fec: {
        count: withFec || 0,
        percent: active > 0 ? Math.round((withFec || 0) / active * 100) : 0,
      },
      canonical: {
        count: withCanonical || 0,
        percent: active > 0 ? Math.round((withCanonical || 0) / active * 100) : 0,
      },
    },
    dataQuality: {
      average: Math.round(avgQuality * 10) / 10,
      min: minQuality,
      max: maxQuality,
      high: highQuality,
      medium: mediumQuality,
      low: lowQuality,
    },
    coverage: {
      contacts: {
        count: contactsCount || 0,
        percent: active > 0 ? Math.round((contactsCount || 0) / active * 100) : 0,
      },
      photos: {
        count: photosCount || 0,
        percent: active > 0 ? Math.round((photosCount || 0) / active * 100) : 0,
      },
      social: {
        count: socialCount || 0,
        percent: active > 0 ? Math.round((socialCount || 0) / active * 100) : 0,
      },
      finance: {
        count: financeCount || 0,
        percent: active > 0 ? Math.round((financeCount || 0) / active * 100) : 0,
      },
      activity: {
        count: activityCount || 0,
        percent: active > 0 ? Math.round((activityCount || 0) / active * 100) : 0,
      },
      committees: {
        count: committeesCount || 0,
        percent: active > 0 ? Math.round((committeesCount || 0) / active * 100) : 0,
      },
    },
    freshness: {
      updatedToday: updatedToday || 0,
      updatedThisWeek: updatedThisWeek || 0,
      updatedThisMonth: updatedThisMonth || 0,
      stale: stale || 0,
    },
    apiUsage: {
      openstates: {
        dailyRequests: openstatesStats.dailyRequests,
        dailyLimit: openstatesStats.dailyLimit,
        remaining: openstatesStats.remaining,
        resetAt: openstatesStats.resetAt?.toISOString(),
      },
    },
  };
}

function formatTable(metrics: Metrics): void {
  console.log('\n📊 Ingestion Metrics Dashboard');
  console.log('='.repeat(60));
  
  console.log('\n👥 Representatives:');
  console.log(`   Total: ${metrics.representatives.total}`);
  console.log(`   Active: ${metrics.representatives.active}`);
  console.log(`   Inactive: ${metrics.representatives.inactive}`);
  console.log(`   Historical: ${metrics.representatives.historical}`);
  console.log(`   By Level:`);
  console.log(`     Federal: ${metrics.representatives.byLevel.federal}`);
  console.log(`     State: ${metrics.representatives.byLevel.state}`);
  console.log(`     Local: ${metrics.representatives.byLevel.local}`);
  
  console.log('\n🔗 Identifier Coverage:');
  console.log(`   OpenStates ID: ${metrics.identifiers.openstates.count}/${metrics.representatives.active} (${metrics.identifiers.openstates.percent}%)`);
  console.log(`   Bioguide ID: ${metrics.identifiers.bioguide.count}/${metrics.representatives.active} (${metrics.identifiers.bioguide.percent}%)`);
  console.log(`   FEC ID: ${metrics.identifiers.fec.count}/${metrics.representatives.active} (${metrics.identifiers.fec.percent}%)`);
  console.log(`   Canonical ID: ${metrics.identifiers.canonical.count}/${metrics.representatives.active} (${metrics.identifiers.canonical.percent}%)`);
  
  console.log('\n📈 Data Quality:');
  console.log(`   Average: ${metrics.dataQuality.average}`);
  console.log(`   Range: ${metrics.dataQuality.min}-${metrics.dataQuality.max}`);
  console.log(`   High (≥80): ${metrics.dataQuality.high}`);
  console.log(`   Medium (50-79): ${metrics.dataQuality.medium}`);
  console.log(`   Low (<50): ${metrics.dataQuality.low}`);
  
  console.log('\n📦 Data Coverage:');
  console.log(`   Contacts: ${metrics.coverage.contacts.count} (${metrics.coverage.contacts.percent}%)`);
  console.log(`   Photos: ${metrics.coverage.photos.count} (${metrics.coverage.photos.percent}%)`);
  console.log(`   Social Media: ${metrics.coverage.social.count} (${metrics.coverage.social.percent}%)`);
  console.log(`   Finance: ${metrics.coverage.finance.count} (${metrics.coverage.finance.percent}%)`);
  console.log(`   Activity: ${metrics.coverage.activity.count} (${metrics.coverage.activity.percent}%)`);
  console.log(`   Committees: ${metrics.coverage.committees.count} (${metrics.coverage.committees.percent}%)`);
  
  console.log('\n🕒 Data Freshness:');
  console.log(`   Updated today: ${metrics.freshness.updatedToday}`);
  console.log(`   Updated this week: ${metrics.freshness.updatedThisWeek}`);
  console.log(`   Updated this month: ${metrics.freshness.updatedThisMonth}`);
  console.log(`   Stale (>90 days): ${metrics.freshness.stale}`);
  
  console.log('\n🔌 API Usage:');
  console.log(`   OpenStates: ${metrics.apiUsage.openstates.dailyRequests}/${metrics.apiUsage.openstates.dailyLimit} (${metrics.apiUsage.openstates.remaining} remaining)`);
  if (metrics.apiUsage.openstates.resetAt) {
    console.log(`   Resets at: ${new Date(metrics.apiUsage.openstates.resetAt).toLocaleString()}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'table';
  
  try {
    const metrics = await collectMetrics();
    
    if (format === 'json') {
      console.log(JSON.stringify(metrics, null, 2));
    } else {
      formatTable(metrics);
    }
  } catch (error) {
    console.error('❌ Error collecting metrics:', (error as Error).message);
    process.exit(1);
  }
}

main();
