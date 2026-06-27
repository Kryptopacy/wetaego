import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActiveOrdersGrid } from '@/app/(dashboard)/dashboard/orders/components/active-orders-grid'
import { UIOrder } from '@/lib/types/frontend'


describe('ActiveOrdersGrid', () => {
  const mockCurrentUserId = 'staff-123'
  
  const mockOrders = [
    {
      id: 'order-1',
      created_at: '2026-06-19T10:00:00Z',
      customer_name: 'Alice',
      table_identifier: 'Table 4',
      total_amount_minor: 500000,
      tip_amount_minor: 50000,
      status: 'pending',
      assigned_staff_id: null,
      customer_note: 'No onions please',
      order_items: [
        {
          id: 'item-1',
          order_id: 'order-1',
          item_id: 'menu-1',
          item_name: 'Burger',
          quantity: 2,
          price_minor: 250000,
          created_at: '2026-06-19T10:00:00Z'
        }
      ]
    }
  ] as unknown as UIOrder[]

  it('renders the active orders header with correct count', () => {
    render(
      <ActiveOrdersGrid 
        activeOrders={mockOrders} 
        currentUserId={mockCurrentUserId}
        billingMode="table_service"
        onClaimOrder={vi.fn()}
        onMarkPaidOffline={vi.fn()}
        onCompleteOrder={vi.fn()}
        onCancelOrder={vi.fn()}
      />
    )
    
    expect(screen.getByText('Active Orders')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined() // count badge
  })

  it('displays the empty state when there are no active orders', () => {
    render(
      <ActiveOrdersGrid 
        activeOrders={[]} 
        currentUserId={mockCurrentUserId}
        billingMode="table_service"
        onClaimOrder={vi.fn()}
        onMarkPaidOffline={vi.fn()}
        onCompleteOrder={vi.fn()}
        onCancelOrder={vi.fn()}
      />
    )
    
    expect(screen.getByText('Waiting for new orders...')).toBeDefined()
  })

  it('renders order details including items, tips, and notes correctly', () => {
    render(
      <ActiveOrdersGrid 
        activeOrders={mockOrders} 
        currentUserId={mockCurrentUserId}
        billingMode="table_service"
        onClaimOrder={vi.fn()}
        onMarkPaidOffline={vi.fn()}
        onCompleteOrder={vi.fn()}
        onCancelOrder={vi.fn()}
      />
    )
    
    // Customer info
    expect(screen.getByText('Table 4')).toBeDefined()
    expect(screen.getByText('Alice')).toBeDefined()
    
    // Total and Tip
    expect(screen.getByText(/5,000/)).toBeDefined()
    expect(screen.getByText(/\+.*500.*Tip/)).toBeDefined()
    
    // Items
    expect(screen.getByText('Burger')).toBeDefined()
    
    // Note
    expect(screen.getByText('📝 Note: No onions please')).toBeDefined()
  })

  it('calls onClaimOrder when the Claim/Accept button is clicked', () => {
    const onClaimOrderMock = vi.fn()
    
    render(
      <ActiveOrdersGrid 
        activeOrders={mockOrders} 
        currentUserId={mockCurrentUserId}
        billingMode="table_service" // For table_service, pending status shows "Accept (Pay After)"
        onClaimOrder={onClaimOrderMock}
        onMarkPaidOffline={vi.fn()}
        onCompleteOrder={vi.fn()}
        onCancelOrder={vi.fn()}
      />
    )
    
    const claimButton = screen.getByText('Accept (Pay After)')
    fireEvent.click(claimButton)
    
    expect(onClaimOrderMock).toHaveBeenCalledWith('order-1')
  })
})
