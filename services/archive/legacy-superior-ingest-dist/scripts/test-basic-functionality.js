#!/usr/bin/env node
"use strict";
/**
 * Basic Functionality Test Script
 *
 * Tests the basic functionality of the civics backend system
 * to ensure everything is working properly.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function testBasicFunctionality() {
    console.log('🧪 Testing basic functionality...');
    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
        console.log('✅ Supabase client created');
        // Test 1: Database connection
        console.log('🔍 Test 1: Database connection...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('representatives_core')
            .select('count')
            .limit(1);
        if (connectionError) {
            console.error('❌ Database connection test failed:', connectionError.message);
            return false;
        }
        console.log('✅ Database connection test passed');
        // Test 2: Table access
        console.log('🔍 Test 2: Table access...');
        const tables = [
            'representatives_core',
            'representative_contacts',
            'representative_photos',
            'representative_social_media',
            'id_crosswalk'
        ];
        for (const table of tables) {
            const { error: tableError } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            if (tableError) {
                console.error(`❌ Table access test failed for ${table}:`, tableError.message);
                return false;
            }
        }
        console.log('✅ Table access test passed');
        // Test 3: Write permissions
        console.log('🔍 Test 3: Write permissions...');
        const testRecord = {
            name: 'Test Representative',
            office: 'Test Office',
            level: 'federal',
            state: 'XX',
            is_active: false,
            canonical_id: 'test_functionality_' + Date.now()
        };
        const { data: insertData, error: insertError } = await supabase
            .from('representatives_core')
            .insert(testRecord)
            .select();
        if (insertError) {
            console.error('❌ Write permissions test failed:', insertError.message);
            return false;
        }
        console.log('✅ Write permissions test passed');
        // Clean up test record
        await supabase
            .from('representatives_core')
            .delete()
            .eq('id', insertData[0].id);
        console.log('✅ Test record cleaned up');
        // Test 4: API key validation
        console.log('🔍 Test 4: API key validation...');
        const requiredKeys = [
            'CONGRESS_GOV_API_KEY',
            'OPEN_STATES_API_KEY',
            'FEC_API_KEY',
            'GOOGLE_CIVIC_API_KEY'
        ];
        const missingKeys = requiredKeys.filter(key => !process.env[key]);
        if (missingKeys.length > 0) {
            console.log('⚠️  Missing API keys (optional for basic functionality):');
            missingKeys.forEach(key => console.log(`   - ${key}`));
        }
        else {
            console.log('✅ All API keys configured');
        }
        // Test 5: Environment configuration
        console.log('🔍 Test 5: Environment configuration...');
        const requiredEnvVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];
        const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
        if (missingEnvVars.length > 0) {
            console.error('❌ Missing required environment variables:');
            missingEnvVars.forEach(key => console.error(`   - ${key}`));
            return false;
        }
        console.log('✅ Environment configuration test passed');
        console.log('🎉 All basic functionality tests passed!');
        return true;
    }
    catch (error) {
        console.error('❌ Basic functionality test failed:', error.message);
        return false;
    }
}
// Run tests
if (require.main === module) {
    testBasicFunctionality()
        .then(success => {
        process.exit(success ? 0 : 1);
    })
        .catch(error => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
}
module.exports = { testBasicFunctionality };
//# sourceMappingURL=test-basic-functionality.js.map