#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function analyzeFeedbackSubmission() {
  console.log('🔍 Analyzing recent feedback submission...\n');

  // Initialize Supabase client with service role for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get the most recent feedback submission
    const { data: recentFeedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.log('❌ Error fetching feedback:', fetchError.message);
      return;
    }

    if (!recentFeedback) {
      console.log('⚠️  No feedback submissions found in database');
      return;
    }

    console.log('📊 RECENT FEEDBACK SUBMISSION ANALYSIS');
    console.log('=====================================');
    console.log(`📅 Submitted: ${recentFeedback.created_at}`);
    console.log(`👤 User ID: ${recentFeedback.user_id || 'Anonymous'}`);
    console.log(`📝 Type: ${recentFeedback.type || 'Not specified'}`);
    console.log(`🏷️  Title: ${recentFeedback.title || 'No title'}`);
    console.log(`📄 Description: ${recentFeedback.description || 'No description'}`);
    console.log(`😊 Sentiment: ${recentFeedback.sentiment || 'Not analyzed'}`);
    console.log(`📸 Screenshot: ${recentFeedback.screenshot ? 'Yes' : 'No'}`);
    console.log(`🛤️  User Journey: ${recentFeedback.user_journey || 'Not tracked'}`);
    console.log(`📊 Status: ${recentFeedback.status || 'New'}`);
    console.log(`⭐ Priority: ${recentFeedback.priority || 'Not set'}`);
    console.log(`🏷️  Tags: ${recentFeedback.tags ? JSON.stringify(recentFeedback.tags) : 'None'}`);
    console.log(`🤖 AI Analysis: ${recentFeedback.ai_analysis ? 'Yes' : 'No'}`);
    console.log(`📋 Metadata: ${recentFeedback.metadata ? JSON.stringify(recentFeedback.metadata) : 'None'}`);

    // Analyze data quality
    console.log('\n📈 DATA QUALITY ANALYSIS');
    console.log('========================');
    
    const qualityScore = calculateQualityScore(recentFeedback);
    console.log(`🎯 Overall Quality Score: ${qualityScore}/100`);
    
    const missingFields = getMissingFields(recentFeedback);
    if (missingFields.length > 0) {
      console.log(`⚠️  Missing Fields: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ All fields populated');
    }

    // Get feedback statistics
    const { data: allFeedback, error: statsError } = await supabase
      .from('feedback')
      .select('*');

    if (!statsError && allFeedback) {
      console.log('\n📊 FEEDBACK SYSTEM STATISTICS');
      console.log('=============================');
      console.log(`📝 Total Submissions: ${allFeedback.length}`);
      
      const types = {};
      const sentiments = {};
      const statuses = {};
      
      allFeedback.forEach(feedback => {
        types[feedback.type] = (types[feedback.type] || 0) + 1;
        sentiments[feedback.sentiment] = (sentiments[feedback.sentiment] || 0) + 1;
        statuses[feedback.status] = (statuses[feedback.status] || 0) + 1;
      });
      
      console.log('📋 Types:', types);
      console.log('😊 Sentiments:', sentiments);
      console.log('📊 Statuses:', statuses);
    }

    // Generate improvement recommendations
    console.log('\n🚀 IMPROVEMENT RECOMMENDATIONS');
    console.log('===============================');
    
    const recommendations = generateRecommendations(recentFeedback, allFeedback);
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

  } catch (error) {
    console.log('❌ Error analyzing feedback:', error.message);
  }
}

function calculateQualityScore(feedback) {
  let score = 0;
  const fields = [
    'title', 'description', 'type', 'sentiment', 
    'user_journey', 'screenshot', 'tags', 'ai_analysis'
  ];
  
  fields.forEach(field => {
    if (feedback[field] && feedback[field] !== '') {
      score += 12.5; // 100 / 8 fields
    }
  });
  
  return Math.round(score);
}

function getMissingFields(feedback) {
  const requiredFields = ['title', 'description', 'type'];
  return requiredFields.filter(field => !feedback[field] || feedback[field] === '');
}

function generateRecommendations(feedback, allFeedback) {
  const recommendations = [];
  
  // Data quality improvements
  if (!feedback.title || feedback.title === '') {
    recommendations.push('Add title field validation and auto-generation for better organization');
  }
  
  if (!feedback.user_journey || feedback.user_journey === '') {
    recommendations.push('Implement user journey tracking to understand context better');
  }
  
  if (!feedback.sentiment || feedback.sentiment === '') {
    recommendations.push('Add automatic sentiment analysis for better categorization');
  }
  
  if (!feedback.tags || feedback.tags.length === 0) {
    recommendations.push('Implement automatic tagging based on content analysis');
  }
  
  if (!feedback.ai_analysis || feedback.ai_analysis === '') {
    recommendations.push('Add AI-powered feedback analysis for insights and categorization');
  }
  
  // System improvements
  recommendations.push('Add feedback submission confirmation email to users');
  recommendations.push('Implement feedback status updates and notifications');
  recommendations.push('Create admin dashboard for feedback management and analytics');
  recommendations.push('Add feedback search and filtering capabilities');
  recommendations.push('Implement feedback response system for user engagement');
  
  // Analytics improvements
  recommendations.push('Add feedback analytics dashboard with trends and insights');
  recommendations.push('Implement feedback export functionality for analysis');
  recommendations.push('Add feedback priority scoring algorithm');
  recommendations.push('Create feedback categorization and routing system');
  
  return recommendations;
}

// Run the analysis
analyzeFeedbackSubmission().catch(console.error);
