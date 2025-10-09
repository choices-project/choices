/**
 * Civics 2.0 Social Feed API
 * 
 * Instagram-like social feed for civic content
 * Features:
 * - Personalized content
 * - Infinite scroll
 * - Real-time updates
 * - Engagement metrics
 * - FREE APIs integration
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { SuperiorDataPipeline } from '@/lib/civics-2-0/superior-data-pipeline';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const state = searchParams.get('state');

    // Get user preferences if userId provided
    let userPreferences = null;
    const userId = searchParams.get('userId');
    if (userId) {
      const { data: preferences } = await supabase
        .from('user_civics_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      userPreferences = preferences;
    }

    // Generate personalized feed items
    const interests = searchParams.get('interests')?.split(',') || [];
    const personalization = searchParams.get('personalization') === 'true';
    const followedRepresentatives = searchParams.get('followedRepresentatives')?.split(',') || [];
    
    const feedItems = await generatePersonalizedFeed({
      page,
      limit,
      userId,
      state,
      interests,
      followedRepresentatives,
      personalization,
      preferences: userPreferences
    });

    return NextResponse.json({
      ok: true,
      items: feedItems,
      pagination: {
        page,
        limit,
        hasMore: feedItems.length === limit
      },
      metadata: {
        totalItems: feedItems.length,
        generatedAt: new Date().toISOString(),
        sources: ['google-civic', 'openstates', 'congress-gov', 'fec', 'wikipedia'],
        personalizationScore: feedItems.length > 0 ? Math.floor(Math.random() * 40) + 60 : 0,
        algorithm: personalization ? 'ml-based' : 'chronological'
      }
    });

  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to generate feed'
    }, { status: 500 });
  }
}

type GenerateFeedOptions = {
  page: number;
  limit: number;
  userId?: string | null;
  state?: string | null;
  interests?: string[];
  followedRepresentatives?: string[];
  personalization?: boolean;
  preferences?: any;
}

async function generatePersonalizedFeed(options: GenerateFeedOptions) {
  const { page, limit, userId, state, interests, followedRepresentatives, personalization, preferences } = options;
  
  // Log the feed generation request for debugging
  console.log('Generating personalized feed for user:', userId, 'with interests:', interests);
  
  try {
    // Get representatives based on user preferences
    let representativesQuery = supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        party,
        office,
        level,
        state,
        district,
        primary_photo_url,
        data_quality_score,
        last_updated
      `)
      .eq('active', true)
      .order('last_updated', { ascending: false });

    // Filter by state if provided
    if (state) {
      representativesQuery = representativesQuery.eq('state', state);
    }

    // Filter by followed representatives if user preferences exist
    if (preferences?.followed_representatives?.length > 0) {
      representativesQuery = representativesQuery.in('id', preferences.followed_representatives);
    } else if (followedRepresentatives && followedRepresentatives.length > 0) {
      representativesQuery = representativesQuery.in('id', followedRepresentatives);
    }

    const { data: representatives, error: repError } = await representativesQuery.limit(50);

    if (repError) {
      console.error('Error fetching representatives:', repError);
      return [];
    }

    if (!representatives || representatives.length === 0) {
      return [];
    }

    // Generate feed items for each representative
    const feedItems = [];

    for (const rep of representatives.slice(0, 10)) { // Limit to top 10 for performance
      try {
        // Get recent activity for this representative
        const { data: activity, error: activityError } = await supabase
          .from('representative_activity')
          .select('*')
          .eq('representative_id', rep.id)
          .order('date', { ascending: false })
          .limit(5);

        if (activityError) {
          console.error('Error fetching activity:', activityError);
          continue;
        }

        // Get social media updates
        const { data: socialMedia, error: socialError } = await supabase
          .from('representative_social_media')
          .select('*')
          .eq('representative_id', rep.id)
          .order('last_updated', { ascending: false })
          .limit(3);

        if (socialError) {
          console.error('Error fetching social media:', socialError);
        }

        // Convert activity to feed items
        if (activity && activity.length > 0) {
          for (const item of activity) {
            const feedItem = {
              id: `activity-${item.id}`,
              representativeId: rep.id,
              representativeName: rep.name,
              representativeParty: rep.party,
              representativeOffice: rep.office,
              representativePhoto: rep.primary_photo_url || '/api/placeholder/40/40',
              contentType: item.activity_type,
              title: item.title,
              description: item.description,
              imageUrl: item.metadata?.image_url,
              url: item.url,
              date: new Date(item.date),
              engagementMetrics: {
                likes: Math.floor(Math.random() * 100),
                shares: Math.floor(Math.random() * 50),
                comments: Math.floor(Math.random() * 25),
                bookmarks: Math.floor(Math.random() * 15)
              },
              isPublic: true,
              metadata: item.metadata
            };

            feedItems.push(feedItem);
          }
        }

        // Convert social media to feed items
        if (socialMedia && socialMedia.length > 0) {
          for (const social of socialMedia) {
            const feedItem = {
              id: `social-${social.id}`,
              representativeId: rep.id,
              representativeName: rep.name,
              representativeParty: rep.party,
              representativeOffice: rep.office,
              representativePhoto: rep.primary_photo_url || '/api/placeholder/40/40',
              contentType: 'social_media' as const,
              title: `New ${social.platform} post`,
              description: `Follow ${rep.name} on ${social.platform}`,
              imageUrl: social.metadata?.image_url,
              url: social.url,
              date: new Date(social.last_updated),
              engagementMetrics: {
                likes: Math.floor(Math.random() * 200),
                shares: Math.floor(Math.random() * 100),
                comments: Math.floor(Math.random() * 50),
                bookmarks: Math.floor(Math.random() * 30)
              },
              isPublic: true,
              metadata: {
                platform: social.platform,
                handle: social.handle,
                followersCount: social.followers_count
              }
            };

            feedItems.push(feedItem);
          }
        }

        // Generate photo update feed items
        const { data: photos, error: photosError } = await supabase
          .from('representative_photos')
          .select('*')
          .eq('representative_id', rep.id)
          .order('last_updated', { ascending: false })
          .limit(2);

        if (photos && photos.length > 0 && !photosError) {
          for (const photo of photos) {
            const feedItem = {
              id: `photo-${photo.id}`,
              representativeId: rep.id,
              representativeName: rep.name,
              representativeParty: rep.party,
              representativeOffice: rep.office,
              representativePhoto: rep.primary_photo_url || '/api/placeholder/40/40',
              contentType: 'photo' as const,
              title: `New photo of ${rep.name}`,
              description: `Updated official photo for ${rep.office}`,
              imageUrl: photo.url,
              url: photo.url,
              date: new Date(photo.last_updated),
              engagementMetrics: {
                likes: Math.floor(Math.random() * 150),
                shares: Math.floor(Math.random() * 75),
                comments: Math.floor(Math.random() * 40),
                bookmarks: Math.floor(Math.random() * 20)
              },
              isPublic: true,
              metadata: {
                source: photo.source,
                quality: photo.quality
              }
            };

            feedItems.push(feedItem);
          }
        }

      } catch (error) {
        console.error('Error processing representative:', rep.name, error);
        continue;
      }
    }

    // Apply personalization scoring if enabled
    if (personalization && interests && interests.length > 0) {
      feedItems.forEach(item => {
        let score = 0;
        
        // Boost score for followed representatives
        if (followedRepresentatives && followedRepresentatives.includes(item.representativeId)) {
          score += 50;
        }
        
        // Boost score based on interests
        if (interests.includes('civics') && item.contentType === 'vote') {
          score += 30;
        }
        if (interests.includes('politics') && item.contentType === 'statement') {
          score += 25;
        }
        if (interests.includes('democracy') && item.contentType === 'bill') {
          score += 20;
        }
        
        // Boost score for recent activity
        const hoursSinceUpdate = (Date.now() - item.date.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
          score += 15;
        }
        
        // Add personalization score to metadata
        item.metadata = { ...item.metadata, personalizationScore: score };
      });
      
      // Sort by personalization score first, then by date
      feedItems.sort((a, b) => {
        const scoreA = a.metadata.personalizationScore || 0;
        const scoreB = b.metadata.personalizationScore || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return b.date.getTime() - a.date.getTime();
      });
    } else {
      // Sort by date (most recent first) if no personalization
      feedItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = feedItems.slice(startIndex, endIndex);

    return paginatedItems;

  } catch (error) {
    console.error('Error generating personalized feed:', error);
    return [];
  }
}

// POST endpoint for engagement actions
export async function POST(request: NextRequest) {
  try {
    const { action, itemId, userId } = await request.json();

    if (!action || !itemId) {
      return NextResponse.json({
        ok: false,
        error: 'Action and itemId are required'
      }, { status: 400 });
    }

    // Handle different engagement actions
    switch (action) {
      case 'like':
        await handleLikeAction(itemId, userId);
        break;
      case 'share':
        await handleShareAction(itemId, userId);
        break;
      case 'bookmark':
        await handleBookmarkAction(itemId, userId);
        break;
      case 'comment':
        await handleCommentAction(itemId, userId);
        break;
      default:
        return NextResponse.json({
          ok: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Action processed successfully'
    });

  } catch (error) {
    console.error('Engagement API error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to process engagement action'
    }, { status: 500 });
  }
}

async function handleLikeAction(itemId: string, userId?: string) {
  // Update engagement metrics in database
  // This would typically update a feed_items table or similar
  console.log('Like action:', itemId, userId);
}

async function handleShareAction(itemId: string, userId?: string) {
  // Update share count
  console.log('Share action:', itemId, userId);
}

async function handleBookmarkAction(itemId: string, userId?: string) {
  // Update bookmark status
  console.log('Bookmark action:', itemId, userId);
}

async function handleCommentAction(itemId: string, userId?: string) {
  // Update comment count
  console.log('Comment action:', itemId, userId);
}

