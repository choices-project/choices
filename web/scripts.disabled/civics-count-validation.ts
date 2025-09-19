// web/scripts/civics-count-validation.ts
// Count drift validation with ±2% threshold
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// Validation thresholds
const DRIFT_THRESHOLD = 2.0; // 2% threshold
const ALERT_THRESHOLD = 1.0; // 1% for warnings

type CountValidation = {
  level: string;
  jurisdiction: string;
  expectedCount: number;
  actualCount: number;
  driftPercentage: number;
  isWithinThreshold: boolean;
  status: 'PASS' | 'WARN' | 'FAIL';
}

async function validateCounts(): Promise<CountValidation[]> {
  console.log('📊 Starting count validation...');
  
  const validations: CountValidation[] = [];
  
  try {
    // Get current counts by level and jurisdiction
    const { data: allReps, error: countError } = await supabase
      .from('civics_representatives')
      .select('level, jurisdiction')
      .eq('valid_to', 'infinity');

    if (countError) {
      throw countError;
    }

    // Group counts manually
    const currentCounts = allReps.reduce((acc: any[], rep: any) => {
      const key = `${rep.level}-${rep.jurisdiction}`;
      const existing = acc.find(item => item.key === key);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ level: rep.level, jurisdiction: rep.jurisdiction, count: 1, key });
      }
      return acc;
    }, []) || [];

    if (!currentCounts || currentCounts.length === 0) {
      console.log('❌ No current counts found');
      return validations;
    }

    console.log(`📈 Found ${currentCounts.length} jurisdiction counts to validate`);

    // Validate each jurisdiction
    for (const count of currentCounts) {
      const level = count.level;
      const jurisdiction = count.jurisdiction;
      const actualCount = parseInt(count.count);

      console.log(`\n🔍 Validating ${level} - ${jurisdiction}: ${actualCount} representatives`);

      // Check if count is within threshold
      const isWithinThreshold = await supabase.rpc('check_count_drift', {
        p_level: level,
        p_jurisdiction: jurisdiction,
        p_actual_count: actualCount
      });

      if (isWithinThreshold.error) {
        console.error(`❌ Error checking drift for ${level}-${jurisdiction}:`, isWithinThreshold.error);
        continue;
      }

      // Get the drift percentage from the logged entry
      const { data: driftData } = await supabase
        .from('civics_expected_counts')
        .select('drift_percentage, is_within_threshold')
        .eq('level', level)
        .eq('jurisdiction', jurisdiction)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const driftPercentage = driftData?.drift_percentage || 0;
      const withinThreshold = driftData?.is_within_threshold || false;

      // Determine status
      let status: 'PASS' | 'WARN' | 'FAIL';
      if (withinThreshold) {
        status = driftPercentage > ALERT_THRESHOLD ? 'WARN' : 'PASS';
      } else {
        status = 'FAIL';
      }

      const validation: CountValidation = {
        level,
        jurisdiction,
        expectedCount: actualCount, // For first run, expected = actual
        actualCount,
        driftPercentage,
        isWithinThreshold: withinThreshold,
        status
      };

      validations.push(validation);

      // Log status
      const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${level}-${jurisdiction}: ${driftPercentage.toFixed(2)}% drift (${status})`);
    }

    return validations;

  } catch (error) {
    console.error('❌ Count validation failed:', error);
    throw error;
  }
}

async function runCountValidation() {
  try {
    const validations = await validateCounts();
    
    console.log('\n📊 Count Validation Summary:');
    console.log('='.repeat(50));
    
    const passCount = validations.filter(v => v.status === 'PASS').length;
    const warnCount = validations.filter(v => v.status === 'WARN').length;
    const failCount = validations.filter(v => v.status === 'FAIL').length;
    
    console.log(`✅ PASS: ${passCount} jurisdictions`);
    console.log(`⚠️ WARN: ${warnCount} jurisdictions`);
    console.log(`❌ FAIL: ${failCount} jurisdictions`);
    
    if (failCount > 0) {
      console.log('\n❌ FAILED Validations:');
      validations
        .filter(v => v.status === 'FAIL')
        .forEach(v => {
          console.log(`   ${v.level}-${v.jurisdiction}: ${v.driftPercentage.toFixed(2)}% drift (threshold: ${DRIFT_THRESHOLD}%)`);
        });
    }
    
    if (warnCount > 0) {
      console.log('\n⚠️ WARNING Validations:');
      validations
        .filter(v => v.status === 'WARN')
        .forEach(v => {
          console.log(`   ${v.level}-${v.jurisdiction}: ${v.driftPercentage.toFixed(2)}% drift (alert: ${ALERT_THRESHOLD}%)`);
        });
    }
    
    // Overall status
    const overallStatus = failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS';
    const overallIcon = overallStatus === 'PASS' ? '✅' : overallStatus === 'WARN' ? '⚠️' : '❌';
    
    console.log(`\n${overallIcon} Overall Status: ${overallStatus}`);
    
    // Exit with appropriate code
    if (failCount > 0) {
      console.log('\n🚨 Count validation FAILED - aborting ingest');
      process.exit(1);
    } else if (warnCount > 0) {
      console.log('\n⚠️ Count validation WARNED - proceeding with caution');
      process.exit(0);
    } else {
      console.log('\n✅ Count validation PASSED - proceeding with ingest');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Count validation script failed:', error);
    process.exit(1);
  }
}

// Run validation
runCountValidation();
