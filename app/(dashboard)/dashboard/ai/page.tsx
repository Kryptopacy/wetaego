import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PageHeader } from '@/components/ui/page-header'
import { ActionForm } from '@/components/ActionForm'
import { saveLocationAiSettings } from '../settings/actions'
import { AiKnowledgeBaseEditor } from '../settings/ai-knowledge-base-editor'
import AiFaqBuilder from '../settings/ai-faq-builder'
import { Bot, Sparkles, Shield, HelpCircle, MessageSquare, BookOpen, UserCheck } from 'lucide-react'

export const metadata = {
  title: 'AI Concierge & Copilot | OurMenu OS',
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

  const isAiActive = activePage?.ai_enabled ?? loc.ai_enabled
  const aiName = activePage?.ai_name ?? loc.ai_name ?? 'AI Concierge'
  const basePersonality = activePage?.ai_base_personality ?? loc.ai_base_personality ?? 'professional'

  return (
    <div className="max-w-5xl space-y-8 pb-20">
      <PageHeader
        title="AI Concierge & Dining Copilot"
        description="Configure your automated storefront AI advisor. Guests can chat to get sensory recommendations, check dietary suitability, customize items, and ask about policies."
      />

      <ActionForm action={saveLocationAiSettings} className="space-y-8">
        <input type="hidden" name="locationId" value={loc.id} />
        {activePage && <input type="hidden" name="pageId" value={activePage.id} />}

        {/* ── Status & Persona Card ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Assistant Persona & Tone
                  {isAiActive && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Active on Storefront
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Choose your bot's name, public identity, and conversational style.
                </p>
              </div>
            </div>

            <div className="w-40">
              <select
                name="aiEnabled"
                defaultValue={isAiActive ? 'true' : 'false'}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="true">🟢 Enabled</option>
                <option value="false">⚪ Disabled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Assistant Name
              </label>
              <input
                type="text"
                name="aiName"
                required
                defaultValue={aiName}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
                placeholder="e.g. Chef Pierre, Concierge Sophia"
                maxLength={30}
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                This name is displayed to customers in the chat header and message bubbles.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Base Personality Tone
              </label>
              <select
                name="aiBasePersonality"
                defaultValue={basePersonality}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
              >
                <option value="professional">👔 Professional & Polite (Refined, courteous)</option>
                <option value="casual">👋 Casual & Friendly (Approachable, warm)</option>
                <option value="upscale">🍷 Upscale & Sommelier-Level (Articulate, sensory)</option>
                <option value="witty">✨ Witty & Playful (Lively, engaging)</option>
              </select>
              <p className="mt-1.5 text-xs text-zinc-500">
                Governs vocabulary, sentence cadence, and hospitality manners.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Escalation Contact / Hand-off Instructions
            </label>
            <input
              type="text"
              name="aiEscalationContact"
              defaultValue={activePage?.ai_escalation_contact ?? loc.ai_escalation_contact ?? ''}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
              placeholder="e.g. Call the host desk at 555-0199 or ask any floor server"
              maxLength={200}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Given to customers when a question requires human staff intervention.
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Custom Instructions & Upsell Guidelines
            </label>
            <textarea
              name="aiInstructions"
              rows={3}
              defaultValue={activePage?.ai_instructions ?? loc.ai_instructions ?? ''}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-white outline-none focus:border-blue-500 text-sm"
              placeholder="e.g. Always pair red meat with our signature cabernet. Mention that our Suya is 24-hour marinated."
              maxLength={2000}
            />
          </div>
        </div>

        {/* ── Peak-Hour Manager Protection Shield ── */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <label htmlFor="aiManagerProtectionMode" className="text-sm font-bold text-amber-300 block">
                  Manager Protection Mode (Peak-Hour Shield)
                </label>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  During peak rush hours, the AI proactively resolves guest queries and queues non-critical feedback for post-rush review instead of interrupting floor managers unless it is an urgent emergency.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="aiManagerProtectionMode"
              name="aiManagerProtectionMode"
              defaultChecked={loc.ai_manager_protection_mode || false}
              className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0 mt-1"
            />
          </div>
        </div>

        {/* ── Brand Knowledge Base & FAQs ── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Brand Knowledge & Venue Policies</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Provide venue backstory, dress code, parking instructions, and dietary handling guidelines.
              </p>
            </div>
          </div>

          <div>
            <AiKnowledgeBaseEditor defaultValue={loc.brand_knowledge || ''} />
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              Frequently Asked Questions (FAQs)
            </label>
            <p className="text-xs text-zinc-500 mb-4">
              Specific question & answer pairs the AI must strictly adhere to when asked.
            </p>
            <AiFaqBuilder initialFaqs={((activePage?.ai_faqs ?? loc.ai_faqs) as { question: string; answer: string }[]) ?? []} />
          </div>
        </div>

        {/* ── Save CTA Bar ── */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            Save AI Concierge Settings
          </button>
        </div>
      </ActionForm>
    </div>
  )
}
