
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner(orgId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    if (orgId === 'demo-org') return 'demo-user-id'
    throw new Error('Not authenticated')
  }

  // Check if owner
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userData.user.id)
    .single()

  const isOwner = member?.role === 'owner' || (!member && await checkIsCreator(orgId, userData.user.id))
  if (!isOwner) throw new Error('Only the business Owner can perform team management actions.')

  return userData.user.id
}

async function checkIsCreator(orgId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .eq('created_by', userId)
    .single()
  return !!data
}

import { Resend } from 'resend'
import InviteEmail from '../../../../../emails/invite-email'
import { waitUntil } from '@vercel/functions'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function createInviteAction(
  orgId: string,
  email: string,
  role: 'owner' | 'manager' | 'editor' | 'viewer'
) {
  try {
    const userId = await verifyOwner(orgId)
    const supabase = await createClient()

    // Create the invite
    const { data, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: orgId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: userId,
      })
      .select('token')
      .single()

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true, token: 'demo-invite-token-xyz' }
    }

    if (error) {
      return { error: error.message }
    }

    // Fetch org name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    const orgName = org?.name || 'OurMenu Partner'
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'
    const inviteLink = `${origin}/invite?token=${data.token}`

    waitUntil((async () => {
      const { error: resendError } = await resend.emails.send({
        from: 'OurMenu <onboarding@resend.dev>',
        to: email.trim().toLowerCase(),
        subject: `You've been invited to ${orgName}`,
        react: InviteEmail({
          organizationName: orgName,
          role,
          inviteLink
        }) as React.ReactElement
      }, {
        idempotencyKey: `invite-email/${data.token}`
      });

      if (resendError) {
        console.error('Failed to send invite email:', resendError.message);
      }
    })())

    revalidatePath('/dashboard/settings/team')
    return { success: true, token: data.token }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}

export async function revokeInviteAction(orgId: string, inviteId: string) {
  try {
    await verifyOwner(orgId)
    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_invites')
      .delete()
      .eq('id', inviteId)
      .eq('organization_id', orgId)

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true }
    }

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}

export async function removeMemberAction(orgId: string, userIdToDelete: string) {
  try {
    const currentUserId = await verifyOwner(orgId)
    if (currentUserId === userIdToDelete) {
      return { error: 'You cannot remove yourself from your own organization.' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userIdToDelete)

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true }
    }

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }export async function deleteOrganizationAction(orgId: string) {
  try {
    const currentUserId = await verifyOwner(orgId)
    const supabase = await createClient()

    if (orgId === 'demo-org') {
      return { error: 'You cannot delete the demo organization.' }
    }

    // Because of foreign keys, deleting the organization should cascade to:
    // menus, menu_categories, menu_items, locations, custom_pages, etc.
    // Ensure the DB has ON DELETE CASCADE for all org relations.
    // If not, we might need an RPC function. Assuming cascade is set up:
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)
      .eq('created_by', currentUserId) // extra safety: only the creator can delete

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}
