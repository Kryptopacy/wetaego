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
      affiliate_earnings: {
        Row: {
          affiliate_id: string
          amount_minor: number
          billing_payment_id: string
          created_at: string
          id: string
          organization_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount_minor: number
          billing_payment_id: string
          created_at?: string
          id?: string
          organization_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount_minor?: number
          billing_payment_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earnings_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_billing_payment_id_fkey"
            columns: ["billing_payment_id"]
            isOneToOne: false
            referencedRelation: "billing_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          created_at: string
          id: string
          paystack_subaccount_code: string | null
          referral_code: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paystack_subaccount_code?: string | null
          referral_code: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paystack_subaccount_code?: string | null
          referral_code?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          organization_id?: string
          user_id?: string | null
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
      billing_payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          organization_id: string
          payment_purpose: string
          provider_reference: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          payment_purpose: string
          provider_reference: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          payment_purpose?: string
          provider_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          organization_id: string
          redeemed_by: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          organization_id: string
          redeemed_by: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          plan_tier: string | null
          times_redeemed: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          plan_tier?: string | null
          times_redeemed?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          plan_tier?: string | null
          times_redeemed?: number
        }
        Relationships: []
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
      customer_profiles: {
        Row: {
          created_at: string | null
          credit_balance_minor: number | null
          credit_limit_minor: number | null
          credit_score: number | null
          email: string
          id: string
          is_iou_approved: boolean | null
          last_visit_at: string | null
          loyalty_points: number | null
          marketing_opt_in: boolean | null
          organization_id: string
          total_orders: number | null
          total_spend_minor: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_balance_minor?: number | null
          credit_limit_minor?: number | null
          credit_score?: number | null
          email: string
          id?: string
          is_iou_approved?: boolean | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          marketing_opt_in?: boolean | null
          organization_id: string
          total_orders?: number | null
          total_spend_minor?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_balance_minor?: number | null
          credit_limit_minor?: number | null
          credit_score?: number | null
          email?: string
          id?: string
          is_iou_approved?: boolean | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          marketing_opt_in?: boolean | null
          organization_id?: string
          total_orders?: number | null
          total_spend_minor?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intercom_channel_members: {
        Row: {
          channel_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercom_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "intercom_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      intercom_channels: {
        Row: {
          created_at: string
          id: string
          name: string | null
          organization_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercom_channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intercom_messages: {
        Row: {
          audio_url: string | null
          channel_id: string
          content_text: string | null
          created_at: string
          id: string
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          channel_id: string
          content_text?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          channel_id?: string
          content_text?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercom_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "intercom_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      iou_installments: {
        Row: {
          amount_due_minor: number
          created_at: string
          customer_id: string
          due_date: string
          id: string
          organization_id: string
          payment_link: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_due_minor: number
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          organization_id: string
          payment_link?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_due_minor?: number
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          organization_id?: string
          payment_link?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iou_installments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iou_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      iou_settings: {
        Row: {
          auto_approve_spend_threshold_minor: number | null
          created_at: string | null
          default_credit_limit_minor: number | null
          is_enabled: boolean | null
          organization_id: string
          reminder_frequency_days: number | null
          updated_at: string | null
        }
        Insert: {
          auto_approve_spend_threshold_minor?: number | null
          created_at?: string | null
          default_credit_limit_minor?: number | null
          is_enabled?: boolean | null
          organization_id: string
          reminder_frequency_days?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_approve_spend_threshold_minor?: number | null
          created_at?: string | null
          default_credit_limit_minor?: number | null
          is_enabled?: boolean | null
          organization_id?: string
          reminder_frequency_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iou_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      iou_transactions: {
        Row: {
          amount_minor: number
          created_at: string
          customer_id: string
          id: string
          order_id: string | null
          organization_id: string
          reference: string | null
          type: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          customer_id: string
          id?: string
          order_id?: string | null
          organization_id: string
          reference?: string | null
          type: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          organization_id?: string
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "iou_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iou_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iou_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pages: {
        Row: {
          billing_enabled: boolean
          billing_mode: string | null
          business_type_preset: string | null
          content: string | null
          created_at: string
          deposit_percentage: number | null
          id: string
          is_primary: boolean
          is_published: boolean
          location_id: string
          page_images: string[] | null
          payment_mode: string | null
          randomizer_enabled: boolean | null
          slug: string
          template_data: Json | null
          template_type: string
          title: string
          updated_at: string
        }
        Insert: {
          billing_enabled?: boolean
          billing_mode?: string | null
          business_type_preset?: string | null
          content?: string | null
          created_at?: string
          deposit_percentage?: number | null
          id?: string
          is_primary?: boolean
          is_published?: boolean
          location_id: string
          page_images?: string[] | null
          payment_mode?: string | null
          randomizer_enabled?: boolean | null
          slug: string
          template_data?: Json | null
          template_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          billing_enabled?: boolean
          billing_mode?: string | null
          business_type_preset?: string | null
          content?: string | null
          created_at?: string
          deposit_percentage?: number | null
          id?: string
          is_primary?: boolean
          is_published?: boolean
          location_id?: string
          page_images?: string[] | null
          payment_mode?: string | null
          randomizer_enabled?: boolean | null
          slug?: string
          template_data?: Json | null
          template_type?: string
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
      location_taxes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string
          name: string
          percentage: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id: string
          name: string
          percentage?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string
          name?: string
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_taxes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          name: string
          sku: string | null
          category: string
          unit: string
          current_quantity: number
          reorder_threshold: number | null
          cost_price_minor: number | null
          notes: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          name: string
          sku?: string | null
          category?: string
          unit?: string
          current_quantity?: number
          reorder_threshold?: number | null
          cost_price_minor?: number | null
          notes?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          name?: string
          sku?: string | null
          category?: string
          unit?: string
          current_quantity?: number
          reorder_threshold?: number | null
          cost_price_minor?: number | null
          notes?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          item_id: string
          movement_type: 'restock' | 'use' | 'wastage' | 'sale' | 'adjustment'
          quantity: number
          note: string | null
          order_id: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          item_id: string
          movement_type: 'restock' | 'use' | 'wastage' | 'sale' | 'adjustment'
          quantity: number
          note?: string | null
          order_id?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          item_id?: string
          movement_type?: 'restock' | 'use' | 'wastage' | 'sale' | 'adjustment'
          quantity?: number
          note?: string | null
          order_id?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          ai_base_personality: string
          ai_enabled: boolean
          ai_escalation_contact: string | null
          ai_faqs: Json | null
          ai_instructions: string | null
          ai_name: string
          brand_knowledge: string | null
          cover_image_url: string | null
          created_at: string
          currency_code: string
          delivery_enabled: boolean | null
          delivery_fee_minor: number | null
          delivery_minimum_order_minor: number | null
          delivery_note: string | null
          facebook_handle: string | null
          fulfillment_location_label: string | null
          global_discount_banner_text: string | null
          global_discount_enabled: boolean | null
          global_discount_percentage: number | null
          google_maps_url: string | null
          id: string
          instagram_handle: string | null
          is_search_visible: boolean | null
          logo_url: string | null
          manual_payment_account_name: string | null
          manual_payment_account_number: string | null
          manual_payment_bank_name: string | null
          manual_payment_enabled: boolean
          manual_payment_instructions: string | null
          name: string
          operating_hours: string | null
          organization_id: string
          phone: string | null
          phone_number: string | null
          portal_display_name: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          qr_color: string | null
          qr_text: string | null
          randomizer_enabled: boolean | null
          slug: string
          spinner_config: Json | null
          spinner_enabled: boolean | null
          tagline: string | null
          theme_color: string
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string
          whatsapp_number: string | null
          wifi_network: string | null
          wifi_password: string | null
          x_handle: string | null
        }
        Insert: {
          address?: string | null
          ai_base_personality?: string
          ai_enabled?: boolean
          ai_escalation_contact?: string | null
          ai_faqs?: Json | null
          ai_instructions?: string | null
          ai_name?: string
          brand_knowledge?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency_code?: string
          delivery_enabled?: boolean | null
          delivery_fee_minor?: number | null
          delivery_minimum_order_minor?: number | null
          delivery_note?: string | null
          facebook_handle?: string | null
          fulfillment_location_label?: string | null
          global_discount_banner_text?: string | null
          global_discount_enabled?: boolean | null
          global_discount_percentage?: number | null
          google_maps_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_search_visible?: boolean | null
          logo_url?: string | null
          manual_payment_account_name?: string | null
          manual_payment_account_number?: string | null
          manual_payment_bank_name?: string | null
          manual_payment_enabled?: boolean
          manual_payment_instructions?: string | null
          name: string
          operating_hours?: string | null
          organization_id: string
          phone?: string | null
          phone_number?: string | null
          portal_display_name?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          qr_color?: string | null
          qr_text?: string | null
          randomizer_enabled?: boolean | null
          slug: string
          spinner_config?: Json | null
          spinner_enabled?: boolean | null
          tagline?: string | null
          theme_color?: string
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          wifi_network?: string | null
          wifi_password?: string | null
          x_handle?: string | null
        }
        Update: {
          address?: string | null
          ai_base_personality?: string
          ai_enabled?: boolean
          ai_escalation_contact?: string | null
          ai_faqs?: Json | null
          ai_instructions?: string | null
          ai_name?: string
          brand_knowledge?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency_code?: string
          delivery_enabled?: boolean | null
          delivery_fee_minor?: number | null
          delivery_minimum_order_minor?: number | null
          delivery_note?: string | null
          facebook_handle?: string | null
          fulfillment_location_label?: string | null
          global_discount_banner_text?: string | null
          global_discount_enabled?: boolean | null
          global_discount_percentage?: number | null
          google_maps_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_search_visible?: boolean | null
          logo_url?: string | null
          manual_payment_account_name?: string | null
          manual_payment_account_number?: string | null
          manual_payment_bank_name?: string | null
          manual_payment_enabled?: boolean
          manual_payment_instructions?: string | null
          name?: string
          operating_hours?: string | null
          organization_id?: string
          phone?: string | null
          phone_number?: string | null
          portal_display_name?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          qr_color?: string | null
          qr_text?: string | null
          randomizer_enabled?: boolean | null
          slug?: string
          spinner_config?: Json | null
          spinner_enabled?: boolean | null
          tagline?: string | null
          theme_color?: string
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          wifi_network?: string | null
          wifi_password?: string | null
          x_handle?: string | null
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
      loyalty_settings: {
        Row: {
          created_at: string | null
          is_enabled: boolean | null
          organization_id: string
          points_per_major_unit: number | null
          reward_discount_minor: number | null
          reward_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          is_enabled?: boolean | null
          organization_id: string
          points_per_major_unit?: number | null
          reward_discount_minor?: number | null
          reward_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          is_enabled?: boolean | null
          organization_id?: string
          points_per_major_unit?: number | null
          reward_discount_minor?: number | null
          reward_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
          stock_count: number | null
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
          stock_count?: number | null
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
          stock_count?: number | null
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
          abandoned_recovery_sent: boolean | null
          amount_paid_minor: number | null
          assigned_staff_id: string | null
          cancellation_reason: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_note: string | null
          customer_phone: string | null
          delivery_instructions: string | null
          discount_amount_minor: number | null
          estimated_prep_time_minutes: number | null
          estimated_ready_at: string | null
          feedback_pin: string
          fulfillment_type: string | null
          id: string
          location_id: string
          organization_id: string
          payment_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_minor: number
          table_identifier: string | null
          tax_breakdown: Json | null
          tax_total_minor: number
          tip_amount_minor: number | null
          total_amount_minor: number
          updated_at: string
        }
        Insert: {
          abandoned_recovery_sent?: boolean | null
          amount_paid_minor?: number | null
          assigned_staff_id?: string | null
          cancellation_reason?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          delivery_instructions?: string | null
          discount_amount_minor?: number | null
          estimated_prep_time_minutes?: number | null
          estimated_ready_at?: string | null
          feedback_pin?: string
          fulfillment_type?: string | null
          id?: string
          location_id: string
          organization_id: string
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_minor?: number
          table_identifier?: string | null
          tax_breakdown?: Json | null
          tax_total_minor?: number
          tip_amount_minor?: number | null
          total_amount_minor?: number
          updated_at?: string
        }
        Update: {
          abandoned_recovery_sent?: boolean | null
          amount_paid_minor?: number | null
          assigned_staff_id?: string | null
          cancellation_reason?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          delivery_instructions?: string | null
          discount_amount_minor?: number | null
          estimated_prep_time_minutes?: number | null
          estimated_ready_at?: string | null
          feedback_pin?: string
          fulfillment_type?: string | null
          id?: string
          location_id?: string
          organization_id?: string
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_minor?: number
          table_identifier?: string | null
          tax_breakdown?: Json | null
          tax_total_minor?: number
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
          department: string | null
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
          department?: string | null
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
          department?: string | null
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
          department: string | null
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
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
          billing_plan_code: string | null
          business_type: string | null
          created_at: string
          created_by: string
          current_period_end: string | null
          id: string
          is_demo: boolean
          logo_url: string | null
          max_concurrent_orders: number
          monthly_free_credits_used: number
          name: string
          plan: string
          purchased_credits: number
          referred_by_affiliate_id: string | null
          slug: string
          subscription_plan: string
          subscription_status: string
          subscription_tier: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          billing_plan_code?: string | null
          business_type?: string | null
          created_at?: string
          created_by: string
          current_period_end?: string | null
          id?: string
          is_demo?: boolean
          logo_url?: string | null
          max_concurrent_orders?: number
          monthly_free_credits_used?: number
          name: string
          plan?: string
          purchased_credits?: number
          referred_by_affiliate_id?: string | null
          slug: string
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          billing_plan_code?: string | null
          business_type?: string | null
          created_at?: string
          created_by?: string
          current_period_end?: string | null
          id?: string
          is_demo?: boolean
          logo_url?: string | null
          max_concurrent_orders?: number
          monthly_free_credits_used?: number
          name?: string
          plan?: string
          purchased_credits?: number
          referred_by_affiliate_id?: string | null
          slug?: string
          subscription_plan?: string
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_referred_by_affiliate_id_fkey"
            columns: ["referred_by_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      page_bookings: {
        Row: {
          amount_paid_minor: number
          booking_date: string | null
          booking_end_date: string | null
          booking_end_time: string | null
          booking_notes: string | null
          booking_time: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          item_id: string | null
          number_of_guests: number | null
          page_id: string
          payment_reference: string | null
          payment_status: string
          status: string
          total_amount_minor: number | null
          updated_at: string
        }
        Insert: {
          amount_paid_minor?: number
          booking_date?: string | null
          booking_end_date?: string | null
          booking_end_time?: string | null
          booking_notes?: string | null
          booking_time?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          item_id?: string | null
          number_of_guests?: number | null
          page_id: string
          payment_reference?: string | null
          payment_status?: string
          status?: string
          total_amount_minor?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid_minor?: number
          booking_date?: string | null
          booking_end_date?: string | null
          booking_end_time?: string | null
          booking_notes?: string | null
          booking_time?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          item_id?: string | null
          number_of_guests?: number | null
          page_id?: string
          payment_reference?: string | null
          payment_status?: string
          status?: string
          total_amount_minor?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_bookings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "page_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_bookings_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "location_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_inquiries: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          item_id: string | null
          message: string | null
          page_id: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          item_id?: string | null
          message?: string | null
          page_id: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          item_id?: string | null
          message?: string | null
          page_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_inquiries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "page_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_inquiries_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "location_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_items: {
        Row: {
          availability_status: string
          created_at: string
          currency: string
          deposit_percentage: number | null
          description: string | null
          id: string
          images: string[] | null
          inventory_count: number | null
          is_published: boolean
          item_data: Json | null
          page_id: string
          payment_mode: string | null
          price_display: string | null
          price_minor: number | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          availability_status?: string
          created_at?: string
          currency?: string
          deposit_percentage?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          is_published?: boolean
          item_data?: Json | null
          page_id: string
          payment_mode?: string | null
          price_display?: string | null
          price_minor?: number | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          availability_status?: string
          created_at?: string
          currency?: string
          deposit_percentage?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          is_published?: boolean
          item_data?: Json | null
          page_id?: string
          payment_mode?: string | null
          price_display?: string | null
          price_minor?: number | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "location_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_fee_ledger: {
        Row: {
          created_at: string | null
          fee_amount_minor: number
          id: string
          location_id: string | null
          order_id: string | null
          organization_id: string | null
          settled_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          fee_amount_minor: number
          id?: string
          location_id?: string | null
          order_id?: string | null
          organization_id?: string | null
          settled_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          fee_amount_minor?: number
          id?: string
          location_id?: string | null
          order_id?: string | null
          organization_id?: string | null
          settled_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_fee_ledger_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fee_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fee_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          endpoint: string
          id: string
          organization_id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          id?: string
          organization_id: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          id?: string
          organization_id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          clock_in_time: string
          clock_out_time: string | null
          created_at: string
          id: string
          location_id: string
          status: string
          total_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clock_in_time?: string
          clock_out_time?: string | null
          created_at?: string
          id?: string
          location_id: string
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clock_in_time?: string
          clock_out_time?: string | null
          created_at?: string
          id?: string
          location_id?: string
          status?: string
          total_hours?: number | null
          updated_at?: string
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
      user_profiles: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
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
          department: string | null
          email: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: never
          organization_id?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
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
      auto_checkout_stale_shifts: { Args: never; Returns: undefined }
      charge_credits_atomic: {
        Args: {
          p_cost: number
          p_organization_id: string
          p_reason: string
          p_user_id?: string
        }
        Returns: Json
      }
      check_item_availability: {
        Args: { p_end_date: string; p_item_id: string; p_start_date: string }
        Returns: boolean
      }
      claim_order: {
        Args: { p_order_id: string; p_prep_time_minutes: number }
        Returns: boolean
      }
      cleanup_demo_accounts: { Args: never; Returns: undefined }
      cleanup_stale_orders: { Args: never; Returns: undefined }
      decrement_stock: { Args: { p_items: Json }; Returns: boolean }
      enforce_subscription_grace_periods: { Args: never; Returns: undefined }
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
      increment_stock: { Args: { p_items: Json }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_organization_id: string
        }
        Returns: string
      }
    }
    Enums: {
      availability_status: "available" | "low" | "sold_out" | "hidden"
      coupon_discount_type:
        | "free_plan"
        | "free_credits"
        | "plan_extension"
        | "trial_extension"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      availability_status: ["available", "low", "sold_out", "hidden"],
      coupon_discount_type: [
        "free_plan",
        "free_credits",
        "plan_extension",
        "trial_extension",
      ],
      member_role: ["owner", "manager", "editor", "viewer"],
      order_status: ["pending", "paid", "preparing", "completed", "cancelled"],
      payment_provider: ["paystack", "stripe"],
      publication_status: ["draft", "published", "archived"],
      service_request_status: ["pending", "acknowledged", "resolved"],
      service_request_type: ["waiter", "bill", "cleanup"],
    },
  },
} as const
