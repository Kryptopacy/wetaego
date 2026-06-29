import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { createClient } from '@/lib/supabase/server';
const isRedirectError = (e: unknown) => e instanceof Error && e.message === 'NEXT_REDIRECT' || (typeof e === 'object' && e !== null && 'digest' in e && typeof (e as { digest: string }).digest === 'string' && (e as { digest: string }).digest.startsWith('NEXT_REDIRECT'));

/**
 * Base action client for public, unauthenticated actions.
 * It automatically handles unexpected errors.
 */
export const actionClient = createSafeActionClient({
  handleServerError(e: unknown) {
    if (isRedirectError(e)) {
      throw e;
    }
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Action error:", err.message);
    if (err.message === 'Unauthorized' || 
        err.message === 'Not authenticated' || 
        err.message === 'Not logged in' ||
        err.message.includes('Image must be less than') || 
        err.message.includes('Invalid image format') ||
        err.message.includes('Booking not found')) {
      return err.message;
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
