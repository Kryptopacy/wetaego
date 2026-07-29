'use client'

import React, { useState, useRef } from 'react'

const TEMPLATE_HEADINGS = [
  { label: '🏢 Overview & Vibe', template: '[🏢 OVERVIEW & VIBE]\n' },
  { label: '🕒 Hours & Location', template: '[🕒 OPENING HOURS & LOCATION]\n' },
  { label: '📋 Policies & Rules', template: '[📋 POLICIES & CANCELLATIONS]\n' },
  { label: '📶 Wi-Fi & Amenities', template: '[📶 AMENITIES & WI-FI]\n' },
  { label: '🛠️ Custom Heading', template: '[🛠️ CUSTOM HEADING]\n' },
]

export function AiKnowledgeBaseEditor({ defaultValue }: { defaultValue?: string }) {
  const [text, setText] = useState(defaultValue || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertHeading = (headingTemplate: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setText((prev) => (prev ? prev + '\n\n' + headingTemplate : headingTemplate))
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const prefix = text.substring(0, start)
    const suffix = text.substring(end)
    const insertion = (prefix.length > 0 && !prefix.endsWith('\n') ? '\n\n' : '') + headingTemplate

    const newText = prefix + insertion + suffix
    setText(newText)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = prefix.length + insertion.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <div className="space-y-3">
      {/* Informational Guidance Banner */}
      <div className="rounded-xl bg-blue-950/40 border border-blue-500/30 p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
        <span className="text-base leading-none">✨</span>
        <div className="space-y-1">
          <p className="font-semibold text-blue-100">
            Automatic Knowledge Integration — No Manual Menu Copying Needed!
          </p>
          <p className="text-blue-300/90">
            Your live menu items, prices, catalog listings, and business address are automatically indexed by the AI.
            Use this section to add venue policies, Wi-Fi passwords, parking rules, or special customer guidelines.
          </p>
        </div>
      </div>

      {/* Template Heading Pills */}
      <div>
        <span className="text-xs font-medium text-zinc-400 block mb-1.5">
          Quick-Insert Structured Headings:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_HEADINGS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => insertHeading(item.template)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
            >
              + {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        name="brandKnowledge"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono"
        placeholder="[🏢 OVERVIEW & VIBE]&#10;Quiet, upscale lounge with soft jazz music.&#10;&#10;[📶 AMENITIES & WI-FI]&#10;Wi-Fi network: LoungeGuest / Pass: welcome2026"
        maxLength={4000}
      />
      <p className="text-xs text-zinc-500 flex justify-between">
        <span>Use structured headings above so your AI assistant can accurately find answers.</span>
        <span>{text.length}/4000</span>
      </p>
    </div>
  )
}
