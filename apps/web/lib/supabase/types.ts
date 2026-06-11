export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          created_by: string
          created_at: string
          updated_at: string
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string
          current_period_end: string | null
          subscription_tier: string
          extra_pages_purchased: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          created_by: string
          created_at?: string
          updated_at?: string
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string
          current_period_end?: string | null
          subscription_tier?: string
          extra_pages_purchased?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string
          current_period_end?: string | null
          subscription_tier?: string
          extra_pages_purchased?: number
        }
      }
      organization_members: {
        Row: {
          organization_id: string
          user_id: string
          role: 'owner' | 'manager' | 'editor' | 'viewer'
          invited_by: string | null
          created_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role?: 'owner' | 'manager' | 'editor' | 'viewer'
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'manager' | 'editor' | 'viewer'
          invited_by?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          tagline: string | null
          address: string | null
          phone: string | null
          currency_code: string
          theme_color: string
          cover_image_url: string | null
          publication_status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
          ai_enabled: boolean
          ai_name: string
          ai_instructions: string | null
          brand_knowledge: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          tagline?: string | null
          address?: string | null
          phone?: string | null
          currency_code?: string
          theme_color?: string
          cover_image_url?: string | null
          publication_status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          ai_enabled?: boolean
          ai_name?: string
          ai_instructions?: string | null
          brand_knowledge?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          tagline?: string | null
          address?: string | null
          phone?: string | null
          currency_code?: string
          theme_color?: string
          cover_image_url?: string | null
          publication_status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          ai_enabled?: boolean
          ai_name?: string
          ai_instructions?: string | null
          brand_knowledge?: string | null
        }
      }
      location_pages: {
        Row: {
          id: string
          location_id: string
          title: string
          slug: string
          content: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          title: string
          slug: string
          content?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          title?: string
          slug?: string
          content?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menus: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          name: string
          description: string | null
          publication_status: 'draft' | 'published' | 'archived'
          starts_at: string | null
          ends_at: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          name: string
          description?: string | null
          publication_status?: 'draft' | 'published' | 'archived'
          starts_at?: string | null
          ends_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          name?: string
          description?: string | null
          publication_status?: 'draft' | 'published' | 'archived'
          starts_at?: string | null
          ends_at?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          organization_id: string
          menu_id: string
          name: string
          description: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          menu_id: string
          name: string
          description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          menu_id?: string
          name?: string
          description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          organization_id: string
          category_id: string
          name: string
          description: string | null
          price_minor: number
          availability_status: 'available' | 'low' | 'sold_out' | 'hidden'
          is_featured: boolean
          image_url: string | null
          dietary_tags: string[]
          allergen_tags: string[]
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          category_id: string
          name: string
          description?: string | null
          price_minor?: number
          availability_status?: 'available' | 'low' | 'sold_out' | 'hidden'
          is_featured?: boolean
          image_url?: string | null
          dietary_tags?: string[]
          allergen_tags?: string[]
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          category_id?: string
          name?: string
          description?: string | null
          price_minor?: number
          availability_status?: 'available' | 'low' | 'sold_out' | 'hidden'
          is_featured?: boolean
          image_url?: string | null
          dietary_tags?: string[]
          allergen_tags?: string[]
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      organization_payment_settings: {
        Row: {
          organization_id: string
          provider: 'paystack' | 'stripe'
          provider_account_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          provider?: 'paystack' | 'stripe'
          provider_account_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          provider?: 'paystack' | 'stripe'
          provider_account_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          customer_name: string | null
          table_identifier: string | null
          status: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
          total_amount_minor: number
          payment_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          customer_name?: string | null
          table_identifier?: string | null
          status?: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
          total_amount_minor?: number
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          customer_name?: string | null
          table_identifier?: string | null
          status?: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
          total_amount_minor?: number
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string | null
          item_name: string
          quantity: number
          price_minor: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_id?: string | null
          item_name: string
          quantity?: number
          price_minor?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string | null
          item_name?: string
          quantity?: number
          price_minor?: number
          created_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          table_identifier: string
          request_type: 'waiter' | 'bill' | 'cleanup' | 'custom'
          status: 'pending' | 'acknowledged' | 'resolved'
          created_at: string
          resolved_at: string | null
          custom_request_text: string | null
          urgency_tier: 'critical' | 'standard' | 'low'
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          table_identifier: string
          request_type?: 'waiter' | 'bill' | 'cleanup' | 'custom'
          status?: 'pending' | 'acknowledged' | 'resolved'
          created_at?: string
          resolved_at?: string | null
          custom_request_text?: string | null
          urgency_tier?: 'critical' | 'standard' | 'low'
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          table_identifier?: string
          request_type?: 'waiter' | 'bill' | 'cleanup' | 'custom'
          status?: 'pending' | 'acknowledged' | 'resolved'
          created_at?: string
          resolved_at?: string | null
          custom_request_text?: string | null
          urgency_tier?: 'critical' | 'standard' | 'low'
        }
      }
      qr_codes: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          table_identifier: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          table_identifier?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          table_identifier?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      organization_invites: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'owner' | 'manager' | 'editor' | 'viewer'
          invited_by: string
          token: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: 'owner' | 'manager' | 'editor' | 'viewer'
          invited_by: string
          token?: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: 'owner' | 'manager' | 'editor' | 'viewer'
          invited_by?: string
          token?: string
          created_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      organization_member_details: {
        Row: {
          organization_id: string
          user_id: string
          role: 'owner' | 'manager' | 'editor' | 'viewer'
          created_at: string
          email: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      member_role: 'owner' | 'manager' | 'editor' | 'viewer'
      availability_status: 'available' | 'low' | 'sold_out' | 'hidden'
      publication_status: 'draft' | 'published' | 'archived'
      payment_provider: 'paystack' | 'stripe'
      order_status: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
      service_request_type: 'waiter' | 'bill' | 'cleanup'
      service_request_status: 'pending' | 'acknowledged' | 'resolved'
    }
  }
}
