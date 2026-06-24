import { ActionForm } from '@/components/ActionForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  updateOrganization, 
  saveLocationAiSettings,
  saveLocationInfoSettings
} from './actions'
import { AICoverStudio } from './ai-cover-studio'
import { PlanType } from '@/lib/payments/credits'
import { getPlanLimits } from '@/lib/utils/settings'
import { savePaymentSettings, saveManualPaymentSettings } from './payment-actions'



export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'general' } = await searchParams;
  const supabase = await createClient()

  // Fetch current user
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  
  

  if (!user) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  // Fetch their organization and role
  let organization = null
  let role = 'viewer'
  let creditsRemaining = 0

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, slug, subscription_tier, purchased_credits, monthly_free_credits_used)')
    .eq('user_id', userId)
    .single()

  if (member && member.organizations) {
    organization = member.organizations
    role = member.role
    const orgData = organization
    const tier = orgData.subscription_tier as PlanType
    const dynamicPlanLimits = await getPlanLimits() as Record<string, { credits: number, pages: number }>
    const monthlyLimit = dynamicPlanLimits[tier]?.credits || 0
    const availableFree = Math.max(0, monthlyLimit - orgData.monthly_free_credits_used)
    creditsRemaining = availableFree + orgData.purchased_credits
  } else {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug, subscription_tier, purchased_credits, monthly_free_credits_used')
      .eq('created_by', userId)
      .single()
    organization = org
    role = 'owner'
    if (org) {
      const tier = org.subscription_tier as PlanType
      const dynamicPlanLimits = await getPlanLimits() as Record<string, { credits: number, pages: number }>
      const monthlyLimit = dynamicPlanLimits[tier]?.credits || 0
      const availableFree = Math.max(0, monthlyLimit - org.monthly_free_credits_used)
      creditsRemaining = availableFree + org.purchased_credits
    }
  }

  const isOwnerOrManager = role === 'owner' || role === 'manager'
  
  // If not owner/manager and they are on a restricted tab, redirect them to their profile
  if (!isOwnerOrManager && tab !== 'profile') {
    redirect('/dashboard/settings?tab=profile')
  }

  let paymentSettings = null
  let location = null
  if (organization && isOwnerOrManager) {
    const { data: paySettings } = await supabase
      .from('organization_payment_settings')
      .select('*')
      .eq('organization_id', organization.id)
      .single()
    paymentSettings = paySettings

    const { data: loc } = await supabase
      .from('locations')
      .select('*')
      .eq('organization_id', organization.id)
      .limit(1)
      .single()
    location = loc
  }

  // Fetch their profile details for the inputs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userProfile } = await (supabase as any)
    .from('user_profiles')
    .select('full_name, bank_name, account_number, account_name')
    .eq('id', userId)
    .single()

  return (
    <div className="max-w-3xl pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Business Settings</h1>
        {isOwnerOrManager && (
          <Link 
            href="/dashboard/settings/team" 
            className="self-start px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium transition-colors border border-zinc-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Manage Team
          </Link>
        )}
      </div>

      <div className="flex space-x-1 border-b border-zinc-800 mb-6 overflow-x-auto no-scrollbar">
        {isOwnerOrManager && (
          <>
            <Link 
              href="?tab=general"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === 'general' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              General & Payments
            </Link>
            <Link 
              href="?tab=venue"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === 'venue' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              Venue Information
            </Link>
            <Link 
              href="?tab=ai"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === 'ai' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              AI Assistant
            </Link>
            <Link 
              href="?tab=promotions"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === 'promotions' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              Promotions
            </Link>
          </>
        )}
        <Link 
          href="?tab=profile"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            tab === 'profile' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          My Profile
        </Link>
        {isOwnerOrManager && (
          <>
            <Link 
              href="?tab=loyalty"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === 'loyalty' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              Loyalty & CRM
            </Link>
            <Link 
              href="?tab=addons"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === 'addons' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              Add-ons
            </Link>
          </>
        )}
      </div>

      <div className="space-y-6">
        {tab === 'profile' && user && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-2">My Profile</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Set your personal profile details. This name will be visible to your team.
            </p>
            <ActionForm action={async (formData) => {
              'use server'
              const { updateProfile } = await import('./actions')
              await updateProfile(formData)
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

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <h3 className="text-md font-semibold text-white mb-2">Payout Details (Tips & Earnings)</h3>
                <p className="text-sm text-zinc-400 mb-4">
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

              <div className="mt-4 flex items-center justify-between">
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                  Save Profile & Payout Details
                </button>
              </div>
            </ActionForm>
          </div>
        )}

        {tab === 'general' && (
          <>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">General Info</h2>
          <ActionForm action={updateOrganization} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Business Name</label>
              <input
                type="text"
                name="name"
                defaultValue={organization?.name || ''}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="My Lounge"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Public Slug (URL)</label>
              <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <span className="px-4 text-zinc-500">ourmenuos.online/m/</span>
                <input
                  type="text"
                  name="slug"
                  defaultValue={organization?.slug || ''}
                  required
                  pattern="[a-z0-9\-]+"
                  className="w-full bg-transparent py-2.5 text-white outline-none"
                  placeholder="my-lounge"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">Only lowercase letters, numbers, and hyphens.</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </ActionForm>
        </div>

        {organization && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                Paystack Integration
                {paymentSettings?.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span>
                )}
              </h2>
              <p className="text-sm text-zinc-400 mb-6">Connect your bank account via Paystack to receive payouts instantly when customers order from your digital menu.</p>
              
              <ActionForm action={savePaymentSettings} className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Bank Name</label>
                  <select name="bankName" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="">Select a bank...</option>
                    <option value="058">Guaranty Trust Bank</option>
                    <option value="057">Zenith Bank</option>
                    <option value="011">First Bank of Nigeria</option>
                    <option value="033">United Bank for Africa</option>
                    <option value="044">Access Bank</option>
                    <option value="050">Ecobank Nigeria</option>
                    <option value="232">Sterling Bank</option>
                    <option value="032">Union Bank of Nigeria</option>
                    <option value="215">Unity Bank</option>
                    <option value="035">Wema Bank</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0123456789"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Must be a valid 10-digit NUBAN account number.</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Registered Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    required
                    defaultValue={organization?.name || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-zinc-500">The legal name associated with this bank account.</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors">
                    {paymentSettings?.is_active ? 'Update Bank Account' : 'Connect Bank Account'}
                  </button>
                </div>
              </ActionForm>
            </div>

            {location && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  Manual Transfer Fallback
                  {location.manual_payment_enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Enabled</span>
                  )}
                </h2>
                <p className="text-sm text-zinc-400 mb-6">
  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  If your Paystack account isn't live yet or the provider experiences downtime, the system will automatically fall back to showing these manual bank transfer details so you never lose a booking.
                </p>
                
                <ActionForm action={saveManualPaymentSettings} className="flex flex-col gap-4">
                  <input type="hidden" name="locationId" value={location.id} />
                  
                  <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Status</label>
                  <select name="manualPaymentEnabled" defaultValue={location.manual_payment_enabled ? 'true' : 'false'} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="false">Disabled</option>
                    <option value="true">Enabled (Use as Fallback)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Bank Name</label>
                    <input
                      type="text"
                      name="manualBankName"
                      defaultValue={location.manual_payment_bank_name || ''}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Zenith Bank"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Account Number</label>
                    <input
                      type="text"
                      name="manualAccountNumber"
                      defaultValue={location.manual_payment_account_number || ''}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="0123456789"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Account Name</label>
                  <input
                    type="text"
                    name="manualAccountName"
                    defaultValue={location.manual_payment_account_name || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. My Lounge Limited"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Transfer Instructions</label>
                  <textarea
                    name="manualInstructions"
                    rows={2}
                    defaultValue={location.manual_payment_instructions || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="e.g. Please use your Order Number as the transfer remark and send a receipt on WhatsApp."
                    maxLength={500}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                    Save Fallback Settings
                  </button>
                </div>
              </ActionForm>
            </div>
            )}
          </div>
        )}
          </>
        )}

        {tab === 'venue' && location && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              Venue Information
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Add details that customers might find helpful while at your venue. These will be displayed on your public digital menu.
            </p>

            <div className="mb-8">
              <AICoverStudio 
                locationId={location.id} 
                currentCoverUrl={location.cover_image_url} 
                creditsRemaining={creditsRemaining} 
              />
            </div>

            <ActionForm action={saveLocationInfoSettings} className="flex flex-col gap-4">
              <input type="hidden" name="locationId" value={location.id} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Wi-Fi Network Name</label>
                  <input
                    type="text"
                    name="wifiNetwork"
                    defaultValue={location.wifi_network || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Guest Wi-Fi"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Wi-Fi Password</label>
                  <input
                    type="text"
                    name="wifiPassword"
                    defaultValue={location.wifi_password || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Leave blank if open"
                    maxLength={100}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Instagram Handle</label>
                <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="px-4 text-zinc-500">@</span>
                  <input
                    type="text"
                    name="instagramHandle"
                    defaultValue={location.instagram_handle || ''}
                    className="w-full bg-transparent py-2.5 text-white outline-none"
                    placeholder="yourvenue"
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Twitter (X) Handle</label>
                  <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="px-4 text-zinc-500">@</span>
                    <input
                      type="text"
                      name="twitterHandle"
                      defaultValue={location.twitter_handle || ''}
                      className="w-full bg-transparent py-2.5 text-white outline-none"
                      placeholder="yourvenue"
                      maxLength={50}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Facebook Handle</label>
                  <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="px-4 text-zinc-500">/</span>
                    <input
                      type="text"
                      name="facebookHandle"
                      defaultValue={location.facebook_handle || ''}
                      className="w-full bg-transparent py-2.5 text-white outline-none"
                      placeholder="yourvenue"
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">WhatsApp Number</label>
                  <input
                    type="text"
                    name="whatsappNumber"
                    defaultValue={location.whatsapp_number || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="+1234567890"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    defaultValue={location.phone_number || ''}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="(555) 123-4567"
                    maxLength={30}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Google Maps URL</label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  defaultValue={location.google_maps_url || ''}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="https://maps.google.com/..."
                  maxLength={300}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Operating Hours</label>
                <input
                  type="text"
                  name="operatingHours"
                  defaultValue={location.operating_hours || ''}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="e.g. Mon-Sun, 11:00 AM - 11:00 PM"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Location Identifier Label (Table, Room, Seat)</label>
                <input
                  type="text"
                  name="fulfillmentLocationLabel"
                  defaultValue={location.fulfillment_location_label || 'Table'}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="e.g. Table, Room, Cabana, Seat"
                  maxLength={50}
                />
              </div>

              <div className="mt-6">
                <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                  Save Venue Info
                </button>
              </div>
            </ActionForm>
          </div>
        )}

        {tab === 'promotions' && location && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Promotions & Discounts</h2>
            <ActionForm action={async (formData) => {
              'use server'
              const { saveLocationPromotions } = await import('./promotions-actions')
              await saveLocationPromotions(formData)
            }} className="flex flex-col gap-5">
              <input type="hidden" name="locationId" value={location.id} />
              
              <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                <input 
                  type="checkbox" 
                  id="global_discount_enabled"
                  name="global_discount_enabled" 
                  defaultChecked={location.global_discount_enabled || false}
                  className="w-5 h-5 rounded border-zinc-600 text-blue-500 bg-zinc-800"
                />
                <label htmlFor="global_discount_enabled" className="text-sm font-medium text-white flex-1 cursor-pointer">
                  Enable Global Discount
                  <span className="block text-xs text-zinc-400 font-normal mt-0.5">Apply an automatic discount to all items on your menu.</span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Discount Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="global_discount_percentage"
                    defaultValue={location.global_discount_percentage || ''}
                    placeholder="e.g. 10"
                    min="0"
                    max="100"
                    className="w-full rounded-xl bg-zinc-800 border-zinc-700 px-4 py-3 text-white outline-none focus:border-blue-500 pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-zinc-400">%</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Example: 10 means 10% off the cart subtotal.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Promotional Banner Text</label>
                <input
                  type="text"
                  name="global_discount_banner_text"
                  defaultValue={location.global_discount_banner_text || ''}
                  placeholder="e.g. Weekend Special! 10% Off Everything!"
                  className="w-full rounded-xl bg-zinc-800 border-zinc-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
                <p className="text-xs text-zinc-500 mt-2">This text will be displayed prominently at the top of your public menu.</p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                >
                  Save Promotions
                </button>
              </div>
            </ActionForm>
          </div>
        )}

        {tab === 'ai' && location && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              AI Chat Assistant Configuration
              {location.ai_enabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Active</span>
              )}
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Enable an interactive AI dining advisor on your public menu. Guests can chat with it to get recommendations, ask questions, customize items, and manage their cart.
            </p>

            <ActionForm action={saveLocationAiSettings} className="flex flex-col gap-4">
              <input type="hidden" name="locationId" value={location.id} />
              
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Status</label>
                <select name="aiEnabled" defaultValue={location.ai_enabled ? 'true' : 'false'} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Assistant Name</label>
                <input
                  type="text"
                  name="aiName"
                  required
                  defaultValue={location.ai_name || 'AI Assistant'}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Pierre the Bistro Bot"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Custom Tone & Instructions</label>
                <textarea
                  name="aiInstructions"
                  rows={3}
                  defaultValue={location.ai_instructions || ''}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Define style/personality. e.g.: Be very polite and helpful. Suggest drink pairings. Recommend happy hour specials."
                  maxLength={2000}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Brand Context & Knowledge</label>
                <textarea
                  name="brandKnowledge"
                  rows={4}
                  defaultValue={location.brand_knowledge || ''}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Extra info about the venue. e.g.: Wi-Fi is Lounge2026. Parking is free. Specializing in dry-aged steaks. Vibe is quiet and upscale."
                  maxLength={4000}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                  Save AI Assistant Settings
                </button>
              </div>
            </ActionForm>
          </div>
        )}

        {tab === 'addons' && location && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              Menu Add-ons
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Enable fun, interactive add-ons to boost guest engagement on your public menu.
            </p>

            <ActionForm action={async (formData) => {
              'use server'
              const { saveAddonsSettings } = await import('./addons-actions')
              await saveAddonsSettings(formData)
            }} className="flex flex-col gap-8">
              <input type="hidden" name="locationId" value={location.id} />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-white">Payment Roulette</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Enable the Surprise Me spinning wheel for customers who can&apos;t decide what to eat.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="randomizerEnabled" value="true" defaultChecked={location.randomizer_enabled || false} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 space-y-5">
                <h3 className="text-md font-bold text-white mb-2">Gamified Discount Spinner</h3>
                
                <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                  <input 
                    type="checkbox" 
                    id="spinner_enabled"
                    name="spinner_enabled" 
                    defaultChecked={location.spinner_enabled || false}
                    className="w-5 h-5 rounded border-zinc-600 text-purple-500 bg-zinc-800"
                  />
                  <label htmlFor="spinner_enabled" className="text-sm font-medium text-white flex-1 cursor-pointer">
                    Enable Spin the Wheel
                    <span className="block text-xs text-zinc-400 font-normal mt-0.5">Let guests spin a wheel to win discounts before checkout.</span>
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Wheel Segments (JSON)</label>
                  <textarea
                    name="spinner_config"
                    defaultValue={location.spinner_config ? JSON.stringify(location.spinner_config, null, 2) : '[\n  { "label": "10% Off", "value": 10, "type": "win" },\n  { "label": "Try Again", "value": 0, "type": "loss" },\n  { "label": "5% Off", "value": 5, "type": "win" },\n  { "label": "No Luck", "value": 0, "type": "loss" }\n]'}
                    rows={6}
                    className="w-full rounded-xl bg-zinc-800 border-zinc-700 px-4 py-3 text-white outline-none focus:border-purple-500 font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Customize the wheel segments. &quot;value&quot; is the discount percentage won.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 space-y-5">
                <h3 className="text-md font-bold text-white mb-2">Delivery Settings</h3>
                
                <div className="flex items-center gap-3 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                  <input 
                    type="checkbox" 
                    id="delivery_enabled"
                    name="delivery_enabled" 
                    defaultChecked={location.delivery_enabled || false}
                    className="w-5 h-5 rounded border-zinc-600 text-green-500 bg-zinc-800"
                  />
                  <label htmlFor="delivery_enabled" className="text-sm font-medium text-white flex-1 cursor-pointer">
                    Enable Delivery Support
                    <span className="block text-xs text-zinc-400 font-normal mt-0.5">Allow customers to choose delivery at checkout.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Delivery Fee (Minor Units)</label>
                    <input
                      type="number"
                      name="delivery_fee_minor"
                      defaultValue={location.delivery_fee_minor || 0}
                      className="w-full rounded-xl bg-zinc-800 border-zinc-700 px-4 py-3 text-white outline-none focus:border-green-500"
                      placeholder="e.g. 150000 for ₦1,500"
                    />
                    <p className="text-xs text-zinc-500 mt-2">The flat fee added to delivery orders.</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Minimum Order (Minor Units)</label>
                    <input
                      type="number"
                      name="delivery_minimum_order_minor"
                      defaultValue={location.delivery_minimum_order_minor || 0}
                      className="w-full rounded-xl bg-zinc-800 border-zinc-700 px-4 py-3 text-white outline-none focus:border-green-500"
                      placeholder="e.g. 500000 for ₦5,000"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Minimum cart subtotal to qualify for delivery.</p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Delivery Note / Radius</label>
                  <input
                    type="text"
                    name="delivery_note"
                    defaultValue={location.delivery_note || ''}
                    className="w-full rounded-xl bg-zinc-800 border-zinc-700 px-4 py-3 text-white outline-none focus:border-green-500"
                    placeholder="e.g. Mainland Lagos Only"
                    maxLength={255}
                  />
                  <p className="text-xs text-zinc-500 mt-2">Displayed to customers when entering their delivery address.</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                  Save Add-ons
                </button>
              </div>
            </ActionForm>
          </div>
        )}
        
        {/* Removed AICoverStudio from here as it was moved inside Venue Information */}
      </div>
    </div>
  )
}




