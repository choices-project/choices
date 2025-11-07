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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_event_data: {
        Row: {
          created_at: string | null
          data_key: string
          data_type: string | null
          data_value: string
          event_id: string
          id: number
        }
        Insert: {
          created_at?: string | null
          data_key: string
          data_type?: string | null
          data_value: string
          event_id: string
          id?: number
        }
        Update: {
          created_at?: string | null
          data_key?: string
          data_type?: string | null
          data_value?: string
          event_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_event_data_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "analytics_events"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          error_message: string | null
          error_stack: string | null
          event_name: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          expires_at: string | null
          granted: boolean | null
          id: string
          ip_address: unknown
          metadata: Json | null
          request_method: string | null
          request_path: string | null
          resource: string | null
          session_id: string | null
          severity: Database["public"]["Enums"]["audit_severity"] | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_name: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          expires_at?: string | null
          granted?: boolean | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"] | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_name?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          expires_at?: string | null
          granted?: boolean | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"] | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      biometric_trust_scores: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          credential_id: string | null
          device_info: Json | null
          factors: Json | null
          id: string
          trust_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          credential_id?: string | null
          device_info?: Json | null
          factors?: Json | null
          id?: string
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          credential_id?: string | null
          device_info?: Json | null
          factors?: Json | null
          id?: string
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bot_detection_logs: {
        Row: {
          created_at: string | null
          detection_reasons: Json
          detection_score: number
          detection_type: string
          human_reviewed: boolean | null
          id: string
          is_confirmed_bot: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detection_reasons: Json
          detection_score: number
          detection_type: string
          human_reviewed?: boolean | null
          id?: string
          is_confirmed_bot?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detection_reasons?: Json
          detection_score?: number
          detection_type?: string
          human_reviewed?: boolean | null
          id?: string
          is_confirmed_bot?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_detection_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_performance_log: {
        Row: {
          cache_key: string
          cache_operation: string
          cache_size_bytes: number | null
          cache_type: string | null
          expires_at: string | null
          id: string
          is_hit: boolean | null
          namespace: string | null
          operation_time_ms: number | null
          recorded_at: string | null
          ttl_seconds: number | null
        }
        Insert: {
          cache_key: string
          cache_operation: string
          cache_size_bytes?: number | null
          cache_type?: string | null
          expires_at?: string | null
          id?: string
          is_hit?: boolean | null
          namespace?: string | null
          operation_time_ms?: number | null
          recorded_at?: string | null
          ttl_seconds?: number | null
        }
        Update: {
          cache_key?: string
          cache_operation?: string
          cache_size_bytes?: number | null
          cache_type?: string | null
          expires_at?: string | null
          id?: string
          is_hit?: boolean | null
          namespace?: string | null
          operation_time_ms?: number | null
          recorded_at?: string | null
          ttl_seconds?: number | null
        }
        Relationships: []
      }
      candidate_platforms: {
        Row: {
          ballot_access_confirmed: boolean | null
          campaign_email: string | null
          campaign_funding: Json | null
          campaign_phone: string | null
          campaign_website: string | null
          candidate_name: string
          created_at: string | null
          district: string | null
          election_date: string | null
          endorsements: Json | null
          experience: string | null
          filing_deadline: string | null
          filing_document_url: string | null
          filing_jurisdiction: string | null
          filing_status: string | null
          id: string
          jurisdiction: string
          last_active_at: string | null
          level: string
          office: string
          official_filing_date: string | null
          official_filing_id: string | null
          party: string | null
          photo_url: string | null
          platform_positions: Json
          state: string
          status: string | null
          updated_at: string | null
          user_id: string
          verification_method: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          visibility: string | null
        }
        Insert: {
          ballot_access_confirmed?: boolean | null
          campaign_email?: string | null
          campaign_funding?: Json | null
          campaign_phone?: string | null
          campaign_website?: string | null
          candidate_name: string
          created_at?: string | null
          district?: string | null
          election_date?: string | null
          endorsements?: Json | null
          experience?: string | null
          filing_deadline?: string | null
          filing_document_url?: string | null
          filing_jurisdiction?: string | null
          filing_status?: string | null
          id?: string
          jurisdiction: string
          last_active_at?: string | null
          level: string
          office: string
          official_filing_date?: string | null
          official_filing_id?: string | null
          party?: string | null
          photo_url?: string | null
          platform_positions?: Json
          state: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_method?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          visibility?: string | null
        }
        Update: {
          ballot_access_confirmed?: boolean | null
          campaign_email?: string | null
          campaign_funding?: Json | null
          campaign_phone?: string | null
          campaign_website?: string | null
          candidate_name?: string
          created_at?: string | null
          district?: string | null
          election_date?: string | null
          endorsements?: Json | null
          experience?: string | null
          filing_deadline?: string | null
          filing_document_url?: string | null
          filing_jurisdiction?: string | null
          filing_status?: string | null
          id?: string
          jurisdiction?: string
          last_active_at?: string | null
          level?: string
          office?: string
          official_filing_date?: string | null
          official_filing_id?: string | null
          party?: string | null
          photo_url?: string | null
          platform_positions?: Json
          state?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_method?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      civic_action_metadata: {
        Row: {
          action_id: string
          created_at: string | null
          id: number
          metadata_key: string
          metadata_value: string
        }
        Insert: {
          action_id: string
          created_at?: string | null
          id?: number
          metadata_key: string
          metadata_value: string
        }
        Update: {
          action_id?: string
          created_at?: string | null
          id?: number
          metadata_key?: string
          metadata_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_action_metadata_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "civic_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_actions: {
        Row: {
          action_type: string
          category: string | null
          created_at: string | null
          created_by: string
          current_signatures: number | null
          description: string | null
          end_date: string | null
          id: string
          offline_synced: boolean | null
          required_signatures: number | null
          start_date: string | null
          status: string | null
          target_district: string | null
          target_office: string | null
          target_representative_id: number | null
          target_state: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          category?: string | null
          created_at?: string | null
          created_by: string
          current_signatures?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          offline_synced?: boolean | null
          required_signatures?: number | null
          start_date?: string | null
          status?: string | null
          target_district?: string | null
          target_office?: string | null
          target_representative_id?: number | null
          target_state?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          category?: string | null
          created_at?: string | null
          created_by?: string
          current_signatures?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          offline_synced?: boolean | null
          required_signatures?: number | null
          start_date?: string | null
          status?: string | null
          target_district?: string | null
          target_office?: string | null
          target_representative_id?: number | null
          target_state?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      civic_database_entries: {
        Row: {
          average_engagement_score: number | null
          created_at: string | null
          current_trust_tier: string | null
          id: string
          stable_user_id: string
          total_polls_participated: number | null
          total_votes_cast: number | null
          trust_tier_history: Json | null
          trust_tier_upgrade_date: string | null
          updated_at: string | null
          user_hash: string
        }
        Insert: {
          average_engagement_score?: number | null
          created_at?: string | null
          current_trust_tier?: string | null
          id?: string
          stable_user_id: string
          total_polls_participated?: number | null
          total_votes_cast?: number | null
          trust_tier_history?: Json | null
          trust_tier_upgrade_date?: string | null
          updated_at?: string | null
          user_hash: string
        }
        Update: {
          average_engagement_score?: number | null
          created_at?: string | null
          current_trust_tier?: string | null
          id?: string
          stable_user_id?: string
          total_polls_participated?: number | null
          total_votes_cast?: number | null
          trust_tier_history?: Json | null
          trust_tier_upgrade_date?: string | null
          updated_at?: string | null
          user_hash?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          offline_synced: boolean | null
          priority: string | null
          representative_id: number
          status: string | null
          subject: string
          thread_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          offline_synced?: boolean | null
          priority?: string | null
          representative_id: number
          status?: string | null
          subject: string
          thread_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          offline_synced?: boolean | null
          priority?: string | null
          representative_id?: number
          status?: string | null
          subject?: string
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "contact_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number
          priority: string
          representative_id: number
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          priority?: string
          representative_id: number
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          priority?: string
          representative_id?: number
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_threads_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          action_type: string
          context: Json | null
          duration: number | null
          error_message: string | null
          feature_name: string
          id: string
          metadata: Json | null
          session_id: string | null
          success: boolean | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          context?: Json | null
          duration?: number | null
          error_message?: string | null
          feature_name: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          context?: Json | null
          duration?: number | null
          error_message?: string | null
          feature_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          success?: boolean | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feed_interactions: {
        Row: {
          created_at: string | null
          feed_id: string
          id: string
          interaction_type: string
          item_id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feed_id: string
          id?: string
          interaction_type: string
          item_id: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feed_id?: string
          id?: string
          interaction_type?: string
          item_id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_interactions_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          created_at: string | null
          feed_id: string
          id: string
          is_featured: boolean | null
          item_data: Json | null
          item_type: string
          poll_id: string | null
          position: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feed_id: string
          id?: string
          is_featured?: boolean | null
          item_data?: Json | null
          item_type: string
          poll_id?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feed_id?: string
          id?: string
          is_featured?: boolean | null
          item_data?: Json | null
          item_type?: string
          poll_id?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          ai_analysis: Json | null
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          feedback_type: string
          id: string
          impact_score: number | null
          metadata: Json | null
          priority: string | null
          reproducibility: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          screenshot: string | null
          sentiment: string | null
          severity: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
          user_journey: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          feedback_type: string
          id?: string
          impact_score?: number | null
          metadata?: Json | null
          priority?: string | null
          reproducibility?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot?: string | null
          sentiment?: string | null
          severity?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_journey?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          feedback_type?: string
          id?: string
          impact_score?: number | null
          metadata?: Json | null
          priority?: string | null
          reproducibility?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot?: string | null
          sentiment?: string | null
          severity?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_journey?: Json | null
        }
        Relationships: []
      }
      feeds: {
        Row: {
          content_filters: Json | null
          created_at: string | null
          feed_name: string
          feed_type: string
          hashtag_filters: Json | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_filters?: Json | null
          created_at?: string | null
          feed_name: string
          feed_type: string
          hashtag_filters?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_filters?: Json | null
          created_at?: string | null
          feed_name?: string
          feed_type?: string
          hashtag_filters?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hashtag_engagement: {
        Row: {
          created_at: string | null
          engagement_type: string
          hashtag_id: string
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          engagement_type: string
          hashtag_id: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
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
          flag_type: string
          flagged_by: string | null
          hashtag_id: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flag_type: string
          flagged_by?: string | null
          hashtag_id: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          flag_type?: string
          flagged_by?: string | null
          hashtag_id?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hashtag_flags_flagged_by"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_flags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_usage: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          poll_id: string | null
          usage_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          poll_id?: string | null
          usage_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          poll_id?: string | null
          usage_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_usage_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_usage_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_user_preferences: {
        Row: {
          created_at: string | null
          followed_hashtags: Json | null
          hashtag_filters: Json | null
          id: string
          notification_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          followed_hashtags?: Json | null
          hashtag_filters?: Json | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          followed_hashtags?: Json | null
          hashtag_filters?: Json | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          follower_count: number | null
          id: string
          is_featured: boolean | null
          is_trending: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          name: string
          trending_score: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          follower_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          name: string
          trending_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          follower_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string
          trending_score?: number | null
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
          id: number
          source: string
          source_id: string
          updated_at: string | null
        }
        Insert: {
          attrs?: Json | null
          canonical_id: string
          created_at?: string | null
          entity_type: string
          id?: number
          source: string
          source_id: string
          updated_at?: string | null
        }
        Update: {
          attrs?: Json | null
          canonical_id?: string
          created_at?: string | null
          entity_type?: string
          id?: number
          source?: string
          source_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          completed_at: string | null
          created_at: string
          data: Json | null
          error_message: string | null
          expires_at: string
          id: string
          key: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          error_message?: string | null
          expires_at: string
          id?: string
          key: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          error_message?: string | null
          expires_at?: string
          id?: string
          key?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_delivery_logs: {
        Row: {
          created_at: string | null
          delivery_status: string
          delivery_timestamp: string | null
          error_message: string | null
          id: string
          message_id: string
          retry_count: number | null
        }
        Insert: {
          created_at?: string | null
          delivery_status: string
          delivery_timestamp?: string | null
          error_message?: string | null
          id?: string
          message_id: string
          retry_count?: number | null
        }
        Update: {
          created_at?: string | null
          delivery_status?: string
          delivery_timestamp?: string | null
          error_message?: string | null
          id?: string
          message_id?: string
          retry_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_delivery_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_analysis_results: {
        Row: {
          analysis_period: string
          anonymous_sentiment: number | null
          bot_detection_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          narrative_divergence: number | null
          propaganda_indicators: Json | null
          tier_1_sentiment: number | null
          tier_2_sentiment: number | null
          tier_3_sentiment: number | null
        }
        Insert: {
          analysis_period: string
          anonymous_sentiment?: number | null
          bot_detection_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          narrative_divergence?: number | null
          propaganda_indicators?: Json | null
          tier_1_sentiment?: number | null
          tier_2_sentiment?: number | null
          tier_3_sentiment?: number | null
        }
        Update: {
          analysis_period?: string
          anonymous_sentiment?: number | null
          bot_detection_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          narrative_divergence?: number | null
          propaganda_indicators?: Json | null
          tier_1_sentiment?: number | null
          tier_2_sentiment?: number | null
          tier_3_sentiment?: number | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json
          sent_at: string | null
          status: string
          subscription_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload: Json
          sent_at?: string | null
          status: string
          subscription_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      openstates_people_contacts: {
        Row: {
          contact_type: string
          created_at: string | null
          id: number
          note: string | null
          openstates_person_id: number
          value: string
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          id?: number
          note?: string | null
          openstates_person_id: number
          value: string
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          id?: number
          note?: string | null
          openstates_person_id?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "openstates_people_contacts_openstates_person_id_fkey"
            columns: ["openstates_person_id"]
            isOneToOne: false
            referencedRelation: "openstates_people_data"
            referencedColumns: ["id"]
          },
        ]
      }
      openstates_people_data: {
        Row: {
          biography: string | null
          birth_date: string | null
          created_at: string | null
          current_party: boolean | null
          death_date: string | null
          extras: Json | null
          family_name: string | null
          gender: string | null
          given_name: string | null
          id: number
          image_url: string | null
          middle_name: string | null
          name: string
          nickname: string | null
          openstates_id: string
          party: string | null
          suffix: string | null
          updated_at: string | null
        }
        Insert: {
          biography?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_party?: boolean | null
          death_date?: string | null
          extras?: Json | null
          family_name?: string | null
          gender?: string | null
          given_name?: string | null
          id?: number
          image_url?: string | null
          middle_name?: string | null
          name: string
          nickname?: string | null
          openstates_id: string
          party?: string | null
          suffix?: string | null
          updated_at?: string | null
        }
        Update: {
          biography?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_party?: boolean | null
          death_date?: string | null
          extras?: Json | null
          family_name?: string | null
          gender?: string | null
          given_name?: string | null
          id?: number
          image_url?: string | null
          middle_name?: string | null
          name?: string
          nickname?: string | null
          openstates_id?: string
          party?: string | null
          suffix?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      openstates_people_identifiers: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: number
          identifier: string
          openstates_person_id: number
          scheme: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: number
          identifier: string
          openstates_person_id: number
          scheme: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: number
          identifier?: string
          openstates_person_id?: number
          scheme?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openstates_people_identifiers_openstates_person_id_fkey"
            columns: ["openstates_person_id"]
            isOneToOne: false
            referencedRelation: "openstates_people_data"
            referencedColumns: ["id"]
          },
        ]
      }
      openstates_people_other_names: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: number
          name: string
          openstates_person_id: number
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: number
          name: string
          openstates_person_id: number
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: number
          name?: string
          openstates_person_id?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openstates_people_other_names_openstates_person_id_fkey"
            columns: ["openstates_person_id"]
            isOneToOne: false
            referencedRelation: "openstates_people_data"
            referencedColumns: ["id"]
          },
        ]
      }
      openstates_people_roles: {
        Row: {
          created_at: string | null
          district: string | null
          division: string | null
          end_date: string | null
          end_reason: string | null
          id: number
          is_current: boolean | null
          jurisdiction: string
          member_role: string | null
          openstates_person_id: number
          role_type: string
          start_date: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          division?: string | null
          end_date?: string | null
          end_reason?: string | null
          id?: number
          is_current?: boolean | null
          jurisdiction: string
          member_role?: string | null
          openstates_person_id: number
          role_type: string
          start_date?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          district?: string | null
          division?: string | null
          end_date?: string | null
          end_reason?: string | null
          id?: number
          is_current?: boolean | null
          jurisdiction?: string
          member_role?: string | null
          openstates_person_id?: number
          role_type?: string
          start_date?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "openstates_people_roles_openstates_person_id_fkey"
            columns: ["openstates_person_id"]
            isOneToOne: false
            referencedRelation: "openstates_people_data"
            referencedColumns: ["id"]
          },
        ]
      }
      openstates_people_social_media: {
        Row: {
          created_at: string | null
          id: number
          openstates_person_id: number
          platform: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          openstates_person_id: number
          platform: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: number
          openstates_person_id?: number
          platform?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "openstates_people_social_media_openstates_person_id_fkey"
            columns: ["openstates_person_id"]
            isOneToOne: false
            referencedRelation: "openstates_people_data"
            referencedColumns: ["id"]
          },
        ]
      }
      openstates_people_sources: {
        Row: {
          created_at: string | null
          id: number
          note: string | null
          openstates_person_id: number
          source_type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          note?: string | null
          openstates_person_id: number
          source_type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          note?: string | null
          openstates_person_id?: number
          source_type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "openstates_people_sources_openstates_person_id_fkey"
            columns: ["openstates_person_id"]
            isOneToOne: false
            referencedRelation: "openstates_people_data"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          endpoint: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          query_hash: string | null
          recorded_at: string | null
          session_id: string | null
          table_name: string | null
          tags: Json | null
          user_id: string | null
        }
        Insert: {
          endpoint?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          query_hash?: string | null
          recorded_at?: string | null
          session_id?: string | null
          table_name?: string | null
          tags?: Json | null
          user_id?: string | null
        }
        Update: {
          endpoint?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          query_hash?: string | null
          recorded_at?: string | null
          session_id?: string | null
          table_name?: string | null
          tags?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      platform_analytics: {
        Row: {
          category: string | null
          dimensions: Json | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end: string | null
          period_start: string | null
          source: string | null
          subcategory: string | null
          timestamp: string | null
        }
        Insert: {
          category?: string | null
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          period_end?: string | null
          period_start?: string | null
          source?: string | null
          subcategory?: string | null
          timestamp?: string | null
        }
        Update: {
          category?: string | null
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          period_end?: string | null
          period_start?: string | null
          source?: string | null
          subcategory?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string | null
          order_index: number | null
          poll_id: string
          text: string
          updated_at: string | null
          vote_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text?: string | null
          order_index?: number | null
          poll_id: string
          text: string
          updated_at?: string | null
          vote_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string | null
          order_index?: number | null
          poll_id?: string
          text?: string
          updated_at?: string | null
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_rankings: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string
          rankings: number[]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id: string
          rankings: number[]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string
          rankings?: number[]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_rankings_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple_votes: boolean | null
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
          is_public: boolean | null
          is_shareable: boolean | null
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
          offline_created: boolean | null
          options: Json | null
          participation: number | null
          participation_rate: number | null
          poll_question: string | null
          poll_settings: Json | null
          primary_hashtag: string | null
          privacy_level: string | null
          question: string | null
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
          unlocked_at: string | null
          updated_at: string | null
          verification_notes: string | null
          voting_method: string | null
        }
        Insert: {
          allow_multiple_votes?: boolean | null
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
          is_public?: boolean | null
          is_shareable?: boolean | null
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
          offline_created?: boolean | null
          options?: Json | null
          participation?: number | null
          participation_rate?: number | null
          poll_question?: string | null
          poll_settings?: Json | null
          primary_hashtag?: string | null
          privacy_level?: string | null
          question?: string | null
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
          unlocked_at?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          voting_method?: string | null
        }
        Update: {
          allow_multiple_votes?: boolean | null
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
          is_public?: boolean | null
          is_shareable?: boolean | null
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
          offline_created?: boolean | null
          options?: Json | null
          participation?: number | null
          participation_rate?: number | null
          poll_question?: string | null
          poll_settings?: Json | null
          primary_hashtag?: string | null
          privacy_level?: string | null
          question?: string | null
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
          unlocked_at?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          voting_method?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string | null
          created_at: string | null
          deactivated_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string | null
          preferences: Json | null
          subscription_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string | null
          preferences?: Json | null
          subscription_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string | null
          preferences?: Json | null
          subscription_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      query_performance_log: {
        Row: {
          buffer_hits: number | null
          buffer_reads: number | null
          cache_efficiency: number | null
          client_ip: unknown
          endpoint: string | null
          execution_time_ms: number
          expires_at: string | null
          id: string
          planning_time_ms: number | null
          query_hash: string
          query_signature: string
          query_type: string
          recorded_at: string | null
          rows_affected: number | null
          rows_scanned: number | null
          session_id: string | null
          slow_query: boolean | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          buffer_hits?: number | null
          buffer_reads?: number | null
          cache_efficiency?: number | null
          client_ip?: unknown
          endpoint?: string | null
          execution_time_ms: number
          expires_at?: string | null
          id?: string
          planning_time_ms?: number | null
          query_hash: string
          query_signature: string
          query_type: string
          recorded_at?: string | null
          rows_affected?: number | null
          rows_scanned?: number | null
          session_id?: string | null
          slow_query?: boolean | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          buffer_hits?: number | null
          buffer_reads?: number | null
          cache_efficiency?: number | null
          client_ip?: unknown
          endpoint?: string | null
          execution_time_ms?: number
          expires_at?: string | null
          id?: string
          planning_time_ms?: number | null
          query_hash?: string
          query_signature?: string
          query_type?: string
          recorded_at?: string | null
          rows_affected?: number | null
          rows_scanned?: number | null
          session_id?: string | null
          slow_query?: boolean | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "query_performance_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          expires_at: string | null
          id: string
          ip_address: unknown
          request_count: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          expires_at?: string | null
          id?: string
          ip_address: unknown
          request_count?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          request_count?: number | null
        }
        Relationships: []
      }
      representative_activity: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          id: number
          metadata: Json | null
          representative_id: number
          source: string | null
          source_url: string | null
          title: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
          representative_id: number
          source?: string | null
          source_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
          representative_id?: number
          source?: string | null
          source_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_activity_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_campaign_finance: {
        Row: {
          cash_on_hand: number | null
          created_at: string | null
          id: number
          last_filing_date: string | null
          representative_id: number | null
          source: string
          total_raised: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          cash_on_hand?: number | null
          created_at?: string | null
          id?: number
          last_filing_date?: string | null
          representative_id?: number | null
          source: string
          total_raised?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          cash_on_hand?: number | null
          created_at?: string | null
          id?: number
          last_filing_date?: string | null
          representative_id?: number | null
          source?: string
          total_raised?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_campaign_finance_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: true
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_committees: {
        Row: {
          committee_name: string
          created_at: string | null
          end_date: string | null
          id: number
          is_current: boolean | null
          representative_id: number
          role: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          committee_name: string
          created_at?: string | null
          end_date?: string | null
          id?: number
          is_current?: boolean | null
          representative_id: number
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          committee_name?: string
          created_at?: string | null
          end_date?: string | null
          id?: number
          is_current?: boolean | null
          representative_id?: number
          role?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_committees_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_contacts: {
        Row: {
          contact_type: string
          created_at: string | null
          id: number
          is_primary: boolean | null
          is_verified: boolean | null
          representative_id: number
          source: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          is_verified?: boolean | null
          representative_id: number
          source?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          is_verified?: boolean | null
          representative_id?: number
          source?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "representative_contacts_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_crosswalk_enhanced: {
        Row: {
          canonical_id: string
          created_at: string | null
          id: number
          last_verified: string | null
          representative_id: number | null
          source_confidence: string | null
          source_id: string
          source_system: string
          updated_at: string | null
        }
        Insert: {
          canonical_id: string
          created_at?: string | null
          id?: number
          last_verified?: string | null
          representative_id?: number | null
          source_confidence?: string | null
          source_id: string
          source_system: string
          updated_at?: string | null
        }
        Update: {
          canonical_id?: string
          created_at?: string | null
          id?: number
          last_verified?: string | null
          representative_id?: number | null
          source_confidence?: string | null
          source_id?: string
          source_system?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_crosswalk_enhanced_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_data_quality: {
        Row: {
          created_at: string | null
          data_completeness: number | null
          id: number
          last_validated: string | null
          overall_confidence: number | null
          primary_source_score: number | null
          representative_id: number | null
          secondary_source_score: number | null
          source_reliability: number | null
          updated_at: string | null
          validation_method: string | null
        }
        Insert: {
          created_at?: string | null
          data_completeness?: number | null
          id?: number
          last_validated?: string | null
          overall_confidence?: number | null
          primary_source_score?: number | null
          representative_id?: number | null
          secondary_source_score?: number | null
          source_reliability?: number | null
          updated_at?: string | null
          validation_method?: string | null
        }
        Update: {
          created_at?: string | null
          data_completeness?: number | null
          id?: number
          last_validated?: string | null
          overall_confidence?: number | null
          primary_source_score?: number | null
          representative_id?: number | null
          secondary_source_score?: number | null
          source_reliability?: number | null
          updated_at?: string | null
          validation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_data_quality_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: true
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_data_sources: {
        Row: {
          confidence: string
          created_at: string | null
          id: number
          last_updated: string | null
          raw_data: Json | null
          representative_id: number | null
          source_name: string
          source_type: string
          updated_at: string | null
          validation_status: string | null
        }
        Insert: {
          confidence: string
          created_at?: string | null
          id?: number
          last_updated?: string | null
          raw_data?: Json | null
          representative_id?: number | null
          source_name: string
          source_type: string
          updated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          confidence?: string
          created_at?: string | null
          id?: number
          last_updated?: string | null
          raw_data?: Json | null
          representative_id?: number | null
          source_name?: string
          source_type?: string
          updated_at?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_data_sources_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_enhanced_crosswalk: {
        Row: {
          attrs: Json | null
          canonical_id: string
          created_at: string | null
          entity_type: string
          id: number
          representative_id: number | null
          source: string
          source_id: string
          updated_at: string | null
        }
        Insert: {
          attrs?: Json | null
          canonical_id: string
          created_at?: string | null
          entity_type: string
          id?: number
          representative_id?: number | null
          source: string
          source_id: string
          updated_at?: string | null
        }
        Update: {
          attrs?: Json | null
          canonical_id?: string
          created_at?: string | null
          entity_type?: string
          id?: number
          representative_id?: number | null
          source?: string
          source_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_enhanced_crosswalk_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_photos: {
        Row: {
          alt_text: string | null
          attribution: string | null
          created_at: string | null
          height: number | null
          id: number
          is_primary: boolean | null
          representative_id: number
          source: string
          updated_at: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          attribution?: string | null
          created_at?: string | null
          height?: number | null
          id?: number
          is_primary?: boolean | null
          representative_id: number
          source: string
          updated_at?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          attribution?: string | null
          created_at?: string | null
          height?: number | null
          id?: number
          is_primary?: boolean | null
          representative_id?: number
          source?: string
          updated_at?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_photos_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representative_social_media: {
        Row: {
          created_at: string | null
          followers_count: number | null
          handle: string
          id: number
          is_primary: boolean | null
          is_verified: boolean | null
          platform: string
          representative_id: number
          updated_at: string | null
          url: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          followers_count?: number | null
          handle: string
          id?: number
          is_primary?: boolean | null
          is_verified?: boolean | null
          platform: string
          representative_id: number
          updated_at?: string | null
          url?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          followers_count?: number | null
          handle?: string
          id?: number
          is_primary?: boolean | null
          is_verified?: boolean | null
          platform?: string
          representative_id?: number
          updated_at?: string | null
          url?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "representative_social_media_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives_core"
            referencedColumns: ["id"]
          },
        ]
      }
      representatives_core: {
        Row: {
          ballotpedia_url: string | null
          bioguide_id: string | null
          canonical_id: string | null
          congress_gov_id: string | null
          created_at: string | null
          data_quality_score: number | null
          data_sources: Json | null
          district: string | null
          facebook_url: string | null
          fec_id: string | null
          google_civic_id: string | null
          govinfo_id: string | null
          id: number
          instagram_handle: string | null
          is_active: boolean | null
          last_verified: string | null
          legiscan_id: string | null
          level: string
          linkedin_url: string | null
          name: string
          next_election_date: string | null
          office: string
          openstates_id: string | null
          party: string | null
          primary_email: string | null
          primary_phone: string | null
          primary_photo_url: string | null
          primary_website: string | null
          state: string
          term_end_date: string | null
          term_start_date: string | null
          twitter_handle: string | null
          updated_at: string | null
          verification_status: string | null
          wikipedia_url: string | null
          youtube_channel: string | null
        }
        Insert: {
          ballotpedia_url?: string | null
          bioguide_id?: string | null
          canonical_id?: string | null
          congress_gov_id?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: Json | null
          district?: string | null
          facebook_url?: string | null
          fec_id?: string | null
          google_civic_id?: string | null
          govinfo_id?: string | null
          id?: number
          instagram_handle?: string | null
          is_active?: boolean | null
          last_verified?: string | null
          legiscan_id?: string | null
          level: string
          linkedin_url?: string | null
          name: string
          next_election_date?: string | null
          office: string
          openstates_id?: string | null
          party?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          primary_photo_url?: string | null
          primary_website?: string | null
          state: string
          term_end_date?: string | null
          term_start_date?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          verification_status?: string | null
          wikipedia_url?: string | null
          youtube_channel?: string | null
        }
        Update: {
          ballotpedia_url?: string | null
          bioguide_id?: string | null
          canonical_id?: string | null
          congress_gov_id?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: Json | null
          district?: string | null
          facebook_url?: string | null
          fec_id?: string | null
          google_civic_id?: string | null
          govinfo_id?: string | null
          id?: number
          instagram_handle?: string | null
          is_active?: boolean | null
          last_verified?: string | null
          legiscan_id?: string | null
          level?: string
          linkedin_url?: string | null
          name?: string
          next_election_date?: string | null
          office?: string
          openstates_id?: string | null
          party?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          primary_photo_url?: string | null
          primary_website?: string | null
          state?: string
          term_end_date?: string | null
          term_start_date?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          verification_status?: string | null
          wikipedia_url?: string | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_messages: {
        Row: {
          action_text: string | null
          action_url: string | null
          created_at: string | null
          created_by: string | null
          dismissible: boolean | null
          end_date: string | null
          id: string
          is_active: boolean | null
          last_viewed_at: string | null
          message: string
          metadata: Json | null
          priority: string | null
          start_date: string | null
          status: string | null
          target_audience: string | null
          title: string
          type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          created_by?: string | null
          dismissible?: boolean | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          message: string
          metadata?: Json | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string | null
          created_by?: string | null
          dismissible?: boolean | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          device_id: string | null
          duration_ms: number | null
          failure_count: number
          id: string
          success_count: number
          sync_details: Json | null
          synced_at: string | null
          total_actions: number
          user_id: string | null
        }
        Insert: {
          device_id?: string | null
          duration_ms?: number | null
          failure_count?: number
          id?: string
          success_count?: number
          sync_details?: Json | null
          synced_at?: string | null
          total_actions?: number
          user_id?: string | null
        }
        Update: {
          device_id?: string | null
          duration_ms?: number | null
          failure_count?: number
          id?: string
          success_count?: number
          sync_details?: Json | null
          synced_at?: string | null
          total_actions?: number
          user_id?: string | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          alerts: Json | null
          details: Json | null
          error_rate: number | null
          health_status: string
          id: string
          last_check: string | null
          metadata: Json | null
          next_check: string | null
          response_time: number | null
          service_name: string
          uptime_percentage: number | null
        }
        Insert: {
          alerts?: Json | null
          details?: Json | null
          error_rate?: number | null
          health_status: string
          id?: string
          last_check?: string | null
          metadata?: Json | null
          next_check?: string | null
          response_time?: number | null
          service_name: string
          uptime_percentage?: number | null
        }
        Update: {
          alerts?: Json | null
          details?: Json | null
          error_rate?: number | null
          health_status?: string
          id?: string
          last_check?: string | null
          metadata?: Json | null
          next_check?: string | null
          response_time?: number | null
          service_name?: string
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          momentum: number | null
          score: number | null
          sentiment_score: number | null
          source_name: string | null
          title: string | null
          topic: string
          trending_score: number | null
          updated_at: string | null
          velocity: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          momentum?: number | null
          score?: number | null
          sentiment_score?: number | null
          source_name?: string | null
          title?: string | null
          topic: string
          trending_score?: number | null
          updated_at?: string | null
          velocity?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          momentum?: number | null
          score?: number | null
          sentiment_score?: number | null
          source_name?: string | null
          title?: string | null
          topic?: string
          trending_score?: number | null
          updated_at?: string | null
          velocity?: number | null
        }
        Relationships: []
      }
      trust_tier_analytics: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          previous_tier: string | null
          tier_change_reason: string | null
          trust_tier: string
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          previous_tier?: string | null
          tier_change_reason?: string | null
          trust_tier: string
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          previous_tier?: string | null
          tier_change_reason?: string | null
          trust_tier?: string
          user_id?: string
        }
        Relationships: []
      }
      trust_tier_progression: {
        Row: {
          created_at: string | null
          id: string
          new_tier: number
          previous_tier: number | null
          progression_data: Json | null
          progression_reason: string | null
          reason: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_tier: number
          previous_tier?: number | null
          progression_data?: Json | null
          progression_reason?: string | null
          reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_tier?: number
          previous_tier?: number | null
          progression_data?: Json | null
          progression_reason?: string | null
          reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_tier_progression_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hashtags: {
        Row: {
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
      user_profiles: {
        Row: {
          analytics_dashboard_mode: string | null
          avatar_url: string | null
          bio: string | null
          community_focus: string[] | null
          created_at: string | null
          dashboard_layout: Json | null
          demographics: Json | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          participation_style: string | null
          primary_concerns: string[] | null
          privacy_settings: Json | null
          trust_tier: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          analytics_dashboard_mode?: string | null
          avatar_url?: string | null
          bio?: string | null
          community_focus?: string[] | null
          created_at?: string | null
          dashboard_layout?: Json | null
          demographics?: Json | null
          display_name?: string | null
          email: string
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          participation_style?: string | null
          primary_concerns?: string[] | null
          privacy_settings?: Json | null
          trust_tier?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          analytics_dashboard_mode?: string | null
          avatar_url?: string | null
          bio?: string | null
          community_focus?: string[] | null
          created_at?: string | null
          dashboard_layout?: Json | null
          demographics?: Json | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          participation_style?: string | null
          primary_concerns?: string[] | null
          privacy_settings?: Json | null
          trust_tier?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          actions_count: number | null
          avg_page_load_time: number | null
          bounce_rate: number | null
          conversion_events: Json | null
          device_info: Json | null
          ended_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          location: Json | null
          metadata: Json | null
          page_views: number | null
          session_id: string
          started_at: string | null
          total_session_duration: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actions_count?: number | null
          avg_page_load_time?: number | null
          bounce_rate?: number | null
          conversion_events?: Json | null
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          location?: Json | null
          metadata?: Json | null
          page_views?: number | null
          session_id: string
          started_at?: string | null
          total_session_duration?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actions_count?: number | null
          avg_page_load_time?: number | null
          bounce_rate?: number | null
          conversion_events?: Json | null
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          location?: Json | null
          metadata?: Json | null
          page_views?: number | null
          session_id?: string
          started_at?: string | null
          total_session_duration?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vote_trust_tiers: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          sentiment_score: number | null
          trust_tier: number
          vote_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          sentiment_score?: number | null
          trust_tier: number
          vote_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          sentiment_score?: number | null
          trust_tier?: number
          vote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vote_trust_tiers_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "user_voting_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_trust_tiers_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          linked_at: string | null
          offline_synced: boolean | null
          offline_timestamp: number | null
          option_id: string
          poll_id: string
          poll_option_id: string | null
          poll_question: string | null
          trust_tier: number | null
          updated_at: string | null
          user_id: string | null
          vote_status: string | null
          voter_session: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          linked_at?: string | null
          offline_synced?: boolean | null
          offline_timestamp?: number | null
          option_id: string
          poll_id: string
          poll_option_id?: string | null
          poll_question?: string | null
          trust_tier?: number | null
          updated_at?: string | null
          user_id?: string | null
          vote_status?: string | null
          voter_session?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          linked_at?: string | null
          offline_synced?: boolean | null
          offline_timestamp?: number | null
          option_id?: string
          poll_id?: string
          poll_option_id?: string | null
          poll_question?: string | null
          trust_tier?: number | null
          updated_at?: string | null
          user_id?: string | null
          vote_status?: string | null
          voter_session?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_option_id_fkey"
            columns: ["poll_option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
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
          metadata: Json | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string | null
          expires_at: string
          id?: string
          metadata?: Json | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          public_key: string
          rp_id: string | null
          user_handle: string | null
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          public_key: string
          rp_id?: string | null
          user_handle?: string | null
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          public_key?: string
          rp_id?: string | null
          user_handle?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      idempotency_monitor: {
        Row: {
          avg_duration_seconds: number | null
          count: number | null
          max_duration_seconds: number | null
          status: string | null
          stuck_count: number | null
        }
        Relationships: []
      }
      user_voting_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          is_public: boolean | null
          is_shareable: boolean | null
          linked_at: string | null
          option_id: string | null
          option_text: string | null
          poll_id: string | null
          poll_question: string | null
          trust_tier: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_platform_metrics:
        | {
            Args: {
              end_time: string
              metric_name_param?: string
              start_time: string
            }
            Returns: {
              metric_name: string
              metric_value: number
              period_end: string
              period_start: string
            }[]
          }
        | {
            Args: {
              end_time: string
              metric_name_param: string
              start_time: string
            }
            Returns: {
              avg_value: number
              count_records: number
              max_value: number
              metric_name: string
              min_value: number
              total_value: number
            }[]
          }
      analyze_geographic_intelligence:
        | {
            Args: never
            Returns: {
              engagement_score: number
              poll_count: number
              region: string
              user_count: number
            }[]
          }
        | {
            Args: { p_analysis_window?: unknown; p_poll_id: string }
            Returns: Json
          }
      analyze_narrative_divergence: {
        Args: {
          p_analysis_period?: string
          p_content_id: string
          p_content_type: string
        }
        Returns: Json
      }
      analyze_poll_sentiment:
        | {
            Args: { p_poll_id: string }
            Returns: {
              negative_votes: number
              neutral_votes: number
              positive_votes: number
              sentiment_score: number
            }[]
          }
        | {
            Args: { p_poll_id: string; p_time_window?: unknown }
            Returns: Json
          }
      analyze_polls_table: {
        Args: never
        Returns: {
          last_analyzed: string
          table_name: string
          total_rows: number
        }[]
      }
      analyze_query_performance: {
        Args: {
          p_buffer_hits?: number
          p_buffer_reads?: number
          p_client_ip?: unknown
          p_execution_time_ms: number
          p_planning_time_ms?: number
          p_query_hash: string
          p_query_signature: string
          p_query_type: string
          p_rows_affected?: number
          p_rows_scanned?: number
          p_session_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      analyze_temporal_patterns:
        | {
            Args: never
            Returns: {
              activity_level: number
              day_of_week: number
              hour_of_day: number
              peak_period: boolean
            }[]
          }
        | {
            Args: { p_analysis_window?: unknown; p_poll_id: string }
            Returns: Json
          }
      calculate_trust_filtered_votes: {
        Args: { p_poll_id: string; p_trust_tier_filter?: number }
        Returns: Json
      }
      calculate_trust_weighted_votes: {
        Args: { p_poll_id: string }
        Returns: Json
      }
      calculate_user_trust_tier: {
        Args: { p_user_id: string }
        Returns: number
      }
      cleanup_expired_audit_logs: { Args: never; Returns: number }
      cleanup_expired_data: {
        Args: never
        Returns: {
          cleanup_time: string
          rows_deleted: number
          table_name: string
        }[]
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_idempotency_keys: { Args: never; Returns: number }
      cleanup_inactive_sessions: { Args: never; Returns: number }
      cleanup_inactive_subscriptions: { Args: never; Returns: undefined }
      cleanup_old_notification_logs: { Args: never; Returns: undefined }
      cleanup_old_sync_logs: { Args: never; Returns: undefined }
      cleanup_performance_data: { Args: never; Returns: Json }
      create_audit_log: {
        Args: {
          p_action?: string
          p_event_name: string
          p_event_type: Database["public"]["Enums"]["audit_event_type"]
          p_granted?: boolean
          p_ip_address?: unknown
          p_metadata?: Json
          p_resource?: string
          p_retention_days?: number
          p_severity?: Database["public"]["Enums"]["audit_severity"]
          p_status?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      detect_bot_behavior:
        | { Args: { p_user_id: string }; Returns: Json }
        | {
            Args: { p_poll_id: string; p_time_window?: unknown }
            Returns: Json
          }
      exec_sql: { Args: { sql: string }; Returns: string }
      get_audit_log_stats: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          count: number
          event_type: Database["public"]["Enums"]["audit_event_type"]
          severity: Database["public"]["Enums"]["audit_severity"]
          success_rate: number
          unique_users: number
        }[]
      }
      get_comprehensive_analytics:
        | {
            Args: { p_analysis_window?: unknown; p_poll_id: string }
            Returns: Json
          }
        | {
            Args: { p_poll_id: string; p_trust_tiers?: number[] }
            Returns: Json
          }
      get_hashtag_trending_history: {
        Args: { p_hashtag_id: string }
        Returns: {
          position_rank: number
          score: number
          timestamp_value: string
        }[]
      }
      get_heatmap: {
        Args: {
          level_filter?: string
          min_count?: number
          state_filter?: string
        }
        Returns: {
          district_id: string
          district_name: string
          engagement_count: number
          level: string
          representative_count: number
          state: string
        }[]
      }
      get_performance_recommendations: {
        Args: never
        Returns: {
          affected_tables: string[]
          description: string
          estimated_impact: string
          occurrence_count: number
          recommendation_type: string
          severity: string
          suggested_action: string
        }[]
      }
      get_personalized_recommendations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: Json
      }
      get_poll_results_by_trust_tier: {
        Args: { p_poll_id: string; p_trust_tiers?: number[] }
        Returns: Json
      }
      get_poll_votes_by_trust_tier: {
        Args: {
          p_max_trust_tier?: number
          p_min_trust_tier?: number
          p_poll_id: string
        }
        Returns: Json
      }
      get_real_time_analytics: {
        Args: { p_poll_id: string; p_time_window?: unknown }
        Returns: {
          engagement_score: number
          peak_activity_time: string
          poll_id: string
          real_time_metrics: Json
          total_votes: number
          trust_tier_distribution: Json
          viral_coefficient: number
          votes_per_hour: number
        }[]
      }
      get_trust_tier_progression: { Args: { p_user_id: string }; Returns: Json }
      get_user_voting_history: { Args: { p_user_id: string }; Returns: Json }
      link_anonymous_votes_to_user: {
        Args: { p_user_id: string; p_voter_session: string }
        Returns: number
      }
      optimize_database_performance: {
        Args: never
        Returns: {
          details: string
          execution_time: unknown
          optimization_type: string
          status: string
        }[]
      }
      rebuild_poll_indexes: { Args: never; Returns: undefined }
      refresh_poll_statistics_view: { Args: never; Returns: undefined }
      run_maintenance_job: {
        Args: { p_job_name: string; p_job_type: string }
        Returns: Json
      }
      update_cache_performance_metrics: {
        Args: {
          p_cache_key: string
          p_cache_size_bytes?: number
          p_cache_type?: string
          p_operation: string
          p_operation_time_ms?: number
          p_ttl_seconds?: number
        }
        Returns: string
      }
      update_hashtag_trending_scores: { Args: never; Returns: undefined }
      update_poll_demographic_insights: {
        Args: { p_poll_id: string }
        Returns: undefined
      }
      update_poll_statistics: { Args: never; Returns: undefined }
      update_trending_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      audit_event_type:
        | "authentication"
        | "authorization"
        | "data_access"
        | "data_modification"
        | "analytics_access"
        | "admin_action"
        | "security_event"
        | "system_event"
        | "user_action"
      audit_severity: "info" | "warning" | "error" | "critical"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_event_type: [
        "authentication",
        "authorization",
        "data_access",
        "data_modification",
        "analytics_access",
        "admin_action",
        "security_event",
        "system_event",
        "user_action",
      ],
      audit_severity: ["info", "warning", "error", "critical"],
    },
  },
} as const
