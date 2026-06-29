import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { createClient } from '@/lib/supabase/server';
import { isRedirectError } from 'next/dist/client/components/redirect';

/**
 * Base action client for public, unauthenticated actions.
 * It automatically handles unexpected errors.
 */
export const actionClient = createSafeActionClient({
  handleServerError(e: any) {
    if (isRedirectError(e)) {
      throw e;
    }
    console.error("Action error:", e.message);
    if (e.message === 'Unauthorized' || 
        e.message === 'Not authenticated' || 
        e.message === 'Not logged in' ||
        e.message.includes('Image must be less than') || 
        e.message.includes('Invalid image format') ||
        e.message.includes('Booking not found')) {
      return e.message;
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }
});

/**
 * Authenticated action client.
 * This guarantees that the action will only run if there is a valid user session.
 * It injects the `user` and the `supabase` server client into the action context.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  // Pass user and supabase instance to the action context
  return next({ ctx: { user, supabase } });
});
