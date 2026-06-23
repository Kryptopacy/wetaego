
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


    // 2. Call the secure RPC to accept the invite
    const { data: success, error: rpcError } = await supabase
      .rpc('accept_invite_by_token', { lookup_token: token })

    if (rpcError) {
      return { error: rpcError.message || 'Failed to accept invitation.' }
    }

    if (!success) {
      return { error: 'Invitation not found or has already been used.' }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An unexpected error occurred.' }
  }
}
