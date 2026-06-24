
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyOwnerOrManager(orgId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    if (orgId === 'demo-org') return { userId: 'demo-user-id', role: 'owner' }
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { userId: 'demo-user-id', role: 'owner' }
    }
    throw new Error('Not authenticated')
  }

  // Check if owner or manager
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userData.user.id)
    .single()

  const isOwnerOrManager = member?.role === 'owner' || member?.role === 'manager' || (!member && await checkIsCreator(orgId, userData.user.id))
  if (!isOwnerOrManager) throw new Error('Only the business Owner or Manager can perform team management actions.')

  return { userId: userData.user.id, role: member?.role || 'owner' }
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
    const { userId } = await verifyOwnerOrManager(orgId)
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
      return { error: (error as Error).message }
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
    await verifyOwnerOrManager(orgId)
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
      return { error: (error as Error).message }
    }

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}

export async function removeMemberAction(orgId: string, userIdToDelete: string) {
  try {
    const { userId: currentUserId, role } = await verifyOwnerOrManager(orgId)
    if (currentUserId === userIdToDelete) {
      return { error: 'You cannot remove yourself from your own organization.' }
    }
    
    // Additional check: Managers cannot remove owners
    if (role === 'manager') {
      const supabase = await createClient()
      const { data: targetMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', userIdToDelete)
        .single()
      
      if (targetMember?.role === 'owner') {
        return { error: 'Managers cannot remove the organization owner.' }
      }
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
      return { error: (error as Error).message }
    }

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}

export async function updateMemberRoleAction(orgId: string, targetUserId: string, newRole: string) {
  try {
    const { userId: currentUserId, role } = await verifyOwnerOrManager(orgId)
    if (currentUserId === targetUserId) {
      return { error: 'You cannot change your own role.' }
    }

    const validRoles = ['owner', 'manager', 'editor', 'viewer']
    if (!validRoles.includes(newRole)) {
      return { error: 'Invalid role provided.' }
    }

    const supabase = await createClient()

    // Additional check: Managers cannot modify owners
    if (role === 'manager') {
      const { data: targetMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', targetUserId)
        .single()
      
      if (targetMember?.role === 'owner') {
        return { error: 'Managers cannot change the role of the organization owner.' }
      }
      if (newRole === 'owner') {
        return { error: 'Only owners can assign the owner role.' }
      }
    }

    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole as "owner" | "manager" | "editor" | "viewer" })
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true }
    }

    if (error) {
      return { error: (error as Error).message }
    }

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}

export async function deleteOrganizationAction(orgId: string) {
  try {
    // Only strictly allow owners to delete
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) throw new Error('Not authenticated')

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', userData.user.id)
      .single()

    const isOwner = member?.role === 'owner' || (!member && await checkIsCreator(orgId, userData.user.id))
    if (!isOwner) throw new Error('Only the business Owner can delete the organization.')
    
    const currentUserId = userData.user.id

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
      return { error: (error as Error).message }
    }

    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An error occurred' }
  }
}
