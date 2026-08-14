import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PrinterMode = 
  | 'html_kiosk' 
  | 'epson_epos' 
  | 'star_prnt' 
  | 'raw_escpos_usb' 
  | 'raw_escpos_serial' 
  | 'raw_escpos_bluetooth'

interface PrinterState {
  mode: PrinterMode
  ipAddress: string
  baudRate: number
  autoPrintReceipts: boolean
  setPrinterSettings: (mode: PrinterMode, ipAddress: string, autoPrint: boolean, baudRate?: number) => void
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      mode: 'html_kiosk',
      ipAddress: '',
      baudRate: 9600,
      autoPrintReceipts: false,
      setPrinterSettings: (mode, ipAddress, autoPrint, baudRate = 9600) => 
        set({ mode, ipAddress, autoPrintReceipts: autoPrint, baudRate }),
    }),
    {
      name: 'ourmenu-hardware-printer-settings',
    }
  )
)
