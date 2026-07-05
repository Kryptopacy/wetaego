'use client'

import * as React from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { 
  Search,
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  QrCode,
  Users,
  MessageSquare,
  TrendingUp,
  FileText,
  CreditCard
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none"
          >
            <div className="w-full max-w-xl pointer-events-auto shadow-2xl rounded-xl overflow-hidden border border-zinc-800 bg-[#0a0a0f]">
              <Command
                className="w-full h-full flex flex-col"
                shouldFilter={true}
              >
                <div className="flex items-center border-b border-zinc-800 px-3" cmdk-input-wrapper="">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
                  <Command.Input 
                    autoFocus 
                    placeholder="Type a command or search..." 
                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 text-zinc-200">
                  <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                    No results found.
                  </Command.Empty>
                  
                  <Command.Group heading="General" className="px-2 py-1.5 text-xs font-medium text-zinc-500">
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/orders'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <TrendingUp className="mr-2 h-4 w-4 text-emerald-400" />
                      Live Orders
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/pages'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <FileText className="mr-2 h-4 w-4 text-emerald-400" />
                      Your Pages
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Management" className="px-2 py-1.5 text-xs font-medium text-zinc-500 mt-2 border-t border-zinc-800/50 pt-3">
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/menu'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <BookOpen className="mr-2 h-4 w-4 text-orange-400" />
                      Catalog & Menu
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/qr'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      QR Generator
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/customers'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <Users className="mr-2 h-4 w-4 text-blue-400" />
                      Customers & CRM
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/manage/feedback'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <MessageSquare className="mr-2 h-4 w-4 text-rose-400" />
                      Feedback Inbox
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Account" className="px-2 py-1.5 text-xs font-medium text-zinc-500 mt-2 border-t border-zinc-800/50 pt-3">
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/billing'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Command.Item>
                    <Command.Item
                      onSelect={() => runCommand(() => router.push('/dashboard/settings'))}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-white transition-colors"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings & Team
                    </Command.Item>
                  </Command.Group>

                </Command.List>
              </Command>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
