import { PrinterMode, usePrinterStore } from '@/lib/stores/printer-store'
import { toast } from 'sonner'
import { UIOrder } from '@/lib/types/frontend'
import { printOrder } from '@/lib/utils/printer'
import { Printer, Network, Settings, RefreshCcw, Globe, Usb, Bluetooth, Cpu } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { setLocale } from '@/app/actions/i18n'

export function HardwareSettingsView() {
  const { mode, ipAddress, baudRate, autoPrintReceipts, setPrinterSettings } = usePrinterStore()
  const [selectedMode, setSelectedMode] = useState<PrinterMode>(mode)
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
    const newMode = (fd.get('mode') as PrinterMode) || 'html_kiosk'
    const newIp = (fd.get('ipAddress') as string) || ''
    const newBaud = parseInt((fd.get('baudRate') as string) || '9600', 10)
    const newAuto = fd.get('autoPrint') === 'on'

    setPrinterSettings(newMode, newIp, newAuto, newBaud)
    setSelectedMode(newMode)
    toast.success('Hardware preferences synced securely.')
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    toast.info('Initiating raw hardware print sequence...')

    const testOrder: UIOrder = {
      id: 'test-9941-escpos',
      customer_name: 'Walk-in Guest',
      table_identifier: 'Table 4',
      total_amount_minor: 850000,
      tip_amount_minor: 50000,
      status: 'paid',
      created_at: new Date().toISOString(),
      order_items: [
        {
          id: '1',
          item_name: 'Ribeye Steak (Medium Rare)',
          quantity: 2,
          price_minor: 350000,
        },
        {
          id: '2',
          item_name: 'Signature Smoked Old Fashioned',
          quantity: 2,
          price_minor: 75000,
        }
      ]
    } as unknown as UIOrder

    try {
      const success = await printOrder(testOrder, {
        mode: selectedMode,
        ipAddress,
        baudRate: baudRate || 9600,
        businessName: 'WETAEGO Hardware Test',
        businessType: 'restaurant'
      })

      if (success) {
        toast.success('Direct hardware test print succeeded!')
      } else {
        toast.error('Print failed or connection was cancelled.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hardware connection error.')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="relative overflow-hidden border border-white/5 rounded-2xl bg-black/20 backdrop-blur-xl p-8 shadow-2xl">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Settings className="w-5 h-5 text-teal-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Hardware & Regional Settings</h2>
        </div>
        <p className="text-zinc-400 mb-8 ml-11 text-sm">
          Configure direct binary thermal printer communication (ESC/POS bytecode over WebUSB, Serial, Bluetooth, or LAN) and localized interface languages.
        </p>

        <form onSubmit={handleSave} className="space-y-8 ml-11">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3 group sm:col-span-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Network className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                Receipt Printing Protocol
              </label>
              <div className="relative">
                <select 
                  name="mode" 
                  defaultValue={mode}
                  onChange={(e) => setSelectedMode(e.target.value as PrinterMode)}
                  className="w-full appearance-none p-3.5 pl-4 pr-10 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-zinc-800/50"
                >
                  <option value="raw_escpos_usb">🔌 Direct WebUSB (Raw Binary ESC/POS — Zero Dialog)</option>
                  <option value="raw_escpos_serial">⚡ Direct WebSerial / RS-232 COM Port (ESC/POS)</option>
                  <option value="raw_escpos_bluetooth">📡 Direct WebBluetooth BLE (ESC/POS Wireless)</option>
                  <option value="epson_epos">🌐 Network LAN / IP Print (Epson ePOS XML)</option>
                  <option value="html_kiosk">🖨️ Universal Browser Kiosk Print (Standard HTML Dialog)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  ▼
                </div>
              </div>
            </div>

            {selectedMode === 'epson_epos' && (
              <div className="space-y-3 group sm:col-span-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                  Printer IPv4 Address
                </label>
                <input 
                  type="text" 
                  name="ipAddress" 
                  defaultValue={ipAddress}
                  placeholder="e.g. 192.168.1.50"
                  className="w-full p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all hover:bg-zinc-800/50 placeholder:text-zinc-600"
                />
              </div>
            )}

            {selectedMode === 'raw_escpos_serial' && (
              <div className="space-y-3 group sm:col-span-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                  Serial Baud Rate
                </label>
                <select 
                  name="baudRate" 
                  defaultValue={baudRate || 9600}
                  className="w-full p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="9600">9600 Baud (Standard POS)</option>
                  <option value="19200">19200 Baud</option>
                  <option value="38400">38400 Baud</option>
                  <option value="115200">115200 Baud (High Speed)</option>
                </select>
              </div>
            )}
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
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="yo">Yorùbá (Yoruba)</option>
                <option value="ig">Asụsụ Igbo (Igbo)</option>
                <option value="ha">Harshen Hausa (Hausa)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                ▼
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5">
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
              {selectedMode.startsWith('raw_escpos') ? 'Pair & Test Hardware' : 'Test Print'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
