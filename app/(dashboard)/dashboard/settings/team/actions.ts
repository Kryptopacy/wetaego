'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { authActionClient } from '@/lib/safe-action'
import { Resend } from 'resend'
import InviteEmail from '../../../../../emails/invite-email'
import { waitUntil } from '@vercel/functions'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyOwnerOrManager(orgId: string, supabase: any, user: { id: string }) {
  if (orgId === 'demo-org') return { userId: 'demo-user-id', role: 'owner' }
  const { cookies } = await import('next/headers')
  if ((await cookies()).get('demo_mode')?.value === '1') {
    return { userId: 'demo-user-id', role: 'owner' }
  }

  // Check if owner or manager
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  const isOwnerOrManager = member?.role === 'owner' || member?.role === 'manager' || (!member && await checkIsCreator(orgId, user.id, supabase))
  if (!isOwnerOrManager) throw new Error('Only the business Owner or Manager can perform team management actions.')

  return { userId: user.id, role: member?.role || 'owner' }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkIsCreator(orgId: string, userId: string, supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .eq('created_by', userId)
    .single()
  return !!data
}

export const createInviteAction = authActionClient
  .schema(z.object({
    orgId: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['owner', 'manager', 'editor', 'viewer']),
    department: z.string().trim().optional(),
  }))
  .action(async ({ parsedInput: { orgId, email, role, department }, ctx: { supabase, user } }) => {
    const { userId } = await verifyOwnerOrManager(orgId, supabase, user)

    // Create the invite
    const { data, error } = await supabase
      .from('organization_invites')
      .insert({
        organization_id: orgId,
        email: email.trim().toLowerCase(),
        role,
        department: department || null,
        invited_by: userId,
      })
      .select('token')
      .single()

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { token: 'demo-invite-token-xyz' }
    }

    if (error) throw new Error(error.message)

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
    return { token: data.token }
  })

export const revokeInviteAction = authActionClient
  .schema(z.object({
    orgId: z.string().min(1),
    inviteId: z.string().min(1)
  }))
  .action(async ({ parsedInput: { orgId, inviteId }, ctx: { supabase, user } }) => {
    await verifyOwnerOrManager(orgId, supabase, user)

    const { error } = await supabase
      .from('organization_invites')
      .delete()
      .eq('id', inviteId)
      .eq('organization_id', orgId)

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true }
    }

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  })

export const removeMemberAction = authActionClient
  .schema(z.object({
    orgId: z.string().min(1),
    userIdToDelete: z.string().min(1)
  }))
  .action(async ({ parsedInput: { orgId, userIdToDelete }, ctx: { supabase, user } }) => {
    const { userId: currentUserId, role } = await verifyOwnerOrManager(orgId, supabase, user)
    
    if (currentUserId === userIdToDelete) {
      throw new Error('You cannot remove yourself from your own organization.')
    }
    
    // Additional check: Managers cannot remove owners
    if (role === 'manager') {
      const { data: targetMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', userIdToDelete)
        .single()
      
      if (targetMember?.role === 'owner') {
        throw new Error('Managers cannot remove the organization owner.')
      }
    }

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userIdToDelete)

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true }
    }

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  })

export const updateMemberRoleAction = authActionClient
  .schema(z.object({
    orgId: z.string().min(1),
    targetUserId: z.string().min(1),
    newRole: z.enum(['owner', 'manager', 'editor', 'viewer'])
  }))
  .action(async ({ parsedInput: { orgId, targetUserId, newRole }, ctx: { supabase, user } }) => {
    const { userId: currentUserId, role } = await verifyOwnerOrManager(orgId, supabase, user)
    
    if (currentUserId === targetUserId) {
      throw new Error('You cannot change your own role.')
    }

    // Additional check: Managers cannot modify owners
    if (role === 'manager') {
      const { data: targetMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', targetUserId)
        .single()
      
      if (targetMember?.role === 'owner') {
        throw new Error('Managers cannot change the role of the organization owner.')
      }
      if (newRole === 'owner') {
        throw new Error('Only owners can assign the owner role.')
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

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  })

export const updateMemberDepartmentAction = authActionClient
  .schema(z.object({
    orgId: z.string().min(1),
    targetUserId: z.string().min(1),
    department: z.string().trim().nullable(),
  }))
  .action(async ({ parsedInput: { orgId, targetUserId, department }, ctx: { supabase, user } }) => {
    await verifyOwnerOrManager(orgId, supabase, user)

    const { error } = await supabase
      .from('organization_members')
      .update({ department })
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)

    if (orgId === 'demo-org') {
      revalidatePath('/dashboard/settings/team')
      return { success: true }
    }

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings/team')
    return { success: true }
  })

export const deleteOrganizationAction = authActionClient
  .schema(z.object({
    orgId: z.string().min(1)
  }))
  .action(async ({ parsedInput: { orgId }, ctx: { supabase, user } }) => {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isOwner = member?.role === 'owner' || (!member && await checkIsCreator(orgId, user.id, supabase))
    if (!isOwner) throw new Error('Only the business Owner can delete the organization.')
    
    const currentUserId = user.id

    if (orgId === 'demo-org') {
      throw new Error('You cannot delete the demo organization.')
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)
      .eq('created_by', currentUserId)

    if (error) throw new Error(error.message)

    return { success: true }
  })
