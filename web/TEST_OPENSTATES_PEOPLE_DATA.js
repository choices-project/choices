/**
 * Test OpenStates People Repository Data
 * 
 * This script examines the OpenStates people repository data structure
 * to see what social media and contact data is available.
 * 
 * Created: October 6, 2025
 */

require('dotenv').config({ path: '.env.local' });

async function testOpenStatesPeopleData() {
  console.log('🔍 OPENSTATES PEOPLE REPOSITORY DATA ANALYSIS');
  console.log('📊 Examining the curated dataset for social media and contact data\n');
  
  try {
    // Test the OpenStates People API endpoint
    console.log('📊 1. OPENSTATES PEOPLE API');
    console.log('─'.repeat(50));
    
    const response = await fetch(
      `https://v3.openstates.org/people?jurisdiction=california&apikey=${process.env.OPEN_STATES_API_KEY}`
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ People found: ${data.results?.length || 0}`);
      
      if (data.results && data.results.length > 0) {
        const person = data.results[0];
        console.log('\n📋 Sample Person Data Structure:');
        console.log(JSON.stringify(person, null, 2));
        
        // Check for social media fields
        console.log('\n🔍 Social Media Analysis:');
        if (person.social_media) {
          console.log('📱 Social Media Found:');
          Object.entries(person.social_media).forEach(([platform, handle]) => {
            console.log(`  - ${platform}: ${handle}`);
          });
        } else {
          console.log('❌ No social_media field found');
        }
        
        // Check for contact information
        console.log('\n📞 Contact Information Analysis:');
        if (person.contact_details) {
          console.log('📞 Contact Details Found:');
          Object.entries(person.contact_details).forEach(([type, value]) => {
            console.log(`  - ${type}: ${value}`);
          });
        } else {
          console.log('❌ No contact_details field found');
        }
        
        // Check for other potential social media fields
        const socialFields = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube'];
        socialFields.forEach(field => {
          if (person[field]) {
            console.log(`📱 Found ${field}: ${person[field]}`);
          }
        });
        
        // Show all available fields
        console.log('\n🔍 All Available Fields:');
        Object.keys(person).forEach(key => {
          const value = person[key];
          if (typeof value === 'object' && value !== null) {
            console.log(`  - ${key}: ${Array.isArray(value) ? `Array(${value.length})` : 'Object'}`);
          } else {
            console.log(`  - ${key}: ${value}`);
          }
        });
      }
    } else if (response.status === 429) {
      console.log('⚠️ OpenStates API Rate Limited (429 Too Many Requests)');
      console.log('📊 This confirms we need to wait for rate limits to reset');
    } else {
      console.log(`❌ API Error: ${response.status}`);
    }
    
    // Test with a different approach - check if we can access the GitHub repository data
    console.log('\n📊 2. GITHUB REPOSITORY DATA ACCESS');
    console.log('─'.repeat(50));
    
    try {
      // Try to access a sample YAML file from the repository
      const githubResponse = await fetch(
        'https://raw.githubusercontent.com/openstates/people/main/data/ca/legislature/anthony-portantino.yml'
      );
      
      if (githubResponse.ok) {
        const yamlContent = await githubResponse.text();
        console.log('✅ GitHub YAML data accessible');
        console.log('\n📋 Sample YAML Content:');
        console.log(yamlContent.substring(0, 1000) + '...');
        
        // Look for social media references in the YAML
        const socialMediaTerms = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'social'];
        const foundTerms = socialMediaTerms.filter(term => 
          yamlContent.toLowerCase().includes(term)
        );
        
        if (foundTerms.length > 0) {
          console.log(`\n📱 Social Media Terms Found: ${foundTerms.join(', ')}`);
        } else {
          console.log('\n❌ No social media terms found in YAML');
        }
      } else {
        console.log(`❌ GitHub data not accessible: ${githubResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ GitHub data access error: ${error.message}`);
    }
    
    console.log('\n📊 SUMMARY - OPENSTATES PEOPLE DATA ANALYSIS');
    console.log('═'.repeat(80));
    console.log('This analysis shows what data is available in the OpenStates');
    console.log('people repository and whether it contains social media information.');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
testOpenStatesPeopleData();
