const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'apps/web/lib/supabase/types.ts')
let content = fs.readFileSync(filePath, 'utf8')

if (!content.includes('customer_profiles: {') && content.includes('credit_transactions: {')) {
  const insertContent = `
        customer_profiles: {
          Row: {
            id: string
            organization_id: string
            email: string | null
            phone: string | null
            first_name: string | null
            last_name: string | null
            total_orders: number
            total_spend_minor: number
            loyalty_points: number
            last_visit_at: string | null
            marketing_opt_in: boolean
            notes: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            organization_id: string
            email?: string | null
            phone?: string | null
            first_name?: string | null
            last_name?: string | null
            total_orders?: number
            total_spend_minor?: number
            loyalty_points?: number
            last_visit_at?: string | null
            marketing_opt_in?: boolean
            notes?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            organization_id?: string
            email?: string | null
            phone?: string | null
            first_name?: string | null
            last_name?: string | null
            total_orders?: number
            total_spend_minor?: number
            loyalty_points?: number
            last_visit_at?: string | null
            marketing_opt_in?: boolean
            notes?: string | null
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
            points_per_minor_unit: number
            points_value_minor_unit: number
            minimum_points_redemption: number
            welcome_points: number
            created_at: string
            updated_at: string
          }
          Insert: {
            organization_id: string
            is_enabled?: boolean
            points_per_minor_unit?: number
            points_value_minor_unit?: number
            minimum_points_redemption?: number
            welcome_points?: number
            created_at?: string
            updated_at?: string
          }
          Update: {
            organization_id?: string
            is_enabled?: boolean
            points_per_minor_unit?: number
            points_value_minor_unit?: number
            minimum_points_redemption?: number
            welcome_points?: number
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
        }
`
  content = content.replace('credit_transactions: {', insertContent + '        credit_transactions: {')
  fs.writeFileSync(filePath, content)
  console.log('Appended missing types')
}
