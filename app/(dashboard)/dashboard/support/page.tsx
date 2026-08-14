import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Mail, MessageSquare, Bug, Lightbulb } from 'lucide-react'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Help & Support</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bug className="w-24 h-24 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-400" />
            Report a Bug
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Found an issue or something isn't working as expected? Let our engineering team know so we can squash it immediately.
          </p>
          <a 
            href="mailto:engineering@ourmenuos.online?subject=Bug Report"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Report Bug
          </a>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lightbulb className="w-24 h-24 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-400" />
            Feature Request
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Have a great idea for a new feature? We are constantly evolving OurMenu OS to better serve your business needs.
          </p>
          <a 
            href="mailto:features@ourmenuos.online?subject=Feature Request"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Suggest Feature
          </a>
        </div>
      </div>

      <div className="bg-linear-to-r from-blue-900/20 to-indigo-900/20 border border-blue-900/50 rounded-xl p-8 text-center">
        <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Need Immediate Assistance?</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
          Our Tego AI Co-Pilot (located in the bottom right corner) is always available to answer questions about how the platform works and guide you through configuration steps. For anything else, our support team is a click away.
        </p>
        <a 
          href="mailto:support@ourmenuos.online"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Mail className="w-5 h-5 mr-2" />
          Email Support Team
        </a>
      </div>
    </div>
  )
}
