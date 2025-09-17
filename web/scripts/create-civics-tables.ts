#!/usr/bin/env tsx

/**
 * Create Civics Tables Script
 * 
 * Creates all the civics tables one by one to avoid SQL parsing issues
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

async function createCivicsTables() {
  console.log('🚀 Creating Civics Tables...\n');

  const tables = [
    {
      name: 'candidates',
      sql: `
        CREATE TABLE IF NOT EXISTS candidates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          canonical_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          party TEXT CHECK (party IN ('D','R','I','L','G','N','U')),
          office TEXT NOT NULL,
          chamber TEXT CHECK (chamber IN ('house', 'senate', 'state_house', 'state_senate', 'local')),
          state TEXT NOT NULL CHECK (LENGTH(state) = 2),
          district TEXT,
          level TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
          email TEXT,
          phone TEXT,
          website TEXT,
          photo_url TEXT,
          social_media JSONB DEFAULT '{}',
          ocd_division_id TEXT,
          jurisdiction_ids TEXT[],
          verified BOOLEAN DEFAULT FALSE,
          verification_method TEXT,
          verification_date TIMESTAMPTZ,
          data_sources TEXT[] NOT NULL,
          quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          provenance JSONB DEFAULT '{}',
          license_key TEXT
        );
      `
    },
    {
      name: 'elections',
      sql: `
        CREATE TABLE IF NOT EXISTS elections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          canonical_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('general', 'primary', 'special', 'runoff')),
          level TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
          state TEXT NOT NULL CHECK (LENGTH(state) = 2),
          district TEXT,
          election_date DATE NOT NULL,
          registration_deadline DATE,
          early_voting_start DATE,
          early_voting_end DATE,
          ocd_division_id TEXT,
          jurisdiction_ids TEXT[],
          status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
          results_available BOOLEAN DEFAULT FALSE,
          data_sources TEXT[] NOT NULL,
          quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          provenance JSONB DEFAULT '{}',
          license_key TEXT
        );
      `
    },
    {
      name: 'campaign_finance',
      sql: `
        CREATE TABLE IF NOT EXISTS campaign_finance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          candidate_id UUID REFERENCES candidates(id),
          committee_id TEXT,
          committee_name TEXT,
          cycle INTEGER NOT NULL,
          total_receipts DECIMAL(15,2) DEFAULT 0.0,
          total_disbursements DECIMAL(15,2) DEFAULT 0.0,
          cash_on_hand DECIMAL(15,2) DEFAULT 0.0,
          debt DECIMAL(15,2) DEFAULT 0.0,
          individual_contributions DECIMAL(15,2) DEFAULT 0.0,
          pac_contributions DECIMAL(15,2) DEFAULT 0.0,
          party_contributions DECIMAL(15,2) DEFAULT 0.0,
          self_financing DECIMAL(15,2) DEFAULT 0.0,
          independence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (independence_score >= 0 AND independence_score <= 1),
          top_donor_percentage DECIMAL(5,2) DEFAULT 0.0,
          corporate_donor_percentage DECIMAL(5,2) DEFAULT 0.0,
          data_sources TEXT[] NOT NULL,
          quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          provenance JSONB DEFAULT '{}',
          license_key TEXT
        );
      `
    },
    {
      name: 'contributions',
      sql: `
        CREATE TABLE IF NOT EXISTS contributions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          candidate_id UUID REFERENCES candidates(id),
          committee_id TEXT,
          contributor_name_hash TEXT,
          contributor_city TEXT,
          contributor_state TEXT CHECK (LENGTH(contributor_state) = 2),
          contributor_zip5 TEXT,
          contributor_employer TEXT,
          contributor_occupation TEXT,
          amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
          contribution_date DATE NOT NULL,
          contribution_type TEXT CHECK (contribution_type IN ('individual', 'pac', 'party', 'self')),
          sector TEXT,
          industry TEXT,
          data_sources TEXT[] NOT NULL,
          quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          provenance JSONB DEFAULT '{}',
          license_key TEXT,
          retention_until DATE
        );
      `
    },
    {
      name: 'voting_records',
      sql: `
        CREATE TABLE IF NOT EXISTS voting_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          candidate_id UUID REFERENCES candidates(id),
          bill_id TEXT,
          bill_title TEXT,
          bill_subject TEXT,
          vote TEXT NOT NULL CHECK (vote IN ('yea', 'nay', 'present', 'not_voting')),
          vote_date DATE NOT NULL,
          chamber TEXT,
          bill_type TEXT CHECK (bill_type IN ('house', 'senate', 'concurrent')),
          bill_number TEXT,
          congress_number INTEGER,
          vote_description TEXT,
          vote_question TEXT,
          data_sources TEXT[] NOT NULL,
          quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          provenance JSONB DEFAULT '{}',
          license_key TEXT
        );
      `
    },
    {
      name: 'data_licenses',
      sql: `
        CREATE TABLE IF NOT EXISTS data_licenses (
          license_key TEXT PRIMARY KEY,
          source_name TEXT NOT NULL,
          attribution_text TEXT NOT NULL,
          display_requirements TEXT,
          cache_ttl_seconds INTEGER,
          usage_restrictions JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'independence_score_methodology',
      sql: `
        CREATE TABLE IF NOT EXISTS independence_score_methodology (
          version TEXT PRIMARY KEY,
          formula TEXT NOT NULL,
          data_sources TEXT[] NOT NULL,
          confidence_interval DECIMAL(3,2),
          experimental BOOLEAN DEFAULT TRUE,
          methodology_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'ingest_cursors',
      sql: `
        CREATE TABLE IF NOT EXISTS ingest_cursors (
          source TEXT PRIMARY KEY,
          cursor JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'data_quality_audit',
      sql: `
        CREATE TABLE IF NOT EXISTS data_quality_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name TEXT NOT NULL,
          record_id UUID NOT NULL,
          completeness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
          accuracy_score DECIMAL(3,2) DEFAULT 0.0 CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
          consistency_score DECIMAL(3,2) DEFAULT 0.0 CHECK (consistency_score >= 0 AND consistency_score <= 1),
          timeliness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (timeliness_score >= 0 AND timeliness_score <= 1),
          overall_score DECIMAL(3,2) DEFAULT 0.0 CHECK (overall_score >= 0 AND overall_score <= 1),
          primary_source TEXT,
          secondary_sources TEXT[],
          conflict_resolution TEXT,
          last_validation TIMESTAMPTZ DEFAULT NOW(),
          validation_method TEXT,
          issues_found TEXT[],
          resolved_issues TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`Creating ${table.name} table...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      
      if (error) {
        console.log(`❌ Failed to create ${table.name}: ${error.message}`);
      } else {
        console.log(`✅ ${table.name} table created successfully`);
      }
    } catch (err) {
      console.log(`❌ Error creating ${table.name}: ${err}`);
    }
  }

  // Create indexes
  console.log('\n📊 Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_candidates_canonical_id ON candidates (canonical_id);',
    'CREATE INDEX IF NOT EXISTS idx_candidates_state_district ON candidates (state, district);',
    'CREATE INDEX IF NOT EXISTS idx_candidates_verified ON candidates (verified);',
    'CREATE INDEX IF NOT EXISTS idx_elections_canonical_id ON elections (canonical_id);',
    'CREATE INDEX IF NOT EXISTS idx_elections_date ON elections (election_date);',
    'CREATE INDEX IF NOT EXISTS idx_campaign_finance_candidate ON campaign_finance (candidate_id);',
    'CREATE INDEX IF NOT EXISTS idx_campaign_finance_cycle ON campaign_finance (cycle);',
    'CREATE INDEX IF NOT EXISTS idx_contributions_candidate ON contributions (candidate_id);',
    'CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions (contribution_date);',
    'CREATE INDEX IF NOT EXISTS idx_voting_records_candidate ON voting_records (candidate_id);',
    'CREATE INDEX IF NOT EXISTS idx_voting_records_date ON voting_records (vote_date);'
  ];

  for (const indexSQL of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error) {
        console.log(`❌ Failed to create index: ${error.message}`);
      } else {
        console.log(`✅ Index created successfully`);
      }
    } catch (err) {
      console.log(`❌ Error creating index: ${err}`);
    }
  }

  // Seed initial data
  console.log('\n🌱 Seeding initial data...');
  
  const seedData = [
    {
      table: 'data_licenses',
      data: [
        { license_key: 'congress-gov', source_name: 'Congress.gov', attribution_text: 'Data provided by Congress.gov', display_requirements: 'Must display attribution', cache_ttl_seconds: 86400 },
        { license_key: 'fec', source_name: 'Federal Election Commission', attribution_text: 'Data provided by the Federal Election Commission', display_requirements: 'Must display attribution', cache_ttl_seconds: 86400 },
        { license_key: 'open-states', source_name: 'Open States', attribution_text: 'Data provided by Open States', display_requirements: 'Must display attribution', cache_ttl_seconds: 86400 },
        { license_key: 'opensecrets', source_name: 'OpenSecrets', attribution_text: 'Data provided by OpenSecrets', display_requirements: 'Must display attribution', cache_ttl_seconds: 86400 },
        { license_key: 'google-civic', source_name: 'Google Civic Information API', attribution_text: 'Data provided by Google Civic Information API', display_requirements: 'Must display attribution', cache_ttl_seconds: 3600 },
        { license_key: 'govtrack', source_name: 'GovTrack.us', attribution_text: 'Data provided by GovTrack.us', display_requirements: 'Must display attribution', cache_ttl_seconds: 86400 }
      ]
    },
    {
      table: 'independence_score_methodology',
      data: [
        { 
          version: '1.0', 
          formula: 'independence_score = 100 - (pac_percentage * 0.4 + top10_donor_percentage * 0.3 + corporate_percentage * 0.3)', 
          data_sources: ['fec', 'opensecrets'], 
          confidence_interval: 0.05, 
          experimental: true, 
          methodology_url: 'https://choices-platform.com/methodology/independence-score' 
        }
      ]
    }
  ];

  for (const { table, data } of seedData) {
    try {
      const { error } = await supabase.from(table).insert(data);
      if (error) {
        console.log(`❌ Failed to seed ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table} seeded successfully`);
      }
    } catch (err) {
      console.log(`❌ Error seeding ${table}: ${err}`);
    }
  }

  console.log('\n🎉 Civics tables creation completed!');
}

// Run the creation
if (require.main === module) {
  createCivicsTables()
    .then(() => {
      console.log('\n✅ All tables created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Table creation failed:', error);
      process.exit(1);
    });
}

export { createCivicsTables };
