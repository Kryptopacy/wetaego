'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePortalSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const organizationId = formData.get('organizationId') as string
  const portalName = formData.get('portalName') as string
  const portalCoverImageUrl = formData.get('portalCoverImageUrl') as string
  const portalThemeColor = formData.get('portalThemeColor') as string
  const portalBackgroundColor = formData.get('portalBackgroundColor') as string

  if (!organizationId) return { error: 'Missing organization ID' }

  // Ensure user has access to org
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'owner' && member.role !== 'manager')) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      portal_name: portalName || null,
      portal_cover_image_url: portalCoverImageUrl || null,
      portal_theme_color: portalThemeColor || null,
      portal_background_color: portalBackgroundColor || null,
    })
    .eq('id', organizationId)

  if (error) {
    console.error('Failed to update portal settings', error)
    return { error: 'Failed to update portal settings' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function submitKycData(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const organizationId = formData.get('organizationId') as string
  const businessType = formData.get('businessType') as string
  const legalName = formData.get('legalName') as string
  const registrationNumber = formData.get('registrationNumber') as string

  if (!organizationId || !businessType || !legalName || !registrationNumber) {
    return { error: 'Missing required KYC fields' }
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'owner' && member.role !== 'manager')) {
    return { error: 'Unauthorized' }
  }

  // Insert or update KYC
  const { error } = await supabase
    .from('organization_kyc')
    .upsert({
      organization_id: organizationId,
      business_type: businessType as 'registered_business' | 'individual',
      legal_name: legalName,
      registration_number: registrationNumber,
      status: 'in_review',
      submitted_by: user.id
    }, { onConflict: 'organization_id' })

  if (error) {
    console.error('Failed to submit KYC data', error)
    return { error: 'Failed to submit KYC data' }
  }

  // Update org status
  await supabase
    .from('organizations')
    .update({ status: 'in_review' })
    .eq('id', organizationId)

  revalidatePath('/dashboard/settings')
  return { success: true }
}
