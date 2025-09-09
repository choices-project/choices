/**
 * Privacy Data Management Utilities
 * 
 * Handles user data export, anonymization, and privacy controls.
 * All operations are user-controlled and privacy-preserving.
 * 
 * @created September 9, 2025
 */

import { supabase } from '../supabase/client';
import { UserEncryption, EncryptionUtils } from './encryption';
import { ConsentManager } from './consent';

export interface UserDataExport {
  profile: any;
  polls: any[];
  votes: any[];
  consent: any[];
  analytics_contributions: any[];
  exported_at: string;
}

export interface AnonymizationResult {
  success: boolean;
  message: string;
  anonymized_fields: string[];
}

export class PrivacyDataManager {
  private encryption: UserEncryption;
  private consentManager: ConsentManager;

  constructor() {
    this.encryption = new UserEncryption();
    this.consentManager = new ConsentManager(supabase);
  }

  /**
   * Export all user data
   */
  async exportUserData(): Promise<UserDataExport | null> {
    try {
      const { data, error } = await supabase.rpc('export_user_data', {
        target_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        console.error('Error exporting user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }

  /**
   * Anonymize user data
   */
  async anonymizeUserData(): Promise<AnonymizationResult> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        return {
          success: false,
          message: 'User not authenticated',
          anonymized_fields: []
        };
      }

      const { error } = await supabase.rpc('anonymize_user_data', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error anonymizing user data:', error);
        return {
          success: false,
          message: error.message,
          anonymized_fields: []
        };
      }

      return {
        success: true,
        message: 'User data successfully anonymized',
        anonymized_fields: [
          'username',
          'public_bio',
          'encrypted_demographics',
          'encrypted_preferences',
          'encrypted_contact_info',
          'private_user_data',
          'analytics_contributions'
        ]
      };
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        anonymized_fields: []
      };
    }
  }

  /**
   * Store encrypted user data
   */
  async storeEncryptedData(
    dataType: 'demographics' | 'preferences' | 'contact_info' | 'personal_info' | 'behavioral_data' | 'analytics_data',
    data: any,
    password: string
  ): Promise<boolean> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Generate encryption key
      const salt = this.encryption.generateSalt();
      await this.encryption.generateUserKey(password, salt);

      // Encrypt data
      const encryptionResult = await this.encryption.encryptData(data);
      const keyHash = await this.encryption.createKeyHash();

      // Store encrypted data
      const encryptedDataBase64 = EncryptionUtils.arrayBufferToBase64(encryptionResult.encryptedData);
      const saltBase64 = EncryptionUtils.uint8ArrayToBase64(encryptionResult.salt);
      const ivBase64 = EncryptionUtils.uint8ArrayToBase64(encryptionResult.iv);

      let updateData: any = {
        encryption_version: 1,
        key_derivation_salt: saltBase64,
        key_hash: keyHash,
        updated_at: new Date().toISOString()
      };

      // Determine which table and field to update
      if (['demographics', 'preferences', 'contact_info'].includes(dataType)) {
        updateData[`encrypted_${dataType}`] = encryptedDataBase64;
        
        const { error } = await supabase
          .from('user_profiles_encrypted')
          .upsert({
            user_id: userId,
            ...updateData
          });

        if (error) throw error;
      } else {
        // Store in private_user_data table
        updateData[`encrypted_${dataType}`] = encryptedDataBase64;
        
        const { error } = await supabase
          .from('private_user_data')
          .upsert({
            user_id: userId,
            ...updateData
          });

        if (error) throw error;
      }

      // Clear encryption key from memory
      this.encryption.clearKey();

      return true;
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      this.encryption.clearKey();
      return false;
    }
  }

  /**
   * Retrieve and decrypt user data
   */
  async retrieveEncryptedData(
    dataType: 'demographics' | 'preferences' | 'contact_info' | 'personal_info' | 'behavioral_data' | 'analytics_data',
    password: string
  ): Promise<any | null> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let encryptedData: string | null = null;
      let salt: string | null = null;
      let iv: string | null = null;

      // Retrieve encrypted data from appropriate table
      if (['demographics', 'preferences', 'contact_info'].includes(dataType)) {
        const { data, error } = await supabase
          .from('user_profiles_encrypted')
          .select(`encrypted_${dataType}, key_derivation_salt`)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        if (!data) return null;

        encryptedData = data[`encrypted_${dataType}`];
        salt = data.key_derivation_salt;
      } else {
        const { data, error } = await supabase
          .from('private_user_data')
          .select(`encrypted_${dataType}`)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        if (!data) return null;

        encryptedData = data[`encrypted_${dataType}`];
        
        // Get salt from user_profiles_encrypted
        const { data: profileData } = await supabase
          .from('user_profiles_encrypted')
          .select('key_derivation_salt')
          .eq('user_id', userId)
          .single();
        
        salt = profileData?.key_derivation_salt;
      }

      if (!encryptedData || !salt) return null;

      // Generate encryption key
      const saltArray = EncryptionUtils.base64ToUint8Array(salt);
      await this.encryption.generateUserKey(password, saltArray);

      // Decrypt data
      const encryptedDataArray = EncryptionUtils.base64ToArrayBuffer(encryptedData);
      const ivArray = new Uint8Array(12); // IV is prepended to encrypted data
      const actualEncryptedData = encryptedDataArray.slice(12);
      
      const decryptionResult = await this.encryption.decryptData(
        actualEncryptedData,
        saltArray,
        ivArray
      );

      // Clear encryption key from memory
      this.encryption.clearKey();

      return decryptionResult.success ? decryptionResult.decryptedData : null;
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      this.encryption.clearKey();
      return null;
    }
  }

  /**
   * Contribute to analytics (privacy-preserving)
   */
  async contributeToAnalytics(
    pollId: string,
    demographicData: {
      age: number;
      location: string;
      education: string;
    },
    voteChoice: number,
    participationTime: number
  ): Promise<boolean> {
    try {
      // Check if user has consent for analytics
      const hasConsent = await this.consentManager.hasConsent('analytics');
      if (!hasConsent) {
        console.warn('User has not granted consent for analytics');
        return false;
      }

      // Create demographic buckets
      const ageBucket = this.getAgeBucket(demographicData.age);
      const regionBucket = this.getRegionBucket(demographicData.location);
      const educationBucket = this.getEducationBucket(demographicData.education);

      // Contribute to analytics
      const { error } = await supabase.rpc('contribute_to_analytics', {
        target_poll_id: pollId,
        target_age_bucket: ageBucket,
        target_region_bucket: regionBucket,
        target_education_bucket: educationBucket,
        target_vote_choice: voteChoice,
        target_participation_time: `${participationTime} seconds`
      });

      if (error) {
        console.error('Error contributing to analytics:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error contributing to analytics:', error);
      return false;
    }
  }

  /**
   * Get privacy dashboard data
   */
  async getPrivacyDashboard(): Promise<{
    consentSummary: any;
    dataExportAvailable: boolean;
    anonymizationAvailable: boolean;
    encryptionStatus: {
      demographics: boolean;
      preferences: boolean;
      contact_info: boolean;
      personal_info: boolean;
      behavioral_data: boolean;
      analytics_data: boolean;
    };
  }> {
    try {
      const consentSummary = await this.consentManager.getConsentSummary();
      
      // Check encryption status
      const { data: profileData } = await supabase
        .from('user_profiles_encrypted')
        .select('encrypted_demographics, encrypted_preferences, encrypted_contact_info')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data: privateData } = await supabase
        .from('private_user_data')
        .select('encrypted_personal_info, encrypted_behavioral_data, encrypted_analytics_data')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      return {
        consentSummary,
        dataExportAvailable: true,
        anonymizationAvailable: true,
        encryptionStatus: {
          demographics: !!profileData?.encrypted_demographics,
          preferences: !!profileData?.encrypted_preferences,
          contact_info: !!profileData?.encrypted_contact_info,
          personal_info: !!privateData?.encrypted_personal_info,
          behavioral_data: !!privateData?.encrypted_behavioral_data,
          analytics_data: !!privateData?.encrypted_analytics_data
        }
      };
    } catch (error) {
      console.error('Error getting privacy dashboard:', error);
      return {
        consentSummary: { totalConsents: 0, activeConsents: 0, consentTypes: {} },
        dataExportAvailable: false,
        anonymizationAvailable: false,
        encryptionStatus: {
          demographics: false,
          preferences: false,
          contact_info: false,
          personal_info: false,
          behavioral_data: false,
          analytics_data: false
        }
      };
    }
  }

  /**
   * Helper methods for demographic bucketing
   */
  private getAgeBucket(age: number): string {
    if (age < 18) return 'under_18';
    if (age <= 24) return 'age_18_24';
    if (age <= 34) return 'age_25_34';
    if (age <= 44) return 'age_35_44';
    if (age <= 54) return 'age_45_54';
    if (age <= 64) return 'age_55_64';
    return 'age_65_plus';
  }

  private getRegionBucket(location: string): string {
    const region = location.toLowerCase();
    if (region.includes('north') || region.includes('northeast')) return 'region_northeast';
    if (region.includes('south') || region.includes('southeast')) return 'region_southeast';
    if (region.includes('west') || region.includes('southwest')) return 'region_southwest';
    if (region.includes('midwest') || region.includes('central')) return 'region_midwest';
    return 'region_other';
  }

  private getEducationBucket(education: string): string {
    const edu = education.toLowerCase();
    if (edu.includes('high school') || edu.includes('secondary')) return 'education_high_school';
    if (edu.includes('associate') || edu.includes('2-year')) return 'education_associate';
    if (edu.includes('bachelor') || edu.includes('4-year')) return 'education_bachelor';
    if (edu.includes('master') || edu.includes('graduate')) return 'education_master';
    if (edu.includes('doctorate') || edu.includes('phd')) return 'education_doctorate';
    return 'education_other';
  }
}
