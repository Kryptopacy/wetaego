import { describe, it, expect, vi } from 'vitest'
import { Database } from '@/lib/supabase/types'
import { render, screen, fireEvent } from '@testing-library/react'
import { StockManagementView } from '@/app/(dashboard)/dashboard/orders/components/stock-management-view'

describe('StockManagementView', () => {
  it('renders correctly with empty items', () => {
    render(<StockManagementView menuItems={[]} onToggleStock={vi.fn()} />)
    expect(screen.getByText('No items on your menu yet.')).not.toBeNull()
  })

  it('renders menu items and triggers toggle function on click', () => {
    const mockToggle = vi.fn()
    const items = [
      { id: '1', name: 'Jollof Rice', price_minor: 500000, availability_status: 'available' },
      { id: '2', name: 'Fried Rice', price_minor: 400000, availability_status: 'sold_out' }
    ] as unknown as Database['public']['Tables']['menu_items']['Row'][]

    render(<StockManagementView menuItems={items} onToggleStock={mockToggle} />)

    expect(screen.getByText('Jollof Rice')).not.toBeNull()
    expect(screen.getByText(/5,000/)).not.toBeNull()
    expect(screen.getByText('Fried Rice')).not.toBeNull()

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(2)

    fireEvent.click(buttons[0])
    expect(mockToggle).toHaveBeenCalledWith('1', 'available')

    fireEvent.click(buttons[1])
    expect(mockToggle).toHaveBeenCalledWith('2', 'sold_out')
  })
})
