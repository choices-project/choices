/**
 * Complete Database Schema Types
 * 
 * Generated on: 2025-10-18T21:09:04.814Z
 * 
 * This file contains the complete database schema for ALL 100+ tables
 * in the Choices civic engagement platform.
 * 
 * Total tables: 127
 * 
 * Systems covered:
 * - Core Application (4 tables)
 * - Hashtag System (7 tables)
 * - Analytics & Monitoring (15+ tables)
 * - Civics & Government Data (25+ tables)
 * - Privacy & Compliance (10+ tables)
 * - Data Quality & Monitoring (15+ tables)
 * - Authentication & Security (8+ tables)
 * - User Management (10+ tables)
 * - Content & Moderation (5+ tables)
 * - System Administration (10+ tables)
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          email: string
          trust_tier: string
          avatar_url?: string
          bio?: string
          is_active: boolean
          created_at: string
          updated_at: string
          is_admin: boolean
          geo_lat?: string
          geo_lon?: string
          geo_precision?: string
          geo_updated_at?: string
          geo_source?: string
          geo_consent_version?: string
          geo_coarse_hash?: string
          geo_trust_gate: string
          display_name?: string
          preferences: Record<string, unknown>
          privacy_settings: Record<string, unknown>
          primary_concerns?: string
          community_focus?: string
          participation_style: string
          demographics: Record<string, unknown>
          onboarding_completed: boolean
          onboarding_data: Record<string, unknown>
          location_data: Record<string, unknown>
          primary_hashtags: string[]
          followed_hashtags: string[]
          hashtag_preferences: Record<string, unknown>
          total_polls_created: number
          total_votes_cast: number
          total_engagement_score: number
          trust_score: number
          reputation_points: number
          verification_status: string
        }
        Insert: {
          id: string
          user_id: string
          username: string
          email: string
          trust_tier: string
          avatar_url?: string
          bio?: string
          is_active: boolean
          created_at: string
          updated_at: string
          is_admin: boolean
          geo_lat?: string
          geo_lon?: string
          geo_precision?: string
          geo_updated_at?: string
          geo_source?: string
          geo_consent_version?: string
          geo_coarse_hash?: string
          geo_trust_gate: string
          display_name?: string
          preferences: Record<string, unknown>
          privacy_settings: Record<string, unknown>
          primary_concerns?: string
          community_focus?: string
          participation_style: string
          demographics: Record<string, unknown>
          onboarding_completed: boolean
          onboarding_data: Record<string, unknown>
          location_data: Record<string, unknown>
          primary_hashtags: string[]
          followed_hashtags: string[]
          hashtag_preferences: Record<string, unknown>
          total_polls_created: number
          total_votes_cast: number
          total_engagement_score: number
          trust_score: number
          reputation_points: number
          verification_status: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          email?: string
          trust_tier?: string
          avatar_url?: string
          bio?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          geo_lat?: string
          geo_lon?: string
          geo_precision?: string
          geo_updated_at?: string
          geo_source?: string
          geo_consent_version?: string
          geo_coarse_hash?: string
          geo_trust_gate?: string
          display_name?: string
          preferences?: Record<string, unknown>
          privacy_settings?: Record<string, unknown>
          primary_concerns?: string
          community_focus?: string
          participation_style?: string
          demographics?: Record<string, unknown>
          onboarding_completed?: boolean
          onboarding_data?: Record<string, unknown>
          location_data?: Record<string, unknown>
          primary_hashtags?: string[]
          followed_hashtags?: string[]
          hashtag_preferences?: Record<string, unknown>
          total_polls_created?: number
          total_votes_cast?: number
          total_engagement_score?: number
          trust_score?: number
          reputation_points?: number
          verification_status?: string
        }
      }
      polls: {
        Row: {
          id: string
          user_id: string
          title: string
          description?: string
          question: string
          options: Record<string, unknown>
          poll_type: string
          is_public: boolean
          is_active: boolean
          expires_at?: string
          created_at: string
          updated_at: string
          hashtags: string[]
          primary_hashtag?: string
          poll_settings: Record<string, unknown>
          allow_multiple_votes: boolean
          require_authentication: boolean
          show_results_before_voting: boolean
          total_views: number
          total_votes: number
          engagement_score: number
          trending_score: number
          is_trending: boolean
          is_featured: boolean
          is_verified: boolean
          last_modified_by?: string
          modification_reason?: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          description?: string
          question: string
          options: Record<string, unknown>
          poll_type: string
          is_public: boolean
          is_active: boolean
          expires_at?: string
          created_at: string
          updated_at: string
          hashtags: string[]
          primary_hashtag?: string
          poll_settings: Record<string, unknown>
          allow_multiple_votes: boolean
          require_authentication: boolean
          show_results_before_voting: boolean
          total_views: number
          total_votes: number
          engagement_score: number
          trending_score: number
          is_trending: boolean
          is_featured: boolean
          is_verified: boolean
          last_modified_by?: string
          modification_reason?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          question?: string
          options?: Record<string, unknown>
          poll_type?: string
          is_public?: boolean
          is_active?: boolean
          expires_at?: string
          created_at?: string
          updated_at?: string
          hashtags?: string[]
          primary_hashtag?: string
          poll_settings?: Record<string, unknown>
          allow_multiple_votes?: boolean
          require_authentication?: boolean
          show_results_before_voting?: boolean
          total_views?: number
          total_votes?: number
          engagement_score?: number
          trending_score?: number
          is_trending?: boolean
          is_featured?: boolean
          is_verified?: boolean
          last_modified_by?: string
          modification_reason?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          vote_choice: number
          created_at: string
          updated_at: string
          ip_address?: string
          user_agent?: string
          session_id?: string
          device_fingerprint?: string
          time_spent_seconds: number
          page_views: number
          engagement_actions: Record<string, unknown>
          trust_score_at_vote?: number
          vote_metadata: Record<string, unknown>
          analytics_data: Record<string, unknown>
          is_active: boolean
        }
        Insert: {
          id: string
          poll_id: string
          user_id: string
          vote_choice: number
          created_at: string
          updated_at: string
          ip_address?: string
          user_agent?: string
          session_id?: string
          device_fingerprint?: string
          time_spent_seconds: number
          page_views: number
          engagement_actions: Record<string, unknown>
          trust_score_at_vote?: number
          vote_metadata: Record<string, unknown>
          analytics_data: Record<string, unknown>
          is_active: boolean
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          vote_choice?: number
          created_at?: string
          updated_at?: string
          ip_address?: string
          user_agent?: string
          session_id?: string
          device_fingerprint?: string
          time_spent_seconds?: number
          page_views?: number
          engagement_actions?: Record<string, unknown>
          trust_score_at_vote?: number
          vote_metadata?: Record<string, unknown>
          analytics_data?: Record<string, unknown>
          is_active?: boolean
        }
      }
      feedback: {
        Row: {
          id: string
          user_id?: string
          feedback_type: string
          title: string
          description: string
          priority: string
          status: string
          created_at: string
          updated_at: string
          category?: string
          tags: string[]
          admin_response?: string
          admin_response_at?: string
          admin_user_id?: string
          upvotes: number
          downvotes: number
          views: number
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          feedback_type: string
          title: string
          description: string
          priority: string
          status: string
          created_at: string
          updated_at: string
          category?: string
          tags: string[]
          admin_response?: string
          admin_response_at?: string
          admin_user_id?: string
          upvotes: number
          downvotes: number
          views: number
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          feedback_type?: string
          title?: string
          description?: string
          priority?: string
          status?: string
          created_at?: string
          updated_at?: string
          category?: string
          tags?: string[]
          admin_response?: string
          admin_response_at?: string
          admin_user_id?: string
          upvotes?: number
          downvotes?: number
          views?: number
          metadata?: Record<string, unknown>
        }
      }
      hashtags: {
        Row: {
          id: string
          name: string
          display_name: string
          description?: string
          category: string
          usage_count: number
          follower_count: number
          is_trending: boolean
          trend_score: number
          created_at: string
          updated_at: string
          created_by?: string
          is_verified: boolean
          is_featured: boolean
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          display_name: string
          description?: string
          category: string
          usage_count: number
          follower_count: number
          is_trending: boolean
          trend_score: number
          created_at: string
          updated_at: string
          created_by?: string
          is_verified: boolean
          is_featured: boolean
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string
          category?: string
          usage_count?: number
          follower_count?: number
          is_trending?: boolean
          trend_score?: number
          created_at?: string
          updated_at?: string
          created_by?: string
          is_verified?: boolean
          is_featured?: boolean
          metadata?: Record<string, unknown>
        }
      }
      user_hashtags: {
        Row: {
          id: string
          user_id: string
          hashtag_id: string
          followed_at: string
          is_primary: boolean
          usage_count: number
          last_used_at?: string
          preferences: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          hashtag_id: string
          followed_at: string
          is_primary: boolean
          usage_count: number
          last_used_at?: string
          preferences: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          hashtag_id?: string
          followed_at?: string
          is_primary?: boolean
          usage_count?: number
          last_used_at?: string
          preferences?: Record<string, unknown>
        }
      }
      hashtag_usage: {
        Row: {
          id: string
          hashtag_id: string
          user_id?: string
          content_id?: string
          content_type?: string
          created_at: string
          views: number
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          hashtag_id: string
          user_id?: string
          content_id?: string
          content_type?: string
          created_at: string
          views: number
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          hashtag_id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
          views?: number
          metadata?: Record<string, unknown>
        }
      }
      hashtag_engagement: {
        Row: {
          id: string
          hashtag_id: string
          user_id?: string
          engagement_type: string
          timestamp: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          hashtag_id: string
          user_id?: string
          engagement_type: string
          timestamp: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          hashtag_id?: string
          user_id?: string
          engagement_type?: string
          timestamp?: string
          metadata?: Record<string, unknown>
        }
      }
      hashtag_content: {
        Row: {
          id: string
          hashtag_id: string
          content_id: string
          content_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          hashtag_id: string
          content_id: string
          content_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          hashtag_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      hashtag_co_occurrence: {
        Row: {
          id: string
          hashtag1_id: string
          hashtag2_id: string
          co_occurrence_count: number
          last_seen: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          hashtag1_id: string
          hashtag2_id: string
          co_occurrence_count: number
          last_seen: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          hashtag1_id?: string
          hashtag2_id?: string
          co_occurrence_count?: number
          last_seen?: string
          metadata?: Record<string, unknown>
        }
      }
      hashtag_analytics: {
        Row: {
          id: string
          hashtag_id: string
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id: string
          hashtag_id: string
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          created_at: string
        }
        Update: {
          id?: string
          hashtag_id?: string
          metric_name?: string
          metric_value?: number
          period_start?: string
          period_end?: string
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id?: string
          session_id?: string
          properties: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id: string
          event_type: string
          user_id?: string
          session_id?: string
          properties: Record<string, unknown>
          created_at: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string
          session_id?: string
          properties?: Record<string, unknown>
          created_at?: string
        }
      }
      analytics_contributions: {
        Row: {
          id: string
          user_id: string
          contribution_type: string
          contribution_id: string
          points_awarded: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          contribution_type: string
          contribution_id: string
          points_awarded: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          contribution_type?: string
          contribution_id?: string
          points_awarded?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      analytics_demographics: {
        Row: {
          id: string
          poll_id?: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          participant_count: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id?: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          participant_count: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          participant_count?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      analytics_page_views: {
        Row: {
          id: string
          user_id?: string
          page_path: string
          page_title?: string
          referrer?: string
          user_agent?: string
          ip_address?: string
          session_id?: string
          created_at: string
          time_on_page: number
          scroll_depth: number
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          page_path: string
          page_title?: string
          referrer?: string
          user_agent?: string
          ip_address?: string
          session_id?: string
          created_at: string
          time_on_page: number
          scroll_depth: number
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          page_path?: string
          page_title?: string
          referrer?: string
          user_agent?: string
          ip_address?: string
          session_id?: string
          created_at?: string
          time_on_page?: number
          scroll_depth?: number
          metadata?: Record<string, unknown>
        }
      }
      analytics_sessions: {
        Row: {
          id: string
          user_id?: string
          session_id: string
          started_at: string
          ended_at?: string
          duration_seconds: number
          page_views: number
          events_count: number
          user_agent?: string
          ip_address?: string
          referrer?: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          session_id: string
          started_at: string
          ended_at?: string
          duration_seconds: number
          page_views: number
          events_count: number
          user_agent?: string
          ip_address?: string
          referrer?: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          started_at?: string
          ended_at?: string
          duration_seconds?: number
          page_views?: number
          events_count?: number
          user_agent?: string
          ip_address?: string
          referrer?: string
          metadata?: Record<string, unknown>
        }
      }
      analytics_user_engagement: {
        Row: {
          id: string
          user_id: string
          engagement_type: string
          engagement_value: number
          session_id?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          engagement_type: string
          engagement_value: number
          session_id?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          engagement_type?: string
          engagement_value?: number
          session_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          metric_name?: string
          metric_value?: number
          period_start?: string
          period_end?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      poll_analytics: {
        Row: {
          id: string
          poll_id: string
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id: string
          metric_name: string
          metric_value: number
          period_start: string
          period_end: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          metric_name?: string
          metric_value?: number
          period_start?: string
          period_end?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_feedback_analytics: {
        Row: {
          id: string
          feedback_id: string
          metric_name: string
          metric_value: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          feedback_id: string
          metric_name: string
          metric_value: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          feedback_id?: string
          metric_name?: string
          metric_value?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representatives_core: {
        Row: {
          id: string
          first_name: string
          last_name: string
          full_name: string
          title?: string
          party?: string
          state: string
          district?: string
          chamber?: string
          office_type?: string
          created_at: string
          updated_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          full_name: string
          title?: string
          party?: string
          state: string
          district?: string
          chamber?: string
          office_type?: string
          created_at: string
          updated_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          full_name?: string
          title?: string
          party?: string
          state?: string
          district?: string
          chamber?: string
          office_type?: string
          created_at?: string
          updated_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_contacts_optimal: {
        Row: {
          id: string
          representative_id: string
          contact_type: string
          contact_value: string
          is_primary: boolean
          is_verified: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          contact_type: string
          contact_value: string
          is_primary: boolean
          is_verified: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          contact_type?: string
          contact_value?: string
          is_primary?: boolean
          is_verified?: boolean
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_offices_optimal: {
        Row: {
          id: string
          representative_id: string
          office_type: string
          address_line1?: string
          address_line2?: string
          city?: string
          state?: string
          zip_code?: string
          phone?: string
          fax?: string
          email?: string
          website?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          office_type: string
          address_line1?: string
          address_line2?: string
          city?: string
          state?: string
          zip_code?: string
          phone?: string
          fax?: string
          email?: string
          website?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          office_type?: string
          address_line1?: string
          address_line2?: string
          city?: string
          state?: string
          zip_code?: string
          phone?: string
          fax?: string
          email?: string
          website?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_photos_optimal: {
        Row: {
          id: string
          representative_id: string
          photo_url: string
          photo_type: string
          is_primary: boolean
          quality_score: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          photo_url: string
          photo_type: string
          is_primary: boolean
          quality_score: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          photo_url?: string
          photo_type?: string
          is_primary?: boolean
          quality_score?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_roles_optimal: {
        Row: {
          id: string
          representative_id: string
          role_type: string
          role_title?: string
          committee?: string
          subcommittee?: string
          start_date?: string
          end_date?: string
          is_current: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          role_type: string
          role_title?: string
          committee?: string
          subcommittee?: string
          start_date?: string
          end_date?: string
          is_current: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          role_type?: string
          role_title?: string
          committee?: string
          subcommittee?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      candidates: {
        Row: {
          id: string
          first_name: string
          last_name: string
          full_name: string
          party?: string
          office?: string
          state?: string
          district?: string
          election_year?: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          full_name: string
          party?: string
          office?: string
          state?: string
          district?: string
          election_year?: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          full_name?: string
          party?: string
          office?: string
          state?: string
          district?: string
          election_year?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      civic_jurisdictions: {
        Row: {
          id: string
          name: string
          jurisdiction_type: string
          state?: string
          county?: string
          city?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          jurisdiction_type: string
          state?: string
          county?: string
          city?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          jurisdiction_type?: string
          state?: string
          county?: string
          city?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      elections: {
        Row: {
          id: string
          election_name: string
          election_date: string
          election_type: string
          state?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          election_name: string
          election_date: string
          election_type: string
          state?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          election_name?: string
          election_date?: string
          election_type?: string
          state?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      state_districts: {
        Row: {
          id: string
          state: string
          district_number: string
          district_name?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          state: string
          district_number: string
          district_name?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          state?: string
          district_number?: string
          district_name?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      privacy_consent_records: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          consent_given: boolean
          consent_version: string
          consent_timestamp: string
          ip_address?: string
          user_agent?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          consent_type: string
          consent_given: boolean
          consent_version: string
          consent_timestamp: string
          ip_address?: string
          user_agent?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: string
          consent_given?: boolean
          consent_version?: string
          consent_timestamp?: string
          ip_address?: string
          user_agent?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      privacy_data_requests: {
        Row: {
          id: string
          user_id: string
          request_type: string
          request_status: string
          request_description?: string
          created_at: string
          completed_at?: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          request_type: string
          request_status: string
          request_description?: string
          created_at: string
          completed_at?: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          request_status?: string
          request_description?: string
          created_at?: string
          completed_at?: string
          metadata?: Record<string, unknown>
        }
      }
      privacy_audit_logs: {
        Row: {
          id: string
          user_id?: string
          action_type: string
          resource_type: string
          resource_id?: string
          action_timestamp: string
          ip_address?: string
          user_agent?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          action_type: string
          resource_type: string
          resource_id?: string
          action_timestamp: string
          ip_address?: string
          user_agent?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          resource_type?: string
          resource_id?: string
          action_timestamp?: string
          ip_address?: string
          user_agent?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_consent: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          consent_given: boolean
          consent_version: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          consent_type: string
          consent_given: boolean
          consent_version: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: string
          consent_given?: boolean
          consent_version?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      private_user_data: {
        Row: {
          id: string
          user_id: string
          data_type: string
          encrypted_data: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          data_type: string
          encrypted_data: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          data_type?: string
          encrypted_data?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_profiles_encrypted: {
        Row: {
          id: string
          user_id: string
          encrypted_profile_data: string
          encryption_key_id?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          encrypted_profile_data: string
          encryption_key_id?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_profile_data?: string
          encryption_key_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_quality_audit: {
        Row: {
          id: string
          table_name: string
          audit_type: string
          audit_timestamp: string
          issues_found: number
          issues_resolved: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          audit_type: string
          audit_timestamp: string
          issues_found: number
          issues_resolved: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          audit_type?: string
          audit_timestamp?: string
          issues_found?: number
          issues_resolved?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_quality_checks: {
        Row: {
          id: string
          check_name: string
          table_name: string
          check_type: string
          check_query: string
          severity: string
          is_active: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          check_name: string
          table_name: string
          check_type: string
          check_query: string
          severity: string
          is_active: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          check_name?: string
          table_name?: string
          check_type?: string
          check_query?: string
          severity?: string
          is_active?: boolean
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_quality_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          table_name?: string
          calculated_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          metric_name: string
          metric_value: number
          table_name?: string
          calculated_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          table_name?: string
          calculated_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_test_results: {
        Row: {
          id: string
          test_name: string
          test_status: string
          test_message?: string
          execution_time_seconds?: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          test_name: string
          test_status: string
          test_message?: string
          execution_time_seconds?: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          test_name?: string
          test_status?: string
          test_message?: string
          execution_time_seconds?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_freshness_status: {
        Row: {
          id: string
          table_name: string
          freshness_status: string
          last_updated?: string
          freshness_threshold_hours?: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          freshness_status: string
          last_updated?: string
          freshness_threshold_hours?: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          freshness_status?: string
          last_updated?: string
          freshness_threshold_hours?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      webauthn_credentials: {
        Row: {
          id: string
          user_id: string
          credential_id: string
          public_key: string
          counter: number
          created_at: string
          last_used_at?: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          credential_id: string
          public_key: string
          counter: number
          created_at: string
          last_used_at?: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          credential_id?: string
          public_key?: string
          counter?: number
          created_at?: string
          last_used_at?: string
          metadata?: Record<string, unknown>
        }
      }
      webauthn_challenges: {
        Row: {
          id: string
          user_id: string
          challenge: string
          expires_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          challenge: string
          expires_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          challenge?: string
          expires_at?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      security_audit_log: {
        Row: {
          id: string
          user_id?: string
          action_type: string
          resource_type: string
          action_timestamp: string
          ip_address?: string
          user_agent?: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          action_type: string
          resource_type: string
          action_timestamp: string
          ip_address?: string
          user_agent?: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          resource_type?: string
          action_timestamp?: string
          ip_address?: string
          user_agent?: string
          metadata?: Record<string, unknown>
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id?: string
          action_type: string
          resource_type: string
          resource_id?: string
          action_timestamp: string
          ip_address?: string
          user_agent?: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          action_type: string
          resource_type: string
          resource_id?: string
          action_timestamp: string
          ip_address?: string
          user_agent?: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          resource_type?: string
          resource_id?: string
          action_timestamp?: string
          ip_address?: string
          user_agent?: string
          metadata?: Record<string, unknown>
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id?: string
          endpoint: string
          requests_count: number
          window_start: string
          window_end: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id?: string
          endpoint: string
          requests_count: number
          window_start: string
          window_end: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          requests_count?: number
          window_start?: string
          window_end?: string
          metadata?: Record<string, unknown>
        }
      }
      user_civics_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_topics: string[]
          preferred_hashtags: string[]
          notification_frequency: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          preferred_topics: string[]
          preferred_hashtags: string[]
          notification_frequency: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          preferred_topics?: string[]
          preferred_hashtags?: string[]
          notification_frequency?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_notification_preferences: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          is_enabled: boolean
          frequency: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          notification_type: string
          is_enabled: boolean
          frequency: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          is_enabled?: boolean
          frequency?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_location_resolutions: {
        Row: {
          id: string
          user_id: string
          ip_address?: string
          resolved_location: Record<string, unknown>
          resolution_method?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          ip_address?: string
          resolved_location: Record<string, unknown>
          resolution_method?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          ip_address?: string
          resolved_location?: Record<string, unknown>
          resolution_method?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      user_privacy_analytics: {
        Row: {
          id: string
          user_id: string
          privacy_event_type: string
          privacy_event_value: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          privacy_event_type: string
          privacy_event_value: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          privacy_event_type?: string
          privacy_event_value?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      site_messages: {
        Row: {
          id: string
          message_type: string
          title: string
          content: string
          is_active: boolean
          priority: string
          created_at: string
          expires_at?: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          message_type: string
          title: string
          content: string
          is_active: boolean
          priority: string
          created_at: string
          expires_at?: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          message_type?: string
          title?: string
          content?: string
          is_active?: boolean
          priority?: string
          created_at?: string
          expires_at?: string
          metadata?: Record<string, unknown>
        }
      }
      trending_topics: {
        Row: {
          id: string
          topic_name: string
          topic_type: string
          trend_score: number
          engagement_count: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          topic_name: string
          topic_type: string
          trend_score: number
          engagement_count: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          topic_name?: string
          topic_type?: string
          trend_score?: number
          engagement_count?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      generated_polls: {
        Row: {
          id: string
          poll_id?: string
          generation_method: string
          generation_prompt?: string
          generation_parameters: Record<string, unknown>
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id?: string
          generation_method: string
          generation_prompt?: string
          generation_parameters: Record<string, unknown>
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          generation_method?: string
          generation_prompt?: string
          generation_parameters?: Record<string, unknown>
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      system_configuration: {
        Row: {
          id: string
          config_key: string
          config_value: string
          config_type: string
          is_active: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          config_key: string
          config_value: string
          config_type: string
          is_active: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: string
          config_type?: string
          is_active?: boolean
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      error_logs: {
        Row: {
          id: string
          error_type: string
          error_message: string
          error_stack?: string
          user_id?: string
          session_id?: string
          request_id?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          error_type: string
          error_message: string
          error_stack?: string
          user_id?: string
          session_id?: string
          request_id?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          error_type?: string
          error_message?: string
          error_stack?: string
          user_id?: string
          session_id?: string
          request_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      migration_log: {
        Row: {
          id: string
          migration_name: string
          migration_version: string
          executed_at: string
          execution_time_seconds?: number
          status: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          migration_name: string
          migration_version: string
          executed_at: string
          execution_time_seconds?: number
          status: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          migration_name?: string
          migration_version?: string
          executed_at?: string
          execution_time_seconds?: number
          status?: string
          metadata?: Record<string, unknown>
        }
      }
      admin_activity_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          details: Record<string, unknown>
          ip_address: string
          user_agent: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id: string
          admin_id: string
          action: string
          details: Record<string, unknown>
          ip_address: string
          user_agent: string
          timestamp: string
          created_at: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          details?: Record<string, unknown>
          ip_address?: string
          user_agent?: string
          timestamp?: string
          created_at?: string
        }
      }
      trust_tier_analytics: {
        Row: {
          id: string
          user_id: string
          poll_id: string
          trust_tier: string
          age_group?: string
          geographic_region?: string
          education_level?: string
          income_bracket?: string
          political_affiliation?: string
          voting_history_count: number
          biometric_verified: boolean
          phone_verified: boolean
          identity_verified: boolean
          verification_methods: string[]
          data_quality_score: number
          confidence_level: number
          last_activity: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          poll_id: string
          trust_tier: string
          age_group?: string
          geographic_region?: string
          education_level?: string
          income_bracket?: string
          political_affiliation?: string
          voting_history_count: number
          biometric_verified: boolean
          phone_verified: boolean
          identity_verified: boolean
          verification_methods: string[]
          data_quality_score: number
          confidence_level: number
          last_activity: string
          created_at: string
        }
        Update: {
          id?: string
          user_id?: string
          poll_id?: string
          trust_tier?: string
          age_group?: string
          geographic_region?: string
          education_level?: string
          income_bracket?: string
          political_affiliation?: string
          voting_history_count?: number
          biometric_verified?: boolean
          phone_verified?: boolean
          identity_verified?: boolean
          verification_methods?: string[]
          data_quality_score?: number
          confidence_level?: number
          last_activity?: string
          created_at?: string
        }
      }
      hashtag_flags: {
        Row: {
          id: string
          hashtag_id: string
          user_id?: string
          flag_type: string
          reason: string
          status: string
          created_at: string
          resolved_at?: string
          resolved_by?: string
        }
        Insert: {
          id: string
          hashtag_id: string
          user_id?: string
          flag_type: string
          reason: string
          status: string
          created_at: string
          resolved_at?: string
          resolved_by?: string
        }
        Update: {
          id?: string
          hashtag_id?: string
          user_id?: string
          flag_type?: string
          reason?: string
          status?: string
          created_at?: string
          resolved_at?: string
          resolved_by?: string
        }
      }
      hashtag_moderation: {
        Row: {
          id: string
          hashtag_id: string
          status: string
          moderation_reason?: string
          moderated_by: string
          moderated_at: string
          human_review_required: boolean
          created_at: string
        }
        Insert: {
          id: string
          hashtag_id: string
          status: string
          moderation_reason?: string
          moderated_by: string
          moderated_at: string
          human_review_required: boolean
          created_at: string
        }
        Update: {
          id?: string
          hashtag_id?: string
          status?: string
          moderation_reason?: string
          moderated_by?: string
          moderated_at?: string
          human_review_required?: boolean
          created_at?: string
        }
      }
      user_hashtag_follows: {
        Row: {
          id: string
          user_id: string
          hashtag: string
          is_following: boolean
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          hashtag: string
          is_following: boolean
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Update: {
          id?: string
          user_id?: string
          hashtag?: string
          is_following?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_engagement_summary: {
        Row: {
          id: string
          stable_user_id: string
          user_hash: string
          total_polls_participated: number
          total_votes_cast: number
          average_engagement_score: number
          current_trust_tier: string
          trust_tier_history: Record<string, unknown>
          trust_tier_upgrade_date?: string
          created_at: string
        }
        Insert: {
          id: string
          stable_user_id: string
          user_hash: string
          total_polls_participated: number
          total_votes_cast: number
          average_engagement_score: number
          current_trust_tier: string
          trust_tier_history: Record<string, unknown>
          trust_tier_upgrade_date?: string
          created_at: string
        }
        Update: {
          id?: string
          stable_user_id?: string
          user_hash?: string
          total_polls_participated?: number
          total_votes_cast?: number
          average_engagement_score?: number
          current_trust_tier?: string
          trust_tier_history?: Record<string, unknown>
          trust_tier_upgrade_date?: string
          created_at?: string
        }
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          label: string
          weight: number
          order: number
          created_at: string
        }
        Insert: {
          id: string
          poll_id: string
          label: string
          weight: number
          order: number
          created_at: string
        }
        Update: {
          id?: string
          poll_id?: string
          label?: string
          weight?: number
          order?: number
          created_at?: string
        }
      }
      bias_detection_logs: {
        Row: {
          id: string
          poll_id: string
          bias_type: string
          confidence_score: number
          detected_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id: string
          bias_type: string
          confidence_score: number
          detected_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          bias_type?: string
          confidence_score?: number
          detected_at?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      biometric_auth_logs: {
        Row: {
          id: string
          user_id: string
          auth_method: string
          success: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          auth_method: string
          success: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          auth_method?: string
          success?: boolean
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      biometric_trust_scores: {
        Row: {
          id: string
          user_id: string
          score: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          score: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      breaking_news: {
        Row: {
          id: string
          title: string
          content: string
          source: string
          published_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          title: string
          content: string
          source: string
          published_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          title?: string
          content?: string
          source?: string
          published_at?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      campaign_finance: {
        Row: {
          id: string
          candidate_id: string
          amount: number
          source: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          candidate_id: string
          amount: number
          source: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          candidate_id?: string
          amount?: number
          source?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      candidate_jurisdictions: {
        Row: {
          id: string
          candidate_id: string
          jurisdiction_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          candidate_id: string
          jurisdiction_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          candidate_id?: string
          jurisdiction_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      civics_feed_items: {
        Row: {
          id: string
          title: string
          content: string
          source: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          title: string
          content: string
          source: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          title?: string
          content?: string
          source?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      contributions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          amount: number
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_checksums: {
        Row: {
          id: string
          table_name: string
          checksum: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          checksum: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          checksum?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_licenses: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_lineage: {
        Row: {
          id: string
          source_table: string
          target_table: string
          transformation: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          source_table: string
          target_table: string
          transformation: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          source_table?: string
          target_table?: string
          transformation?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_quality_summary: {
        Row: {
          id: string
          table_name: string
          quality_score: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          quality_score: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          quality_score?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_sources: {
        Row: {
          id: string
          name: string
          type: string
          url: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          url: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          url?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      data_transformations: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_freshness_sla: {
        Row: {
          id: string
          table_name: string
          sla_hours: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          sla_hours: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          sla_hours?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_test_config: {
        Row: {
          id: string
          test_name: string
          config: Record<string, unknown>
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          test_name: string
          config: Record<string, unknown>
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          test_name?: string
          config?: Record<string, unknown>
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_test_execution_history: {
        Row: {
          id: string
          test_name: string
          executed_at: string
          status: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          test_name: string
          executed_at: string
          status: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          test_name?: string
          executed_at?: string
          status?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_test_execution_log: {
        Row: {
          id: string
          test_name: string
          execution_time: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          test_name: string
          execution_time: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          test_name?: string
          execution_time?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      dbt_test_results_summary: {
        Row: {
          id: string
          total_tests: number
          passed_tests: number
          failed_tests: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          total_tests: number
          passed_tests: number
          failed_tests: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          total_tests?: number
          passed_tests?: number
          failed_tests?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      demographic_analytics: {
        Row: {
          id: string
          poll_id: string
          age_bucket: string
          region_bucket: string
          education_bucket: string
          participant_count: number
          average_choice: number
          choice_variance: number
          first_contribution: string
          last_contribution: string
        }
        Insert: {
          id: string
          poll_id: string
          age_bucket: string
          region_bucket: string
          education_bucket: string
          participant_count: number
          average_choice: number
          choice_variance: number
          first_contribution: string
          last_contribution: string
        }
        Update: {
          id?: string
          poll_id?: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          participant_count?: number
          average_choice?: number
          choice_variance?: number
          first_contribution?: string
          last_contribution?: string
        }
      }
      fact_check_sources: {
        Row: {
          id: string
          name: string
          url: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          url: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          url?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_candidate_committee: {
        Row: {
          id: string
          candidate_id: string
          committee_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          candidate_id: string
          committee_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          candidate_id?: string
          committee_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_candidates: {
        Row: {
          id: string
          name: string
          party?: string
          state?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          party?: string
          state?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          party?: string
          state?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_candidates_v2: {
        Row: {
          id: string
          name: string
          party?: string
          state?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          party?: string
          state?: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          party?: string
          state?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_committees: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_committees_v2: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_contributions: {
        Row: {
          id: string
          amount: number
          contributor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          amount: number
          contributor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          amount?: number
          contributor?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_cycles: {
        Row: {
          id: string
          cycle: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          cycle: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          cycle?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_disbursements: {
        Row: {
          id: string
          amount: number
          recipient: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          amount: number
          recipient: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          amount?: number
          recipient?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_filings_v2: {
        Row: {
          id: string
          filing_id: string
          filing_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          filing_id: string
          filing_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          filing_id?: string
          filing_type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_independent_expenditures: {
        Row: {
          id: string
          amount: number
          spender: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          amount: number
          spender: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          amount?: number
          spender?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      fec_ingest_cursors: {
        Row: {
          id: string
          table_name: string
          last_cursor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          last_cursor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          last_cursor?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      hashtag_performance_summary: {
        Row: {
          id: string
          hashtag_id: string
          hashtag_name: string
          total_usage: number
          average_metric: number
          last_activity: string
        }
        Insert: {
          id: string
          hashtag_id: string
          hashtag_name: string
          total_usage: number
          average_metric: number
          last_activity: string
        }
        Update: {
          id?: string
          hashtag_id?: string
          hashtag_name?: string
          total_usage?: number
          average_metric?: number
          last_activity?: string
        }
      }
      id_crosswalk: {
        Row: {
          id: string
          source_id: string
          target_id: string
          source_type: string
          target_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          source_id: string
          target_id: string
          source_type: string
          target_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          source_id?: string
          target_id?: string
          source_type?: string
          target_type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      idempotency_keys: {
        Row: {
          id: string
          key: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          key: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          key?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      independence_score_methodology: {
        Row: {
          id: string
          methodology: string
          version: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          methodology: string
          version: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          methodology?: string
          version?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      ingest_cursors: {
        Row: {
          id: string
          table_name: string
          last_cursor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          last_cursor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          last_cursor?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      ingestion_cursors: {
        Row: {
          id: string
          table_name: string
          last_cursor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          last_cursor: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          last_cursor?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      ingestion_logs: {
        Row: {
          id: string
          table_name: string
          status: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          status: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          status?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdiction_aliases: {
        Row: {
          id: string
          jurisdiction_id: string
          alias: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          jurisdiction_id: string
          alias: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          jurisdiction_id?: string
          alias?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdiction_geometries: {
        Row: {
          id: string
          jurisdiction_id: string
          geometry: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          jurisdiction_id: string
          geometry: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          jurisdiction_id?: string
          geometry?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdiction_tiles: {
        Row: {
          id: string
          jurisdiction_id: string
          tile_data: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          jurisdiction_id: string
          tile_data: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          jurisdiction_id?: string
          tile_data?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdictions_optimal: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      latlon_to_ocd: {
        Row: {
          id: string
          latitude: number
          longitude: number
          ocd_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          latitude: number
          longitude: number
          ocd_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          latitude?: number
          longitude?: number
          ocd_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      location_consent_audit: {
        Row: {
          id: string
          user_id: string
          consent_given: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          consent_given: boolean
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          consent_given?: boolean
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      media_polls: {
        Row: {
          id: string
          poll_id: string
          media_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id: string
          media_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          media_type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      media_sources: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      news_fetch_logs: {
        Row: {
          id: string
          source: string
          status: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          source: string
          status: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          source?: string
          status?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      news_sources: {
        Row: {
          id: string
          name: string
          url: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          url: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          name?: string
          url?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      notification_history: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          sent_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          notification_type: string
          sent_at: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          sent_at?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      poll_contexts: {
        Row: {
          id: string
          poll_id: string
          context_type: string
          context_data: Record<string, unknown>
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id: string
          context_type: string
          context_data: Record<string, unknown>
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          context_type?: string
          context_data?: Record<string, unknown>
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      poll_generation_logs: {
        Row: {
          id: string
          poll_id: string
          generation_method: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          poll_id: string
          generation_method: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          poll_id?: string
          generation_method?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      privacy_logs: {
        Row: {
          id: string
          action: string
          user_id_hash: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          action: string
          user_id_hash: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          action?: string
          user_id_hash?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          endpoint: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      quality_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          metric_name: string
          metric_value: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      redistricting_history: {
        Row: {
          id: string
          district_id: string
          year: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          district_id: string
          year: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          district_id?: string
          year?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_activity_enhanced: {
        Row: {
          id: string
          representative_id: string
          activity_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          activity_type: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          activity_type?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_campaign_finance: {
        Row: {
          id: string
          representative_id: string
          amount: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          amount: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          amount?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_committees: {
        Row: {
          id: string
          representative_id: string
          committee_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          committee_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          committee_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_leadership: {
        Row: {
          id: string
          representative_id: string
          leadership_role: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          leadership_role: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          leadership_role?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_social_media_optimal: {
        Row: {
          id: string
          representative_id: string
          platform: string
          handle: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          platform: string
          handle: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          platform?: string
          handle?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      representative_social_posts: {
        Row: {
          id: string
          representative_id: string
          platform: string
          content: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          representative_id: string
          platform: string
          content: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          representative_id?: string
          platform?: string
          content?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      staging_processing_summary: {
        Row: {
          id: string
          table_name: string
          processed_count: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          table_name: string
          processed_count: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          table_name?: string
          processed_count?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      voting_records: {
        Row: {
          id: string
          user_id: string
          poll_id: string
          vote_choice: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          user_id: string
          poll_id: string
          vote_choice: number
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          poll_id?: string
          vote_choice?: number
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      zip_to_ocd: {
        Row: {
          id: string
          zip_code: string
          ocd_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id: string
          zip_code: string
          ocd_id: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Update: {
          id?: string
          zip_code?: string
          ocd_id?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
    }
    Views: {
      demographic_analytics: {
        Row: {
          poll_id: string
          age_bucket: string
          region_bucket: string
          education_bucket: string
          participant_count: number
          average_choice: number
          choice_variance: number
          first_contribution: string
          last_contribution: string
        }
      }
      hashtag_performance_summary: {
        Row: {
          hashtag_id: string
          hashtag_name: string
          total_usage: number
          average_metric: number
          last_activity: string
        }
      }
      user_engagement_summary: {
        Row: {
          user_id: string
          username: string
          polls_created: number
          votes_cast: number
          engagement_score: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
