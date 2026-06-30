'use client'

import { useState } from 'react'

type FAQ = { question: string; answer: string }

export default function AiFaqBuilder({ initialFaqs }: { initialFaqs?: FAQ[] }) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs || [])

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index][field] = value
    setFaqs(newFaqs)
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="aiFaqs" value={JSON.stringify(faqs)} />
      
      {faqs.map((faq, index) => (
        <div key={index} className="flex flex-col gap-2 p-4 bg-zinc-950 border border-zinc-800 rounded-lg relative">
          <button
            type="button"
            onClick={() => removeFaq(index)}
            className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 transition-colors"
            title="Remove FAQ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1 block">Question</label>
            <input
              type="text"
              value={faq.question}
              onChange={(e) => updateFaq(index, 'question', e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white outline-none focus:border-blue-500 text-sm"
              placeholder="e.g. Do you have vegan options?"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1 block">Answer</label>
            <textarea
              value={faq.answer}
              onChange={(e) => updateFaq(index, 'answer', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white outline-none focus:border-blue-500 text-sm resize-none"
              placeholder="e.g. Yes, we have several vegan dishes clearly marked on our menu."
              required
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addFaq}
        className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Add FAQ
      </button>
    </div>
  )
}
