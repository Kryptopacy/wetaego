const fs = require('fs')
const path = require('path')

const typesFile = path.join(__dirname, 'lib', 'supabase', 'types.ts')
let content = fs.readFileSync(typesFile, 'utf8')

const customerProfilesType = `
        customer_profiles: {
          Row: {
            id: string
            organization_id: string
            email: string | null
            phone: string | null
            name: string | null
            total_spend_minor: number
            total_orders: number
            loyalty_points: number
            last_visit_at: string | null
            marketing_opt_in: boolean
            created_at: string
          }
          Insert: {
            id?: string
            organization_id: string
            email?: string | null
            phone?: string | null
            name?: string | null
            total_spend_minor?: number
            total_orders?: number
            loyalty_points?: number
            last_visit_at?: string | null
            marketing_opt_in?: boolean
            created_at?: string
          }
          Update: {
            id?: string
            organization_id?: string
            email?: string | null
            phone?: string | null
            name?: string | null
            total_spend_minor?: number
            total_orders?: number
            loyalty_points?: number
            last_visit_at?: string | null
            marketing_opt_in?: boolean
            created_at?: string
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
`

const loyaltySettingsType = `
        loyalty_settings: {
          Row: {
            organization_id: string
            points_per_minor_unit: number
            welcome_points: number
            min_redemption_points: number
            is_active: boolean
            created_at: string
            updated_at: string
          }
          Insert: {
            organization_id: string
            points_per_minor_unit?: number
            welcome_points?: number
            min_redemption_points?: number
            is_active?: boolean
            created_at?: string
            updated_at?: string
          }
          Update: {
            organization_id?: string
            points_per_minor_unit?: number
            welcome_points?: number
            min_redemption_points?: number
            is_active?: boolean
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

if (!content.includes('customer_profiles: {')) {
  content = content.replace('public: {\n    Tables: {', `public: {\n    Tables: {${customerProfilesType}`)
}
if (!content.includes('loyalty_settings: {')) {
  content = content.replace('public: {\n    Tables: {', `public: {\n    Tables: {${loyaltySettingsType}`)
}

fs.writeFileSync(typesFile, content)
console.log('types.ts patched successfully.')
