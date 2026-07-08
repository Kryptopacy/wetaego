import { PrinterMode, usePrinterStore } from '@/lib/stores/printer-store'
import { toast } from 'sonner'
import { UIOrder } from '@/lib/types/frontend'
import { printOrder } from '@/lib/utils/printer'
import { Printer, Network, Settings, RefreshCcw, Globe } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { setLocale } from '@/app/actions/i18n'

export function HardwareSettingsView() {
  const { mode, ipAddress, autoPrintReceipts, setPrinterSettings } = usePrinterStore()
  const [isTesting, setIsTesting] = useState(false)
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value
    startTransition(() => {
      setLocale(nextLocale)
    })
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPrinterSettings(
      fd.get('mode') as PrinterMode,
      fd.get('ipAddress') as string,
      fd.get('autoPrint') === 'on'
    )
    toast.success('Hardware preferences synced securely.')
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    toast.info('Initiating print sequence...')
    // Create a dummy order for testing
    const testOrder: UIOrder = {
      id: 'test-1234',
      customer_name: 'Test Customer',
      table_identifier: 'Test Table',
      total_amount_minor: 150000,
      tip_amount_minor: 20000,
      status: 'paid',
      created_at: new Date().toISOString(),
      order_items: [
        {
          id: '1',
          item_name: 'Test Item 1',
          quantity: 2,
          price_minor: 50000,
        },
        {
          id: '2',
          item_name: 'Test Item 2',
          quantity: 1,
          price_minor: 30000,
        }
      ]
    
    } as unknown as UIOrder

    const success = await printOrder(testOrder, {
      mode,
      ipAddress,
      businessName: 'OurMenu System Test',
      businessType: 'restaurant'
    })

    if (success) {
      toast.success('Test print successful!')
    } else {
      toast.error('Test print failed to connect.')
    }
    setIsTesting(false)
  }

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="relative overflow-hidden border border-white/5 rounded-2xl bg-black/20 backdrop-blur-xl p-8 shadow-2xl">
        {/* Subtle decorative gradient */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Settings className="w-5 h-5 text-teal-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Device Integrations</h2>
        </div>
        <p className="text-zinc-400 mb-8 ml-11">
          Configure native hardware support for this specific terminal. Settings are isolated to this device.
        </p>

        <form onSubmit={handleSave} className="space-y-8 ml-11">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3 group">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Network className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                Connection Protocol
              </label>
              <div className="relative">
                <select 
                  name="mode" 
                  defaultValue={mode}
                  className="w-full appearance-none p-3.5 pl-4 pr-10 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-zinc-800/50"
                >
                  <option value="html_kiosk">Browser Kiosk Mode (Universal USB)</option>
                  <option value="epson_epos">Network Print (Epson ePOS Standard)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-3 group">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Printer className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                IPv4 Address
              </label>
              <input 
                type="text" 
                name="ipAddress" 
                defaultValue={ipAddress}
                placeholder="e.g. 192.168.1.50"
                className="w-full p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-zinc-800/50 placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                name="autoPrint" 
                id="autoPrint"
                defaultChecked={autoPrintReceipts}
                className="peer sr-only"
              />
              <div className="w-10 h-6 bg-zinc-800 rounded-full peer peer-checked:bg-teal-500 transition-colors duration-300 ease-in-out"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-4 shadow-sm"></div>
            </div>
            <label htmlFor="autoPrint" className="text-sm font-medium text-zinc-300 cursor-pointer group-hover:text-white transition-colors">
              Enable automated fulfillment routing (Auto-print upon resolution)
            </label>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-3 group">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
              {t('language')}
            </label>
            <p className="text-xs text-zinc-500 mb-2">{t('languageDesc')}</p>
            <div className="relative sm:max-w-xs">
              <select 
                value={locale}
                onChange={handleLanguageChange}
                disabled={isPending}
                className="w-full appearance-none p-3.5 pl-4 pr-10 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-zinc-800/50 disabled:opacity-50"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                ▼
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-white/5">
            <button 
              type="submit"
              className="px-8 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
            >
              Sync Configuration
            </button>
            <button 
              type="button"
              onClick={handleTestPrint}
              disabled={isTesting}
              className="px-8 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Test Print
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
