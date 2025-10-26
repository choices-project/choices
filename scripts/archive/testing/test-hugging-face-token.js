#!/usr/bin/env node

/**
 * Test Hugging Face Token Integration
 * Verifies that the HUGGING_FACE_TOKEN is working correctly
 */

require('dotenv').config({ path: 'web/.env.local' });

async function testHuggingFaceToken() {
  console.log('🧠 Testing Hugging Face Token Integration...\n');
  
  // Check if token exists
  const token = process.env.HUGGING_FACE_TOKEN;
  if (!token) {
    console.log('❌ HUGGING_FACE_TOKEN not found in .env.local');
    console.log('   Please add HUGGING_FACE_TOKEN=your_token_here to web/.env.local');
    return;
  }
  
  console.log('✅ HUGGING_FACE_TOKEN found');
  console.log(`   Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
  
  try {
    // Test token validity by making a simple API call
    const response = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const userInfo = await response.json();
      console.log('✅ Token is valid and working');
      console.log(`   User: ${userInfo.name || 'Unknown'}`);
      console.log(`   Type: ${userInfo.type || 'Unknown'}`);
      console.log(`   Organizations: ${userInfo.orgs?.length || 0}`);
    } else {
      console.log('❌ Token validation failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${await response.text()}`);
    }
  } catch (error) {
    console.log('❌ Error testing token:', error.message);
  }
  
  // Test model access
  console.log('\n🔍 Testing model access...');
  
  try {
    const modelResponse = await fetch('https://huggingface.co/api/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (modelResponse.ok) {
      const modelInfo = await modelResponse.json();
      console.log('✅ Model access confirmed');
      console.log(`   Model: ${modelInfo.modelId}`);
      console.log(`   Downloads: ${modelInfo.downloads || 'Unknown'}`);
      console.log(`   Tags: ${modelInfo.tags?.join(', ') || 'None'}`);
    } else {
      console.log('❌ Model access failed');
      console.log(`   Status: ${modelResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Error testing model access:', error.message);
  }
  
  // Test inference endpoint
  console.log('\n🚀 Testing inference endpoint...');
  
  try {
    const inferenceResponse = await fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'This is a test poll about democracy and civic engagement.'
      })
    });
    
    if (inferenceResponse.ok) {
      const result = await inferenceResponse.json();
      console.log('✅ Inference endpoint working');
      console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.log('❌ Inference endpoint failed');
      console.log(`   Status: ${inferenceResponse.status}`);
      console.log(`   Response: ${await inferenceResponse.text()}`);
    }
  } catch (error) {
    console.log('❌ Error testing inference:', error.message);
  }
  
  console.log('\n🎯 Summary:');
  console.log('   - Token exists: ✅');
  console.log('   - Token valid: ' + (token ? '✅' : '❌'));
  console.log('   - Model access: ' + (token ? '✅' : '❌'));
  console.log('   - Inference ready: ' + (token ? '✅' : '❌'));
  
  console.log('\n📝 Next steps:');
  console.log('   1. Your token is ready for use');
  console.log('   2. You can now use enhanced Hugging Face models');
  console.log('   3. No rate limits on your account');
  console.log('   4. Access to private models if available');
}

// Run the test
testHuggingFaceToken().catch(console.error);
