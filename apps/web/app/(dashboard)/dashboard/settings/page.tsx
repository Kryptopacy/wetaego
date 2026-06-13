/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { savePaymentSettings } from './payment-actions'
import { cookies } from 'next/headers'

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
  
  const cookieStore = await cookies()
  const isDemo = !user && cookieStore.get('demo_mode')?.value === '1'

  if (!user && !isDemo) {
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
    const orgData = organization as any
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
  if (!isOwnerOrManager) {
    redirect('/dashboard')
  }

  let paymentSettings = null
  let location = null
  if (organization) {
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

  return (
    <div className="max-w-3xl pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Business Settings</h1>
        <Link 
          href="/dashboard/settings/team" 
          className="self-start px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium transition-colors border border-zinc-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Manage Team
        </Link>
      </div>

      <div className="flex space-x-1 border-b border-zinc-800 mb-6 overflow-x-auto no-scrollbar">
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
      </div>

      <div className="space-y-6">
        {tab === 'general' && (
          <>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">General Info</h2>
          <form action={updateOrganization} className="flex flex-col gap-4">
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
                <span className="px-4 text-zinc-500">ourmenu.os/m/</span>
                <input
                  type="text"
                  name="slug"
                  defaultValue={organization?.slug || ''}
                  required
                  pattern="[a-z0-9-]+"
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
          </form>
        </div>

        {organization && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Payment Settings
              {paymentSettings?.is_active && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span>
              )}
            </h2>
            <p className="text-sm text-zinc-400 mb-6">Connect your bank account via Paystack to receive payouts instantly when customers order from your digital menu.</p>
            
            <form action={savePaymentSettings} className="flex flex-col gap-4">
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
            </form>
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

            <form action={saveLocationInfoSettings as any} className="flex flex-col gap-4">
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

              <div className="mt-2 flex items-center justify-between">
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                  Save Venue Info
                </button>
              </div>
            </form>
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

            <form action={saveLocationAiSettings as any} className="flex flex-col gap-4">
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
            </form>
          </div>
        )}

        {/* Removed AICoverStudio from here as it was moved inside Venue Information */}
      </div>
    </div>
  )
}


