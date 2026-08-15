'use client'

import React, { useState } from 'react'
import { ActionForm } from '@/components/ActionForm'
import { saveLocationAiSettings } from '../settings/actions'
import { AiKnowledgeBaseEditor } from '../settings/ai-knowledge-base-editor'
import AiFaqBuilder from '../settings/ai-faq-builder'
import { AiSimulator } from './ai-simulator'
import { Bot, Sparkles, Shield, HelpCircle, BookOpen, UserCog, Sliders, CheckCircle2 } from 'lucide-react'

interface AiSettingsClientProps {
  locationId: string
  activePageId?: string | null
  isAiActive: boolean
  aiName: string
  basePersonality: string
  escalationContact: string
  customInstructions: string
  managerProtectionMode: boolean
  brandKnowledge: string
  faqs: { question: string; answer: string }[]
}

export function AiSettingsClient({
  locationId,
  activePageId,
  isAiActive,
  aiName,
  basePersonality,
  escalationContact,
  customInstructions,
  managerProtectionMode,
  brandKnowledge,
  faqs
}: AiSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'persona' | 'knowledge' | 'automation'>('persona')
  const [status, setStatus] = useState(isAiActive ? 'true' : 'false')

  const tabs = [
    { id: 'persona', label: 'Persona & Voice', icon: UserCog, desc: 'Name, tone & sales guidelines' },
    { id: 'knowledge', label: 'Knowledge & FAQs', icon: BookOpen, desc: 'Policies, catalog info & answers' },
    { id: 'automation', label: 'Guardrails & Shield', icon: Shield, desc: 'Peak protection & staff escalation' },
  ] as const

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Tabbed Settings */}
      <div className="lg:col-span-7 space-y-6">
        {/* Category Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center sm:items-start p-3 rounded-xl transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span className="text-xs font-bold truncate">{tab.label}</span>
                </div>
                <span className="hidden sm:inline text-[10px] text-zinc-500 line-clamp-1">{tab.desc}</span>
              </button>
            )
          })}
        </div>

        <ActionForm action={saveLocationAiSettings} className="space-y-6">
          <input type="hidden" name="locationId" value={locationId} />
          {activePageId && <input type="hidden" name="pageId" value={activePageId} />}

          {/* ── TAB 1: PERSONA & VOICE ── */}
          {activeTab === 'persona' && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Assistant Persona & Status
                      {status === 'true' && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Active
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Define the public identity and conversational tone for your customer concierge.
                    </p>
                  </div>
                </div>

                <div className="w-36">
                  <select
                    name="aiEnabled"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="true">🟢 Active</option>
                    <option value="false">⚪ Disabled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Assistant Name / Moniker
                  </label>
                  <input
                    type="text"
                    name="aiName"
                    required
                    defaultValue={aiName}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500 text-xs font-semibold"
                    placeholder="e.g. Concierge Alex, Studio Advisor"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Conversational Cadence / Tone
                  </label>
                  <select
                    name="aiBasePersonality"
                    defaultValue={basePersonality}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500 text-xs font-semibold"
                  >
                    <option value="professional">👔 Professional & Polite (Corporate / Retail / Clinics)</option>
                    <option value="casual">👋 Casual & Warm (Cafés / Studios / Local Shops)</option>
                    <option value="upscale">✨ Luxury & Sommelier (Fine Dining / High-End / VIP)</option>
                    <option value="witty">⚡ Energetic & Witty (Clubs / Entertainment / Youth)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Staff Escalation Contact
                </label>
                <input
                  type="text"
                  name="aiEscalationContact"
                  defaultValue={escalationContact}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500 text-xs"
                  placeholder="e.g. Speak to host at front desk or call reception at +1 555-0199"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Custom Directives & Recommendation Guidelines
                </label>
                <textarea
                  name="aiInstructions"
                  rows={4}
                  defaultValue={customInstructions}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500 text-xs leading-relaxed placeholder:text-zinc-600"
                  placeholder="e.g. Always recommend our seasonal bundles. Emphasize organic ingredients and highlight same-day booking options."
                  maxLength={2000}
                />
              </div>
            </div>
          )}

          {/* ── TAB 2: KNOWLEDGE BASE & FAQS ── */}
          {activeTab === 'knowledge' && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Business Backstory & Knowledge Base</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Equip your AI with deep context on your business history, parking, dress code, policies, and specialties.
                  </p>
                </div>
              </div>

              <div>
                <AiKnowledgeBaseEditor defaultValue={brandKnowledge} />
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Frequently Asked Questions (FAQ Directives)
                </label>
                <p className="text-xs text-zinc-500 mb-4">
                  Deterministic Q&A pairs the AI must strictly use when matching questions are asked.
                </p>
                <AiFaqBuilder initialFaqs={faqs} />
              </div>
            </div>
          )}

          {/* ── TAB 3: AUTOMATION & GUARDRAILS ── */}
          {activeTab === 'automation' && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Operational Guardrails & Peak Shield</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Prevent floor staff interruptions during high-traffic rush hours.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
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
                        When enabled, the AI independently handles routine inquiries and defers non-urgent feedback so floor staff and managers remain focused on customer fulfillment.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="aiManagerProtectionMode"
                    name="aiManagerProtectionMode"
                    defaultChecked={managerProtectionMode}
                    className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0 mt-1"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Public Intercom Integration</span>
                </div>
                <p>
                  Customers on any page of your storefront can tap the <strong>Concierge & Staff Intercom</strong> to get instant recommendations or summon on-duty staff.
                </p>
              </div>
            </div>
          )}

          {/* ── Save CTA Bar ── */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Changes take effect live immediately across all storefront sessions.</span>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Save AI Settings
            </button>
          </div>
        </ActionForm>
      </div>

      {/* Right Column: Live Testing Simulator */}
      <div className="lg:col-span-5 sticky top-6">
        <AiSimulator
          locationId={locationId}
          aiName={aiName}
          basePersonality={basePersonality}
        />
      </div>
    </div>
  )
}
