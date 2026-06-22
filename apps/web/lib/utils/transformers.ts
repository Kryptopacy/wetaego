import { UIOrder, UIOrderItem, UIOrganization } from '../types/frontend'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseOrderToUI(rawOrder: any): UIOrder {
  if (!rawOrder) throw new Error('Cannot map null order')

  const items: UIOrderItem[] = (rawOrder.order_items || []).map((i: any) => ({
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
    customer_name: rawOrder.customer_name || null,
    customer_email: rawOrder.customer_email || null,
    customer_phone: rawOrder.customer_phone || null,
    total_amount_minor: rawOrder.total_amount_minor || 0,
    tip_amount_minor: rawOrder.tip_amount_minor || null,
    amount_paid_minor: rawOrder.amount_paid_minor || null,
    status: (rawOrder.status as UIOrder['status']) || 'pending',
    payment_method: rawOrder.payment_method || null,
    customer_note: rawOrder.customer_note || null,
    assigned_staff_id: rawOrder.assigned_staff_id || null,
    created_at: rawOrder.created_at || new Date().toISOString(),
    order_items: items,
    organizations: org
  }
}
