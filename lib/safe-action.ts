import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { createClient } from '@/lib/supabase/server';

/**
 * Base action client for public, unauthenticated actions.
 * It automatically handles unexpected errors.
 */
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);
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
