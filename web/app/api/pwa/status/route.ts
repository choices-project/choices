/**
 * PWA Status API Endpoint
 * 
 * Provides PWA status information including feature availability,
 * user preferences, and system health.
 */

import { type NextRequest } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, validationError } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeUserData = searchParams.get('includeUserData') === 'true';

    // Get PWA system status
    const systemStatus = await getPWASystemStatus();
    
    // Get user-specific PWA status if userId provided
    let userStatus = null;
    if (userId && includeUserData) {
      userStatus = await getUserPWAStatus(userId);
    }

    const response = {
      success: true,
      features: {
        pwa: true,
        offlineVoting: isFeatureEnabled('PWA'),
        pushNotifications: isFeatureEnabled('PWA'),
        backgroundSync: isFeatureEnabled('PWA'),
        webAuthn: isFeatureEnabled('WEBAUTHN')
      },
      system: systemStatus,
      user: userStatus,
      timestamp: new Date().toISOString()
    };

    const responseObj = NextResponse.json(response);
    
    // Add CORS headers
    responseObj.headers.set('Access-Control-Allow-Origin', '*');
    responseObj.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseObj.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return responseObj;

  } catch (error) {
    logger.error('PWA: Failed to get PWA status:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get PWA status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, data } = body;

    if (!action || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Action and userId are required'
      }, { status: 400 });
    }

    logger.info(`PWA: Processing ${action} for user ${userId}`);

    let result;
    switch (action) {
      case 'register':
        result = await registerPWAUser(userId, data);
        break;
      case 'updatePreferences':
        result = await updatePWAUserPreferences(userId, data);
        break;
      case 'getDeviceInfo':
        result = await getPWAUserDeviceInfo(userId);
        break;
      case 'clearOfflineData':
        result = await clearPWAUserOfflineData(userId);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('PWA: Failed to process PWA action:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process PWA action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get PWA system status
 */
async function getPWASystemStatus(): Promise<any> {
  return {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      serviceWorker: true,
      manifest: true,
      offlineSupport: true,
      pushNotifications: true,
      backgroundSync: true
    },
    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: process.uptime()
    },
    limits: {
      maxOfflineVotes: 100,
      maxNotificationHistory: 50,
      syncInterval: 30000
    }
  };
}

/**
 * Get user-specific PWA status
 */
async function getUserPWAStatus(userId: string): Promise<any> {
  // This would typically query your database for user-specific PWA data
  return {
    userId,
    isRegistered: true,
    preferences: {
      offlineVoting: true,
      pushNotifications: true,
      backgroundSync: true,
      dataCollection: false
    },
    stats: {
      offlineVotesStored: 0,
      notificationsReceived: 0,
      lastSync: new Date().toISOString(),
      installDate: new Date().toISOString()
    },
    device: {
      platform: 'web',
      userAgent: 'Mozilla/5.0 (compatible; PWA)',
      capabilities: {
        serviceWorker: true,
        pushNotifications: true,
        webAuthn: true,
        offlineStorage: true
      }
    }
  };
}

/**
 * Register a new PWA user
 */
async function registerPWAUser(userId: string, data: any): Promise<any> {
  logger.info(`PWA: Registering user ${userId} with data:`, data);
  
  // This would typically store user registration in your database
  return {
    userId,
    registered: true,
    pwaId: `pwa_${userId}_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
}

/**
 * Update PWA user preferences
 */
async function updatePWAUserPreferences(userId: string, preferences: any): Promise<any> {
  logger.info(`PWA: Updating preferences for user ${userId}:`, preferences);
  
  // This would typically update user preferences in your database
  return {
    userId,
    preferences,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Get PWA user device information
 */
async function getPWAUserDeviceInfo(userId: string): Promise<any> {
  // This would typically query your database for user device info
  return {
    userId,
    device: {
      platform: 'web',
      capabilities: {
        serviceWorker: true,
        pushNotifications: true,
        webAuthn: true,
        offlineStorage: true
      },
      lastSeen: new Date().toISOString()
    }
  };
}

/**
 * Clear PWA user offline data
 */
async function clearPWAUserOfflineData(userId: string): Promise<any> {
  logger.info(`PWA: Clearing offline data for user ${userId}`);
  
  // This would typically clear user's offline data from your database
  return {
    userId,
    cleared: true,
    clearedAt: new Date().toISOString(),
    itemsCleared: {
      offlineVotes: 0,
      cachedData: 0,
      notifications: 0
    }
  };
}
