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
          created_at: string | null
          created_by: string
          current_signatures: number | null
          description: string | null
          end_date: string | null
          id: string
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
          created_at?: string | null
          created_by: string
          current_signatures?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
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
          created_at?: string | null
          created_by?: string
          current_signatures?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
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
      contact_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          priority: string | null
          representative_id: number
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          representative_id: number
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          representative_id?: number
          status?: string | null
          subject?: string
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
        ]
      }
      contact_threads: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          thread_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          thread_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_threads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          feedback_type: string
          id: string
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          feedback_type: string
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          feedback_type?: string
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hashtag_flags: {
        Row: {
          created_at: string | null
          flag_type: string
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
      hashtags: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_trending: boolean | null
          is_verified: boolean | null
          name: string
          trending_score: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_trending?: boolean | null
          is_verified?: boolean | null
          name: string
          trending_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_trending?: boolean | null
          is_verified?: boolean | null
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
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          order_index: number | null
          poll_id: string
          text: string
          vote_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          poll_id: string
          text: string
          vote_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          poll_id?: string
          text?: string
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
          options: Json | null
          participation: number | null
          participation_rate: number | null
          poll_settings: Json | null
          primary_hashtag: string | null
          privacy_level: string | null
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
          options?: Json | null
          participation?: number | null
          participation_rate?: number | null
          poll_settings?: Json | null
          primary_hashtag?: string | null
          privacy_level?: string | null
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
          options?: Json | null
          participation?: number | null
          participation_rate?: number | null
          poll_settings?: Json | null
          primary_hashtag?: string | null
          privacy_level?: string | null
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
          handle: string
          id: number
          is_primary: boolean | null
          is_verified: boolean | null
          platform: string
          representative_id: number
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          handle: string
          id?: number
          is_primary?: boolean | null
          is_verified?: boolean | null
          platform: string
          representative_id: number
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          handle?: string
          id?: number
          is_primary?: boolean | null
          is_verified?: boolean | null
          platform?: string
          representative_id?: number
          updated_at?: string | null
          url?: string | null
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
          canonical_id: string | null
          created_at: string | null
          data_quality_score: number | null
          district: string | null
          id: number
          is_active: boolean | null
          last_verified: string | null
          level: string
          name: string
          office: string
          openstates_id: string | null
          party: string | null
          state: string
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          canonical_id?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          district?: string | null
          id?: number
          is_active?: boolean | null
          last_verified?: string | null
          level: string
          name: string
          office: string
          openstates_id?: string | null
          party?: string | null
          state: string
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          canonical_id?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          district?: string | null
          id?: number
          is_active?: boolean | null
          last_verified?: string | null
          level?: string
          name?: string
          office?: string
          openstates_id?: string | null
          party?: string | null
          state?: string
          updated_at?: string | null
          verification_status?: string | null
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
      user_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
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
          avatar_url: string | null
          bio: string | null
          community_focus: string[] | null
          created_at: string | null
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
          avatar_url?: string | null
          bio?: string | null
          community_focus?: string[] | null
          created_at?: string | null
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
          avatar_url?: string | null
          bio?: string | null
          community_focus?: string[] | null
          created_at?: string | null
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
      votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
          vote_weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
          vote_weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
          vote_weight?: number | null
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
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string | null
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string | null
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: { Args: { sql: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
