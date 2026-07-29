import { UIOrder, UIOrderItem, UIOrganization } from '../types/frontend'

import { Database } from '../supabase/types'

type SupabaseOrder = Database['public']['Tables']['orders']['Row']
type SupabaseOrderItem = Database['public']['Tables']['order_items']['Row']
type SupabaseOrg = Database['public']['Tables']['organizations']['Row']

type RawOrderPayload = Partial<SupabaseOrder> & {
  id: string;
  order_items?: Partial<SupabaseOrderItem>[];
  organizations?: Partial<SupabaseOrg> | null;
  order_milestones?: Record<string, unknown>[];
  tracking_code?: string | null;
  [key: string]: unknown;
}

export function mapSupabaseOrderToUI(rawOrder: RawOrderPayload): UIOrder {
  if (!rawOrder) throw new Error('Cannot map null order')

  const items: UIOrderItem[] = (rawOrder.order_items || []).map((i: Partial<{ id: string, order_id: string, item_id: string | null, item_name: string, quantity: number, price_minor: number, created_at: string }>) => ({
    id: i.id || '',
    order_id: i.order_id || '',
    item_id: i.item_id || '',
    item_name: i.item_name || 'Unknown Item',
    quantity: i.quantity || 1,
    price_minor: i.price_minor || 0,
    created_at: i.created_at || new Date().toISOString()
  }))

  let org: UIOrganization | null = null
  if (rawOrder.organizations) {
    org = {
      id: rawOrder.organizations.id || '',
      name: rawOrder.organizations.name || '',
      slug: rawOrder.organizations.slug || ''
    }
  }

  return {
    id: rawOrder.id || '',
    organization_id: rawOrder.organization_id || '',
    location_id: rawOrder.location_id || '',
    table_identifier: rawOrder.table_identifier || null,
    customer_name: (rawOrder.customer_name as string) || null,
    customer_email: (rawOrder.customer_email as string) || null,
    customer_phone: (rawOrder.customer_phone as string) || null,
    total_amount_minor: rawOrder.total_amount_minor || 0,
    tip_amount_minor: rawOrder.tip_amount_minor || null,
    amount_paid_minor: rawOrder.amount_paid_minor || null,
    status: (rawOrder.status as UIOrder['status']) || 'pending',
    payment_method: (rawOrder.payment_method as string) || null,
    wallet_balance_applied_minor: (rawOrder.wallet_balance_applied_minor as number) || null,
    customer_note: (rawOrder.customer_note as string) || null,
    assigned_staff_id: (rawOrder.assigned_staff_id as string) || null,
    created_at: rawOrder.created_at || new Date().toISOString(),
    order_items: items,
    organizations: org,
    tracking_code: (rawOrder.tracking_code as string) || null,
    order_milestones: (rawOrder.order_milestones as unknown as UIOrder['order_milestones']) || undefined,
    metadata: rawOrder.metadata as Record<string, unknown> || null
  }
}
