export interface UILocation {
  id: string;
  name: string;
  organization_id: string;
  theme_color?: string;
  cover_image_url?: string;
  slug?: string;
}

export interface UIOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface UIOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price_minor: number;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface UIOrder {
  id: string;
  organization_id: string;
  location_id: string;
  table_identifier: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount_minor: number;
  tip_amount_minor: number | null;
  amount_paid_minor: number | null;
  status: 'pending' | 'paid' | 'preparing' | 'out_for_delivery' | 'ready' | 'completed' | 'cancelled';
  payment_method: string | null;
  customer_note: string | null;
  assigned_staff_id: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  currency_code?: string;
  order_items: UIOrderItem[];
  organizations?: UIOrganization | null;
}
