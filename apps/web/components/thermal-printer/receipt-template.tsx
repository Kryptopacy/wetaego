import React from 'react'
import { UIOrder } from '@/lib/types/frontend'
import { formatCurrency } from '@/lib/utils/currency'

interface ReceiptTemplateProps {
  order: UIOrder
  businessName?: string
  businessType?: string
}

export function ReceiptTemplate({ order, businessName = 'OurMenu OS', businessType = 'restaurant' }: ReceiptTemplateProps) {
  // Adapt terminology based on business type
  const isService = ['services', 'consulting', 'salon', 'spa'].includes(businessType)
  const headerText = isService ? 'APPOINTMENT SLIP' : 'STORE RECEIPT'
  const identifierLabel = order.table_identifier ? 'Table / Spot:' : 'Customer:'
  const identifierValue = order.table_identifier || order.customer_name || 'Walk-in'

  return (
    <div style={{ fontFamily: 'monospace', width: '300px', fontSize: '12px', color: '#000', padding: '0 10px' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: '0', fontSize: '18px' }}>{businessName}</h2>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{headerText}</div>
        <div style={{ marginTop: '4px' }}>Order #{order.id.split('-')[0]}</div>
        <div>{new Date(order.created_at).toLocaleString()}</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
        <div><strong>{identifierLabel}</strong> {identifierValue}</div>
        {order.customer_name && order.table_identifier && (
          <div><strong>Name:</strong> {order.customer_name}</div>
        )}
      </div>

      <table style={{ width: '100%', marginBottom: '8px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Qty</th>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map((item) => (
            <tr key={item.id}>
              <td style={{ verticalAlign: 'top', paddingTop: '4px' }}>{item.quantity}x</td>
              <td style={{ paddingRight: '8px', paddingTop: '4px' }}>{item.item_name}</td>
              <td style={{ textAlign: 'right', paddingTop: '4px' }}>
                {formatCurrency(item.price_minor * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {order.customer_note && (
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', marginBottom: '8px' }}>
          <strong>NOTE:</strong> {order.customer_note}
        </div>
      )}

      <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(order.total_amount_minor - (order.tip_amount_minor || 0))}</span>
        </div>
        {!!order.tip_amount_minor && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tip</span>
            <span>{formatCurrency(order.tip_amount_minor)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(order.total_amount_minor)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <div style={{ fontWeight: 'bold' }}>{order.status === 'paid' ? 'PAID' : 'PENDING PAYMENT'}</div>
        <div style={{ marginTop: '16px', fontSize: '10px' }}>Powered by OurMenu OS</div>
      </div>
    </div>
  )
}
