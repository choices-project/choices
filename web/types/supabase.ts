export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      civic_jurisdictions: {
        Row: {
          id: string
          ocd_division_id: string
          name: string
          type: string
          parent_ocd_id: string | null
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ocd_division_id: string
          name: string
          type: string
          parent_ocd_id?: string | null
          level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ocd_division_id?: string
          name?: string
          type?: string
          parent_ocd_id?: string | null
          level?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_jurisdictions_parent_ocd_id_fkey"
            columns: ["parent_ocd_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          }
        ]
      }
      jurisdiction_aliases: {
        Row: {
          id: string
          ocd_division_id: string
          alias_type: string
          alias_value: string
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          ocd_division_id: string
          alias_type: string
          alias_value: string
          confidence?: number
          created_at?: string
        }
        Update: {
          id?: string
          ocd_division_id?: string
          alias_type?: string
          alias_value?: string
          confidence?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_aliases_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          }
        ]
      }
      jurisdiction_geometries: {
        Row: {
          id: string
          ocd_division_id: string
          geometry: Json
          simplified_geometry: Json | null
          bbox: Json
          created_at: string
        }
        Insert: {
          id?: string
          ocd_division_id: string
          geometry: Json
          simplified_geometry?: Json | null
          bbox: Json
          created_at?: string
        }
        Update: {
          id?: string
          ocd_division_id?: string
          geometry?: Json
          simplified_geometry?: Json | null
          bbox?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_geometries_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          }
        ]
      }
      jurisdiction_tiles: {
        Row: {
          id: string
          ocd_division_id: string
          h3_tile: string
          resolution: number
          created_at: string
        }
        Insert: {
          id?: string
          ocd_division_id: string
          h3_tile: string
          resolution: number
          created_at?: string
        }
        Update: {
          id?: string
          ocd_division_id?: string
          h3_tile?: string
          resolution?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_tiles_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          }
        ]
      }
      candidate_jurisdictions: {
        Row: {
          id: string
          candidate_id: string
          ocd_division_id: string
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          ocd_division_id: string
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          ocd_division_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_jurisdictions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_jurisdictions_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          }
        ]
      }
      user_location_resolutions: {
        Row: {
          id: string
          user_id: string
          ocd_division_id: string
          quantized_lat: number
          quantized_lon: number
          precision_level: number
          consent_given: boolean
          consent_timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ocd_division_id: string
          quantized_lat: number
          quantized_lon: number
          precision_level: number
          consent_given: boolean
          consent_timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ocd_division_id?: string
          quantized_lat?: number
          quantized_lon?: number
          precision_level?: number
          consent_given?: boolean
          consent_timestamp?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_location_resolutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_resolutions_ocd_division_id_fkey"
            columns: ["ocd_division_id"]
            isOneToOne: false
            referencedRelation: "civic_jurisdictions"
            referencedColumns: ["ocd_division_id"]
          }
        ]
      }
      // ... existing tables remain unchanged
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
