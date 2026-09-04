import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

/**
 * Returns a stable per-guest session identifier for rate limiting.
 * Reads the `session_id` cookie; when missing, issues a new one-year cookie
 * so anonymous visitors no longer share a single global 'anonymous' bucket.
 * Must be called from a server action or route handler (cookie writes allowed).
 */
export async function getGuestSessionId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get('session_id')?.value
  if (existing && existing.length >= 8) {
    return existing
  }

  const sessionId = randomUUID()
  try {
    cookieStore.set('session_id', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  } catch {
    // Read-only cookie context (e.g. server component render): fall back to
    // the issued id without persisting it.
  }
  return sessionId
}
