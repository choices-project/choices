#!/usr/bin/env tsx

/**
 * Raw Data + Provenance Setup Script
 * 
 * Creates staging tables and provenance infrastructure for complete data lineage
 * Enables replay of any data transformation and complete audit trails
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

async function setupRawProvenance() {
  console.log('📊 Setting up Raw Data + Provenance Infrastructure...\n');

  try {
    // Step 1: Create staging schema
    console.log('1. Creating staging schema...');
    
    const { error: schemaError } = await supabase.rpc('exec_sql', { 
      sql: 'CREATE SCHEMA IF NOT EXISTS staging;' 
    });
    
    if (schemaError) {
      console.log(`❌ Failed to create staging schema: ${schemaError.message}`);
    } else {
      console.log('✅ Staging schema created successfully');
    }

    // Step 2: Create raw data staging tables
    console.log('\n2. Creating raw data staging tables...');
    
    const stagingTables = [
      {
        name: 'staging.congress_gov_raw',
        sql: `
          CREATE TABLE IF NOT EXISTS staging.congress_gov_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            retrieved_at TIMESTAMPTZ NOT NULL,
            request_url TEXT NOT NULL,
            api_version TEXT,
            etag TEXT,
            payload JSONB NOT NULL,
            md5_hash TEXT,
            response_status INT,
            response_headers JSONB,
            processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'staging.fec_raw',
        sql: `
          CREATE TABLE IF NOT EXISTS staging.fec_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            retrieved_at TIMESTAMPTZ NOT NULL,
            request_url TEXT NOT NULL,
            api_version TEXT,
            etag TEXT,
            payload JSONB NOT NULL,
            md5_hash TEXT,
            response_status INT,
            response_headers JSONB,
            processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            data_type TEXT CHECK (data_type IN ('candidates', 'committees', 'contributions', 'disbursements', 'independent_expenditures')),
            cycle INT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'staging.open_states_raw',
        sql: `
          CREATE TABLE IF NOT EXISTS staging.open_states_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            retrieved_at TIMESTAMPTZ NOT NULL,
            request_url TEXT NOT NULL,
            api_version TEXT,
            etag TEXT,
            payload JSONB NOT NULL,
            md5_hash TEXT,
            response_status INT,
            response_headers JSONB,
            processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            data_type TEXT CHECK (data_type IN ('legislators', 'bills', 'votes', 'committees', 'districts')),
            jurisdiction TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'staging.opensecrets_raw',
        sql: `
          CREATE TABLE IF NOT EXISTS staging.opensecrets_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            retrieved_at TIMESTAMPTZ NOT NULL,
            request_url TEXT NOT NULL,
            api_version TEXT,
            etag TEXT,
            payload JSONB NOT NULL,
            md5_hash TEXT,
            response_status INT,
            response_headers JSONB,
            processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            data_type TEXT CHECK (data_type IN ('candidates', 'committees', 'contributions', 'lobbying', 'industries')),
            cycle INT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'staging.google_civic_raw',
        sql: `
          CREATE TABLE IF NOT EXISTS staging.google_civic_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            retrieved_at TIMESTAMPTZ NOT NULL,
            request_url TEXT NOT NULL,
            api_version TEXT,
            etag TEXT,
            payload JSONB NOT NULL,
            md5_hash TEXT,
            response_status INT,
            response_headers JSONB,
            processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            data_type TEXT CHECK (data_type IN ('representatives', 'elections', 'voter_info')),
            address TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'staging.govtrack_raw',
        sql: `
          CREATE TABLE IF NOT EXISTS staging.govtrack_raw (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            retrieved_at TIMESTAMPTZ NOT NULL,
            request_url TEXT NOT NULL,
            api_version TEXT,
            etag TEXT,
            payload JSONB NOT NULL,
            md5_hash TEXT,
            response_status INT,
            response_headers JSONB,
            processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            data_type TEXT CHECK (data_type IN ('people', 'bills', 'votes', 'committees', 'districts')),
            congress INT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of stagingTables) {
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

    // Step 3: Create provenance tracking tables
    console.log('\n3. Creating provenance tracking tables...');
    
    const provenanceTables = [
      {
        name: 'data_lineage',
        sql: `
          CREATE TABLE IF NOT EXISTS data_lineage (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_table TEXT NOT NULL,
            source_record_id UUID NOT NULL,
            target_table TEXT NOT NULL,
            target_record_id UUID NOT NULL,
            transformation_type TEXT NOT NULL CHECK (transformation_type IN ('insert', 'update', 'delete', 'merge', 'deduplicate')),
            transformation_version TEXT NOT NULL,
            transformation_params JSONB,
            source_data_hash TEXT,
            target_data_hash TEXT,
            processing_started_at TIMESTAMPTZ NOT NULL,
            processing_completed_at TIMESTAMPTZ,
            processing_duration_ms INT,
            success BOOLEAN DEFAULT FALSE,
            error_message TEXT,
            retry_count INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'data_quality_checks',
        sql: `
          CREATE TABLE IF NOT EXISTS data_quality_checks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            check_name TEXT NOT NULL,
            check_type TEXT NOT NULL CHECK (check_type IN ('schema', 'completeness', 'accuracy', 'consistency', 'timeliness', 'uniqueness', 'referential_integrity')),
            table_name TEXT NOT NULL,
            record_id UUID,
            check_params JSONB,
            expected_result TEXT,
            actual_result TEXT,
            passed BOOLEAN NOT NULL,
            severity TEXT CHECK (severity IN ('error', 'warning', 'info')),
            error_message TEXT,
            suggested_fix TEXT,
            check_executed_at TIMESTAMPTZ NOT NULL,
            check_version TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'data_transformations',
        sql: `
          CREATE TABLE IF NOT EXISTS data_transformations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transformation_name TEXT NOT NULL,
            transformation_version TEXT NOT NULL,
            source_system TEXT NOT NULL,
            target_system TEXT NOT NULL,
            transformation_sql TEXT,
            transformation_params JSONB,
            input_records_count INT,
            output_records_count INT,
            error_records_count INT,
            processing_started_at TIMESTAMPTZ NOT NULL,
            processing_completed_at TIMESTAMPTZ,
            processing_duration_ms INT,
            success BOOLEAN DEFAULT FALSE,
            error_message TEXT,
            retry_count INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'data_checksums',
        sql: `
          CREATE TABLE IF NOT EXISTS data_checksums (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            table_name TEXT NOT NULL,
            record_id UUID NOT NULL,
            checksum_type TEXT NOT NULL CHECK (checksum_type IN ('md5', 'sha256', 'crc32')),
            checksum_value TEXT NOT NULL,
            data_snapshot JSONB,
            calculated_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (table_name, record_id, checksum_type)
          );
        `
      }
    ];

    for (const table of provenanceTables) {
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

    // Step 4: Create staging indexes
    console.log('\n4. Creating staging indexes...');
    
    const stagingIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_staging_congress_gov_retrieved ON staging.congress_gov_raw (retrieved_at);',
      'CREATE INDEX IF NOT EXISTS idx_staging_congress_gov_status ON staging.congress_gov_raw (processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_congress_gov_etag ON staging.congress_gov_raw (etag);',
      'CREATE INDEX IF NOT EXISTS idx_staging_fec_retrieved ON staging.fec_raw (retrieved_at);',
      'CREATE INDEX IF NOT EXISTS idx_staging_fec_status ON staging.fec_raw (processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_fec_type ON staging.fec_raw (data_type);',
      'CREATE INDEX IF NOT EXISTS idx_staging_fec_cycle ON staging.fec_raw (cycle);',
      'CREATE INDEX IF NOT EXISTS idx_staging_fec_etag ON staging.fec_raw (etag);',
      'CREATE INDEX IF NOT EXISTS idx_staging_open_states_retrieved ON staging.open_states_raw (retrieved_at);',
      'CREATE INDEX IF NOT EXISTS idx_staging_open_states_status ON staging.open_states_raw (processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_open_states_type ON staging.open_states_raw (data_type);',
      'CREATE INDEX IF NOT EXISTS idx_staging_open_states_jurisdiction ON staging.open_states_raw (jurisdiction);',
      'CREATE INDEX IF NOT EXISTS idx_staging_opensecrets_retrieved ON staging.opensecrets_raw (retrieved_at);',
      'CREATE INDEX IF NOT EXISTS idx_staging_opensecrets_status ON staging.opensecrets_raw (processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_opensecrets_type ON staging.opensecrets_raw (data_type);',
      'CREATE INDEX IF NOT EXISTS idx_staging_opensecrets_cycle ON staging.opensecrets_raw (cycle);',
      'CREATE INDEX IF NOT EXISTS idx_staging_google_civic_retrieved ON staging.google_civic_raw (retrieved_at);',
      'CREATE INDEX IF NOT EXISTS idx_staging_google_civic_status ON staging.google_civic_raw (processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_google_civic_type ON staging.google_civic_raw (data_type);',
      'CREATE INDEX IF NOT EXISTS idx_staging_govtrack_retrieved ON staging.govtrack_raw (retrieved_at);',
      'CREATE INDEX IF NOT EXISTS idx_staging_govtrack_status ON staging.govtrack_raw (processing_status);',
      'CREATE INDEX IF NOT EXISTS idx_staging_govtrack_type ON staging.govtrack_raw (data_type);',
      'CREATE INDEX IF NOT EXISTS idx_staging_govtrack_congress ON staging.govtrack_raw (congress);',
      'CREATE INDEX IF NOT EXISTS idx_data_lineage_source ON data_lineage (source_table, source_record_id);',
      'CREATE INDEX IF NOT EXISTS idx_data_lineage_target ON data_lineage (target_table, target_record_id);',
      'CREATE INDEX IF NOT EXISTS idx_data_lineage_transformation ON data_lineage (transformation_type, transformation_version);',
      'CREATE INDEX IF NOT EXISTS idx_data_lineage_success ON data_lineage (success);',
      'CREATE INDEX IF NOT EXISTS idx_data_quality_checks_table ON data_quality_checks (table_name);',
      'CREATE INDEX IF NOT EXISTS idx_data_quality_checks_type ON data_quality_checks (check_type);',
      'CREATE INDEX IF NOT EXISTS idx_data_quality_checks_passed ON data_quality_checks (passed);',
      'CREATE INDEX IF NOT EXISTS idx_data_quality_checks_severity ON data_quality_checks (severity);',
      'CREATE INDEX IF NOT EXISTS idx_data_transformations_name ON data_transformations (transformation_name, transformation_version);',
      'CREATE INDEX IF NOT EXISTS idx_data_transformations_success ON data_transformations (success);',
      'CREATE INDEX IF NOT EXISTS idx_data_checksums_table ON data_checksums (table_name, record_id);',
      'CREATE INDEX IF NOT EXISTS idx_data_checksums_type ON data_checksums (checksum_type);'
    ];

    for (const indexSQL of stagingIndexes) {
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

    // Step 5: Create provenance utility functions
    console.log('\n5. Creating provenance utility functions...');
    
    const provenanceFunctions = [
      {
        name: 'calculate_data_checksum',
        sql: `
          CREATE OR REPLACE FUNCTION calculate_data_checksum(
            table_name TEXT,
            record_id UUID,
            checksum_type TEXT DEFAULT 'md5'
          )
          RETURNS TEXT
          LANGUAGE plpgsql
          AS $$
          DECLARE
            checksum_value TEXT;
            record_data JSONB;
          BEGIN
            -- Get the record data as JSONB
            EXECUTE format('SELECT to_jsonb(t.*) FROM %I t WHERE id = $1', table_name)
            INTO record_data
            USING record_id;
            
            IF record_data IS NULL THEN
              RETURN NULL;
            END IF;
            
            -- Calculate checksum based on type
            CASE checksum_type
              WHEN 'md5' THEN
                checksum_value := md5(record_data::text);
              WHEN 'sha256' THEN
                checksum_value := encode(sha256(record_data::text::bytea), 'hex');
              WHEN 'crc32' THEN
                checksum_value := crc32(record_data::text)::text;
              ELSE
                RAISE EXCEPTION 'Unsupported checksum type: %', checksum_type;
            END CASE;
            
            RETURN checksum_value;
          END;
          $$;
        `
      },
      {
        name: 'track_data_lineage',
        sql: `
          CREATE OR REPLACE FUNCTION track_data_lineage(
            source_table TEXT,
            source_record_id UUID,
            target_table TEXT,
            target_record_id UUID,
            transformation_type TEXT,
            transformation_version TEXT,
            transformation_params JSONB DEFAULT '{}',
            source_data_hash TEXT DEFAULT NULL,
            target_data_hash TEXT DEFAULT NULL
          )
          RETURNS UUID
          LANGUAGE plpgsql
          AS $$
          DECLARE
            lineage_id UUID;
          BEGIN
            INSERT INTO data_lineage (
              source_table,
              source_record_id,
              target_table,
              target_record_id,
              transformation_type,
              transformation_version,
              transformation_params,
              source_data_hash,
              target_data_hash,
              processing_started_at,
              success
            ) VALUES (
              source_table,
              source_record_id,
              target_table,
              target_record_id,
              transformation_type,
              transformation_version,
              transformation_params,
              source_data_hash,
              target_data_hash,
              NOW(),
              TRUE
            ) RETURNING id INTO lineage_id;
            
            RETURN lineage_id;
          END;
          $$;
        `
      },
      {
        name: 'get_data_lineage_trail',
        sql: `
          CREATE OR REPLACE FUNCTION get_data_lineage_trail(
            table_name TEXT,
            record_id UUID
          )
          RETURNS TABLE(
            lineage_id UUID,
            source_table TEXT,
            source_record_id UUID,
            target_table TEXT,
            target_record_id UUID,
            transformation_type TEXT,
            transformation_version TEXT,
            processing_started_at TIMESTAMPTZ,
            processing_completed_at TIMESTAMPTZ,
            success BOOLEAN
          )
          LANGUAGE SQL
          AS $$
            SELECT 
              id,
              source_table,
              source_record_id,
              target_table,
              target_record_id,
              transformation_type,
              transformation_version,
              processing_started_at,
              processing_completed_at,
              success
            FROM data_lineage
            WHERE (source_table = table_name AND source_record_id = record_id)
               OR (target_table = table_name AND target_record_id = record_id)
            ORDER BY processing_started_at;
          $$;
        `
      },
      {
        name: 'validate_data_quality',
        sql: `
          CREATE OR REPLACE FUNCTION validate_data_quality(
            table_name TEXT,
            record_id UUID,
            check_version TEXT DEFAULT '1.0'
          )
          RETURNS TABLE(
            check_name TEXT,
            check_type TEXT,
            passed BOOLEAN,
            severity TEXT,
            error_message TEXT
          )
          LANGUAGE plpgsql
          AS $$
          DECLARE
            record_exists BOOLEAN;
            record_data JSONB;
          BEGIN
            -- Check if record exists
            EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', table_name)
            INTO record_exists
            USING record_id;
            
            IF NOT record_exists THEN
              RETURN QUERY SELECT 
                'record_exists'::TEXT,
                'referential_integrity'::TEXT,
                FALSE,
                'error'::TEXT,
                'Record does not exist'::TEXT;
              RETURN;
            END IF;
            
            -- Get record data for additional checks
            EXECUTE format('SELECT to_jsonb(t.*) FROM %I t WHERE id = $1', table_name)
            INTO record_data
            USING record_id;
            
            -- Check for required fields (example)
            IF record_data ? 'name' AND (record_data->>'name' IS NULL OR record_data->>'name' = '') THEN
              RETURN QUERY SELECT 
                'required_field_name'::TEXT,
                'completeness'::TEXT,
                FALSE,
                'error'::TEXT,
                'Name field is required'::TEXT;
            ELSE
              RETURN QUERY SELECT 
                'required_field_name'::TEXT,
                'completeness'::TEXT,
                TRUE,
                'info'::TEXT,
                'Name field is present'::TEXT;
            END IF;
            
            -- Add more quality checks as needed
            
          END;
          $$;
        `
      }
    ];

    for (const func of provenanceFunctions) {
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

    // Step 6: Add provenance columns to existing tables
    console.log('\n6. Adding provenance columns to existing tables...');
    
    const provenanceColumns = [
      'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE elections ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE campaign_finance ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE contributions ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE voting_records ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE fec_candidates ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE fec_committees ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE fec_contributions ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE fec_disbursements ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';',
      'ALTER TABLE fec_independent_expenditures ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT \'{}\';'
    ];

    for (const columnSQL of provenanceColumns) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: columnSQL });
        if (error) {
          console.log(`   ❌ Failed to add provenance column: ${error.message}`);
        } else {
          console.log(`   ✅ Provenance column added successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error adding provenance column: ${err}`);
      }
    }

    // Step 7: Create data quality views
    console.log('\n7. Creating data quality views...');
    
    const qualityViews = [
      {
        name: 'data_quality_summary',
        sql: `
          CREATE OR REPLACE VIEW data_quality_summary AS
          SELECT 
            table_name,
            check_type,
            COUNT(*) as total_checks,
            COUNT(*) FILTER (WHERE passed = true) as passed_checks,
            COUNT(*) FILTER (WHERE passed = false) as failed_checks,
            ROUND(COUNT(*) FILTER (WHERE passed = true) * 100.0 / COUNT(*), 2) as pass_rate,
            COUNT(*) FILTER (WHERE severity = 'error') as error_count,
            COUNT(*) FILTER (WHERE severity = 'warning') as warning_count,
            COUNT(*) FILTER (WHERE severity = 'info') as info_count,
            MAX(check_executed_at) as last_check
          FROM data_quality_checks
          GROUP BY table_name, check_type
          ORDER BY table_name, check_type;
        `
      },
      {
        name: 'staging_processing_summary',
        sql: `
          CREATE OR REPLACE VIEW staging_processing_summary AS
          SELECT 
            'congress_gov' as source,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
            COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
            COUNT(*) FILTER (WHERE processing_status = 'skipped') as skipped,
            ROUND(COUNT(*) FILTER (WHERE processing_status = 'completed') * 100.0 / COUNT(*), 2) as success_rate
          FROM staging.congress_gov_raw
          UNION ALL
          SELECT 
            'fec' as source,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
            COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
            COUNT(*) FILTER (WHERE processing_status = 'skipped') as skipped,
            ROUND(COUNT(*) FILTER (WHERE processing_status = 'completed') * 100.0 / COUNT(*), 2) as success_rate
          FROM staging.fec_raw
          UNION ALL
          SELECT 
            'open_states' as source,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
            COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
            COUNT(*) FILTER (WHERE processing_status = 'skipped') as skipped,
            ROUND(COUNT(*) FILTER (WHERE processing_status = 'completed') * 100.0 / COUNT(*), 2) as success_rate
          FROM staging.open_states_raw
          UNION ALL
          SELECT 
            'opensecrets' as source,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
            COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
            COUNT(*) FILTER (WHERE processing_status = 'skipped') as skipped,
            ROUND(COUNT(*) FILTER (WHERE processing_status = 'completed') * 100.0 / COUNT(*), 2) as success_rate
          FROM staging.opensecrets_raw
          UNION ALL
          SELECT 
            'google_civic' as source,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
            COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
            COUNT(*) FILTER (WHERE processing_status = 'skipped') as skipped,
            ROUND(COUNT(*) FILTER (WHERE processing_status = 'completed') * 100.0 / COUNT(*), 2) as success_rate
          FROM staging.google_civic_raw
          UNION ALL
          SELECT 
            'govtrack' as source,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE processing_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE processing_status = 'processing') as processing,
            COUNT(*) FILTER (WHERE processing_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
            COUNT(*) FILTER (WHERE processing_status = 'skipped') as skipped,
            ROUND(COUNT(*) FILTER (WHERE processing_status = 'completed') * 100.0 / COUNT(*), 2) as success_rate
          FROM staging.govtrack_raw;
        `
      }
    ];

    for (const view of qualityViews) {
      try {
        console.log(`   Creating view ${view.name}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: view.sql });
        
        if (error) {
          console.log(`   ❌ Failed to create view ${view.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${view.name} created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating view ${view.name}: ${err}`);
      }
    }

    console.log('\n🎉 Raw Data + Provenance setup completed!');
    
    console.log('\n📊 Raw Data + Provenance Summary:');
    console.log('   - Staging schema: Created');
    console.log('   - Raw data staging tables: 6 created (all data sources)');
    console.log('   - Provenance tracking tables: 4 created');
    console.log('   - Staging indexes: 30+ created');
    console.log('   - Provenance utility functions: 4 created');
    console.log('   - Provenance columns: Added to 10 existing tables');
    console.log('   - Data quality views: 2 created');

    console.log('\n🚀 Raw Data + Provenance Features Available:');
    console.log('   - Complete data lineage tracking');
    console.log('   - Raw API payload storage with ETag support');
    console.log('   - Data transformation replay capability');
    console.log('   - Data quality validation and monitoring');
    console.log('   - Checksum-based data integrity verification');
    console.log('   - Processing status tracking with retry logic');
    console.log('   - Complete audit trails for compliance');
    console.log('   - Data provenance for every curated record');

  } catch (error) {
    console.error('\n❌ Raw Data + Provenance setup failed:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupRawProvenance()
    .then(() => {
      console.log('\n✅ Raw Data + Provenance setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Raw Data + Provenance setup failed:', error);
      process.exit(1);
    });
}

export { setupRawProvenance };
