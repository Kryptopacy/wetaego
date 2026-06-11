'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function acceptInviteAction(token: string) {
  try {
    const supabase = await createClient()

    // 1. Get current logged in user
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      return { error: 'You must be logged in to accept an invitation.' }
    }
    const user = userData.user

    // 2. Query the invite details
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return { error: 'Invitation not found or has already been used.' }
    }

    // 3. Verify expiration
    if (new Date(invite.expires_at) < new Date()) {
      return { error: 'This invitation has expired. Please request a new one.' }
    }

    // 4. Verify email match
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return {
        error: `This invitation was sent to ${invite.email}, but you are logged in as ${user.email}. Please sign out and sign in with the correct account.`
      }
    }

    // 5. Insert member
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by
      })

    if (insertError) {
      // If they are already a member, we can just delete the invite and proceed
      if (insertError.code === '23505') { // unique key violation
        // delete invite
        await supabase.from('organization_invites').delete().eq('id', invite.id)
        return { success: true }
      }
      return { error: insertError.message }
    }

    // 6. Delete invite token
    await supabase
      .from('organization_invites')
      .delete()
      .eq('id', invite.id)

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
