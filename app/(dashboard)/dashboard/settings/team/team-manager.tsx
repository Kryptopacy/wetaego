'use client'

import { useState } from 'react'
import { createInviteAction, revokeInviteAction, removeMemberAction, updateMemberRoleAction, updateMemberDepartmentAction } from './actions'

const DEPARTMENT_SUGGESTIONS = [
  'Restaurant', 'Bar', 'Kitchen', 'Front Desk', 'Housekeeping',
  'Security', 'Poolside', 'Spa & Wellness', 'Concierge', 'Valet',
]

interface Member {
  user_id: string
  email: string
  role: string
  created_at: string
  full_name?: string
  department?: string
  bank_name?: string
  account_number?: string
  account_name?: string
}


interface Invite {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  department?: string
}

interface TeamManagerProps {
  organizationId: string
  currentUserId: string
  currentUserRole: string
  members: Member[]
  invites: Invite[]
}

export default function TeamManager({
  organizationId,
  currentUserId,
  currentUserRole,
  members,
  invites,
}: TeamManagerProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'editor' | 'viewer'>('viewer')
  const [inviteDepartment, setInviteDepartment] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isOwnerOrManager = currentUserRole === 'owner' || currentUserRole === 'manager'

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwnerOrManager) return

    setIsInviting(true)
    setError(null)
    setSuccess(null)
    setGeneratedLink(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createInviteAction({ orgId: organizationId, email: inviteEmail, role: inviteRole as any, department: inviteDepartment.trim() || undefined })
    setIsInviting(false)

    if (result?.serverError || result?.validationErrors) {
      setError(result?.serverError || 'Failed to create invite')
    } else if (result.data?.token) {
      const link = `${window.location.origin}/invite?token=${result.data.token}`
      setGeneratedLink(link)
      setSuccess(`Invite generated successfully!`)
      setInviteEmail('')
      setInviteDepartment('')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!isOwnerOrManager) return
    if (!confirm('Are you sure you want to revoke this invite?')) return

    setError(null)
    setSuccess(null)

    const result = await revokeInviteAction({ orgId: organizationId, inviteId })
    if (result?.serverError || result?.validationErrors) {
      setError(result?.serverError || 'Failed to revoke invite')
    } else {
      setSuccess('Invite revoked.')
    }
  }

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!isOwnerOrManager) return
    if (userId === currentUserId) {
      setError('You cannot remove yourself.')
      return
    }
    if (!confirm(`Are you sure you want to remove ${email} from the organization?`)) return

    setError(null)
    setSuccess(null)

    const result = await removeMemberAction({ orgId: organizationId, userIdToDelete: userId })
    if (result?.serverError || result?.validationErrors) {
      setError(result?.serverError || 'Failed to remove member')
    } else {
      setSuccess('Member removed from team.')
    }
  }

  const handleUpdateRole = async (userId: string, email: string, newRole: string) => {
    if (!isOwnerOrManager) return
    if (!confirm(`Are you sure you want to change ${email}'s role to ${newRole}?`)) return

    setError(null)
    setSuccess(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateMemberRoleAction({ orgId: organizationId, targetUserId: userId, newRole: newRole as any })
    if (result?.serverError || result?.validationErrors) {
      setError(result?.serverError || 'Failed to update member role')
    } else {
      setSuccess('Member role updated.')
    }
  }

  const handleUpdateDepartment = async (userId: string, newDept: string) => {
    if (!isOwnerOrManager) return
    setError(null)
    setSuccess(null)
    const result = await updateMemberDepartmentAction({ orgId: organizationId, targetUserId: userId, department: newDept || null })
    if (result?.serverError || result?.validationErrors) {
      setError(result?.serverError || 'Failed to update department')
    } else {
      setSuccess('Department updated.')
    }
  }

  const copyToClipboard = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      case 'manager':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      case 'editor':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      case 'viewer':
      default:
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
    }
  }

  // Group members by department
  const grouped: Record<string, Member[]> = {}
  for (const member of members) {
    const dept = member.department || 'General'
    if (!grouped[dept]) grouped[dept] = []
    grouped[dept].push(member)
  }
  const deptKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'General') return 1
    if (b === 'General') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Invite Link generated popover/section */}
      {generatedLink && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Invite Link Ready
          </div>
          <p className="text-sm text-zinc-300">
            Share this link with your team member. They can use it to register or log in and join your organization.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={generatedLink}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-400 outline-none select-all"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex items-center gap-2 shrink-0"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            This link is one-time use and will expire in 7 days.
          </p>
        </div>
      )}

      {/* Invite Member Section */}
      {isOwnerOrManager ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Invite Team Member</h2>
          <p className="text-sm text-zinc-400 mb-6">Create an invitation link to add managers, editors, or service staff to your business.</p>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="mb-2 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@business.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="mb-2 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'manager' | 'editor' | 'viewer')}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer (Host/Service Staff)</option>
                  <option value="editor">Editor (Menu Manager)</option>
                  <option value="manager">Manager (Full Admin)</option>
                </select>
              </div>
            </div>

            {/* Department field */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Department <span className="text-zinc-600 normal-case font-normal">(optional)</span>
              </label>
              <input
                list="dept-suggestions"
                type="text"
                value={inviteDepartment}
                onChange={(e) => setInviteDepartment(e.target.value)}
                placeholder="e.g. Kitchen, Bar, Front Desk, Poolside…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <datalist id="dept-suggestions">
                {DEPARTMENT_SUGGESTIONS.map(d => <option key={d} value={d} />)}
              </datalist>
              <p className="text-xs text-zinc-600 mt-1">
                Staff in the same department get their own private Intercom channel.
                Managers can read all channels.
              </p>
            </div>

            <button
              type="submit"
              disabled={isInviting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shrink-0 disabled:opacity-50"
            >
              {isInviting ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
          Only the business Owner can send invitations or manage member accounts. Managers have full read access to this page.
        </div>
      )}

      {/* Active Invites List */}
      {invites.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">Pending Invites ({invites.length})</h2>
          </div>
          <div className="divide-y divide-zinc-850">
            {invites.map((invite) => (
              <div key={invite.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-white">{invite.email}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {invite.department && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        {invite.department}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      Expires: {new Date(invite.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleBadgeColor(invite.role)}`}>
                    {invite.role}
                  </span>
                  {isOwnerOrManager && (
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members List — grouped by department */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Active Members ({members.length})</h2>

        {deptKeys.map(dept => (
          <div key={dept} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-6 py-3 border-b border-zinc-800 flex items-center gap-2">
              {dept !== 'General' ? (
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                  {dept}
                </span>
              ) : (
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  No Department
                </span>
              )}
              <span className="text-xs text-zinc-600">({grouped[dept].length})</span>
            </div>
            <div className="divide-y divide-zinc-850">
              {grouped[dept].map((member) => (
                <div key={member.user_id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                      {member.full_name ? `${member.full_name} (${member.email})` : member.email}
                      {member.user_id === currentUserId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Joined: {new Date(member.created_at).toLocaleDateString()}
                    </div>
                    {/* Inline department editor */}
                    {isOwnerOrManager && member.user_id !== currentUserId && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-zinc-600">Dept:</span>
                        <input
                          list="dept-suggestions"
                          type="text"
                          defaultValue={member.department || ''}
                          onBlur={(e) => {
                            const newVal = e.target.value.trim()
                            if (newVal !== (member.department || '')) {
                              handleUpdateDepartment(member.user_id, newVal)
                            }
                          }}
                          placeholder="Assign department…"
                          className="text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-zinc-300 outline-none focus:border-violet-500 w-40"
                        />
                      </div>
                    )}
                    {(member.bank_name || member.account_number) && (
                      <div className="text-xs text-blue-400 mt-2 p-2 bg-blue-500/10 rounded-md inline-block border border-blue-500/20">
                        <span className="font-semibold text-blue-300">Payout Account:</span> {member.bank_name} - {member.account_number} {member.account_name && `(${member.account_name})`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isOwnerOrManager && member.user_id !== currentUserId && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, member.email, e.target.value)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-white cursor-pointer hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 ${getRoleBadgeColor(member.role)}`}
                      >
                        <option value="viewer" className="bg-zinc-900 text-zinc-300">Viewer</option>
                        <option value="editor" className="bg-zinc-900 text-zinc-300">Editor</option>
                        <option value="manager" className="bg-zinc-900 text-zinc-300">Manager</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                    {isOwnerOrManager && member.user_id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.email)}
                        className="text-xs text-zinc-400 hover:text-red-400 font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
