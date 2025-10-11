/**
 * Civics Cache Management API
 * 
 * Provides cache statistics, monitoring, and management capabilities
 * for the civics API caching system.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/api-logger';
import { CivicsCache } from '@/lib/utils/civics-cache';

export async function GET(request: NextRequest) {
  const logger = createApiLogger('/api/civics/cache', 'GET');
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = CivicsCache.getStats();
      
      logger.info('Cache statistics requested', stats);
      
      return NextResponse.json({
        success: true,
        data: {
          cache_stats: stats,
          cache_config: {
            representative_ttl: '15 minutes',
            address_ttl: '5 minutes',
            state_ttl: '30 minutes'
          }
        },
        metadata: {
          source: 'cache',
          last_updated: new Date().toISOString()
        }
      });
    }

    if (action === 'clear') {
      CivicsCache.clearAll();
      
      logger.info('Cache cleared successfully');
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Cache cleared successfully'
        },
        metadata: {
          source: 'cache',
          last_updated: new Date().toISOString()
        }
      });
    }

    // Default: return cache information
    const stats = CivicsCache.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        cache_stats: stats,
        available_actions: ['stats', 'clear'],
        usage: {
          get_stats: 'GET /api/civics/cache?action=stats',
          clear_cache: 'GET /api/civics/cache?action=clear'
        }
      },
      metadata: {
        source: 'cache',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Cache management error', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Cache management failed',
      metadata: {
        source: 'cache',
        last_updated: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const logger = createApiLogger('/api/civics/cache', 'DELETE');
  
  try {
    const { searchParams } = new URL(request.url);
    const representativeId = searchParams.get('representative_id');

    if (representativeId) {
      CivicsCache.clearRepresentative(representativeId);
      
      logger.info('Representative cache cleared', { representativeId });
      
      return NextResponse.json({
        success: true,
        data: {
          message: `Cache cleared for representative ${representativeId}`
        },
        metadata: {
          source: 'cache',
          last_updated: new Date().toISOString()
        }
      });
    }

    // Clear all cache if no specific representative
    CivicsCache.clearAll();
    
    logger.info('All cache cleared via DELETE');
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'All cache cleared successfully'
      },
      metadata: {
        source: 'cache',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Cache deletion error', error as Error);
    return NextResponse.json({
      success: false,
      error: 'Cache deletion failed',
      metadata: {
        source: 'cache',
        last_updated: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
