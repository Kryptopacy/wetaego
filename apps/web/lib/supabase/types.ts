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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      staff_shifts: {
        Row: {
          id: string
          location_id: string
          profile_id: string
          clock_in_time: string
          clock_out_time: string | null
          status: 'active' | 'completed' | 'auto_completed'
          total_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          profile_id: string
          clock_in_time?: string
          clock_out_time?: string | null
          status?: 'active' | 'completed' | 'auto_completed'
          total_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          profile_id?: string
          clock_in_time?: string
          clock_out_time?: string | null
          status?: 'active' | 'completed' | 'auto_completed'
          total_hours?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          reason: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          reason: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pages: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_published: boolean
          randomizer_enabled: boolean
          location_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          randomizer_enabled?: boolean
          location_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean
          randomizer_enabled?: boolean
          location_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pages_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          ai_enabled: boolean
          ai_instructions: string | null
          ai_name: string
          brand_knowledge: string | null
          cover_image_url: string | null
          created_at: string
          currency_code: string
          facebook_handle: string | null
          id: string
          instagram_handle: string | null
          name: string
          operating_hours: string | null
          organization_id: string
          phone: string | null
          phone_number: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          slug: string
          tagline: string | null
          theme_color: string
          twitter_handle: string | null
          updated_at: string
          whatsapp_number: string | null
          wifi_network: string | null
          wifi_password: string | null
          manual_payment_enabled: boolean
          manual_payment_bank_name: string | null
          manual_payment_account_name: string | null
          manual_payment_account_number: string | null
          manual_payment_instructions: string | null
          global_discount_enabled: boolean | null
          global_discount_percentage: number | null
          global_discount_banner_text: string | null
          spinner_enabled: boolean | null
          spinner_config: Json | null
        }
        Insert: {
          address?: string | null
          ai_enabled?: boolean
          ai_instructions?: string | null
          ai_name?: string
          brand_knowledge?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency_code?: string
          facebook_handle?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_handle?: string | null
          name: string
          operating_hours?: string | null
          organization_id: string
          phone?: string | null
          phone_number?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          slug: string
          tagline?: string | null
          theme_color?: string
          twitter_handle?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          wifi_network?: string | null
          wifi_password?: string | null
          manual_payment_enabled?: boolean
          manual_payment_bank_name?: string | null
          manual_payment_account_name?: string | null
          manual_payment_account_number?: string | null
          manual_payment_instructions?: string | null
          global_discount_enabled?: boolean | null
          global_discount_percentage?: number | null
          global_discount_banner_text?: string | null
          spinner_enabled?: boolean | null
          spinner_config?: Json | null
        }
        Update: {
          address?: string | null
          ai_enabled?: boolean
          ai_instructions?: string | null
          ai_name?: string
          brand_knowledge?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency_code?: string
          facebook_handle?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_handle?: string | null
          name?: string
          operating_hours?: string | null
          organization_id?: string
          phone?: string | null
          phone_number?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          slug?: string
          tagline?: string | null
          theme_color?: string
          twitter_handle?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          wifi_network?: string | null
          wifi_password?: string | null
          manual_payment_enabled?: boolean
          manual_payment_bank_name?: string | null
          manual_payment_account_name?: string | null
          manual_payment_account_number?: string | null
          manual_payment_instructions?: string | null
          global_discount_enabled?: boolean | null
          global_discount_percentage?: number | null
          global_discount_banner_text?: string | null
          spinner_enabled?: boolean | null
          spinner_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          created_at: string
          id: string
          object_path: string
          organization_id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          created_at?: string
          id?: string
          object_path: string
          organization_id: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          id?: string
          object_path?: string
          organization_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          menu_id: string
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          menu_id: string
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          menu_id?: string
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergen_tags: string[]
          allergens: string[]
          availability_status: Database["public"]["Enums"]["availability_status"]
          category_id: string
          created_at: string
          description: string | null
          dietary_tags: string[]
          id: string
          image_url: string | null
          is_featured: boolean
          name: string
          organization_id: string
          price_minor: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergen_tags?: string[]
          allergens?: string[]
          availability_status?: Database["public"]["Enums"]["availability_status"]
          category_id: string
          created_at?: string
          description?: string | null
          dietary_tags?: string[]
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name: string
          organization_id: string
          price_minor?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergen_tags?: string[]
          allergens?: string[]
          availability_status?: Database["public"]["Enums"]["availability_status"]
          category_id?: string
          created_at?: string
          description?: string | null
          dietary_tags?: string[]
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name?: string
          organization_id?: string
          price_minor?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          location_id: string
          name: string
          organization_id: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          sort_order: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location_id: string
          name: string
          organization_id: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location_id?: string
          name?: string
          organization_id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          sort_order?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          item_name: string
          order_id: string
          price_minor: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_name: string
          order_id: string
          price_minor?: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string
          order_id?: string
          price_minor?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          order_id: string | null
          provider_reference: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          order_id?: string | null
          provider_reference: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          order_id?: string | null
          provider_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          business_feedback: string | null
          business_rating: number | null
          created_at: string
          id: string
          location_id: string
          order_id: string
          organization_id: string
          staff_feedback: string | null
          staff_id: string | null
          staff_rating: number
        }
        Insert: {
          business_feedback?: string | null
          business_rating?: number | null
          created_at?: string
          id?: string
          location_id: string
          order_id: string
          organization_id: string
          staff_feedback?: string | null
          staff_id?: string | null
          staff_rating: number
        }
        Update: {
          business_feedback?: string | null
          business_rating?: number | null
          created_at?: string
          id?: string
          location_id?: string
          order_id?: string
          organization_id?: string
          staff_feedback?: string | null
          staff_id?: string | null
          staff_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_paid_minor: number | null
          assigned_staff_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_note: string | null
          discount_amount_minor: number | null
          estimated_prep_time_minutes: number | null
          estimated_ready_at: string | null
          feedback_pin: string
          id: string
          location_id: string
          organization_id: string
          payment_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_identifier: string | null
          tip_amount_minor: number | null
          total_amount_minor: number
          updated_at: string
        }
        Insert: {
          amount_paid_minor?: number | null
          assigned_staff_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          discount_amount_minor?: number | null
          estimated_prep_time_minutes?: number | null
          estimated_ready_at?: string | null
          feedback_pin?: string
          id?: string
          location_id: string
          organization_id: string
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_identifier?: string | null
          tip_amount_minor?: number | null
          total_amount_minor?: number
          updated_at?: string
        }
        Update: {
          amount_paid_minor?: number | null
          assigned_staff_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          discount_amount_minor?: number | null
          estimated_prep_time_minutes?: number | null
          estimated_ready_at?: string | null
          feedback_pin?: string
          id?: string
          location_id?: string
          organization_id?: string
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_identifier?: string | null
          tip_amount_minor?: number | null
          total_amount_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_payment_settings: {
        Row: {
          created_at: string
          is_active: boolean
          organization_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_account_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          organization_id: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_account_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          organization_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_payment_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          current_period_end: string | null
          id: string
          logo_url: string | null
          max_concurrent_orders: number
          monthly_free_credits_used: number
          name: string
          plan: string
          purchased_credits: number
          slug: string
          subscription_plan: string
          subscription_status: string
          subscription_tier: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_period_end?: string | null
          id?: string
          logo_url?: string | null
          max_concurrent_orders?: number
          monthly_free_credits_used?: number
          name: string
          plan?: string
          purchased_credits?: number
          slug: string
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_period_end?: string | null
          id?: string
          logo_url?: string | null
          max_concurrent_orders?: number
          monthly_free_credits_used?: number
          name?: string
          plan?: string
          purchased_credits?: number
          slug?: string
          subscription_plan?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          created_at: string
          destination_path: string
          id: string
          is_active: boolean
          label: string
          location_id: string
          organization_id: string
          table_identifier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_path: string
          id?: string
          is_active?: boolean
          label?: string
          location_id: string
          organization_id: string
          table_identifier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_path?: string
          id?: string
          is_active?: boolean
          label?: string
          location_id?: string
          organization_id?: string
          table_identifier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_events: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          location_id: string | null
          organization_id: string | null
          qr_code_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          location_id?: string | null
          organization_id?: string | null
          qr_code_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          location_id?: string | null
          organization_id?: string | null
          qr_code_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string
          custom_request_text: string | null
          id: string
          location_id: string
          organization_id: string
          request_type: Database["public"]["Enums"]["service_request_type"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          table_identifier: string
          urgency_tier: string
        }
        Insert: {
          created_at?: string
          custom_request_text?: string | null
          id?: string
          location_id: string
          organization_id: string
          request_type?: Database["public"]["Enums"]["service_request_type"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          table_identifier: string
          urgency_tier?: string
        }
        Update: {
          created_at?: string
          custom_request_text?: string | null
          id?: string
          location_id?: string
          organization_id?: string
          request_type?: Database["public"]["Enums"]["service_request_type"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          table_identifier?: string
          urgency_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          location_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          location_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          location_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_tips: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          location_id: string
          order_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          id?: string
          location_id: string
          order_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          location_id?: string
          order_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tips_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string | null
          provider_reference: string
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string | null
          provider_reference: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string | null
          provider_reference?: string
        }
        Relationships: []
      }
    }
    Views: {
      organization_member_details: {
        Row: {
          created_at: string | null
          email: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: never
          organization_id?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: never
          organization_id?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invite_by_token: {
        Args: { lookup_token: string }
        Returns: boolean
      }
      claim_order: {
        Args: { p_order_id: string; p_prep_time_minutes: number }
        Returns: boolean
      }
      get_invite_by_token: {
        Args: { lookup_token: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }[]
      }
    }
    Enums: {
      availability_status: "available" | "low" | "sold_out" | "hidden"
      member_role: "owner" | "manager" | "editor" | "viewer"
      order_status: "pending" | "paid" | "preparing" | "completed" | "cancelled"
      payment_provider: "paystack" | "stripe"
      publication_status: "draft" | "published" | "archived"
      service_request_status: "pending" | "acknowledged" | "resolved"
      service_request_type: "waiter" | "bill" | "cleanup"
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
      availability_status: ["available", "low", "sold_out", "hidden"],
      member_role: ["owner", "manager", "editor", "viewer"],
      order_status: ["pending", "paid", "preparing", "completed", "cancelled"],
      payment_provider: ["paystack", "stripe"],
      publication_status: ["draft", "published", "archived"],
      service_request_status: ["pending", "acknowledged", "resolved"],
      service_request_type: ["waiter", "bill", "cleanup"],
    },
  },
} as const
