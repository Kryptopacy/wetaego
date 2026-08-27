import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PageHeader } from '@/components/ui/page-header'
import { AiSettingsClient } from './ai-settings-client'

export const metadata = {
  title: 'Storefront AI Concierge & Automation | WETAEGO',
}

export default async function AiConciergePage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const activeLocationId = cookieStore.get('ourmenu_active_location_id')?.value
  const activePageId = cookieStore.get('ourmenu_active_page_id')?.value

  if (!activeLocationId) {
    redirect('/dashboard/settings')
  }

  const { data: loc } = await supabase
    .from('locations')
    .select('id, name, portal_display_name, ai_enabled, ai_name, ai_base_personality, ai_escalation_contact, ai_instructions, ai_faqs, ai_manager_protection_mode, brand_knowledge, organization_id')
    .eq('id', activeLocationId)
    .single()

  if (!loc) {
    redirect('/dashboard/settings')
  }

  let activePage = null
  if (activePageId) {
    const { data: pageData } = await supabase
      .from('location_pages')
      .select('id, title, ai_enabled, ai_name, ai_base_personality, ai_escalation_contact, ai_instructions, ai_faqs')
      .eq('id', activePageId)
      .single()
    activePage = pageData
  }

  const isAiActive = (activePage?.ai_enabled ?? loc.ai_enabled) ?? false
  const aiName = activePage?.ai_name ?? loc.ai_name ?? 'AI Concierge'
  const basePersonality = activePage?.ai_base_personality ?? loc.ai_base_personality ?? 'professional'
  const escalationContact = activePage?.ai_escalation_contact ?? loc.ai_escalation_contact ?? ''
  const customInstructions = activePage?.ai_instructions ?? loc.ai_instructions ?? ''
  const managerProtectionMode = loc.ai_manager_protection_mode || false
  const brandKnowledge = loc.brand_knowledge || ''
  const faqs = ((activePage?.ai_faqs ?? loc.ai_faqs) as { question: string; answer: string }[]) ?? []

  return (
    <div className="max-w-6xl space-y-8 pb-20">
      <PageHeader
        title="Storefront AI Concierge & Automation"
        description="Configure your customer-facing AI concierge and automated assistant. Answers inquiries, suggests offerings, enforces business policies, and escalates to staff."
      />

      <AiSettingsClient
        locationId={loc.id}
        activePageId={activePage?.id}
        isAiActive={isAiActive}
        aiName={aiName}
        basePersonality={basePersonality}
        escalationContact={escalationContact}
        customInstructions={customInstructions}
        managerProtectionMode={managerProtectionMode}
        brandKnowledge={brandKnowledge}
        faqs={faqs}
      />
    </div>
  )
}
