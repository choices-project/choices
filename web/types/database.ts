export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_contributions: {
        Row: {
          age_bucket: string | null
          created_at: string | null
          education_bucket: string | null
          id: string
          participation_time: string | null
          poll_id: string
          region_bucket: string | null
          user_id: string | null
          vote_choice: number | null
        }
        Insert: {
          age_bucket?: string | null
          created_at?: string | null
          education_bucket?: string | null
          id?: string
          participation_time?: string | null
          poll_id: string
          region_bucket?: string | null
          user_id?: string | null
          vote_choice?: number | null
        }
        Update: {
          age_bucket?: string | null
          created_at?: string | null
          education_bucket?: string | null
          id?: string
          participation_time?: string | null
          poll_id?: string
          region_bucket?: string | null
          user_id?: string | null
          vote_choice?: number | null
        }
        Relationships: []
      }
      analytics_demographics: {
        Row: {
          age_range: string | null
          created_at: string | null
          education_level: string | null
          id: string
          location: string | null
          political_affiliation: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string | null
          education_level?: string | null
          id?: string
          location?: string | null
          political_affiliation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string | null
          education_level?: string | null
          id?: string
          location?: string | null
          political_affiliation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          metadata: Json | null
          poll_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
          poll_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          metadata?: Json | null
          poll_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: unknown | null
          os: string | null
          page_category: string | null
          page_title: string | null
          page_url: string
          referrer: string | null
          region: string | null
          scroll_depth_percentage: number | null
          session_id: string
          time_on_page_seconds: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_category?: string | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          region?: string | null
          scroll_depth_percentage?: number | null
          session_id: string
          time_on_page_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          os?: string | null
          page_category?: string | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          region?: string | null
          scroll_depth_percentage?: number | null
          session_id?: string
          time_on_page_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          events_count: number | null
          exit_page: string | null
          id: string
          ip_address: unknown | null
          is_bounce: boolean | null
          landing_page: string | null
          os: string | null
          page_views: number | null
          referrer: string | null
          region: string | null
          session_id: string
          started_at: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown | null
          is_bounce?: boolean | null
          landing_page?: string | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          region?: string | null
          session_id: string
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown | null
          is_bounce?: boolean | null
          landing_page?: string | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          region?: string | null
          session_id?: string
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_user_engagement: {
        Row: {
          bounce_rate: number | null
          created_at: string | null
          engagement_date: string
          engagement_score: number | null
          id: string
          last_activity: string | null
          pages_per_session: number | null
          return_visitor: boolean | null
          time_on_site_seconds: number | null
          total_events: number | null
          total_page_views: number | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bounce_rate?: number | null
          created_at?: string | null
          engagement_date: string
          engagement_score?: number | null
          id?: string
          last_activity?: string | null
          pages_per_session?: number | null
          return_visitor?: boolean | null
          time_on_site_seconds?: number | null
          total_events?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bounce_rate?: number | null
          created_at?: string | null
          engagement_date?: string
          engagement_score?: number | null
          id?: string
          last_activity?: string | null
          pages_per_session?: number | null
          return_visitor?: boolean | null
          time_on_site_seconds?: number | null
          total_events?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bias_detection_logs: {
        Row: {
          bias_score: number | null
          bias_type: string | null
          confidence_score: number | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          details: Json | null
          detection_method: string | null
          id: string
        }
        Insert: {
          bias_score?: number | null
          bias_type?: string | null
          confidence_score?: number | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          details?: Json | null
          detection_method?: string | null
          id?: string
        }
        Update: {
          bias_score?: number | null
          bias_type?: string | null
          confidence_score?: number | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          details?: Json | null
          detection_method?: string | null
          id?: string
        }
        Relationships: []
      }
      biometric_auth_logs: {
        Row: {
          authentication_result: boolean
          created_at: string | null
          credential_id: string | null
          device_info: Json | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          location_info: Json | null
          risk_score: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          authentication_result: boolean
          created_at?: string | null
          credential_id?: string | null
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          location_info?: Json | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          authentication_result?: boolean
          created_at?: string | null
          credential_id?: string | null
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          location_info?: Json | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      biometric_trust_scores: {
        Row: {
          base_score: number | null
          behavior_score: number | null
          created_at: string | null
          device_consistency_score: number | null
          id: string
          last_calculated_at: string | null
          location_score: number | null
          overall_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          base_score?: number | null
          behavior_score?: number | null
          created_at?: string | null
          device_consistency_score?: number | null
          id?: string
          last_calculated_at?: string | null
          location_score?: number | null
          overall_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          base_score?: number | null
          behavior_score?: number | null
          created_at?: string | null
          device_consistency_score?: number | null
          id?: string
          last_calculated_at?: string | null
          location_score?: number | null
          overall_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      breaking_news: {
        Row: {
          category: string[] | null
          created_at: string | null
          entities: Json | null
          full_story: string | null
          headline: string
          id: string
          metadata: Json | null
          sentiment: string | null
          source_name: string
          source_reliability: number | null
          source_url: string | null
          summary: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          category?: string[] | null
          created_at?: string | null
          entities?: Json | null
          full_story?: string | null
          headline: string
          id?: string
          metadata?: Json | null
          sentiment?: string | null
          source_name: string
          source_reliability?: number | null
          source_url?: string | null
          summary: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          category?: string[] | null
          created_at?: string | null
          entities?: Json | null
          full_story?: string | null
          headline?: string
          id?: string
          metadata?: Json | null
          sentiment?: string | null
          source_name?: string
          source_reliability?: number | null
          source_url?: string | null
          summary?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      campaign_finance: {
        Row: {
          candidate_id: string | null
          cash_on_hand: number | null
          created_at: string | null
          cycle: number | null
          debt: number | null
          id: string
          individual_contributions: number | null
          last_updated: string | null
          pac_contributions: number | null
          party_contributions: number | null
          self_financing: number | null
          total_disbursements: number | null
          total_receipts: number | null
        }
        Insert: {
          candidate_id?: string | null
          cash_on_hand?: number | null
          created_at?: string | null
          cycle?: number | null
          debt?: number | null
          id?: string
          individual_contributions?: number | null
          last_updated?: string | null
          pac_contributions?: number | null
          party_contributions?: number | null
          self_financing?: number | null
          total_disbursements?: number | null
          total_receipts?: number | null
        }
        Update: {
          candidate_id?: string | null
          cash_on_hand?: number | null
          created_at?: string | null
          cycle?: number | null
          debt?: number | null
          id?: string
          individual_contributions?: number | null
          last_updated?: string | null
          pac_contributions?: number | null
          party_contributions?: number | null
          self_financing?: number | null
          total_disbursements?: number | null
          total_receipts?: number | null
        }
        Relationships: []
      }
      candidate_jurisdictions: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          district: string | null
          id: string
          jurisdiction_id: string | null
          office: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          jurisdiction_id?: string | null
          office?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          jurisdiction_id?: string | null
          office?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          canonical_id: string
          chamber: string | null
          created_at: string | null
          data_sources: string[]
          district: string | null
          email: string | null
          first_name: string | null
          id: string
          jurisdiction_ids: string[] | null
          last_name: string | null
          last_updated: string | null
          level: string
          license_key: string | null
          name: string
          ocd_division_id: string | null
          office: string
          party: string | null
          phone: string | null
          photo_url: string | null
          provenance: Json | null
          quality_score: number | null
          social_media: Json | null
          state: string
          verification_date: string | null
          verification_method: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          canonical_id: string
          chamber?: string | null
          created_at?: string | null
          data_sources: string[]
          district?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          jurisdiction_ids?: string[] | null
          last_name?: string | null
          last_updated?: string | null
          level: string
          license_key?: string | null
          name: string
          ocd_division_id?: string | null
          office: string
          party?: string | null
          phone?: string | null
          photo_url?: string | null
          provenance?: Json | null
          quality_score?: number | null
          social_media?: Json | null
          state: string
          verification_date?: string | null
          verification_method?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          canonical_id?: string
          chamber?: string | null
          created_at?: string | null
          data_sources?: string[]
          district?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          jurisdiction_ids?: string[] | null
          last_name?: string | null
          last_updated?: string | null
          level?: string
          license_key?: string | null
          name?: string
          ocd_division_id?: string | null
          office?: string
          party?: string | null
          phone?: string | null
          photo_url?: string | null
          provenance?: Json | null
          quality_score?: number | null
          social_media?: Json | null
          state?: string
          verification_date?: string | null
          verification_method?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      civic_jurisdictions: {
        Row: {
          bounding_box: Json | null
          centroid_lat: number | null
          centroid_lon: number | null
          city_name: string | null
          country_code: string | null
          county_name: string | null
          geo_scope: string | null
          jurisdiction_type: string | null
          last_refreshed: string
          level: string
          metadata: Json
          name: string
          ocd_division_id: string
          parent_ocd_id: string | null
          population: number | null
          source: string
          state_code: string | null
        }
        Insert: {
          bounding_box?: Json | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          city_name?: string | null
          country_code?: string | null
          county_name?: string | null
          geo_scope?: string | null
          jurisdiction_type?: string | null
          last_refreshed?: string
          level: string
          metadata?: Json
          name: string
          ocd_division_id: string
          parent_ocd_id?: string | null
          population?: number | null
          source?: string
          state_code?: string | null
        }
        Update: {
          bounding_box?: Json | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          city_name?: string | null
          country_code?: string | null
          county_name?: string | null
          geo_scope?: string | null
          jurisdiction_type?: string | null
          last_refreshed?: string
          level?: string
          metadata?: Json
          name?: string
          ocd_division_id?: string
          parent_ocd_id?: string | null
          population?: number | null
          source?: string
          state_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_jurisdictions_parent_ocd_id_fkey"
            columns: ["parent_ocd_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          },
        ]
      }
      civics_feed_items: {
        Row: {
          content: string | null
          content_type: string | null
          created_at: string | null
          id: string
          published_at: string | null
          representative_id: number | null
          source_url: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          representative_id?: number | null
          source_url?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          representative_id?: number | null
          source_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          candidate_id: string | null
          committee_id: string | null
          contribution_date: string
          contribution_type: string | null
          contributor_city: string | null
          contributor_employer: string | null
          contributor_name_hash: string | null
          contributor_occupation: string | null
          contributor_state: string | null
          contributor_zip5: string | null
          created_at: string | null
          data_sources: string[]
          id: string
          industry: string | null
          last_updated: string | null
          license_key: string | null
          provenance: Json | null
          quality_score: number | null
          retention_until: string | null
          sector: string | null
        }
        Insert: {
          amount: number
          candidate_id?: string | null
          committee_id?: string | null
          contribution_date: string
          contribution_type?: string | null
          contributor_city?: string | null
          contributor_employer?: string | null
          contributor_name_hash?: string | null
          contributor_occupation?: string | null
          contributor_state?: string | null
          contributor_zip5?: string | null
          created_at?: string | null
          data_sources: string[]
          id?: string
          industry?: string | null
          last_updated?: string | null
          license_key?: string | null
          provenance?: Json | null
          quality_score?: number | null
          retention_until?: string | null
          sector?: string | null
        }
        Update: {
          amount?: number
          candidate_id?: string | null
          committee_id?: string | null
          contribution_date?: string
          contribution_type?: string | null
          contributor_city?: string | null
          contributor_employer?: string | null
          contributor_name_hash?: string | null
          contributor_occupation?: string | null
          contributor_state?: string | null
          contributor_zip5?: string | null
          created_at?: string | null
          data_sources?: string[]
          id?: string
          industry?: string | null
          last_updated?: string | null
          license_key?: string | null
          provenance?: Json | null
          quality_score?: number | null
          retention_until?: string | null
          sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      data_checksums: {
        Row: {
          calculated_at: string
          checksum_type: string
          checksum_value: string
          created_at: string | null
          data_snapshot: Json | null
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          calculated_at: string
          checksum_type: string
          checksum_value: string
          created_at?: string | null
          data_snapshot?: Json | null
          id?: string
          record_id: string
          table_name: string
        }
        Update: {
          calculated_at?: string
          checksum_type?: string
          checksum_value?: string
          created_at?: string | null
          data_snapshot?: Json | null
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      data_licenses: {
        Row: {
          attribution_text: string
          cache_ttl_seconds: number | null
          created_at: string | null
          display_requirements: string | null
          license_key: string
          source_name: string
          usage_restrictions: Json | null
        }
        Insert: {
          attribution_text: string
          cache_ttl_seconds?: number | null
          created_at?: string | null
          display_requirements?: string | null
          license_key: string
          source_name: string
          usage_restrictions?: Json | null
        }
        Update: {
          attribution_text?: string
          cache_ttl_seconds?: number | null
          created_at?: string | null
          display_requirements?: string | null
          license_key?: string
          source_name?: string
          usage_restrictions?: Json | null
        }
        Relationships: []
      }
      data_lineage: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          processing_completed_at: string | null
          processing_duration_ms: number | null
          processing_started_at: string
          retry_count: number | null
          source_data_hash: string | null
          source_record_id: string
          source_table: string
          success: boolean | null
          target_data_hash: string | null
          target_record_id: string
          target_table: string
          transformation_params: Json | null
          transformation_type: string
          transformation_version: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at: string
          retry_count?: number | null
          source_data_hash?: string | null
          source_record_id: string
          source_table: string
          success?: boolean | null
          target_data_hash?: string | null
          target_record_id: string
          target_table: string
          transformation_params?: Json | null
          transformation_type: string
          transformation_version: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string
          retry_count?: number | null
          source_data_hash?: string | null
          source_record_id?: string
          source_table?: string
          success?: boolean | null
          target_data_hash?: string | null
          target_record_id?: string
          target_table?: string
          transformation_params?: Json | null
          transformation_type?: string
          transformation_version?: string
        }
        Relationships: []
      }
      data_quality_audit: {
        Row: {
          accuracy_score: number | null
          completeness_score: number | null
          conflict_resolution: string | null
          consistency_score: number | null
          created_at: string | null
          id: string
          issues_found: string[] | null
          last_validation: string | null
          overall_score: number | null
          primary_source: string | null
          record_id: string
          resolved_issues: string[] | null
          secondary_sources: string[] | null
          table_name: string
          timeliness_score: number | null
          validation_method: string | null
        }
        Insert: {
          accuracy_score?: number | null
          completeness_score?: number | null
          conflict_resolution?: string | null
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          issues_found?: string[] | null
          last_validation?: string | null
          overall_score?: number | null
          primary_source?: string | null
          record_id: string
          resolved_issues?: string[] | null
          secondary_sources?: string[] | null
          table_name: string
          timeliness_score?: number | null
          validation_method?: string | null
        }
        Update: {
          accuracy_score?: number | null
          completeness_score?: number | null
          conflict_resolution?: string | null
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          issues_found?: string[] | null
          last_validation?: string | null
          overall_score?: number | null
          primary_source?: string | null
          record_id?: string
          resolved_issues?: string[] | null
          secondary_sources?: string[] | null
          table_name?: string
          timeliness_score?: number | null
          validation_method?: string | null
        }
        Relationships: []
      }
      data_quality_checks: {
        Row: {
          actual_result: string | null
          check_executed_at: string
          check_name: string
          check_params: Json | null
          check_type: string
          check_version: string
          created_at: string | null
          error_message: string | null
          expected_result: string | null
          id: string
          passed: boolean
          record_id: string | null
          severity: string | null
          suggested_fix: string | null
          table_name: string
        }
        Insert: {
          actual_result?: string | null
          check_executed_at: string
          check_name: string
          check_params?: Json | null
          check_type: string
          check_version: string
          created_at?: string | null
          error_message?: string | null
          expected_result?: string | null
          id?: string
          passed: boolean
          record_id?: string | null
          severity?: string | null
          suggested_fix?: string | null
          table_name: string
        }
        Update: {
          actual_result?: string | null
          check_executed_at?: string
          check_name?: string
          check_params?: Json | null
          check_type?: string
          check_version?: string
          created_at?: string | null
          error_message?: string | null
          expected_result?: string | null
          id?: string
          passed?: boolean
          record_id?: string | null
          severity?: string | null
          suggested_fix?: string | null
          table_name?: string
        }
        Relationships: []
      }
      data_quality_metrics: {
        Row: {
          created_at: string | null
          id: string
          last_checked: string | null
          metric_name: string
          metric_value: number | null
          status: string | null
          table_name: string
          threshold_value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_checked?: string | null
          metric_name: string
          metric_value?: number | null
          status?: string | null
          table_name: string
          threshold_value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_checked?: string | null
          metric_name?: string
          metric_value?: number | null
          status?: string | null
          table_name?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          created_at: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          name: string
          rate_limit: number | null
          reliability: number | null
          success_rate: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name: string
          rate_limit?: number | null
          reliability?: number | null
          success_rate?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name?: string
          rate_limit?: number | null
          reliability?: number | null
          success_rate?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      data_transformations: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_records_count: number | null
          id: string
          input_records_count: number | null
          output_records_count: number | null
          processing_completed_at: string | null
          processing_duration_ms: number | null
          processing_started_at: string
          retry_count: number | null
          source_system: string
          success: boolean | null
          target_system: string
          transformation_name: string
          transformation_params: Json | null
          transformation_sql: string | null
          transformation_version: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_records_count?: number | null
          id?: string
          input_records_count?: number | null
          output_records_count?: number | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at: string
          retry_count?: number | null
          source_system: string
          success?: boolean | null
          target_system: string
          transformation_name: string
          transformation_params?: Json | null
          transformation_sql?: string | null
          transformation_version: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_records_count?: number | null
          id?: string
          input_records_count?: number | null
          output_records_count?: number | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string
          retry_count?: number | null
          source_system?: string
          success?: boolean | null
          target_system?: string
          transformation_name?: string
          transformation_params?: Json | null
          transformation_sql?: string | null
          transformation_version?: string
        }
        Relationships: []
      }
      dbt_freshness_sla: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_check: string | null
          last_failure: string | null
          last_success: string | null
          max_age_hours: number
          table_name: string
          updated_at: string | null
          warning_threshold_hours: number | null
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_check?: string | null
          last_failure?: string | null
          last_success?: string | null
          max_age_hours: number
          table_name: string
          updated_at?: string | null
          warning_threshold_hours?: number | null
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_check?: string | null
          last_failure?: string | null
          last_success?: string | null
          max_age_hours?: number
          table_name?: string
          updated_at?: string | null
          warning_threshold_hours?: number | null
        }
        Relationships: []
      }
      dbt_test_config: {
        Row: {
          column_name: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          severity: string | null
          table_name: string
          test_config: Json | null
          test_name: string
          test_type: string
          updated_at: string | null
        }
        Insert: {
          column_name?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          severity?: string | null
          table_name: string
          test_config?: Json | null
          test_name: string
          test_type: string
          updated_at?: string | null
        }
        Update: {
          column_name?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          severity?: string | null
          table_name?: string
          test_config?: Json | null
          test_name?: string
          test_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dbt_test_execution_log: {
        Row: {
          executed_at: string | null
          execution_id: string
          execution_time_ms: number | null
          id: string
          message: string | null
          status: string
          test_name: string
        }
        Insert: {
          executed_at?: string | null
          execution_id: string
          execution_time_ms?: number | null
          id?: string
          message?: string | null
          status: string
          test_name: string
        }
        Update: {
          executed_at?: string | null
          execution_id?: string
          execution_time_ms?: number | null
          id?: string
          message?: string | null
          status?: string
          test_name?: string
        }
        Relationships: []
      }
      dbt_test_results: {
        Row: {
          column_name: string | null
          created_at: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          message: string | null
          rows_affected: number | null
          status: string
          table_name: string
          test_config: Json | null
          test_name: string
          test_type: string
        }
        Insert: {
          column_name?: string | null
          created_at?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          message?: string | null
          rows_affected?: number | null
          status: string
          table_name: string
          test_config?: Json | null
          test_name: string
          test_type: string
        }
        Update: {
          column_name?: string | null
          created_at?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          message?: string | null
          rows_affected?: number | null
          status?: string
          table_name?: string
          test_config?: Json | null
          test_name?: string
          test_type?: string
        }
        Relationships: []
      }
      elections: {
        Row: {
          candidates: Json | null
          created_at: string | null
          district: string | null
          election_date: string | null
          election_name: string | null
          election_type: string | null
          id: string
          results: Json | null
          state: string | null
        }
        Insert: {
          candidates?: Json | null
          created_at?: string | null
          district?: string | null
          election_date?: string | null
          election_name?: string | null
          election_type?: string | null
          id?: string
          results?: Json | null
          state?: string | null
        }
        Update: {
          candidates?: Json | null
          created_at?: string | null
          district?: string | null
          election_date?: string | null
          election_name?: string | null
          election_type?: string | null
          id?: string
          results?: Json | null
          state?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          category: string | null
          component: string | null
          context: Json | null
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          ip_address: unknown | null
          request_id: string | null
          session_id: string | null
          severity: string
          source: string | null
          stack_trace: string | null
          subcategory: string | null
          tags: string[] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          ip_address?: unknown | null
          request_id?: string | null
          session_id?: string | null
          severity?: string
          source?: string | null
          stack_trace?: string | null
          subcategory?: string | null
          tags?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          ip_address?: unknown | null
          request_id?: string | null
          session_id?: string | null
          severity?: string
          source?: string | null
          stack_trace?: string | null
          subcategory?: string | null
          tags?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fact_check_sources: {
        Row: {
          bias_score: number | null
          created_at: string | null
          id: string
          name: string
          reliability_score: number | null
          url: string | null
        }
        Insert: {
          bias_score?: number | null
          created_at?: string | null
          id?: string
          name: string
          reliability_score?: number | null
          url?: string | null
        }
        Update: {
          bias_score?: number | null
          created_at?: string | null
          id?: string
          name?: string
          reliability_score?: number | null
          url?: string | null
        }
        Relationships: []
      }
      fec_candidate_committee: {
        Row: {
          candidate_id: string | null
          committee_id: string | null
          created_at: string | null
          cycle: number | null
          id: string
        }
        Insert: {
          candidate_id?: string | null
          committee_id?: string | null
          created_at?: string | null
          cycle?: number | null
          id?: string
        }
        Update: {
          candidate_id?: string | null
          committee_id?: string | null
          created_at?: string | null
          cycle?: number | null
          id?: string
        }
        Relationships: []
      }
      fec_candidates: {
        Row: {
          created_at: string | null
          cycle: number | null
          district: string | null
          fec_id: string | null
          id: string
          name: string | null
          office: string | null
          party: string | null
          state: string | null
        }
        Insert: {
          created_at?: string | null
          cycle?: number | null
          district?: string | null
          fec_id?: string | null
          id?: string
          name?: string | null
          office?: string | null
          party?: string | null
          state?: string | null
        }
        Update: {
          created_at?: string | null
          cycle?: number | null
          district?: string | null
          fec_id?: string | null
          id?: string
          name?: string | null
          office?: string | null
          party?: string | null
          state?: string | null
        }
        Relationships: []
      }
      fec_candidates_v2: {
        Row: {
          active_through: number | null
          authorized_committees: string[] | null
          candidate_id: string
          candidate_inactive: string | null
          candidate_status: string | null
          cash_on_hand: number | null
          created_at: string | null
          data_source: string | null
          debt: number | null
          district: string | null
          election_districts: string[] | null
          election_years: number[] | null
          first_file_date: string | null
          id: string
          incumbent_challenge_status: string | null
          is_efiling: boolean | null
          is_processed: boolean | null
          last_f2_date: string | null
          last_file_date: string | null
          last_updated: string | null
          name: string
          office: string | null
          party: string | null
          principal_committees: string[] | null
          state: string | null
          total_disbursements: number | null
          total_receipts: number | null
          updated_at: string | null
        }
        Insert: {
          active_through?: number | null
          authorized_committees?: string[] | null
          candidate_id: string
          candidate_inactive?: string | null
          candidate_status?: string | null
          cash_on_hand?: number | null
          created_at?: string | null
          data_source?: string | null
          debt?: number | null
          district?: string | null
          election_districts?: string[] | null
          election_years?: number[] | null
          first_file_date?: string | null
          id?: string
          incumbent_challenge_status?: string | null
          is_efiling?: boolean | null
          is_processed?: boolean | null
          last_f2_date?: string | null
          last_file_date?: string | null
          last_updated?: string | null
          name: string
          office?: string | null
          party?: string | null
          principal_committees?: string[] | null
          state?: string | null
          total_disbursements?: number | null
          total_receipts?: number | null
          updated_at?: string | null
        }
        Update: {
          active_through?: number | null
          authorized_committees?: string[] | null
          candidate_id?: string
          candidate_inactive?: string | null
          candidate_status?: string | null
          cash_on_hand?: number | null
          created_at?: string | null
          data_source?: string | null
          debt?: number | null
          district?: string | null
          election_districts?: string[] | null
          election_years?: number[] | null
          first_file_date?: string | null
          id?: string
          incumbent_challenge_status?: string | null
          is_efiling?: boolean | null
          is_processed?: boolean | null
          last_f2_date?: string | null
          last_file_date?: string | null
          last_updated?: string | null
          name?: string
          office?: string | null
          party?: string | null
          principal_committees?: string[] | null
          state?: string | null
          total_disbursements?: number | null
          total_receipts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fec_committees: {
        Row: {
          committee_id: string | null
          committee_type: string | null
          created_at: string | null
          id: string
          name: string | null
          party: string | null
          state: string | null
        }
        Insert: {
          committee_id?: string | null
          committee_type?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          party?: string | null
          state?: string | null
        }
        Update: {
          committee_id?: string | null
          committee_type?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          party?: string | null
          state?: string | null
        }
        Relationships: []
      }
      fec_committees_v2: {
        Row: {
          candidate_district: string | null
          candidate_id: string | null
          candidate_incumbent_challenge_status: string | null
          candidate_name: string | null
          candidate_office: string | null
          candidate_party: string | null
          candidate_state: string | null
          candidate_status: string | null
          cash_on_hand: number | null
          city: string | null
          committee_designation: string | null
          committee_district: string | null
          committee_id: string
          committee_name: string
          committee_organization_type: string | null
          committee_party: string | null
          committee_state: string | null
          committee_type: string | null
          committee_type_full: string | null
          created_at: string | null
          custodian_city: string | null
          custodian_name: string | null
          custodian_state: string | null
          custodian_zip: string | null
          cycles: number[] | null
          data_source: string | null
          debt: number | null
          designation: string | null
          designation_full: string | null
          filing_frequency: string | null
          filing_frequency_full: string | null
          first_file_date: string | null
          id: string
          is_efiling: boolean | null
          is_processed: boolean | null
          last_f1_date: string | null
          last_file_date: string | null
          last_updated: string | null
          organization_type: string | null
          organization_type_full: string | null
          party_full: string | null
          state: string | null
          street_1: string | null
          street_2: string | null
          total_disbursements: number | null
          total_receipts: number | null
          treasurer_city: string | null
          treasurer_name: string | null
          treasurer_state: string | null
          treasurer_zip: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          candidate_district?: string | null
          candidate_id?: string | null
          candidate_incumbent_challenge_status?: string | null
          candidate_name?: string | null
          candidate_office?: string | null
          candidate_party?: string | null
          candidate_state?: string | null
          candidate_status?: string | null
          cash_on_hand?: number | null
          city?: string | null
          committee_designation?: string | null
          committee_district?: string | null
          committee_id: string
          committee_name: string
          committee_organization_type?: string | null
          committee_party?: string | null
          committee_state?: string | null
          committee_type?: string | null
          committee_type_full?: string | null
          created_at?: string | null
          custodian_city?: string | null
          custodian_name?: string | null
          custodian_state?: string | null
          custodian_zip?: string | null
          cycles?: number[] | null
          data_source?: string | null
          debt?: number | null
          designation?: string | null
          designation_full?: string | null
          filing_frequency?: string | null
          filing_frequency_full?: string | null
          first_file_date?: string | null
          id?: string
          is_efiling?: boolean | null
          is_processed?: boolean | null
          last_f1_date?: string | null
          last_file_date?: string | null
          last_updated?: string | null
          organization_type?: string | null
          organization_type_full?: string | null
          party_full?: string | null
          state?: string | null
          street_1?: string | null
          street_2?: string | null
          total_disbursements?: number | null
          total_receipts?: number | null
          treasurer_city?: string | null
          treasurer_name?: string | null
          treasurer_state?: string | null
          treasurer_zip?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          candidate_district?: string | null
          candidate_id?: string | null
          candidate_incumbent_challenge_status?: string | null
          candidate_name?: string | null
          candidate_office?: string | null
          candidate_party?: string | null
          candidate_state?: string | null
          candidate_status?: string | null
          cash_on_hand?: number | null
          city?: string | null
          committee_designation?: string | null
          committee_district?: string | null
          committee_id?: string
          committee_name?: string
          committee_organization_type?: string | null
          committee_party?: string | null
          committee_state?: string | null
          committee_type?: string | null
          committee_type_full?: string | null
          created_at?: string | null
          custodian_city?: string | null
          custodian_name?: string | null
          custodian_state?: string | null
          custodian_zip?: string | null
          cycles?: number[] | null
          data_source?: string | null
          debt?: number | null
          designation?: string | null
          designation_full?: string | null
          filing_frequency?: string | null
          filing_frequency_full?: string | null
          first_file_date?: string | null
          id?: string
          is_efiling?: boolean | null
          is_processed?: boolean | null
          last_f1_date?: string | null
          last_file_date?: string | null
          last_updated?: string | null
          organization_type?: string | null
          organization_type_full?: string | null
          party_full?: string | null
          state?: string | null
          street_1?: string | null
          street_2?: string | null
          total_disbursements?: number | null
          total_receipts?: number | null
          treasurer_city?: string | null
          treasurer_name?: string | null
          treasurer_state?: string | null
          treasurer_zip?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      fec_contributions: {
        Row: {
          amount: number | null
          committee_id: string | null
          contribution_date: string | null
          contributor_name: string | null
          created_at: string | null
          cycle: number | null
          id: string
        }
        Insert: {
          amount?: number | null
          committee_id?: string | null
          contribution_date?: string | null
          contributor_name?: string | null
          created_at?: string | null
          cycle?: number | null
          id?: string
        }
        Update: {
          amount?: number | null
          committee_id?: string | null
          contribution_date?: string | null
          contributor_name?: string | null
          created_at?: string | null
          cycle?: number | null
          id?: string
        }
        Relationships: []
      }
      fec_cycles: {
        Row: {
          created_at: string | null
          cycle: number
          cycle_name: string
          data_available: boolean | null
          election_date: string
          end_date: string
          is_completed: boolean | null
          is_current: boolean | null
          is_upcoming: boolean | null
          last_updated: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          cycle: number
          cycle_name: string
          data_available?: boolean | null
          election_date: string
          end_date: string
          is_completed?: boolean | null
          is_current?: boolean | null
          is_upcoming?: boolean | null
          last_updated?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          cycle?: number
          cycle_name?: string
          data_available?: boolean | null
          election_date?: string
          end_date?: string
          is_completed?: boolean | null
          is_current?: boolean | null
          is_upcoming?: boolean | null
          last_updated?: string | null
          start_date?: string
        }
        Relationships: []
      }
      fec_disbursements: {
        Row: {
          amount: number | null
          committee_id: string | null
          created_at: string | null
          cycle: number | null
          disbursement_date: string | null
          id: string
          purpose: string | null
          recipient_name: string | null
        }
        Insert: {
          amount?: number | null
          committee_id?: string | null
          created_at?: string | null
          cycle?: number | null
          disbursement_date?: string | null
          id?: string
          purpose?: string | null
          recipient_name?: string | null
        }
        Update: {
          amount?: number | null
          committee_id?: string | null
          created_at?: string | null
          cycle?: number | null
          disbursement_date?: string | null
          id?: string
          purpose?: string | null
          recipient_name?: string | null
        }
        Relationships: []
      }
      fec_filings_v2: {
        Row: {
          amendment_chain: string[] | null
          candidate_id: string | null
          cash_on_hand: number | null
          committee_id: string
          coordinated_expenditures: number | null
          coverage_end_date: string | null
          coverage_start_date: string | null
          created_at: string | null
          data_source: string | null
          debt: number | null
          election_cycle: number | null
          election_year: number | null
          filing_date: string
          filing_form: string
          filing_frequency: string | null
          filing_frequency_full: string | null
          filing_id: string
          filing_type: string
          id: string
          independent_expenditures: number | null
          individual_contributions: number | null
          is_amended: boolean | null
          is_efiling: boolean | null
          is_processed: boolean | null
          operating_expenditures: number | null
          original_filing_id: string | null
          other_disbursements: number | null
          other_receipts: number | null
          pac_contributions: number | null
          party_contributions: number | null
          processing_notes: string | null
          processing_status: string | null
          report_type: string | null
          report_type_full: string | null
          report_year: number | null
          self_financing: number | null
          total_disbursements: number | null
          total_receipts: number | null
          updated_at: string | null
        }
        Insert: {
          amendment_chain?: string[] | null
          candidate_id?: string | null
          cash_on_hand?: number | null
          committee_id: string
          coordinated_expenditures?: number | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string | null
          data_source?: string | null
          debt?: number | null
          election_cycle?: number | null
          election_year?: number | null
          filing_date: string
          filing_form: string
          filing_frequency?: string | null
          filing_frequency_full?: string | null
          filing_id: string
          filing_type: string
          id?: string
          independent_expenditures?: number | null
          individual_contributions?: number | null
          is_amended?: boolean | null
          is_efiling?: boolean | null
          is_processed?: boolean | null
          operating_expenditures?: number | null
          original_filing_id?: string | null
          other_disbursements?: number | null
          other_receipts?: number | null
          pac_contributions?: number | null
          party_contributions?: number | null
          processing_notes?: string | null
          processing_status?: string | null
          report_type?: string | null
          report_type_full?: string | null
          report_year?: number | null
          self_financing?: number | null
          total_disbursements?: number | null
          total_receipts?: number | null
          updated_at?: string | null
        }
        Update: {
          amendment_chain?: string[] | null
          candidate_id?: string | null
          cash_on_hand?: number | null
          committee_id?: string
          coordinated_expenditures?: number | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string | null
          data_source?: string | null
          debt?: number | null
          election_cycle?: number | null
          election_year?: number | null
          filing_date?: string
          filing_form?: string
          filing_frequency?: string | null
          filing_frequency_full?: string | null
          filing_id?: string
          filing_type?: string
          id?: string
          independent_expenditures?: number | null
          individual_contributions?: number | null
          is_amended?: boolean | null
          is_efiling?: boolean | null
          is_processed?: boolean | null
          operating_expenditures?: number | null
          original_filing_id?: string | null
          other_disbursements?: number | null
          other_receipts?: number | null
          pac_contributions?: number | null
          party_contributions?: number | null
          processing_notes?: string | null
          processing_status?: string | null
          report_type?: string | null
          report_type_full?: string | null
          report_year?: number | null
          self_financing?: number | null
          total_disbursements?: number | null
          total_receipts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fec_independent_expenditures: {
        Row: {
          amount: number | null
          candidate_name: string | null
          committee_id: string | null
          created_at: string | null
          cycle: number | null
          expenditure_date: string | null
          id: string
          support_oppose: string | null
        }
        Insert: {
          amount?: number | null
          candidate_name?: string | null
          committee_id?: string | null
          created_at?: string | null
          cycle?: number | null
          expenditure_date?: string | null
          id?: string
          support_oppose?: string | null
        }
        Update: {
          amount?: number | null
          candidate_name?: string | null
          committee_id?: string | null
          created_at?: string | null
          cycle?: number | null
          expenditure_date?: string | null
          id?: string
          support_oppose?: string | null
        }
        Relationships: []
      }
      fec_ingest_cursors: {
        Row: {
          created_at: string | null
          cursor_type: string
          cursor_value: string
          cycle: number
          last_updated: string | null
          source: string
        }
        Insert: {
          created_at?: string | null
          cursor_type: string
          cursor_value: string
          cycle: number
          last_updated?: string | null
          source: string
        }
        Update: {
          created_at?: string | null
          cursor_type?: string
          cursor_value?: string
          cycle?: number
          last_updated?: string | null
          source?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          poll_id: string | null
          priority: string | null
          rating: number | null
          screenshot: string | null
          sentiment: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          topic_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          user_journey: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          poll_id?: string | null
          priority?: string | null
          rating?: number | null
          screenshot?: string | null
          sentiment?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          topic_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          user_journey?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          poll_id?: string | null
          priority?: string | null
          rating?: number | null
          screenshot?: string | null
          sentiment?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          topic_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          user_journey?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "generated_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "trending_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      feeds: {
        Row: {
          created_at: string
          hashtag_filters: string[] | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtag_filters?: string[] | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtag_filters?: string[] | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_polls: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          description: string | null
          generation_metadata: Json | null
          id: string
          options: Json
          quality_metrics: Json | null
          quality_score: number | null
          status: string | null
          tags: string[] | null
          title: string
          topic_analysis: Json | null
          topic_id: string | null
          updated_at: string | null
          voting_method: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          generation_metadata?: Json | null
          id?: string
          options: Json
          quality_metrics?: Json | null
          quality_score?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          topic_analysis?: Json | null
          topic_id?: string | null
          updated_at?: string | null
          voting_method: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          generation_metadata?: Json | null
          id?: string
          options?: Json
          quality_metrics?: Json | null
          quality_score?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          topic_analysis?: Json | null
          topic_id?: string | null
          updated_at?: string | null
          voting_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_polls_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "trending_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_analytics: {
        Row: {
          generated_at: string | null
          hashtag_id: string
          id: string
          metrics: Json
          period: string
        }
        Insert: {
          generated_at?: string | null
          hashtag_id: string
          id?: string
          metrics: Json
          period: string
        }
        Update: {
          generated_at?: string | null
          hashtag_id?: string
          id?: string
          metrics?: Json
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_analytics_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_co_occurrence: {
        Row: {
          co_occurrence_count: number | null
          created_at: string | null
          hashtag_id: string
          id: string
          last_co_occurrence: string | null
          related_hashtag_id: string
          updated_at: string | null
        }
        Insert: {
          co_occurrence_count?: number | null
          created_at?: string | null
          hashtag_id: string
          id?: string
          last_co_occurrence?: string | null
          related_hashtag_id: string
          updated_at?: string | null
        }
        Update: {
          co_occurrence_count?: number | null
          created_at?: string | null
          hashtag_id?: string
          id?: string
          last_co_occurrence?: string | null
          related_hashtag_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_co_occurrence_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_co_occurrence_related_hashtag_id_fkey"
            columns: ["related_hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          engagement_score: number | null
          hashtag_id: string
          id: string
          is_featured: boolean | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          engagement_score?: number | null
          hashtag_id: string
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          engagement_score?: number | null
          hashtag_id?: string
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_content_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_engagement: {
        Row: {
          content_id: string | null
          content_type: string | null
          engagement_type: string
          hashtag_id: string
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          engagement_type: string
          hashtag_id: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          engagement_type?: string
          hashtag_id?: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_engagement_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_flags: {
        Row: {
          created_at: string | null
          hashtag: string
          id: string
          reason: string
          reporter_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hashtag: string
          id?: string
          reason: string
          reporter_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hashtag?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hashtag_trending_history: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          position: number
          trend_score: number
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          position: number
          trend_score: number
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          position?: number
          trend_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_trending_history_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_usage: {
        Row: {
          content_id: string | null
          content_type: string | null
          context: string | null
          created_at: string | null
          engagement_score: number | null
          hashtag_id: string
          id: string
          metadata: Json | null
          sentiment: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          context?: string | null
          created_at?: string | null
          engagement_score?: number | null
          hashtag_id: string
          id?: string
          metadata?: Json | null
          sentiment?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          context?: string | null
          created_at?: string | null
          engagement_score?: number | null
          hashtag_id?: string
          id?: string
          metadata?: Json | null
          sentiment?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_usage_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_user_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          follower_count: number | null
          id: string
          is_featured: boolean | null
          is_trending: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          name: string
          trend_score: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          follower_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          name: string
          trend_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          follower_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string
          trend_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      id_crosswalk: {
        Row: {
          attrs: Json | null
          canonical_id: string
          created_at: string | null
          entity_type: string
          entity_uuid: string
          source: string
          source_id: string
          updated_at: string | null
        }
        Insert: {
          attrs?: Json | null
          canonical_id: string
          created_at?: string | null
          entity_type: string
          entity_uuid?: string
          source: string
          source_id: string
          updated_at?: string | null
        }
        Update: {
          attrs?: Json | null
          canonical_id?: string
          created_at?: string | null
          entity_type?: string
          entity_uuid?: string
          source?: string
          source_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key: string
          operation: string
          result: Json | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key: string
          operation: string
          result?: Json | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          operation?: string
          result?: Json | null
        }
        Relationships: []
      }
      independence_score_methodology: {
        Row: {
          confidence_interval: number | null
          created_at: string | null
          data_sources: string[]
          experimental: boolean | null
          formula: string
          methodology_url: string | null
          version: string
        }
        Insert: {
          confidence_interval?: number | null
          created_at?: string | null
          data_sources: string[]
          experimental?: boolean | null
          formula: string
          methodology_url?: string | null
          version: string
        }
        Update: {
          confidence_interval?: number | null
          created_at?: string | null
          data_sources?: string[]
          experimental?: boolean | null
          formula?: string
          methodology_url?: string | null
          version?: string
        }
        Relationships: []
      }
      ingest_cursors: {
        Row: {
          created_at: string | null
          cursor_data: Json | null
          id: string
          last_updated: string | null
          source: string
        }
        Insert: {
          created_at?: string | null
          cursor_data?: Json | null
          id?: string
          last_updated?: string | null
          source: string
        }
        Update: {
          created_at?: string | null
          cursor_data?: Json | null
          id?: string
          last_updated?: string | null
          source?: string
        }
        Relationships: []
      }
      ingestion_cursors: {
        Row: {
          created_at: string | null
          cursor_metadata: Json | null
          cursor_type: string
          cursor_value: string
          id: string
          last_updated: string | null
          source: string
        }
        Insert: {
          created_at?: string | null
          cursor_metadata?: Json | null
          cursor_type: string
          cursor_value: string
          id?: string
          last_updated?: string | null
          source: string
        }
        Update: {
          created_at?: string | null
          cursor_metadata?: Json | null
          cursor_type?: string
          cursor_value?: string
          id?: string
          last_updated?: string | null
          source?: string
        }
        Relationships: []
      }
      ingestion_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          ingestion_type: string
          metadata: Json | null
          processing_notes: string | null
          records_failed: number | null
          records_processed: number | null
          records_skipped: number | null
          records_successful: number | null
          source: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          ingestion_type: string
          metadata?: Json | null
          processing_notes?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          records_successful?: number | null
          source: string
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          ingestion_type?: string
          metadata?: Json | null
          processing_notes?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_skipped?: number | null
          records_successful?: number | null
          source?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      jurisdiction_aliases: {
        Row: {
          alias_type: string
          alias_value: string
          confidence: number | null
          id: string
          last_refreshed: string
          metadata: Json
          normalized_value: string | null
          ocd_division_id: string
          source: string
        }
        Insert: {
          alias_type: string
          alias_value: string
          confidence?: number | null
          id?: string
          last_refreshed?: string
          metadata?: Json
          normalized_value?: string | null
          ocd_division_id: string
          source?: string
        }
        Update: {
          alias_type?: string
          alias_value?: string
          confidence?: number | null
          id?: string
          last_refreshed?: string
          metadata?: Json
          normalized_value?: string | null
          ocd_division_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_aliases_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          },
        ]
      }
      jurisdiction_geometries: {
        Row: {
          area_sq_km: number | null
          geometry: Json
          geometry_format: string
          last_refreshed: string
          metadata: Json
          ocd_division_id: string
          perimeter_km: number | null
          simplified_geometry: Json | null
          source: string
        }
        Insert: {
          area_sq_km?: number | null
          geometry: Json
          geometry_format?: string
          last_refreshed?: string
          metadata?: Json
          ocd_division_id: string
          perimeter_km?: number | null
          simplified_geometry?: Json | null
          source: string
        }
        Update: {
          area_sq_km?: number | null
          geometry?: Json
          geometry_format?: string
          last_refreshed?: string
          metadata?: Json
          ocd_division_id?: string
          perimeter_km?: number | null
          simplified_geometry?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_geometries_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: true
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          },
        ]
      }
      jurisdiction_tiles: {
        Row: {
          created_at: string
          h3_index: string
          metadata: Json
          ocd_division_id: string
          resolution: number
          source: string
        }
        Insert: {
          created_at?: string
          h3_index: string
          metadata?: Json
          ocd_division_id: string
          resolution: number
          source?: string
        }
        Update: {
          created_at?: string
          h3_index?: string
          metadata?: Json
          ocd_division_id?: string
          resolution?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_tiles_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          },
        ]
      }
      jurisdictions_optimal: {
        Row: {
          area_sq_miles: number | null
          city: string | null
          county: string | null
          id: string
          last_updated: string | null
          level: Database["public"]["Enums"]["government_level"]
          name: string
          ocd_division_id: string
          parent_jurisdiction_id: string | null
          population: number | null
          source: string
          state: string
        }
        Insert: {
          area_sq_miles?: number | null
          city?: string | null
          county?: string | null
          id?: string
          last_updated?: string | null
          level: Database["public"]["Enums"]["government_level"]
          name: string
          ocd_division_id: string
          parent_jurisdiction_id?: string | null
          population?: number | null
          source: string
          state: string
        }
        Update: {
          area_sq_miles?: number | null
          city?: string | null
          county?: string | null
          id?: string
          last_updated?: string | null
          level?: Database["public"]["Enums"]["government_level"]
          name?: string
          ocd_division_id?: string
          parent_jurisdiction_id?: string | null
          population?: number | null
          source?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdictions_optimal_parent_jurisdiction_id_fkey"
            columns: ["parent_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions_optimal"
            referencedColumns: ["id"]
          },
        ]
      }
      latlon_to_ocd: {
        Row: {
          confidence: number | null
          created_at: string | null
          lat: number
          lon: number
          ocd_division_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          lat: number
          lon: number
          ocd_division_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          lat?: number
          lon?: number
          ocd_division_id?: string
        }
        Relationships: []
      }
      location_consent_audit: {
        Row: {
          action: string
          consent_given: boolean | null
          created_at: string | null
          id: string
          location_data: Json | null
          user_id: string
        }
        Insert: {
          action: string
          consent_given?: boolean | null
          created_at?: string | null
          id?: string
          location_data?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          consent_given?: boolean | null
          created_at?: string | null
          id?: string
          location_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      media_polls: {
        Row: {
          bias_analysis: Json | null
          bias_indicators: Json | null
          created_at: string | null
          fact_check: Json | null
          headline: string
          id: string
          manipulation_score: number | null
          metadata: Json | null
          methodology: Json
          options: Json
          overall_bias_score: number | null
          propaganda_techniques: Json | null
          published_at: string | null
          question: string
          results: Json
          source_data: Json
          source_id: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          bias_analysis?: Json | null
          bias_indicators?: Json | null
          created_at?: string | null
          fact_check?: Json | null
          headline: string
          id?: string
          manipulation_score?: number | null
          metadata?: Json | null
          methodology: Json
          options?: Json
          overall_bias_score?: number | null
          propaganda_techniques?: Json | null
          published_at?: string | null
          question: string
          results: Json
          source_data: Json
          source_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          bias_analysis?: Json | null
          bias_indicators?: Json | null
          created_at?: string | null
          fact_check?: Json | null
          headline?: string
          id?: string
          manipulation_score?: number | null
          metadata?: Json | null
          methodology?: Json
          options?: Json
          overall_bias_score?: number | null
          propaganda_techniques?: Json | null
          published_at?: string | null
          question?: string
          results?: Json
          source_data?: Json
          source_id?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_polls_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "media_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      media_sources: {
        Row: {
          bias: string | null
          created_at: string | null
          fact_check_rating: string | null
          funding: Json | null
          id: string
          metadata: Json | null
          name: string
          network: string
          ownership: string | null
          political_affiliations: Json | null
          propaganda_indicators: Json | null
          reliability: number | null
          source_id: string
          updated_at: string | null
        }
        Insert: {
          bias?: string | null
          created_at?: string | null
          fact_check_rating?: string | null
          funding?: Json | null
          id?: string
          metadata?: Json | null
          name: string
          network: string
          ownership?: string | null
          political_affiliations?: Json | null
          propaganda_indicators?: Json | null
          reliability?: number | null
          source_id: string
          updated_at?: string | null
        }
        Update: {
          bias?: string | null
          created_at?: string | null
          fact_check_rating?: string | null
          funding?: Json | null
          id?: string
          metadata?: Json | null
          name?: string
          network?: string
          ownership?: string | null
          political_affiliations?: Json | null
          propaganda_indicators?: Json | null
          reliability?: number | null
          source_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      migration_log: {
        Row: {
          applied_at: string
          details: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: number
          migration_name: string
          status: string
        }
        Insert: {
          applied_at?: string
          details?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: number
          migration_name: string
          status: string
        }
        Update: {
          applied_at?: string
          details?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: number
          migration_name?: string
          status?: string
        }
        Relationships: []
      }
      news_fetch_logs: {
        Row: {
          articles_found: number | null
          articles_processed: number | null
          created_at: string | null
          error_message: string | null
          fetch_type: string
          id: string
          metadata: Json | null
          processing_time_ms: number | null
          source_id: string | null
          status: string
        }
        Insert: {
          articles_found?: number | null
          articles_processed?: number | null
          created_at?: string | null
          error_message?: string | null
          fetch_type: string
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          source_id?: string | null
          status: string
        }
        Update: {
          articles_found?: number | null
          articles_processed?: number | null
          created_at?: string | null
          error_message?: string | null
          fetch_type?: string
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          source_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_fetch_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          bias: string | null
          created_at: string | null
          domain: string
          error_count: number | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          name: string
          rate_limit: number | null
          reliability: number | null
          success_rate: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          bias?: string | null
          created_at?: string | null
          domain: string
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name: string
          rate_limit?: number | null
          reliability?: number | null
          success_rate?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          bias?: string | null
          created_at?: string | null
          domain?: string
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name?: string
          rate_limit?: number | null
          reliability?: number | null
          success_rate?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          badge: string | null
          data: Json | null
          error_message: string | null
          icon: string | null
          id: string
          message: string
          notification_type: string | null
          priority: string | null
          sent_at: string | null
          status: string | null
          subscription_id: string | null
          tag: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          badge?: string | null
          data?: Json | null
          error_message?: string | null
          icon?: string | null
          id?: string
          message: string
          notification_type?: string | null
          priority?: string | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string | null
          tag?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          badge?: string | null
          data?: Json | null
          error_message?: string | null
          icon?: string | null
          id?: string
          message?: string
          notification_type?: string | null
          priority?: string | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string | null
          tag?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_analytics: {
        Row: {
          average_time_spent: number | null
          bounce_rate: number | null
          completion_rate: number | null
          created_at: string | null
          demographic_breakdown: Json | null
          device_breakdown: Json | null
          engagement_score: number | null
          geographic_distribution: Json | null
          hashtag_clicks: number | null
          hashtag_shares: number | null
          hashtag_views: number | null
          id: string
          last_updated: string | null
          poll_id: string
          time_series_data: Json | null
          total_views: number | null
          total_votes: number | null
          unique_voters: number | null
        }
        Insert: {
          average_time_spent?: number | null
          bounce_rate?: number | null
          completion_rate?: number | null
          created_at?: string | null
          demographic_breakdown?: Json | null
          device_breakdown?: Json | null
          engagement_score?: number | null
          geographic_distribution?: Json | null
          hashtag_clicks?: number | null
          hashtag_shares?: number | null
          hashtag_views?: number | null
          id?: string
          last_updated?: string | null
          poll_id: string
          time_series_data?: Json | null
          total_views?: number | null
          total_votes?: number | null
          unique_voters?: number | null
        }
        Update: {
          average_time_spent?: number | null
          bounce_rate?: number | null
          completion_rate?: number | null
          created_at?: string | null
          demographic_breakdown?: Json | null
          device_breakdown?: Json | null
          engagement_score?: number | null
          geographic_distribution?: Json | null
          hashtag_clicks?: number | null
          hashtag_shares?: number | null
          hashtag_views?: number | null
          id?: string
          last_updated?: string | null
          poll_id?: string
          time_series_data?: Json | null
          total_views?: number | null
          total_votes?: number | null
          unique_voters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_analytics_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_contexts: {
        Row: {
          context: string
          created_at: string | null
          estimated_controversy: number | null
          id: string
          options: Json
          question: string
          stakeholders: Json | null
          status: string | null
          story_id: string | null
          time_to_live: number | null
          updated_at: string | null
          voting_method: string
          why_important: string
        }
        Insert: {
          context: string
          created_at?: string | null
          estimated_controversy?: number | null
          id?: string
          options: Json
          question: string
          stakeholders?: Json | null
          status?: string | null
          story_id?: string | null
          time_to_live?: number | null
          updated_at?: string | null
          voting_method: string
          why_important: string
        }
        Update: {
          context?: string
          created_at?: string | null
          estimated_controversy?: number | null
          id?: string
          options?: Json
          question?: string
          stakeholders?: Json | null
          status?: string | null
          story_id?: string | null
          time_to_live?: number | null
          updated_at?: string | null
          voting_method?: string
          why_important?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_contexts_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "breaking_news"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_generation_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          generation_step: string
          id: string
          metadata: Json | null
          poll_id: string | null
          processing_time_ms: number | null
          status: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          generation_step: string
          id?: string
          metadata?: Json | null
          poll_id?: string | null
          processing_time_ms?: number | null
          status: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          generation_step?: string
          id?: string
          metadata?: Json | null
          poll_id?: string | null
          processing_time_ms?: number | null
          status?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_generation_logs_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "generated_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_generation_logs_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "trending_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_post_close: boolean | null
          allow_reopen: boolean | null
          auto_lock_at: string | null
          baseline_at: string | null
          category: string | null
          close_reason: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          end_time: string | null
          engagement_score: number | null
          hashtags: string[] | null
          id: string
          is_featured: boolean | null
          is_locked: boolean | null
          is_mock: boolean | null
          is_trending: boolean | null
          is_verified: boolean | null
          last_modified_by: string | null
          lock_duration: number | null
          lock_metadata: Json | null
          lock_notifications_sent: boolean | null
          lock_reason: string | null
          lock_type: string | null
          locked_at: string | null
          locked_by: string | null
          mock_data: Json | null
          moderation_notes: string | null
          moderation_reviewed_at: string | null
          moderation_reviewed_by: string | null
          moderation_status: string | null
          modification_reason: string | null
          options: Json
          participation: number | null
          participation_rate: number | null
          poll_settings: Json | null
          primary_hashtag: string | null
          privacy_level: string
          reopened_at: string | null
          settings: Json | null
          sponsors: string[] | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          total_views: number | null
          total_votes: number | null
          trending_score: number | null
          unlock_at: string | null
          updated_at: string | null
          verification_notes: string | null
          verification_status: string | null
          voting_method: string
        }
        Insert: {
          allow_post_close?: boolean | null
          allow_reopen?: boolean | null
          auto_lock_at?: string | null
          baseline_at?: string | null
          category?: string | null
          close_reason?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_locked?: boolean | null
          is_mock?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          last_modified_by?: string | null
          lock_duration?: number | null
          lock_metadata?: Json | null
          lock_notifications_sent?: boolean | null
          lock_reason?: string | null
          lock_type?: string | null
          locked_at?: string | null
          locked_by?: string | null
          mock_data?: Json | null
          moderation_notes?: string | null
          moderation_reviewed_at?: string | null
          moderation_reviewed_by?: string | null
          moderation_status?: string | null
          modification_reason?: string | null
          options: Json
          participation?: number | null
          participation_rate?: number | null
          poll_settings?: Json | null
          primary_hashtag?: string | null
          privacy_level?: string
          reopened_at?: string | null
          settings?: Json | null
          sponsors?: string[] | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          total_views?: number | null
          total_votes?: number | null
          trending_score?: number | null
          unlock_at?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          voting_method: string
        }
        Update: {
          allow_post_close?: boolean | null
          allow_reopen?: boolean | null
          auto_lock_at?: string | null
          baseline_at?: string | null
          category?: string | null
          close_reason?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_locked?: boolean | null
          is_mock?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          last_modified_by?: string | null
          lock_duration?: number | null
          lock_metadata?: Json | null
          lock_notifications_sent?: boolean | null
          lock_reason?: string | null
          lock_type?: string | null
          locked_at?: string | null
          locked_by?: string | null
          mock_data?: Json | null
          moderation_notes?: string | null
          moderation_reviewed_at?: string | null
          moderation_reviewed_by?: string | null
          moderation_status?: string | null
          modification_reason?: string | null
          options?: Json
          participation?: number | null
          participation_rate?: number | null
          poll_settings?: Json | null
          primary_hashtag?: string | null
          privacy_level?: string
          reopened_at?: string | null
          settings?: Json | null
          sponsors?: string[] | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          total_views?: number | null
          total_votes?: number | null
          trending_score?: number | null
          unlock_at?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          voting_method?: string
        }
        Relationships: []
      }
      privacy_audit_logs: {
        Row: {
          compliance_status: string | null
          created_at: string | null
          data_categories: Json | null
          data_controller: string | null
          data_processor: string | null
          data_volume: number | null
          event_category: string
          event_description: string
          event_timestamp: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          legal_basis: string | null
          mitigation_actions: Json | null
          processing_purpose: string | null
          regulatory_requirements: Json | null
          retention_period_days: number | null
          risk_level: string | null
          session_id: string | null
          third_parties: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          compliance_status?: string | null
          created_at?: string | null
          data_categories?: Json | null
          data_controller?: string | null
          data_processor?: string | null
          data_volume?: number | null
          event_category: string
          event_description: string
          event_timestamp?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          mitigation_actions?: Json | null
          processing_purpose?: string | null
          regulatory_requirements?: Json | null
          retention_period_days?: number | null
          risk_level?: string | null
          session_id?: string | null
          third_parties?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          compliance_status?: string | null
          created_at?: string | null
          data_categories?: Json | null
          data_controller?: string | null
          data_processor?: string | null
          data_volume?: number | null
          event_category?: string
          event_description?: string
          event_timestamp?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          mitigation_actions?: Json | null
          processing_purpose?: string | null
          regulatory_requirements?: Json | null
          retention_period_days?: number | null
          risk_level?: string | null
          session_id?: string | null
          third_parties?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      privacy_consent_records: {
        Row: {
          ccpa_compliant: boolean | null
          consent_date: string | null
          consent_language: string | null
          consent_method: string | null
          consent_source: string | null
          consent_status: string
          consent_type: string
          consent_version: string
          created_at: string | null
          cross_border_transfer_safeguards: Json | null
          data_categories: Json | null
          data_protection_officer_notified: boolean | null
          data_subject_rights_implemented: Json | null
          gdpr_compliant: boolean | null
          id: string
          ip_address: unknown | null
          legal_basis: string
          legal_review_date: string | null
          legal_review_notes: string | null
          legal_review_required: boolean | null
          privacy_impact_assessment_id: string | null
          processing_activities: Json | null
          purpose: string
          regulatory_requirements: Json | null
          retention_period_days: number | null
          third_parties: Json | null
          third_party_sharing: boolean | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          withdrawal_date: string | null
        }
        Insert: {
          ccpa_compliant?: boolean | null
          consent_date?: string | null
          consent_language?: string | null
          consent_method?: string | null
          consent_source?: string | null
          consent_status: string
          consent_type: string
          consent_version: string
          created_at?: string | null
          cross_border_transfer_safeguards?: Json | null
          data_categories?: Json | null
          data_protection_officer_notified?: boolean | null
          data_subject_rights_implemented?: Json | null
          gdpr_compliant?: boolean | null
          id?: string
          ip_address?: unknown | null
          legal_basis: string
          legal_review_date?: string | null
          legal_review_notes?: string | null
          legal_review_required?: boolean | null
          privacy_impact_assessment_id?: string | null
          processing_activities?: Json | null
          purpose: string
          regulatory_requirements?: Json | null
          retention_period_days?: number | null
          third_parties?: Json | null
          third_party_sharing?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawal_date?: string | null
        }
        Update: {
          ccpa_compliant?: boolean | null
          consent_date?: string | null
          consent_language?: string | null
          consent_method?: string | null
          consent_source?: string | null
          consent_status?: string
          consent_type?: string
          consent_version?: string
          created_at?: string | null
          cross_border_transfer_safeguards?: Json | null
          data_categories?: Json | null
          data_protection_officer_notified?: boolean | null
          data_subject_rights_implemented?: Json | null
          gdpr_compliant?: boolean | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string
          legal_review_date?: string | null
          legal_review_notes?: string | null
          legal_review_required?: boolean | null
          privacy_impact_assessment_id?: string | null
          processing_activities?: Json | null
          purpose?: string
          regulatory_requirements?: Json | null
          retention_period_days?: number | null
          third_parties?: Json | null
          third_party_sharing?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawal_date?: string | null
        }
        Relationships: []
      }
      privacy_data_requests: {
        Row: {
          assigned_to: string | null
          ccpa_section_applicable: string | null
          completion_date: string | null
          created_at: string | null
          data_categories: Json | null
          data_controller_contact: string | null
          gdpr_article_applicable: string | null
          id: string
          identity_verification_date: string | null
          identity_verification_method: string | null
          identity_verification_status: string | null
          legal_basis: string
          legal_review_date: string | null
          legal_review_notes: string | null
          legal_review_required: boolean | null
          processing_notes: string | null
          request_date: string | null
          request_description: string | null
          request_source: string | null
          request_status: string
          request_type: string
          response_data: Json | null
          response_deadline: string | null
          response_method: string | null
          response_sent_date: string | null
          retention_exceptions: Json | null
          supervisory_authority_notification_date: string | null
          supervisory_authority_notified: boolean | null
          updated_at: string | null
          user_id: string | null
          verification_date: string | null
          verification_method: string | null
          verification_status: string | null
        }
        Insert: {
          assigned_to?: string | null
          ccpa_section_applicable?: string | null
          completion_date?: string | null
          created_at?: string | null
          data_categories?: Json | null
          data_controller_contact?: string | null
          gdpr_article_applicable?: string | null
          id?: string
          identity_verification_date?: string | null
          identity_verification_method?: string | null
          identity_verification_status?: string | null
          legal_basis: string
          legal_review_date?: string | null
          legal_review_notes?: string | null
          legal_review_required?: boolean | null
          processing_notes?: string | null
          request_date?: string | null
          request_description?: string | null
          request_source?: string | null
          request_status: string
          request_type: string
          response_data?: Json | null
          response_deadline?: string | null
          response_method?: string | null
          response_sent_date?: string | null
          retention_exceptions?: Json | null
          supervisory_authority_notification_date?: string | null
          supervisory_authority_notified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verification_date?: string | null
          verification_method?: string | null
          verification_status?: string | null
        }
        Update: {
          assigned_to?: string | null
          ccpa_section_applicable?: string | null
          completion_date?: string | null
          created_at?: string | null
          data_categories?: Json | null
          data_controller_contact?: string | null
          gdpr_article_applicable?: string | null
          id?: string
          identity_verification_date?: string | null
          identity_verification_method?: string | null
          identity_verification_status?: string | null
          legal_basis?: string
          legal_review_date?: string | null
          legal_review_notes?: string | null
          legal_review_required?: boolean | null
          processing_notes?: string | null
          request_date?: string | null
          request_description?: string | null
          request_source?: string | null
          request_status?: string
          request_type?: string
          response_data?: Json | null
          response_deadline?: string | null
          response_method?: string | null
          response_sent_date?: string | null
          retention_exceptions?: Json | null
          supervisory_authority_notification_date?: string | null
          supervisory_authority_notified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verification_date?: string | null
          verification_method?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      privacy_logs: {
        Row: {
          action: string
          consent_status: string | null
          created_at: string | null
          data_type: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          consent_status?: string | null
          created_at?: string | null
          data_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          consent_status?: string | null
          created_at?: string | null
          data_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      private_user_data: {
        Row: {
          encrypted_analytics_data: string | null
          encrypted_behavioral_data: string | null
          encrypted_personal_info: string | null
          encryption_key_hash: string | null
          id: string
          last_encrypted_at: string | null
          user_id: string | null
        }
        Insert: {
          encrypted_analytics_data?: string | null
          encrypted_behavioral_data?: string | null
          encrypted_personal_info?: string | null
          encryption_key_hash?: string | null
          id?: string
          last_encrypted_at?: string | null
          user_id?: string | null
        }
        Update: {
          encrypted_analytics_data?: string | null
          encrypted_behavioral_data?: string | null
          encrypted_personal_info?: string | null
          encryption_key_hash?: string | null
          id?: string
          last_encrypted_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quality_metrics: {
        Row: {
          assessment_metadata: Json | null
          bias_score: number | null
          clarity_score: number | null
          completeness_score: number | null
          controversy_score: number | null
          created_at: string | null
          id: string
          overall_score: number | null
          poll_id: string | null
          relevance_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_metadata?: Json | null
          bias_score?: number | null
          clarity_score?: number | null
          completeness_score?: number | null
          controversy_score?: number | null
          created_at?: string | null
          id?: string
          overall_score?: number | null
          poll_id?: string | null
          relevance_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_metadata?: Json | null
          bias_score?: number | null
          clarity_score?: number | null
          completeness_score?: number | null
          controversy_score?: number | null
          created_at?: string | null
          id?: string
          overall_score?: number | null
          poll_id?: string | null
          relevance_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_metrics_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "generated_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: unknown
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      redistricting_history: {
        Row: {
          census_cycle_from: number
          census_cycle_to: number
          change_description: string | null
          change_type: string | null
          created_at: string | null
          district_type: string
          effective_date: string
          id: string
          new_district: string | null
          old_district: string | null
          state: string
        }
        Insert: {
          census_cycle_from: number
          census_cycle_to: number
          change_description?: string | null
          change_type?: string | null
          created_at?: string | null
          district_type: string
          effective_date: string
          id?: string
          new_district?: string | null
          old_district?: string | null
          state: string
        }
        Update: {
          census_cycle_from?: number
          census_cycle_to?: number
          change_description?: string | null
          change_type?: string | null
          created_at?: string | null
          district_type?: string
          effective_date?: string
          id?: string
          new_district?: string | null
          old_district?: string | null
          state?: string
        }
        Relationships: []
      }
      representative_activity_enhanced: {
        Row: {
          activity_type: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          representative_id: number | null
          source_url: string | null
          title: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          representative_id?: number | null
          source_url?: string | null
          title?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          representative_id?: number | null
          source_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      representative_campaign_finance: {
        Row: {
          cash_on_hand: number | null
          created_at: string | null
          debt: number | null
          election_cycle: string
          id: string
          individual_contributions: number | null
          last_updated: string | null
          pac_contributions: number | null
          party_contributions: number | null
          representative_id: string | null
          self_financing: number | null
          total_disbursements: number | null
          total_receipts: number | null
        }
        Insert: {
          cash_on_hand?: number | null
          created_at?: string | null
          debt?: number | null
          election_cycle: string
          id?: string
          individual_contributions?: number | null
          last_updated?: string | null
          pac_contributions?: number | null
          party_contributions?: number | null
          representative_id?: string | null
          self_financing?: number | null
          total_disbursements?: number | null
          total_receipts?: number | null
        }
        Update: {
          cash_on_hand?: number | null
          created_at?: string | null
          debt?: number | null
          election_cycle?: string
          id?: string
          individual_contributions?: number | null
          last_updated?: string | null
          pac_contributions?: number | null
          party_contributions?: number | null
          representative_id?: string | null
          self_financing?: number | null
          total_disbursements?: number | null
          total_receipts?: number | null
        }
        Relationships: []
      }
      representative_committees: {
        Row: {
          committee_name: string | null
          created_at: string | null
          end_date: string | null
          id: string
          representative_id: number | null
          role: string | null
          start_date: string | null
        }
        Insert: {
          committee_name?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          representative_id?: number | null
          role?: string | null
          start_date?: string | null
        }
        Update: {
          committee_name?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          representative_id?: number | null
          role?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      representative_contacts_optimal: {
        Row: {
          contact_type: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          label: string | null
          last_updated: string | null
          last_verified: string | null
          representative_id: string
          source: string
          value: string
        }
        Insert: {
          contact_type: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          label?: string | null
          last_updated?: string | null
          last_verified?: string | null
          representative_id: string
          source: string
          value: string
        }
        Update: {
          contact_type?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          label?: string | null
          last_updated?: string | null
          last_verified?: string | null
          representative_id?: string
          source?: string
          value?: string
        }
        Relationships: []
      }
      representative_leadership: {
        Row: {
          committee: string | null
          created_at: string | null
          end_date: string | null
          id: string
          position: string | null
          representative_id: number | null
          start_date: string | null
        }
        Insert: {
          committee?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          position?: string | null
          representative_id?: number | null
          start_date?: string | null
        }
        Update: {
          committee?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          position?: string | null
          representative_id?: number | null
          start_date?: string | null
        }
        Relationships: []
      }
      representative_offices_optimal: {
        Row: {
          address: string | null
          city: string | null
          email: string | null
          fax: string | null
          id: string
          is_current: boolean | null
          is_primary: boolean | null
          last_updated: string | null
          name: string | null
          office_type: string
          phone: string | null
          representative_id: string
          source: string
          state: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          is_current?: boolean | null
          is_primary?: boolean | null
          last_updated?: string | null
          name?: string | null
          office_type: string
          phone?: string | null
          representative_id: string
          source: string
          state?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          is_current?: boolean | null
          is_primary?: boolean | null
          last_updated?: string | null
          name?: string | null
          office_type?: string
          phone?: string | null
          representative_id?: string
          source?: string
          state?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      representative_photos_optimal: {
        Row: {
          attribution: string | null
          file_size: number | null
          height: number | null
          id: string
          is_primary: boolean | null
          last_updated: string | null
          license: string | null
          quality: string
          representative_id: string
          source: string
          url: string
          width: number | null
        }
        Insert: {
          attribution?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          last_updated?: string | null
          license?: string | null
          quality: string
          representative_id: string
          source: string
          url: string
          width?: number | null
        }
        Update: {
          attribution?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          last_updated?: string | null
          license?: string | null
          quality?: string
          representative_id?: string
          source?: string
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      representative_roles_optimal: {
        Row: {
          committee: string | null
          created_at: string | null
          district: string | null
          end_date: string | null
          end_reason: string | null
          id: string
          is_current: boolean | null
          jurisdiction: string | null
          last_updated: string | null
          representative_id: string
          role_type: Database["public"]["Enums"]["representative_type"]
          source: string
          start_date: string | null
          title: string | null
        }
        Insert: {
          committee?: string | null
          created_at?: string | null
          district?: string | null
          end_date?: string | null
          end_reason?: string | null
          id?: string
          is_current?: boolean | null
          jurisdiction?: string | null
          last_updated?: string | null
          representative_id: string
          role_type: Database["public"]["Enums"]["representative_type"]
          source: string
          start_date?: string | null
          title?: string | null
        }
        Update: {
          committee?: string | null
          created_at?: string | null
          district?: string | null
          end_date?: string | null
          end_reason?: string | null
          id?: string
          is_current?: boolean | null
          jurisdiction?: string | null
          last_updated?: string | null
          representative_id?: string
          role_type?: Database["public"]["Enums"]["representative_type"]
          source?: string
          start_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
      representative_social_media_optimal: {
        Row: {
          created_at: string | null
          handle: string | null
          id: string
          platform: string | null
          representative_id: number | null
          url: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          handle?: string | null
          id?: string
          platform?: string | null
          representative_id?: number | null
          url?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          handle?: string | null
          id?: string
          platform?: string | null
          representative_id?: number | null
          url?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      representative_social_posts: {
        Row: {
          content: string | null
          created_at: string | null
          engagement_metrics: Json | null
          id: string
          platform: string | null
          post_id: string | null
          posted_at: string | null
          representative_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          engagement_metrics?: Json | null
          id?: string
          platform?: string | null
          post_id?: string | null
          posted_at?: string | null
          representative_id?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          engagement_metrics?: Json | null
          id?: string
          platform?: string | null
          post_id?: string | null
          posted_at?: string | null
          representative_id?: number | null
        }
        Relationships: []
      }
      representatives_core: {
        Row: {
          ballotpedia_url: string | null
          bioguide_id: string | null
          congress_gov_id: string | null
          created_at: string | null
          data_quality_score: number | null
          data_sources: string[] | null
          district: string | null
          enhanced_activity: Json | null
          enhanced_contacts: Json | null
          enhanced_photos: Json | null
          enhanced_social_media: Json | null
          facebook_url: string | null
          fec_id: string | null
          google_civic_id: string | null
          govinfo_id: string | null
          id: number
          instagram_handle: string | null
          last_updated: string | null
          last_verified: string | null
          legiscan_id: string | null
          level: string | null
          linkedin_url: string | null
          name: string
          next_election_date: string | null
          office: string | null
          openstates_id: string | null
          party: string | null
          primary_email: string | null
          primary_phone: string | null
          primary_photo_url: string | null
          primary_website: string | null
          state: string | null
          term_end_date: string | null
          term_start_date: string | null
          twitter_handle: string | null
          verification_status: string | null
          wikipedia_url: string | null
          youtube_channel: string | null
        }
        Insert: {
          ballotpedia_url?: string | null
          bioguide_id?: string | null
          congress_gov_id?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: string[] | null
          district?: string | null
          enhanced_activity?: Json | null
          enhanced_contacts?: Json | null
          enhanced_photos?: Json | null
          enhanced_social_media?: Json | null
          facebook_url?: string | null
          fec_id?: string | null
          google_civic_id?: string | null
          govinfo_id?: string | null
          id?: number
          instagram_handle?: string | null
          last_updated?: string | null
          last_verified?: string | null
          legiscan_id?: string | null
          level?: string | null
          linkedin_url?: string | null
          name: string
          next_election_date?: string | null
          office?: string | null
          openstates_id?: string | null
          party?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          primary_photo_url?: string | null
          primary_website?: string | null
          state?: string | null
          term_end_date?: string | null
          term_start_date?: string | null
          twitter_handle?: string | null
          verification_status?: string | null
          wikipedia_url?: string | null
          youtube_channel?: string | null
        }
        Update: {
          ballotpedia_url?: string | null
          bioguide_id?: string | null
          congress_gov_id?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: string[] | null
          district?: string | null
          enhanced_activity?: Json | null
          enhanced_contacts?: Json | null
          enhanced_photos?: Json | null
          enhanced_social_media?: Json | null
          facebook_url?: string | null
          fec_id?: string | null
          google_civic_id?: string | null
          govinfo_id?: string | null
          id?: number
          instagram_handle?: string | null
          last_updated?: string | null
          last_verified?: string | null
          legiscan_id?: string | null
          level?: string | null
          linkedin_url?: string | null
          name?: string
          next_election_date?: string | null
          office?: string | null
          openstates_id?: string | null
          party?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          primary_photo_url?: string | null
          primary_website?: string | null
          state?: string | null
          term_end_date?: string | null
          term_start_date?: string | null
          twitter_handle?: string | null
          verification_status?: string | null
          wikipedia_url?: string | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_messages: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          priority: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          priority?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          priority?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      state_districts: {
        Row: {
          census_cycle: number
          congress_number: number | null
          created_at: string | null
          district_number: string | null
          district_type: string
          id: string
          is_current: boolean | null
          ocd_division_id: string
          state: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          census_cycle: number
          congress_number?: number | null
          created_at?: string | null
          district_number?: string | null
          district_type: string
          id?: string
          is_current?: boolean | null
          ocd_division_id: string
          state: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          census_cycle?: number
          congress_number?: number | null
          created_at?: string | null
          district_number?: string | null
          district_type?: string
          id?: string
          is_current?: boolean | null
          ocd_division_id?: string
          state?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      system_configuration: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_health: {
        Row: {
          cpu_usage: number | null
          created_at: string
          database_connections: number | null
          disk_usage: number | null
          error_count: number | null
          id: string
          last_check: string | null
          memory_usage: number | null
          response_time_ms: number | null
          status: string
          uptime_seconds: number | null
          warning_count: number | null
        }
        Insert: {
          cpu_usage?: number | null
          created_at?: string
          database_connections?: number | null
          disk_usage?: number | null
          error_count?: number | null
          id?: string
          last_check?: string | null
          memory_usage?: number | null
          response_time_ms?: number | null
          status?: string
          uptime_seconds?: number | null
          warning_count?: number | null
        }
        Update: {
          cpu_usage?: number | null
          created_at?: string
          database_connections?: number | null
          disk_usage?: number | null
          error_count?: number | null
          id?: string
          last_check?: string | null
          memory_usage?: number | null
          response_time_ms?: number | null
          status?: string
          uptime_seconds?: number | null
          warning_count?: number | null
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          analysis_data: Json | null
          category: string[] | null
          created_at: string | null
          description: string | null
          engagement_rate: number | null
          entities: Json | null
          id: string
          is_active: boolean | null
          last_processed_at: string | null
          metadata: Json | null
          momentum: number | null
          participation_rate: number | null
          processing_status: string | null
          score: number | null
          sentiment_score: number | null
          source_name: string
          source_type: string
          source_url: string | null
          title: string
          topic: string | null
          total_votes: number | null
          trending_score: number | null
          updated_at: string | null
          velocity: number | null
        }
        Insert: {
          analysis_data?: Json | null
          category?: string[] | null
          created_at?: string | null
          description?: string | null
          engagement_rate?: number | null
          entities?: Json | null
          id?: string
          is_active?: boolean | null
          last_processed_at?: string | null
          metadata?: Json | null
          momentum?: number | null
          participation_rate?: number | null
          processing_status?: string | null
          score?: number | null
          sentiment_score?: number | null
          source_name: string
          source_type: string
          source_url?: string | null
          title: string
          topic?: string | null
          total_votes?: number | null
          trending_score?: number | null
          updated_at?: string | null
          velocity?: number | null
        }
        Update: {
          analysis_data?: Json | null
          category?: string[] | null
          created_at?: string | null
          description?: string | null
          engagement_rate?: number | null
          entities?: Json | null
          id?: string
          is_active?: boolean | null
          last_processed_at?: string | null
          metadata?: Json | null
          momentum?: number | null
          participation_rate?: number | null
          processing_status?: string | null
          score?: number | null
          sentiment_score?: number | null
          source_name?: string
          source_type?: string
          source_url?: string | null
          title?: string
          topic?: string | null
          total_votes?: number | null
          trending_score?: number | null
          updated_at?: string | null
          velocity?: number | null
        }
        Relationships: []
      }
      trust_tier_analytics: {
        Row: {
          calculated_at: string
          created_at: string
          factors: Json | null
          id: string
          poll_id: string | null
          trust_score: number
          trust_tier: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          factors?: Json | null
          id?: string
          poll_id?: string | null
          trust_score: number
          trust_tier: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          factors?: Json | null
          id?: string
          poll_id?: string | null
          trust_score?: number
          trust_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_tier_analytics_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_tier_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          average_session_duration: number | null
          behavior_insights: Json | null
          created_at: string | null
          engagement_patterns: Json | null
          hashtag_interactions: number | null
          hashtags_created: number | null
          hashtags_followed: number | null
          id: string
          last_updated: string | null
          performance_metrics: Json | null
          polls_created: number | null
          polls_viewed: number | null
          reputation_points: number | null
          total_page_views: number | null
          total_sessions: number | null
          total_time_spent: number | null
          trust_score: number | null
          user_id: string
          verification_level: number | null
          votes_cast: number | null
        }
        Insert: {
          average_session_duration?: number | null
          behavior_insights?: Json | null
          created_at?: string | null
          engagement_patterns?: Json | null
          hashtag_interactions?: number | null
          hashtags_created?: number | null
          hashtags_followed?: number | null
          id?: string
          last_updated?: string | null
          performance_metrics?: Json | null
          polls_created?: number | null
          polls_viewed?: number | null
          reputation_points?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_time_spent?: number | null
          trust_score?: number | null
          user_id: string
          verification_level?: number | null
          votes_cast?: number | null
        }
        Update: {
          average_session_duration?: number | null
          behavior_insights?: Json | null
          created_at?: string | null
          engagement_patterns?: Json | null
          hashtag_interactions?: number | null
          hashtags_created?: number | null
          hashtags_followed?: number | null
          id?: string
          last_updated?: string | null
          performance_metrics?: Json | null
          polls_created?: number | null
          polls_viewed?: number | null
          reputation_points?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_time_spent?: number | null
          trust_score?: number | null
          user_id?: string
          verification_level?: number | null
          votes_cast?: number | null
        }
        Relationships: []
      }
      user_civics_preferences: {
        Row: {
          created_at: string | null
          district: string | null
          feed_preferences: Json | null
          followed_representatives: string[] | null
          id: string
          interests: string[] | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          feed_preferences?: Json | null
          followed_representatives?: string[] | null
          id?: string
          interests?: string[] | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          district?: string | null
          feed_preferences?: Json | null
          followed_representatives?: string[] | null
          id?: string
          interests?: string[] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consent: {
        Row: {
          consent_text: string | null
          consent_type: string
          created_at: string | null
          granted: boolean
          granted_at: string | null
          id: string
          revoked_at: string | null
          updated_at: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          consent_text?: string | null
          consent_type: string
          created_at?: string | null
          granted: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          updated_at?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          consent_text?: string | null
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          updated_at?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      user_feedback_analytics: {
        Row: {
          created_at: string | null
          feedback_by_type: Json | null
          feedback_patterns: Json | null
          feedback_sentiment_score: number | null
          id: string
          last_updated: string | null
          satisfaction_metrics: Json | null
          total_feedback_submitted: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_by_type?: Json | null
          feedback_patterns?: Json | null
          feedback_sentiment_score?: number | null
          id?: string
          last_updated?: string | null
          satisfaction_metrics?: Json | null
          total_feedback_submitted?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_by_type?: Json | null
          feedback_patterns?: Json | null
          feedback_sentiment_score?: number | null
          id?: string
          last_updated?: string | null
          satisfaction_metrics?: Json | null
          total_feedback_submitted?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_hashtags: {
        Row: {
          followed_at: string | null
          hashtag_id: string
          id: string
          is_primary: boolean | null
          last_used_at: string | null
          preferences: Json | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          followed_at?: string | null
          hashtag_id: string
          id?: string
          is_primary?: boolean | null
          last_used_at?: string | null
          preferences?: Json | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          followed_at?: string | null
          hashtag_id?: string
          id?: string
          is_primary?: boolean | null
          last_used_at?: string | null
          preferences?: Json | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_location_resolutions: {
        Row: {
          address: string | null
          created_at: string | null
          district: string | null
          id: string
          jurisdiction: string | null
          latitude: number | null
          longitude: number | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          jurisdiction?: string | null
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          jurisdiction?: string | null
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          marketing_notifications: boolean | null
          poll_notifications: boolean | null
          poll_results: boolean | null
          push_enabled: boolean | null
          system_updates: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          marketing_notifications?: boolean | null
          poll_notifications?: boolean | null
          poll_results?: boolean | null
          push_enabled?: boolean | null
          system_updates?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marketing_notifications?: boolean | null
          poll_notifications?: boolean | null
          poll_results?: boolean | null
          push_enabled?: boolean | null
          system_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_privacy_analytics: {
        Row: {
          consent_granted_count: number | null
          consent_patterns: Json | null
          consent_revoked_count: number | null
          created_at: string | null
          data_access_requests: number | null
          data_deletion_requests: number | null
          data_sharing_preferences: Json | null
          id: string
          last_updated: string | null
          notification_preferences: Json | null
          privacy_behavior: Json | null
          privacy_level: string | null
          user_id: string
        }
        Insert: {
          consent_granted_count?: number | null
          consent_patterns?: Json | null
          consent_revoked_count?: number | null
          created_at?: string | null
          data_access_requests?: number | null
          data_deletion_requests?: number | null
          data_sharing_preferences?: Json | null
          id?: string
          last_updated?: string | null
          notification_preferences?: Json | null
          privacy_behavior?: Json | null
          privacy_level?: string | null
          user_id: string
        }
        Update: {
          consent_granted_count?: number | null
          consent_patterns?: Json | null
          consent_revoked_count?: number | null
          created_at?: string | null
          data_access_requests?: number | null
          data_deletion_requests?: number | null
          data_sharing_preferences?: Json | null
          id?: string
          last_updated?: string | null
          notification_preferences?: Json | null
          privacy_behavior?: Json | null
          privacy_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          community_focus: string[] | null
          created_at: string | null
          demographics: Json | null
          display_name: string | null
          email: string
          followed_hashtags: string[] | null
          hashtag_filters: string[] | null
          hashtag_preferences: Json | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          last_modified_by: string | null
          location_data: Json | null
          modification_reason: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          participation_style: string | null
          preferences: Json | null
          primary_concerns: string[] | null
          primary_hashtags: string[] | null
          privacy_settings: Json | null
          reputation_points: number | null
          total_engagement_score: number | null
          total_polls_created: number | null
          total_votes_cast: number | null
          trust_score: number | null
          trust_tier: string
          updated_at: string | null
          user_id: string
          username: string
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          community_focus?: string[] | null
          created_at?: string | null
          demographics?: Json | null
          display_name?: string | null
          email: string
          followed_hashtags?: string[] | null
          hashtag_filters?: string[] | null
          hashtag_preferences?: Json | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          last_modified_by?: string | null
          location_data?: Json | null
          modification_reason?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          participation_style?: string | null
          preferences?: Json | null
          primary_concerns?: string[] | null
          primary_hashtags?: string[] | null
          privacy_settings?: Json | null
          reputation_points?: number | null
          total_engagement_score?: number | null
          total_polls_created?: number | null
          total_votes_cast?: number | null
          trust_score?: number | null
          trust_tier?: string
          updated_at?: string | null
          user_id: string
          username: string
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          community_focus?: string[] | null
          created_at?: string | null
          demographics?: Json | null
          display_name?: string | null
          email?: string
          followed_hashtags?: string[] | null
          hashtag_filters?: string[] | null
          hashtag_preferences?: Json | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          last_modified_by?: string | null
          location_data?: Json | null
          modification_reason?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          participation_style?: string | null
          preferences?: Json | null
          primary_concerns?: string[] | null
          primary_hashtags?: string[] | null
          privacy_settings?: Json | null
          reputation_points?: number | null
          total_engagement_score?: number | null
          total_polls_created?: number | null
          total_votes_cast?: number | null
          trust_score?: number | null
          trust_tier?: string
          updated_at?: string | null
          user_id?: string
          username?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_profiles_encrypted: {
        Row: {
          created_at: string | null
          encrypted_contact_info: string | null
          encrypted_demographics: string | null
          encrypted_preferences: string | null
          encryption_version: number | null
          id: string
          key_derivation_salt: string | null
          key_hash: string | null
          public_bio: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_contact_info?: string | null
          encrypted_demographics?: string | null
          encrypted_preferences?: string | null
          encryption_version?: number | null
          id?: string
          key_derivation_salt?: string | null
          key_hash?: string | null
          public_bio?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_contact_info?: string | null
          encrypted_demographics?: string | null
          encrypted_preferences?: string | null
          encryption_version?: number | null
          id?: string
          key_derivation_salt?: string | null
          key_hash?: string | null
          public_bio?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          analytics_data: Json | null
          choice: number
          created_at: string | null
          device_fingerprint: string | null
          engagement_actions: Json | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          is_verified: boolean | null
          page_views: number | null
          poll_id: string
          session_id: string | null
          time_spent_seconds: number | null
          trust_score_at_vote: number | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
          verification_token: string | null
          vote_data: Json | null
          vote_metadata: Json | null
          voting_method: string
        }
        Insert: {
          analytics_data?: Json | null
          choice: number
          created_at?: string | null
          device_fingerprint?: string | null
          engagement_actions?: Json | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          is_verified?: boolean | null
          page_views?: number | null
          poll_id: string
          session_id?: string | null
          time_spent_seconds?: number | null
          trust_score_at_vote?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
          verification_token?: string | null
          vote_data?: Json | null
          vote_metadata?: Json | null
          voting_method: string
        }
        Update: {
          analytics_data?: Json | null
          choice?: number
          created_at?: string | null
          device_fingerprint?: string | null
          engagement_actions?: Json | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          is_verified?: boolean | null
          page_views?: number | null
          poll_id?: string
          session_id?: string | null
          time_spent_seconds?: number | null
          trust_score_at_vote?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
          verification_token?: string | null
          vote_data?: Json | null
          vote_metadata?: Json | null
          voting_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_records: {
        Row: {
          bill_id: string | null
          bill_number: string | null
          bill_subject: string | null
          bill_title: string | null
          bill_type: string | null
          candidate_id: string | null
          chamber: string | null
          congress_number: number | null
          created_at: string | null
          data_sources: string[]
          id: string
          last_updated: string | null
          license_key: string | null
          provenance: Json | null
          quality_score: number | null
          vote: string
          vote_date: string
          vote_description: string | null
          vote_question: string | null
        }
        Insert: {
          bill_id?: string | null
          bill_number?: string | null
          bill_subject?: string | null
          bill_title?: string | null
          bill_type?: string | null
          candidate_id?: string | null
          chamber?: string | null
          congress_number?: number | null
          created_at?: string | null
          data_sources: string[]
          id?: string
          last_updated?: string | null
          license_key?: string | null
          provenance?: Json | null
          quality_score?: number | null
          vote: string
          vote_date: string
          vote_description?: string | null
          vote_question?: string | null
        }
        Update: {
          bill_id?: string | null
          bill_number?: string | null
          bill_subject?: string | null
          bill_title?: string | null
          bill_type?: string | null
          candidate_id?: string | null
          chamber?: string | null
          congress_number?: number | null
          created_at?: string | null
          data_sources?: string[]
          id?: string
          last_updated?: string | null
          license_key?: string | null
          provenance?: Json | null
          quality_score?: number | null
          vote?: string
          vote_date?: string
          vote_description?: string | null
          vote_question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_records_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string | null
          expires_at: string
          id: string
          kind: string
          rp_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string | null
          expires_at: string
          id?: string
          kind: string
          rp_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          kind?: string
          rp_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          aaguid: string | null
          backup_eligible: boolean | null
          backup_state: boolean | null
          counter: number
          created_at: string | null
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          rp_id: string
          transports: string[] | null
          user_handle: string | null
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          backup_eligible?: boolean | null
          backup_state?: boolean | null
          counter?: number
          created_at?: string | null
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          rp_id: string
          transports?: string[] | null
          user_handle?: string | null
          user_id: string
        }
        Update: {
          aaguid?: string | null
          backup_eligible?: boolean | null
          backup_state?: boolean | null
          counter?: number
          created_at?: string | null
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          rp_id?: string
          transports?: string[] | null
          user_handle?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zip_to_ocd: {
        Row: {
          confidence: number | null
          created_at: string | null
          ocd_division_id: string
          zip5: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          ocd_division_id: string
          zip5: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          ocd_division_id?: string
          zip5?: string
        }
        Relationships: []
      }
    }
    Views: {
      data_quality_summary: {
        Row: {
          check_type: string | null
          error_count: number | null
          failed_checks: number | null
          info_count: number | null
          last_check: string | null
          pass_rate: number | null
          passed_checks: number | null
          table_name: string | null
          total_checks: number | null
          warning_count: number | null
        }
        Relationships: []
      }
      dbt_freshness_status: {
        Row: {
          consecutive_failures: number | null
          current_status: string | null
          enabled: boolean | null
          last_check: string | null
          last_failure: string | null
          last_success: string | null
          max_age_hours: number | null
          table_name: string | null
          warning_threshold_hours: number | null
        }
        Insert: {
          consecutive_failures?: number | null
          current_status?: never
          enabled?: boolean | null
          last_check?: string | null
          last_failure?: string | null
          last_success?: string | null
          max_age_hours?: number | null
          table_name?: string | null
          warning_threshold_hours?: number | null
        }
        Update: {
          consecutive_failures?: number | null
          current_status?: never
          enabled?: boolean | null
          last_check?: string | null
          last_failure?: string | null
          last_success?: string | null
          max_age_hours?: number | null
          table_name?: string | null
          warning_threshold_hours?: number | null
        }
        Relationships: []
      }
      dbt_test_execution_history: {
        Row: {
          error_tests: number | null
          execution_date: string | null
          failed_tests: number | null
          pass_rate_percent: number | null
          passed_tests: number | null
          total_tests: number | null
          warning_tests: number | null
        }
        Relationships: []
      }
      dbt_test_results_summary: {
        Row: {
          error_tests: number | null
          failed_tests: number | null
          last_execution: string | null
          pass_rate_percent: number | null
          passed_tests: number | null
          table_name: string | null
          total_tests: number | null
          warning_tests: number | null
        }
        Relationships: []
      }
      demographic_analytics: {
        Row: {
          age_bucket: string | null
          average_choice: number | null
          choice_variance: number | null
          education_bucket: string | null
          first_contribution: string | null
          last_contribution: string | null
          participant_count: number | null
          poll_id: string | null
          region_bucket: string | null
        }
        Relationships: []
      }
      hashtag_performance_summary: {
        Row: {
          average_engagement: number | null
          hashtag_id: string | null
          last_used: string | null
          total_usage: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_usage_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_processing_summary: {
        Row: {
          completed: number | null
          failed: number | null
          pending: number | null
          processing: number | null
          skipped: number | null
          source: string | null
          success_rate: number | null
          total_records: number | null
        }
        Relationships: []
      }
      user_engagement_summary: {
        Row: {
          average_engagement_score: number | null
          last_engagement: string | null
          total_engagements: number | null
          unique_content_engaged: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_index_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_name: string
          index_size: string
          table_name: string
          usage_count: number
        }[]
      }
      analyze_polls_table: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_size: string
          last_analyzed: string
          row_count: number
          table_name: string
          table_size: string
        }[]
      }
      anonymize_user_data: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      calculate_biometric_trust_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_data_checksum: {
        Args: { checksum_type?: string; record_id: string; table_name: string }
        Returns: string
      }
      calculate_data_quality_score: {
        Args: { rep_id: string }
        Returns: number
      }
      calculate_data_quality_score_optimal: {
        Args: { rep_id: string }
        Returns: number
      }
      calculate_hashtag_analytics: {
        Args: { hashtag_id_param: string; period_param?: string }
        Returns: Json
      }
      calculate_hashtag_trending_score: {
        Args: { hashtag_id: string }
        Returns: number
      }
      calculate_independence_score: {
        Args: { candidate_id: string; cycle_year: number }
        Returns: number
      }
      calculate_trust_tier_score: {
        Args: {
          p_biometric_verified?: boolean
          p_identity_verified?: boolean
          p_phone_verified?: boolean
          p_voting_history_count?: number
        }
        Returns: {
          trust_score: number
          trust_tier: string
        }[]
      }
      calculate_votesmart_quality_score: {
        Args: { rep_id: string }
        Returns: number
      }
      check_count_drift: {
        Args: {
          p_actual_count: number
          p_jurisdiction: string
          p_level: string
        }
        Returns: boolean
      }
      check_freshness_sla: {
        Args: { table_name: string; timestamp_column?: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip_address: unknown
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: boolean
      }
      cleanup_expired_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_webauthn_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_webauthn_challenges: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      contribute_to_analytics: {
        Args: {
          target_age_bucket: string
          target_education_bucket: string
          target_participation_time: unknown
          target_poll_id: string
          target_region_bucket: string
          target_vote_choice: number
        }
        Returns: boolean
      }
      decrement_hashtag_follower_count: {
        Args: { hashtag_id: string } | { p_hashtag_id: string }
        Returns: undefined
      }
      delete_webauthn_credential: {
        Args: { credential_id_param: string; user_uuid: string }
        Returns: boolean
      }
      determine_trust_tier: {
        Args: { p_score: number }
        Returns: string
      }
      exec_sql: {
        Args: { sql: string }
        Returns: Json
      }
      export_user_data: {
        Args: { target_user_id: string }
        Returns: Json
      }
      generate_user_feed: {
        Args: { limit_count?: number; user_uuid: string }
        Returns: Json
      }
      get_candidate_committees: {
        Args: { candidate_id: string; cycle_year: number }
        Returns: {
          cash_on_hand: number
          committee_name: string
          committee_type: string
          debt: number
          designation: string
          fec_committee_id: string
          total_disbursements: number
          total_receipts: number
        }[]
      }
      get_data_lineage_trail: {
        Args: { record_id: string; table_name: string }
        Returns: {
          lineage_id: string
          processing_completed_at: string
          processing_started_at: string
          source_record_id: string
          source_table: string
          success: boolean
          target_record_id: string
          target_table: string
          transformation_type: string
          transformation_version: string
        }[]
      }
      get_districts_for_state: {
        Args: { district_type?: string; state_code: string }
        Returns: {
          census_cycle: number
          congress_number: number
          district_number: string
          is_current: boolean
          ocd_division_id: string
        }[]
      }
      get_efiling_vs_processed_summary: {
        Args: { cycle_year: number }
        Returns: {
          efiling_percentage: number
          efiling_records: number
          processed_percentage: number
          processed_records: number
          table_name: string
          total_records: number
        }[]
      }
      get_fec_cycle_info: {
        Args: { cycle_year: number }
        Returns: {
          cycle: number
          cycle_name: string
          data_available: boolean
          election_date: string
          end_date: string
          is_completed: boolean
          is_current: boolean
          is_upcoming: boolean
          start_date: string
        }[]
      }
      get_hashtag_suggestions: {
        Args: { input_text: string; limit_count?: number; user_id?: string }
        Returns: {
          confidence_score: number
          display_name: string
          follower_count: number
          id: string
          is_trending: boolean
          name: string
          suggestion_reason: string
          trend_score: number
          usage_count: number
        }[]
      }
      get_local_government_representatives: {
        Args: { state_code: string }
        Returns: {
          data_quality_score: number
          id: string
          jurisdiction: string
          level: string
          name: string
          office: string
          role_type: string
        }[]
      }
      get_ocd_from_coords: {
        Args: { latitude: number; longitude: number }
        Returns: {
          confidence: number
          ocd_division_id: string
        }[]
      }
      get_ocd_from_zip: {
        Args: { zip_code: string }
        Returns: {
          confidence: number
          ocd_division_id: string
        }[]
      }
      get_own_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          is_active: boolean
          stable_id: string
          verification_tier: string
        }[]
      }
      get_poll_privacy_settings: {
        Args: { poll_id_param: string }
        Returns: {
          allows_anonymous_voting: boolean
          poll_id: string
          privacy_level: string
          provides_audit_receipts: boolean
          requires_authentication: boolean
          uses_blinded_tokens: boolean
        }[]
      }
      get_poll_results: {
        Args: { poll_id_param: string }
        Returns: {
          aggregated_results: Json
          participation_rate: number
          poll_id: string
          title: string
          total_votes: number
        }[]
      }
      get_representative_activity: {
        Args: { rep_id: string }
        Returns: Json
      }
      get_representative_contacts: {
        Args: { rep_id: string }
        Returns: Json
      }
      get_representative_full_data: {
        Args: { rep_id: string }
        Returns: Json
      }
      get_representative_photos: {
        Args: { rep_id: string }
        Returns: Json
      }
      get_representative_social_media: {
        Args: { rep_id: string }
        Returns: Json
      }
      get_representatives_by_jurisdiction: {
        Args: { jurisdiction_path: string }
        Returns: {
          data_quality_score: number
          district: string
          id: string
          level: string
          name: string
          office: string
          party: string
          role_type: string
          state: string
        }[]
      }
      get_representatives_by_votesmart_completeness: {
        Args: { min_score?: number }
        Returns: {
          data_quality_score: number
          id: string
          name: string
          state: string
          votesmart_id: string
          votesmart_quality_score: number
        }[]
      }
      get_representatives_needing_enrichment_optimal: {
        Args: Record<PropertyKey, never>
        Returns: {
          bioguide_id: string
          data_quality_score: number
          fec_candidate_id: string
          id: string
          name: string
          openstates_person_id: string
        }[]
      }
      get_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_trending_hashtags: {
        Args: { category_filter?: string; limit_count?: number }
        Returns: {
          category: string
          display_name: string
          follower_count: number
          id: string
          is_trending: boolean
          name: string
          trend_score: number
          usage_count: number
        }[]
      }
      get_user_webauthn_credentials: {
        Args: { user_uuid: string }
        Returns: {
          aaguid: string
          backed_up: boolean
          backup_eligible: boolean
          counter: number
          created_at: string
          credential_id: string
          device_info: Json
          device_label: string
          id: string
          last_used_at: string
          transports: string[]
        }[]
      }
      increment_hashtag_follower_count: {
        Args: { hashtag_id: string } | { p_hashtag_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { input_user_id?: string }
        Returns: boolean
      }
      is_contributor: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_owner: {
        Args:
          | Record<PropertyKey, never>
          | { resource_user_id: string; user_id: string }
        Returns: boolean
      }
      is_system_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          action_param: string
          new_values_param?: Json
          old_values_param?: Json
          record_id_param?: string
          table_name_param: string
        }
        Returns: undefined
      }
      log_biometric_auth: {
        Args: {
          p_credential_id: string
          p_device_info?: Json
          p_failure_reason?: string
          p_ip_address?: unknown
          p_location_info?: Json
          p_result: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      monitor_failed_logins: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_attempts: number
          last_attempt: string
          user_id: string
        }[]
      }
      monitor_rls_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_auth_functions: boolean
          policy_count: number
          table_name: string
        }[]
      }
      monitor_suspicious_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_count: number
          activity_type: string
          last_activity: string
          user_id: string
        }[]
      }
      normalize_hashtag_name: {
        Args: { input_name: string }
        Returns: string
      }
      rebuild_poll_indexes: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_name: string
          rebuild_time: unknown
          status: string
        }[]
      }
      refresh_poll_analytics_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_poll_statistics_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_accepted_values_test: {
        Args: {
          accepted_values: string[]
          column_name: string
          table_name: string
          test_name?: string
        }
        Returns: Json
      }
      run_not_null_test: {
        Args: { column_name: string; table_name: string; test_name?: string }
        Returns: Json
      }
      run_relationships_test: {
        Args: {
          column_name: string
          referenced_column: string
          referenced_table: string
          table_name: string
          test_name?: string
        }
        Returns: Json
      }
      run_table_tests: {
        Args: { table_name: string }
        Returns: Json[]
      }
      run_unique_test: {
        Args: { column_name: string; table_name: string; test_name?: string }
        Returns: Json
      }
      track_data_lineage: {
        Args: {
          source_data_hash?: string
          source_record_id: string
          source_table: string
          target_data_hash?: string
          target_record_id: string
          target_table: string
          transformation_params?: Json
          transformation_type: string
          transformation_version: string
        }
        Returns: string
      }
      update_data_quality_level_optimal: {
        Args: { rep_id: string }
        Returns: Database["public"]["Enums"]["data_quality_level"]
      }
      update_data_quality_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_hashtag_trend_score: {
        Args: { p_hashtag_id: string; p_trend_score: number }
        Returns: undefined
      }
      update_poll_privacy_level: {
        Args: { new_privacy_level: string; poll_id_param: string }
        Returns: boolean
      }
      update_poll_statistics: {
        Args: { poll_id_param: string }
        Returns: {
          last_updated: string
          participation_rate: number
          poll_id: string
          total_votes: number
        }[]
      }
      user_has_webauthn_credentials: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      validate_data_quality: {
        Args: { check_version?: string; record_id: string; table_name: string }
        Returns: {
          check_name: string
          check_type: string
          error_message: string
          passed: boolean
          severity: string
        }[]
      }
      validate_hashtag_name: {
        Args: { input_name: string }
        Returns: boolean
      }
      validate_stable_id: {
        Args: { id: string }
        Returns: boolean
      }
      verify_security_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_count: number
          rls_enabled: boolean
          security_status: string
          table_name: string
        }[]
      }
    }
    Enums: {
      data_quality_level: "excellent" | "good" | "fair" | "poor" | "unknown"
      demographic_key: "age_group" | "location" | "device_type"
      event_type: "vote" | "poll_created" | "user_registered"
      government_level:
        | "federal"
        | "state"
        | "county"
        | "municipal"
        | "school_district"
        | "special_district"
      poll_status: "draft" | "active" | "closed"
      representative_level:
        | "federal"
        | "state"
        | "municipal"
        | "county"
        | "school_district"
        | "special_district"
      representative_type:
        | "governor"
        | "lieutenant_governor"
        | "state_senator"
        | "state_representative"
        | "mayor"
        | "city_councilmember"
        | "county_commissioner"
        | "county_sheriff"
        | "secretary_of_state"
        | "attorney_general"
        | "treasurer"
        | "auditor"
        | "committee_member"
      token_scope: "read" | "write" | "admin"
      verification_status: "verified" | "pending" | "failed" | "unverified"
      verification_tier: "T0" | "T1" | "T2" | "T3"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      data_quality_level: ["excellent", "good", "fair", "poor", "unknown"],
      demographic_key: ["age_group", "location", "device_type"],
      event_type: ["vote", "poll_created", "user_registered"],
      government_level: [
        "federal",
        "state",
        "county",
        "municipal",
        "school_district",
        "special_district",
      ],
      poll_status: ["draft", "active", "closed"],
      representative_level: [
        "federal",
        "state",
        "municipal",
        "county",
        "school_district",
        "special_district",
      ],
      representative_type: [
        "governor",
        "lieutenant_governor",
        "state_senator",
        "state_representative",
        "mayor",
        "city_councilmember",
        "county_commissioner",
        "county_sheriff",
        "secretary_of_state",
        "attorney_general",
        "treasurer",
        "auditor",
        "committee_member",
      ],
      token_scope: ["read", "write", "admin"],
      verification_status: ["verified", "pending", "failed", "unverified"],
      verification_tier: ["T0", "T1", "T2", "T3"],
    },
  },
} as const
