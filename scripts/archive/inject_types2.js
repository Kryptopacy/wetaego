const fs = require('fs')

let typesContent = fs.readFileSync('lib/supabase/types.ts', 'utf8')

const newTables = `
      customer_profiles: {
        Row: {
          id: string
          organization_id: string
          email: string
          loyalty_points: number
          total_orders: number
          total_spend_minor: number
          marketing_opt_in: boolean
          last_visit_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          loyalty_points?: number
          total_orders?: number
          total_spend_minor?: number
          marketing_opt_in?: boolean
          last_visit_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          loyalty_points?: number
          total_orders?: number
          total_spend_minor?: number
          marketing_opt_in?: boolean
          last_visit_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      loyalty_settings: {
        Row: {
          organization_id: string
          is_enabled: boolean
          points_per_major_unit: number
          reward_threshold: number
          reward_discount_minor: number
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          is_enabled?: boolean
          points_per_major_unit?: number
          reward_threshold?: number
          reward_discount_minor?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          is_enabled?: boolean
          points_per_major_unit?: number
          reward_threshold?: number
          reward_discount_minor?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }`

if (!typesContent.includes('customer_profiles')) {
  // Be specific: find the public schemas table
  typesContent = typesContent.replace(
    `  public: {\n    Tables: {`,
    `  public: {\n    Tables: {${newTables}`
  )
  fs.writeFileSync('lib/supabase/types.ts', typesContent)
  console.log('Successfully injected CRM tables into public Tables')
} else {
  console.log('CRM tables already present')
}
