import { NextRequest, NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const pipeline = new FreeAPIsPipeline();
    
    // Create a test representative with sample data
    const testRep = {
      id: 'test-1',
      name: 'Test Representative',
      party: 'Democratic',
      office: 'Assembly',
      level: 'state' as const,
      state: 'California',
      district: '1',
      contacts: [
        { type: 'email', value: 'test@example.com', isPrimary: true, isVerified: true, source: 'test' },
        { type: 'phone', value: '555-123-4567', isPrimary: true, isVerified: true, source: 'test' },
        { type: 'website', value: 'https://test.com', isPrimary: true, isVerified: true, source: 'test' }
      ],
      socialMedia: [
        { platform: 'twitter', handle: '@testrep', url: 'https://twitter.com/testrep', followersCount: 1000, isVerified: true, source: 'test' },
        { platform: 'facebook', handle: 'testrep', url: 'https://facebook.com/testrep', followersCount: 2000, isVerified: true, source: 'test' }
      ],
      photos: [
        { url: 'https://example.com/photo.jpg', source: 'test', quality: 'high', isPrimary: true }
      ],
      activity: [
        { type: 'statement', title: 'Test Statement', date: new Date(), source: 'test' }
      ],
      dataSources: ['test'],
      qualityScore: 0,
      lastUpdated: new Date()
    };

    console.log('🧪 Testing data transformation...');
    
    // Test the transformToEnhancedSchema method directly
    const transformed = (pipeline as any).transformToEnhancedSchema(testRep);
    
    return NextResponse.json({
      status: 'success',
      original: {
        contacts: testRep.contacts.length,
        socialMedia: testRep.socialMedia.length,
        photos: testRep.photos.length,
        activity: testRep.activity.length
      },
      transformed: {
        primaryEmail: transformed.primaryEmail,
        primaryPhone: transformed.primaryPhone,
        primaryWebsite: transformed.primaryWebsite,
        primaryPhotoUrl: transformed.primaryPhotoUrl,
        twitterHandle: transformed.twitterHandle,
        facebookUrl: transformed.facebookUrl,
        accountabilityScore: transformed.accountabilityScore,
        floorSpeeches: transformed.floorSpeeches?.length || 0,
        committeeStatements: transformed.committeeStatements?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `Transformation test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
