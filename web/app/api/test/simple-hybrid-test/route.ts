import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    console.log('🧪 Testing hybrid approach with simple data...');
    
    // Get one representative to test with
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office')
      .limit(1);
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch representative: ${fetchError.message}`
      });
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives found'
      });
    }
    
    const rep = representatives[0];
    console.log(`👤 Testing with ${rep.name} (${rep.office}, ${rep.state})`);
    
    // Test 1: Insert a simple contact record
    const testContact = {
      representative_id: rep.id,
      type: 'email',
      value: 'test@example.com',
      label: 'Test Contact',
      is_primary: false,
      is_verified: false,
      source: 'test'
    };
    
    console.log('📧 Testing contact insertion...');
    const { data: contactData, error: contactError } = await supabase
      .from('representative_contacts')
      .insert(testContact)
      .select();
    
    if (contactError) {
      return NextResponse.json({
        success: false,
        error: `Contact insertion failed: ${contactError.message}`,
        errorCode: contactError.code,
        errorDetails: contactError.details
      });
    }
    
    console.log('✅ Contact inserted successfully');
    
    // Test 2: Insert a simple social media record
    const testSocial = {
      representative_id: rep.id,
      platform: 'twitter',
      handle: '@testuser',
      url: 'https://twitter.com/testuser',
      followers_count: 0,
      is_verified: false,
      source: 'test'
    };
    
    console.log('🐦 Testing social media insertion...');
    const { data: socialData, error: socialError } = await supabase
      .from('representative_social_media')
      .insert(testSocial)
      .select();
    
    if (socialError) {
      return NextResponse.json({
        success: false,
        error: `Social media insertion failed: ${socialError.message}`,
        errorCode: socialError.code,
        errorDetails: socialError.details
      });
    }
    
    console.log('✅ Social media inserted successfully');
    
    // Test 3: Insert a simple photo record
    const testPhoto = {
      representative_id: rep.id,
      url: 'https://example.com/photo.jpg',
      source: 'test',
      quality: 'medium',
      is_primary: false
    };
    
    console.log('📸 Testing photo insertion...');
    const { data: photoData, error: photoError } = await supabase
      .from('representative_photos')
      .insert(testPhoto)
      .select();
    
    if (photoError) {
      return NextResponse.json({
        success: false,
        error: `Photo insertion failed: ${photoError.message}`,
        errorCode: photoError.code,
        errorDetails: photoError.details
      });
    }
    
    console.log('✅ Photo inserted successfully');
    
    // Clean up test data
    await supabase.from('representative_contacts').delete().eq('value', 'test@example.com');
    await supabase.from('representative_social_media').delete().eq('handle', '@testuser');
    await supabase.from('representative_photos').delete().eq('url', 'https://example.com/photo.jpg');
    
    return NextResponse.json({
      success: true,
      message: 'Hybrid approach test successful!',
      tests: {
        contactInsertion: '✅ Passed',
        socialMediaInsertion: '✅ Passed', 
        photoInsertion: '✅ Passed'
      },
      conclusion: 'All detail tables are working correctly. The hybrid approach is ready!'
    });
    
  } catch (error) {
    console.error('Hybrid test failed:', error);
    return NextResponse.json({
      success: false,
      error: `Hybrid test failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
