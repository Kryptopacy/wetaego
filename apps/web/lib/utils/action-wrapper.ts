import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export type ActionResponse<T = any> = T | { error: string } | { success: boolean, message?: string }

/**
 * A wrapper for Server Actions that automatically handles Demo Mode bypassing
 * and authentication checks.
 */
export async function withActionAuth<T>(
  actionName: string,
  callback: (user: User) => Promise<T>,
  options?: {
    disableInDemo?: boolean; // If true, throws an error in demo mode instead of fake success
    demoSuccessMessage?: string;
  }
): Promise<T | { error: string } | { success: boolean, message?: string }> {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_mode')?.value === '1'

  if (isDemo) {
    if (options?.disableInDemo) {
      return { error: 'This action is disabled in Demo Mode.' }
    }
    // Simulate success
    return { 
      success: true, 
      message: options?.demoSuccessMessage || 'Simulated success in Demo Mode.' 
    }
  }

  const supabase = await createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData?.user) {
    return { error: 'Not authenticated' }
  }

  return await callback(userData.user)
}
