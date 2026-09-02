import { NextRequest, NextResponse } from 'next/server'
import { DEMO_ITEMS } from '../search/route'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
  }

  const item = DEMO_ITEMS.find(it => it.itemId === id)
  if (item) {
    return NextResponse.json({
      ...item,
      modifiers: [
        {
          name: 'Customization Choice',
          options: [
            { id: 'opt_standard', name: 'Chef Special Preparation', priceDelta: 0, priceDeltaFormatted: '$0.00' }
          ]
        }
      ],
      variants: [
        { id: 'var_regular', name: 'Regular', price: item.price, priceFormatted: item.priceFormatted, isAvailable: true }
      ]
    })
  }

  return NextResponse.json({
    itemId: id,
    name: 'Selected Specialty Dish',
    category: 'Mains',
    price: 12.0,
    priceFormatted: '$12.00 USD',
    description: 'Freshly prepared specialty dish with seasonal ingredients.',
    dietaryTags: ['vegan', 'gluten_free'],
    isAvailable: true,
    modifiers: [],
    variants: []
  })
}
