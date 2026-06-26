import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PrinterMode = 'html_kiosk' | 'epson_epos' | 'star_prnt'

interface PrinterState {
  mode: PrinterMode
  ipAddress: string
  autoPrintReceipts: boolean
  setPrinterSettings: (mode: PrinterMode, ipAddress: string, autoPrint: boolean) => void
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      mode: 'html_kiosk',
      ipAddress: '',
      autoPrintReceipts: false,
      setPrinterSettings: (mode, ipAddress, autoPrint) => 
        set({ mode, ipAddress, autoPrintReceipts: autoPrint }),
    }),
    {
      name: 'ourmenu-hardware-printer-settings',
    }
  )
)
