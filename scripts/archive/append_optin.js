const fs = require('fs')

const appendContent = `

export async function optInMarketing(orderId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: order } = await supabase
      .from('orders')
      .select('organization_id, customer_email')
      .eq('id', orderId)
      .single()

    if (!order || !order.customer_email) {
      return { error: 'Order or customer email not found' }
    }

    // Upsert into customer_profiles to enable marketing
    const { error } = await supabase
      .from('customer_profiles')
      .upsert({
        organization_id: order.organization_id,
        email: order.customer_email,
        marketing_opt_in: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id,email' })

    if (error) throw error

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to opt in' }
  }
}
`

fs.appendFileSync('app/m/[slug]/actions.ts', appendContent)
console.log('Appended optInMarketing to actions.ts')
