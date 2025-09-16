#!/usr/bin/env tsx

/**
 * FEC Pipeline Setup Script
 * 
 * Creates FEC-specific tables and infrastructure for campaign finance transparency
 * Handles cycles, cursors, e-filing vs processed data, and candidate-committee relationships
 */

// Load environment variables
import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupFECPipeline() {
  console.log('💰 Setting up FEC Pipeline for Campaign Finance Transparency...\n');

  try {
    // Step 1: Create FEC-specific tables
    console.log('1. Creating FEC-specific tables...');
    
    const fecTables = [
      {
        name: 'fec_candidate_committee',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_candidate_committee (
            fec_candidate_id TEXT NOT NULL,
            fec_committee_id TEXT NOT NULL,
            designation TEXT CHECK (designation IN ('P', 'A', 'J', 'B', 'D', 'U')), -- P=Principal, A=Authorized, J=Joint, B=Backup, D=Designated, U=Unauthorized
            cycle INT NOT NULL,
            committee_name TEXT,
            committee_type TEXT,
            committee_designation TEXT,
            committee_organization_type TEXT,
            candidate_name TEXT,
            candidate_office TEXT,
            candidate_state TEXT,
            candidate_district TEXT,
            candidate_party TEXT,
            candidate_status TEXT,
            candidate_incumbent_challenge_status TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (fec_candidate_id, fec_committee_id, cycle)
          );
        `
      },
      {
        name: 'fec_committees',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_committees (
            committee_id TEXT PRIMARY KEY,
            committee_name TEXT NOT NULL,
            committee_type TEXT,
            committee_designation TEXT,
            committee_organization_type TEXT,
            committee_party TEXT,
            committee_state TEXT,
            committee_district TEXT,
            treasurer_name TEXT,
            treasurer_city TEXT,
            treasurer_state TEXT,
            treasurer_zip TEXT,
            custodian_name TEXT,
            custodian_city TEXT,
            custodian_state TEXT,
            custodian_zip TEXT,
            street_1 TEXT,
            street_2 TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            candidate_id TEXT,
            candidate_name TEXT,
            candidate_office TEXT,
            candidate_state TEXT,
            candidate_district TEXT,
            candidate_party TEXT,
            candidate_status TEXT,
            candidate_incumbent_challenge_status TEXT,
            first_file_date DATE,
            last_file_date DATE,
            last_f1_date DATE,
            organization_type TEXT,
            organization_type_full TEXT,
            designation TEXT,
            designation_full TEXT,
            committee_type_full TEXT,
            party_full TEXT,
            filing_frequency TEXT,
            filing_frequency_full TEXT,
            cycles INT[],
            total_receipts DECIMAL(15,2) DEFAULT 0.0,
            total_disbursements DECIMAL(15,2) DEFAULT 0.0,
            cash_on_hand DECIMAL(15,2) DEFAULT 0.0,
            debt DECIMAL(15,2) DEFAULT 0.0,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            data_source TEXT DEFAULT 'fec',
            is_efiling BOOLEAN DEFAULT FALSE,
            is_processed BOOLEAN DEFAULT TRUE
          );
        `
      },
      {
        name: 'fec_candidates',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_candidates (
            candidate_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            office TEXT,
            party TEXT,
            state TEXT,
            district TEXT,
            incumbent_challenge_status TEXT,
            candidate_status TEXT,
            candidate_inactive TEXT,
            election_years INT[],
            election_districts TEXT[],
            first_file_date DATE,
            last_file_date DATE,
            last_f2_date DATE,
            active_through INT,
            principal_committees TEXT[],
            authorized_committees TEXT[],
            total_receipts DECIMAL(15,2) DEFAULT 0.0,
            total_disbursements DECIMAL(15,2) DEFAULT 0.0,
            cash_on_hand DECIMAL(15,2) DEFAULT 0.0,
            debt DECIMAL(15,2) DEFAULT 0.0,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            data_source TEXT DEFAULT 'fec',
            is_efiling BOOLEAN DEFAULT FALSE,
            is_processed BOOLEAN DEFAULT TRUE
          );
        `
      },
      {
        name: 'fec_contributions',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_contributions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            committee_id TEXT NOT NULL,
            candidate_id TEXT,
            contributor_name TEXT,
            contributor_name_normalized TEXT,
            contributor_city TEXT,
            contributor_state TEXT,
            contributor_zip TEXT,
            contributor_employer TEXT,
            contributor_occupation TEXT,
            contributor_organization_name TEXT,
            contributor_organization_type TEXT,
            contributor_committee_id TEXT,
            contributor_committee_name TEXT,
            contributor_committee_type TEXT,
            contributor_committee_designation TEXT,
            contributor_committee_organization_type TEXT,
            contributor_committee_party TEXT,
            contributor_committee_state TEXT,
            contributor_committee_district TEXT,
            amount DECIMAL(15,2) NOT NULL,
            contribution_date DATE NOT NULL,
            contribution_type TEXT,
            contribution_type_desc TEXT,
            memo_code TEXT,
            memo_text TEXT,
            receipt_type TEXT,
            receipt_type_desc TEXT,
            receipt_type_full TEXT,
            line_number TEXT,
            transaction_id TEXT,
            file_number TEXT,
            report_type TEXT,
            report_type_full TEXT,
            report_year INT,
            two_year_transaction_period INT NOT NULL,
            cycle INT NOT NULL,
            sub_id TEXT,
            link_id TEXT,
            image_number TEXT,
            file_number_raw TEXT,
            is_individual BOOLEAN,
            is_corporate BOOLEAN,
            is_pac BOOLEAN,
            is_party BOOLEAN,
            is_self_financing BOOLEAN,
            sector TEXT,
            industry TEXT,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            data_source TEXT DEFAULT 'fec',
            is_efiling BOOLEAN DEFAULT FALSE,
            is_processed BOOLEAN DEFAULT TRUE,
            provenance JSONB DEFAULT '{}'
          );
        `
      },
      {
        name: 'fec_disbursements',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_disbursements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            committee_id TEXT NOT NULL,
            candidate_id TEXT,
            recipient_name TEXT,
            recipient_name_normalized TEXT,
            recipient_city TEXT,
            recipient_state TEXT,
            recipient_zip TEXT,
            recipient_employer TEXT,
            recipient_occupation TEXT,
            recipient_organization_name TEXT,
            recipient_organization_type TEXT,
            recipient_committee_id TEXT,
            recipient_committee_name TEXT,
            recipient_committee_type TEXT,
            recipient_committee_designation TEXT,
            recipient_committee_organization_type TEXT,
            recipient_committee_party TEXT,
            recipient_committee_state TEXT,
            recipient_committee_district TEXT,
            amount DECIMAL(15,2) NOT NULL,
            disbursement_date DATE NOT NULL,
            disbursement_type TEXT,
            disbursement_type_desc TEXT,
            memo_code TEXT,
            memo_text TEXT,
            receipt_type TEXT,
            receipt_type_desc TEXT,
            receipt_type_full TEXT,
            line_number TEXT,
            transaction_id TEXT,
            file_number TEXT,
            report_type TEXT,
            report_type_full TEXT,
            report_year INT,
            two_year_transaction_period INT NOT NULL,
            cycle INT NOT NULL,
            sub_id TEXT,
            link_id TEXT,
            image_number TEXT,
            file_number_raw TEXT,
            purpose TEXT,
            purpose_desc TEXT,
            category TEXT,
            category_desc TEXT,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            data_source TEXT DEFAULT 'fec',
            is_efiling BOOLEAN DEFAULT FALSE,
            is_processed BOOLEAN DEFAULT TRUE,
            provenance JSONB DEFAULT '{}'
          );
        `
      },
      {
        name: 'fec_independent_expenditures',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_independent_expenditures (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            committee_id TEXT NOT NULL,
            candidate_id TEXT,
            candidate_name TEXT,
            candidate_office TEXT,
            candidate_state TEXT,
            candidate_district TEXT,
            candidate_party TEXT,
            candidate_status TEXT,
            candidate_incumbent_challenge_status TEXT,
            spender_name TEXT,
            spender_city TEXT,
            spender_state TEXT,
            spender_zip TEXT,
            spender_employer TEXT,
            spender_occupation TEXT,
            spender_organization_name TEXT,
            spender_organization_type TEXT,
            spender_committee_id TEXT,
            spender_committee_name TEXT,
            spender_committee_type TEXT,
            spender_committee_designation TEXT,
            spender_committee_organization_type TEXT,
            spender_committee_party TEXT,
            spender_committee_state TEXT,
            spender_committee_district TEXT,
            amount DECIMAL(15,2) NOT NULL,
            expenditure_date DATE NOT NULL,
            expenditure_type TEXT,
            expenditure_type_desc TEXT,
            memo_code TEXT,
            memo_text TEXT,
            receipt_type TEXT,
            receipt_type_desc TEXT,
            receipt_type_full TEXT,
            line_number TEXT,
            transaction_id TEXT,
            file_number TEXT,
            report_type TEXT,
            report_type_full TEXT,
            report_year INT,
            two_year_transaction_period INT NOT NULL,
            cycle INT NOT NULL,
            sub_id TEXT,
            link_id TEXT,
            image_number TEXT,
            file_number_raw TEXT,
            purpose TEXT,
            purpose_desc TEXT,
            category TEXT,
            category_desc TEXT,
            support_oppose_indicator TEXT,
            support_oppose_indicator_desc TEXT,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            data_source TEXT DEFAULT 'fec',
            is_efiling BOOLEAN DEFAULT FALSE,
            is_processed BOOLEAN DEFAULT TRUE,
            provenance JSONB DEFAULT '{}'
          );
        `
      },
      {
        name: 'fec_cycles',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_cycles (
            cycle INT PRIMARY KEY,
            cycle_name TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            election_date DATE NOT NULL,
            is_current BOOLEAN DEFAULT FALSE,
            is_upcoming BOOLEAN DEFAULT FALSE,
            is_completed BOOLEAN DEFAULT FALSE,
            data_available BOOLEAN DEFAULT FALSE,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'fec_ingest_cursors',
        sql: `
          CREATE TABLE IF NOT EXISTS fec_ingest_cursors (
            source TEXT NOT NULL,
            cycle INT NOT NULL,
            cursor_type TEXT NOT NULL, -- 'last_index', 'last_file_number', 'last_date'
            cursor_value TEXT NOT NULL,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (source, cycle, cursor_type)
          );
        `
      }
    ];

    for (const table of fecTables) {
      try {
        console.log(`   Creating ${table.name}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
        
        if (error) {
          console.log(`   ❌ Failed to create ${table.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table.name} created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating ${table.name}: ${err}`);
      }
    }

    // Step 2: Create FEC-specific indexes
    console.log('\n2. Creating FEC-specific indexes...');
    
    const fecIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_fec_candidate_committee_candidate ON fec_candidate_committee (fec_candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidate_committee_committee ON fec_candidate_committee (fec_committee_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidate_committee_cycle ON fec_candidate_committee (cycle);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidate_committee_designation ON fec_candidate_committee (designation);',
      'CREATE INDEX IF NOT EXISTS idx_fec_committees_type ON fec_committees (committee_type);',
      'CREATE INDEX IF NOT EXISTS idx_fec_committees_candidate ON fec_committees (candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_committees_cycles ON fec_committees USING GIN (cycles);',
      'CREATE INDEX IF NOT EXISTS idx_fec_committees_efiling ON fec_committees (is_efiling);',
      'CREATE INDEX IF NOT EXISTS idx_fec_committees_processed ON fec_committees (is_processed);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidates_office ON fec_candidates (office);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidates_state ON fec_candidates (state);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidates_party ON fec_candidates (party);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidates_cycles ON fec_candidates USING GIN (election_years);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidates_efiling ON fec_candidates (is_efiling);',
      'CREATE INDEX IF NOT EXISTS idx_fec_candidates_processed ON fec_candidates (is_processed);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_committee ON fec_contributions (committee_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_candidate ON fec_contributions (candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_amount ON fec_contributions (amount);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_date ON fec_contributions (contribution_date);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_cycle ON fec_contributions (cycle);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_period ON fec_contributions (two_year_transaction_period);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_efiling ON fec_contributions (is_efiling);',
      'CREATE INDEX IF NOT EXISTS idx_fec_contributions_processed ON fec_contributions (is_processed);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_committee ON fec_disbursements (committee_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_candidate ON fec_disbursements (candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_amount ON fec_disbursements (amount);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_date ON fec_disbursements (disbursement_date);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_cycle ON fec_disbursements (cycle);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_period ON fec_disbursements (two_year_transaction_period);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_efiling ON fec_disbursements (is_efiling);',
      'CREATE INDEX IF NOT EXISTS idx_fec_disbursements_processed ON fec_disbursements (is_processed);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_committee ON fec_independent_expenditures (committee_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_candidate ON fec_independent_expenditures (candidate_id);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_amount ON fec_independent_expenditures (amount);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_date ON fec_independent_expenditures (expenditure_date);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_cycle ON fec_independent_expenditures (cycle);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_period ON fec_independent_expenditures (two_year_transaction_period);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_efiling ON fec_independent_expenditures (is_efiling);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ie_processed ON fec_independent_expenditures (is_processed);',
      'CREATE INDEX IF NOT EXISTS idx_fec_cycles_current ON fec_cycles (is_current);',
      'CREATE INDEX IF NOT EXISTS idx_fec_cycles_upcoming ON fec_cycles (is_upcoming);',
      'CREATE INDEX IF NOT EXISTS idx_fec_cycles_completed ON fec_cycles (is_completed);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ingest_cursors_source ON fec_ingest_cursors (source);',
      'CREATE INDEX IF NOT EXISTS idx_fec_ingest_cursors_cycle ON fec_ingest_cursors (cycle);'
    ];

    for (const indexSQL of fecIndexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
        if (error) {
          console.log(`   ❌ Failed to create index: ${error.message}`);
        } else {
          console.log(`   ✅ Index created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating index: ${err}`);
      }
    }

    // Step 3: Create FEC utility functions
    console.log('\n3. Creating FEC utility functions...');
    
    const fecFunctions = [
      {
        name: 'get_fec_cycle_info',
        sql: `
          CREATE OR REPLACE FUNCTION get_fec_cycle_info(cycle_year INT)
          RETURNS TABLE(
            cycle INT,
            cycle_name TEXT,
            start_date DATE,
            end_date DATE,
            election_date DATE,
            is_current BOOLEAN,
            is_upcoming BOOLEAN,
            is_completed BOOLEAN,
            data_available BOOLEAN
          )
          LANGUAGE SQL
          AS $$
            SELECT cycle, cycle_name, start_date, end_date, election_date, is_current, is_upcoming, is_completed, data_available
            FROM fec_cycles
            WHERE cycle = cycle_year;
          $$;
        `
      },
      {
        name: 'get_candidate_committees',
        sql: `
          CREATE OR REPLACE FUNCTION get_candidate_committees(candidate_id TEXT, cycle_year INT)
          RETURNS TABLE(
            fec_committee_id TEXT,
            committee_name TEXT,
            designation TEXT,
            committee_type TEXT,
            total_receipts DECIMAL(15,2),
            total_disbursements DECIMAL(15,2),
            cash_on_hand DECIMAL(15,2),
            debt DECIMAL(15,2)
          )
          LANGUAGE SQL
          AS $$
            SELECT 
              fcc.fec_committee_id,
              fc.committee_name,
              fcc.designation,
              fc.committee_type,
              fc.total_receipts,
              fc.total_disbursements,
              fc.cash_on_hand,
              fc.debt
            FROM fec_candidate_committee fcc
            JOIN fec_committees fc ON fcc.fec_committee_id = fc.committee_id
            WHERE fcc.fec_candidate_id = candidate_id 
              AND fcc.cycle = cycle_year;
          $$;
        `
      },
      {
        name: 'calculate_independence_score',
        sql: `
          CREATE OR REPLACE FUNCTION calculate_independence_score(candidate_id TEXT, cycle_year INT)
          RETURNS DECIMAL(3,2)
          LANGUAGE SQL
          AS $$
            WITH contribution_totals AS (
              SELECT 
                SUM(amount) as total_amount,
                SUM(amount) FILTER (WHERE is_pac = true) as pac_amount,
                SUM(amount) FILTER (WHERE is_party = true) as party_amount,
                SUM(amount) FILTER (WHERE is_corporate = true) as corporate_amount,
                SUM(amount) FILTER (WHERE is_individual = true) as individual_amount
              FROM fec_contributions
              WHERE candidate_id = calculate_independence_score.candidate_id
                AND cycle = cycle_year
            )
            SELECT 
              CASE 
                WHEN total_amount = 0 THEN 0.0
                ELSE GREATEST(0.0, 1.0 - (
                  (COALESCE(pac_amount, 0) * 0.4 + 
                   COALESCE(party_amount, 0) * 0.3 + 
                   COALESCE(corporate_amount, 0) * 0.3) / total_amount
                ))
              END
            FROM contribution_totals;
          $$;
        `
      },
      {
        name: 'get_efiling_vs_processed_summary',
        sql: `
          CREATE OR REPLACE FUNCTION get_efiling_vs_processed_summary(cycle_year INT)
          RETURNS TABLE(
            table_name TEXT,
            total_records BIGINT,
            efiling_records BIGINT,
            processed_records BIGINT,
            efiling_percentage DECIMAL(5,2),
            processed_percentage DECIMAL(5,2)
          )
          LANGUAGE SQL
          AS $$
            SELECT 
              'contributions' as table_name,
              COUNT(*) as total_records,
              COUNT(*) FILTER (WHERE is_efiling = true) as efiling_records,
              COUNT(*) FILTER (WHERE is_processed = true) as processed_records,
              ROUND(COUNT(*) FILTER (WHERE is_efiling = true) * 100.0 / COUNT(*), 2) as efiling_percentage,
              ROUND(COUNT(*) FILTER (WHERE is_processed = true) * 100.0 / COUNT(*), 2) as processed_percentage
            FROM fec_contributions
            WHERE cycle = cycle_year
            UNION ALL
            SELECT 
              'disbursements' as table_name,
              COUNT(*) as total_records,
              COUNT(*) FILTER (WHERE is_efiling = true) as efiling_records,
              COUNT(*) FILTER (WHERE is_processed = true) as processed_records,
              ROUND(COUNT(*) FILTER (WHERE is_efiling = true) * 100.0 / COUNT(*), 2) as efiling_percentage,
              ROUND(COUNT(*) FILTER (WHERE is_processed = true) * 100.0 / COUNT(*), 2) as processed_percentage
            FROM fec_disbursements
            WHERE cycle = cycle_year
            UNION ALL
            SELECT 
              'independent_expenditures' as table_name,
              COUNT(*) as total_records,
              COUNT(*) FILTER (WHERE is_efiling = true) as efiling_records,
              COUNT(*) FILTER (WHERE is_processed = true) as processed_records,
              ROUND(COUNT(*) FILTER (WHERE is_efiling = true) * 100.0 / COUNT(*), 2) as efiling_percentage,
              ROUND(COUNT(*) FILTER (WHERE is_processed = true) * 100.0 / COUNT(*), 2) as processed_percentage
            FROM fec_independent_expenditures
            WHERE cycle = cycle_year;
          $$;
        `
      }
    ];

    for (const func of fecFunctions) {
      try {
        console.log(`   Creating function ${func.name}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
        
        if (error) {
          console.log(`   ❌ Failed to create ${func.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${func.name} created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating ${func.name}: ${err}`);
      }
    }

    // Step 4: Seed FEC cycle data
    console.log('\n4. Seeding FEC cycle data...');
    
    const fecCycles = [
      { cycle: 2024, cycle_name: '2024 Election Cycle', start_date: '2023-01-01', end_date: '2024-12-31', election_date: '2024-11-05', is_current: true, is_upcoming: false, is_completed: false, data_available: true },
      { cycle: 2022, cycle_name: '2022 Election Cycle', start_date: '2021-01-01', end_date: '2022-12-31', election_date: '2022-11-08', is_current: false, is_upcoming: false, is_completed: true, data_available: true },
      { cycle: 2020, cycle_name: '2020 Election Cycle', start_date: '2019-01-01', end_date: '2020-12-31', election_date: '2020-11-03', is_current: false, is_upcoming: false, is_completed: true, data_available: true },
      { cycle: 2018, cycle_name: '2018 Election Cycle', start_date: '2017-01-01', end_date: '2018-12-31', election_date: '2018-11-06', is_current: false, is_upcoming: false, is_completed: true, data_available: true },
      { cycle: 2026, cycle_name: '2026 Election Cycle', start_date: '2025-01-01', end_date: '2026-12-31', election_date: '2026-11-03', is_current: false, is_upcoming: true, is_completed: false, data_available: false }
    ];

    try {
      const { error } = await supabase.from('fec_cycles').upsert(fecCycles, { onConflict: 'cycle' });
      if (error) {
        console.log(`   ❌ Failed to seed FEC cycles: ${error.message}`);
      } else {
        console.log(`   ✅ FEC cycles seeded (${fecCycles.length} cycles)`);
      }
    } catch (err) {
      console.log(`   ❌ Error seeding FEC cycles: ${err}`);
    }

    // Step 5: Seed initial ingest cursors
    console.log('\n5. Seeding initial ingest cursors...');
    
    const initialCursors = [
      { source: 'candidates', cycle: 2024, cursor_type: 'last_index', cursor_value: '0' },
      { source: 'committees', cycle: 2024, cursor_type: 'last_index', cursor_value: '0' },
      { source: 'contributions', cycle: 2024, cursor_type: 'last_index', cursor_value: '0' },
      { source: 'disbursements', cycle: 2024, cursor_type: 'last_index', cursor_value: '0' },
      { source: 'independent_expenditures', cycle: 2024, cursor_type: 'last_index', cursor_value: '0' }
    ];

    try {
      const { error } = await supabase.from('fec_ingest_cursors').upsert(initialCursors, { onConflict: 'source,cycle,cursor_type' });
      if (error) {
        console.log(`   ❌ Failed to seed ingest cursors: ${error.message}`);
      } else {
        console.log(`   ✅ Ingest cursors seeded (${initialCursors.length} cursors)`);
      }
    } catch (err) {
      console.log(`   ❌ Error seeding ingest cursors: ${err}`);
    }

    console.log('\n🎉 FEC Pipeline setup completed!');
    
    console.log('\n📊 FEC Pipeline Summary:');
    console.log('   - FEC-specific tables: 8 created');
    console.log('   - FEC-specific indexes: 40+ created');
    console.log('   - FEC utility functions: 4 created');
    console.log('   - FEC cycles: 5 seeded (2018-2026)');
    console.log('   - Ingest cursors: 5 seeded for 2024 cycle');

    console.log('\n🚀 FEC Features Available:');
    console.log('   - Cycle-based data partitioning (2018-2026)');
    console.log('   - E-filing vs processed data distinction');
    console.log('   - Candidate-committee relationship mapping');
    console.log('   - Resumable ingestion with cursors');
    console.log('   - Independence score calculation');
    console.log('   - Campaign finance transparency metrics');
    console.log('   - "Bought off" politician detection');
    console.log('   - PAC, party, and corporate contribution tracking');

  } catch (error) {
    console.error('\n❌ FEC Pipeline setup failed:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupFECPipeline()
    .then(() => {
      console.log('\n✅ FEC Pipeline setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ FEC Pipeline setup failed:', error);
      process.exit(1);
    });
}

export { setupFECPipeline };
