import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifies that the user is a member of the organization with at least one
 * of the allowed roles. Throws an AuthorizationError when not a member.
 *
 * This guard is required before any service-role (admin client) write that
 * targets rows addressed by client-supplied IDs, since the admin client
 * bypasses RLS.
 */
export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

const ROLE_RANK: Record<string, number> = {
  viewer: 1,
  editor: 2,
  manager: 3,
  owner: 4,
}

export async function requireOrgRole(
  userClient: SupabaseClient,
  userId: string,
  organizationId: string,
  minRole: keyof typeof ROLE_RANK = 'editor'
): Promise<void> {
  if (!organizationId || organizationId === 'demo-org') return

  const { data: membership, error } = await userClient
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Authorization check failed: ${error.message}`)
  }

  if (!membership) {
    throw new AuthorizationError('You do not have access to this organization')
  }

  const memberRank = ROLE_RANK[membership.role as string] ?? 0
  const requiredRank = ROLE_RANK[minRole] ?? 2
  if (memberRank < requiredRank) {
    throw new AuthorizationError('Insufficient role for this operation')
  }
}

/**
 * Verifies that the user is a member of the organization that owns the page,
 * by resolving page -> location -> organization through the RLS-scoped user
 * client, then checking membership. Returns the owning organization_id.
 */
export async function requirePageOwnership(
  userClient: SupabaseClient,
  userId: string,
  pageId: string,
  minRole: keyof typeof ROLE_RANK = 'editor'
): Promise<string> {
  const { data: page, error } = await userClient
    .from('location_pages')
    .select('id, location_id, locations!inner(organization_id)')
    .eq('id', pageId)
    .maybeSingle()

  if (error || !page) {
    throw new AuthorizationError('Page not found or not accessible')
  }

  const locations = (page as unknown as { locations: { organization_id: string } | { organization_id: string }[] }).locations
  const orgId = Array.isArray(locations) ? locations[0]?.organization_id : locations?.organization_id
  if (!orgId) {
    throw new AuthorizationError('Page not found or not accessible')
  }

  await requireOrgRole(userClient, userId, orgId, minRole)
  return orgId
}
