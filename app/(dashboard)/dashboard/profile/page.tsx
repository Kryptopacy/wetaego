import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/submit-button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Fetch current user
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  
  if (!user) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  // Fetch their profile details for the inputs
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name, bank_name, account_number, account_name')
    .eq('id', userId)
    .single()

  return (
    <div className="max-w-3xl mx-auto pb-20 mt-8">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-zinc-400">
          Set your personal profile details and payout information.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <ActionForm action={async (formData) => {
          'use server'
          const { updateProfile } = await import('../settings/actions')
          return await updateProfile(formData)
        }} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Full Name</label>
            <input
              type="text"
              name="full_name"
              defaultValue={userProfile?.full_name || user.user_metadata?.full_name || ''}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Jane Doe"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-md font-semibold text-white mb-2">Payout Details (Tips & Earnings)</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Where should the business transfer your accumulated tips?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  defaultValue={userProfile?.bank_name || ''}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Opay, Moniepoint, GTBank"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  defaultValue={userProfile?.account_number || ''}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="0123456789"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-zinc-300">Account Name</label>
              <input
                type="text"
                name="account_name"
                defaultValue={userProfile?.account_name || ''}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Jane Doe"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <SubmitButton>Save Profile & Payout Details</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </div>
  )
}
