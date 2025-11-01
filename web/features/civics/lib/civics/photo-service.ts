/**
 * Civics Photo Service
 * 
 * Manages official photos for representatives and candidates
 * Integrates multiple sources: Google Civic, OpenStates, Congress.gov, Wikipedia
 * 
 * @author Agent E
 * @date 2025-01-05
 */

import { devLog } from '@/lib/utils/logger';

export type PhotoSource = 'google-civic' | 'open-states' | 'congress-gov' | 'wikipedia' | 'placeholder';

export type RepresentativePhoto = {
  url: string;
  source: PhotoSource;
  quality: 'high' | 'medium' | 'low';
  license?: string;
  attribution?: string;
  lastUpdated: string;
  isOfficial: boolean;
}

export type PhotoEnhancementResult = {
  representativeId: string;
  name: string;
  photos: RepresentativePhoto[];
  bestPhoto?: RepresentativePhoto;
  hasOfficialPhoto: boolean;
  fallbackUsed: boolean;
}

export class CivicsPhotoService {
  private cache = new Map<string, RepresentativePhoto[]>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get the best available photo for a representative
   */
  async getRepresentativePhoto(
    representative: {
      id: string;
      name: string;
      bioguideId?: string;
      photoUrl?: string;
      source?: string;
    }
  ): Promise<PhotoEnhancementResult> {
    try {
      devLog('Getting representative photo', { 
        representativeId: representative.id, 
        name: representative.name 
      });

      // Check cache first
      const cached = this.cache.get(representative.id);
      if (cached?.[0]?.lastUpdated && this.isCacheValid(cached[0].lastUpdated)) {
        return this.buildResult(representative, cached);
      }

      const photos: RepresentativePhoto[] = [];

      // 1. Use existing photo from API if available
      if (representative.photoUrl) {
        photos.push({
          url: representative.photoUrl,
          source: representative.source as PhotoSource || 'google-civic',
          quality: 'high',
          isOfficial: true,
          lastUpdated: new Date().toISOString()
        });
      }

      // 2. Try Congress.gov official photo
      if (representative.bioguideId) {
        const congressPhoto = this.generateCongressPhotoUrl(representative.bioguideId);
        if (congressPhoto) {
          photos.push(congressPhoto);
        }
      }

      // 3. Try Wikipedia photo
      const wikipediaPhoto = await this.getWikipediaPhoto(representative.name);
      if (wikipediaPhoto) {
        photos.push(wikipediaPhoto);
      }

      // 4. Add placeholder if no photos found
      if (photos.length === 0) {
        photos.push(this.getPlaceholderPhoto(representative.name));
      }

      // Cache the results
      this.cache.set(representative.id, photos);

      return this.buildResult(representative, photos);

    } catch (error) {
      devLog('Error getting representative photo', { 
        representativeId: representative.id, 
        error 
      });
      
      // Return placeholder on error
      return this.buildResult(representative, [this.getPlaceholderPhoto(representative.name)]);
    }
  }

  /**
   * Generate Congress.gov photo URL from bioguide ID
   */
  private generateCongressPhotoUrl(bioguideId: string): RepresentativePhoto | null {
    try {
      const url = `https://www.congress.gov/img/member/${bioguideId}.jpg`;
      
      return {
        url,
        source: 'congress-gov',
        quality: 'high',
        license: 'Public Domain',
        isOfficial: true,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      devLog('Error generating Congress photo URL', { bioguideId, error });
      return null;
    }
  }

  /**
   * Get Wikipedia photo for a representative
   */
  private async getWikipediaPhoto(name: string): Promise<RepresentativePhoto | null> {
    try {
      // This would integrate with Wikipedia API
      // For now, return null as placeholder
      devLog('Wikipedia photo lookup not implemented yet', { name });
      return null;
    } catch (error) {
      devLog('Error getting Wikipedia photo', { name, error });
      return null;
    }
  }

  /**
   * Get placeholder photo
   */
  private getPlaceholderPhoto(name: string): RepresentativePhoto {
    // Generate initials for placeholder
    const initials = name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=ffffff&size=200`,
      source: 'placeholder',
      quality: 'low',
      isOfficial: false,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Build final result
   */
  private buildResult(representative: any, photos: RepresentativePhoto[]): PhotoEnhancementResult {
    // Sort photos by quality and official status
    const sortedPhotos = photos.sort((a, b) => {
      if (a.isOfficial && !b.isOfficial) return -1;
      if (!a.isOfficial && b.isOfficial) return 1;
      if (a.quality === 'high' && b.quality !== 'high') return -1;
      if (a.quality !== 'high' && b.quality === 'high') return 1;
      return 0;
    });

    const bestPhoto = sortedPhotos[0];
    const hasOfficialPhoto = photos.some(p => p.isOfficial);
    const fallbackUsed = bestPhoto?.source === 'placeholder';

    return {
      representativeId: representative.id,
      name: representative.name,
      photos: sortedPhotos,
      bestPhoto: bestPhoto || {
        url: '',
        source: 'placeholder' as const,
        isOfficial: false,
        quality: 'low' as const,
        lastUpdated: new Date().toISOString()
      },
      hasOfficialPhoto,
      fallbackUsed
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastUpdated: string): boolean {
    if (!lastUpdated) return false;
    const cacheTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    return (now - cacheTime) < this.CACHE_TTL;
  }

  /**
   * Clear photo cache
   */
  clearCache(): void {
    this.cache.clear();
    devLog('Photo cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const civicsPhotoService = new CivicsPhotoService();

