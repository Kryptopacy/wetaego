'use client'

import { useState } from 'react'
import { deleteOrganizationAction } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DangerZone({ orgId, isOwner }: { orgId: string, isOwner: boolean }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  if (!isOwner || orgId === 'demo-org') return null

  async function handleDelete() {
    if (!confirm('DANGER: This action cannot be undone. All your menus, pages, and items will be permanently deleted. Are you absolutely sure?')) return

    setIsDeleting(true)
    try {
      const res = await deleteOrganizationAction(orgId)
      if (res.error) throw new Error(res.error)
      toast.success('Organization deleted successfully.')
      router.push('/dashboard') // Or landing page if they have no other orgs
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete organization')
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-12 border border-red-900/50 rounded-xl bg-red-950/20 overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Permanently delete this organization and all its data (menus, pages, settings, and team members). This action is irreversible.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isDeleting ? 'Deleting...' : 'Delete Organization'}
        </button>
      </div>
    </div>
  )
}
