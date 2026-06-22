const fs = require('fs')

const appendContent = `

const loyaltySettingsSchema = z.object({
  organizationId: z.string().uuid(),
  isEnabled: z.boolean(),
  pointsPerMajorUnit: z.number().min(1).max(1000000),
  rewardThreshold: z.number().min(1).max(1000000),
  rewardDiscountMinor: z.number().min(0),
})

export async function saveLoyaltySettings(formData: FormData): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) throw new Error('Not authenticated')

    const organizationId = formData.get('organizationId') as string
    
    // Validate
    const validatedData = loyaltySettingsSchema.parse({
      organizationId,
      isEnabled: formData.get('isEnabled') === 'true',
      pointsPerMajorUnit: parseInt(formData.get('pointsPerMajorUnit') as string) || 1,
      rewardThreshold: parseInt(formData.get('rewardThreshold') as string) || 100,
      rewardDiscountMinor: parseInt(formData.get('rewardDiscountMinor') as string) || 0,
    })

    // Verify auth
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', validatedData.organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', validatedData.organizationId)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Only owners and managers can modify loyalty settings.')

    // Upsert settings
    const { error: upsertError } = await supabase
      .from('loyalty_settings')
      .upsert({
        organization_id: validatedData.organizationId,
        is_enabled: validatedData.isEnabled,
        points_per_major_unit: validatedData.pointsPerMajorUnit,
        reward_threshold: validatedData.rewardThreshold,
        reward_discount_minor: validatedData.rewardDiscountMinor,
        updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id' })

    if (upsertError) throw new Error(upsertError.message)

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/customers')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}
`

fs.appendFileSync('app/(dashboard)/dashboard/settings/actions.ts', appendContent)
console.log('Appended saveLoyaltySettings')
