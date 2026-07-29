'use client'

import { useState } from 'react'
import {
  AnimatedDialog,
  AnimatedDialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, AlertCircle, FileSpreadsheet, ArrowRight, CheckCircle2 } from 'lucide-react'
import { importCustomersAction } from './actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  organizationId: string
}

const DB_FIELDS = [
  { id: 'email', label: 'Email Address (Required)', required: true },
  { id: 'phone_number', label: 'Phone Number', required: false },
  { id: 'total_orders', label: 'Total Orders', required: false },
  { id: 'total_spend_minor', label: 'Total Spend (Minor units e.g., cents/kobo)', required: false },
  { id: 'last_visit_at', label: 'Last Visit Date (ISO)', required: false },
]

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/);
  const result: Record<string, string>[] = [];
  if (lines.length === 0) return { fields: [], data: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Regex to split by comma, ignoring commas inside quotes
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    result.push(obj);
  }
  return { fields: headers, data: result };
}

export function CustomerImportWizard({ organizationId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  
  // Parsed CSV state
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<any[]>([])
  
  // Mapping state: { [dbFieldId]: csvHeaderName }
  const [mapping, setMapping] = useState<Record<string, string>>({})
  
  const { execute, status } = useAction(importCustomersAction, {
    onSuccess: (res) => {
      if (res.data?.success) {
        toast.success(`Successfully imported ${res.data.count} customers!`)
        setOpen(false)
        router.refresh()
      }
    },
    onError: (err) => {
      toast.error(err.error.serverError || 'Failed to import customers')
    }
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error('Failed to read file.')
        return;
      }
      
      try {
        const results = parseCSV(text);
        if (results.fields && results.fields.length > 0) {
          setHeaders(results.fields)
          setRawData(results.data)
          
          // Auto-map where possible
          const autoMap: Record<string, string> = {}
          results.fields.forEach(h => {
            const lower = h.toLowerCase()
            if (lower.includes('email')) autoMap['email'] = h
            if (lower.includes('phone')) autoMap['phone_number'] = h
            if (lower.includes('order')) autoMap['total_orders'] = h
            if (lower.includes('spend') || lower.includes('ltv')) autoMap['total_spend_minor'] = h
            if (lower.includes('visit') || lower.includes('date')) autoMap['last_visit_at'] = h
          })
          setMapping(autoMap)
          setStep(2)
        } else {
          toast.error('Could not detect columns in CSV.')
        }
      } catch (error: any) {
         toast.error(`Error parsing CSV: ${error.message}`)
      }
    };
    reader.onerror = () => toast.error('Error reading file');
    reader.readAsText(f);
  }

  const handleImport = () => {
    // Validate mapping
    if (!mapping['email']) {
      toast.error('You must map an Email column.')
      return
    }
    
    const mappedCustomers = rawData.map(row => {
      return {
        email: row[mapping['email']]?.toString(),
        phone_number: mapping['phone_number'] ? row[mapping['phone_number']]?.toString() : null,
        total_orders: mapping['total_orders'] ? parseInt(row[mapping['total_orders']]?.toString() || '0', 10) : 0,
        total_spend_minor: mapping['total_spend_minor'] ? parseInt(row[mapping['total_spend_minor']]?.toString() || '0', 10) : 0,
        last_visit_at: mapping['last_visit_at'] ? (row[mapping['last_visit_at']] ? new Date(row[mapping['last_visit_at']]?.toString()).toISOString() : null) : null,
        marketing_opt_in: true // default to true for imported lists
      }
    }).filter(c => c.email && c.email.trim() !== '')

    if (mappedCustomers.length === 0) {
      toast.error('No valid customers found with an email address.')
      return
    }

    execute({
      organizationId,
      customers: mappedCustomers
    })
  }

  const reset = (openState: boolean) => {
    setOpen(openState)
    if (!openState) {
      setTimeout(() => {
        setStep(1)
        setFile(null)
        setHeaders([])
        setRawData([])
        setMapping({})
      }, 300)
    }
  }

  return (
    <AnimatedDialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
          <FileSpreadsheet className="w-4 h-4" />
          Import CSV
        </button>
      </DialogTrigger>
      <AnimatedDialogContent isOpen={open} className="sm:max-w-[600px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-0 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <DialogTitle className="text-xl font-bold">Import Customers</DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2">
            {step === 1 && "Upload a CSV file containing your existing customer database."}
            {step === 2 && "Map your CSV columns to OurMenu's database fields."}
            {step === 3 && "Review and confirm your import."}
          </DialogDescription>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors bg-zinc-900/50">
              <Upload className="w-10 h-10 text-zinc-500 mb-4" />
              <p className="text-sm text-zinc-400 mb-4 text-center">
                Drag and drop your .csv file here, or click to browse.
              </p>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="bg-white text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors">
                  Select File
                </div>
                <input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md flex gap-3 text-amber-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>We've attempted to auto-map your columns. Please verify before continuing. Customers without an email address will be skipped.</p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {DB_FIELDS.map(field => (
                  <div key={field.id} className="grid grid-cols-2 gap-4 items-center bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
                    <div>
                      <p className="font-medium text-sm text-zinc-200">{field.label}</p>
                    </div>
                    <select 
                      value={mapping[field.id] || "unmapped"} 
                      onChange={(e) => setMapping(prev => ({ ...prev, [field.id]: e.target.value === 'unmapped' ? '' : e.target.value }))}
                      className="w-full bg-black border border-zinc-800 text-zinc-300 rounded-md p-2 text-sm focus:outline-none focus:border-zinc-500"
                    >
                      <option value="unmapped" className="text-zinc-500 italic">-- Do not import --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md flex gap-3 text-emerald-500 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>Ready to import <strong>{rawData.filter(r => r[mapping['email']]?.toString().trim() !== '').length}</strong> customers.</p>
              </div>
              
              <div className="border border-zinc-800 rounded-md overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-900">
                    <tr>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {rawData.filter(r => r[mapping['email']]?.toString().trim() !== '').slice(0, 3).map((row, i) => (
                      <tr key={i} className="bg-black/50">
                        <td className="px-4 py-2 truncate max-w-[200px] text-zinc-300">{row[mapping['email']]}</td>
                        <td className="px-4 py-2 truncate max-w-[200px] text-zinc-300">{mapping['phone_number'] ? row[mapping['phone_number']] : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rawData.length > 3 && (
                <p className="text-xs text-zinc-500 text-center">Showing first 3 rows preview...</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center bg-zinc-900/30">
          {step === 2 && (
            <div className="flex justify-between w-full">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Back</button>
              <button onClick={() => setStep(3)} className="px-4 py-2 text-sm bg-white text-black rounded-md hover:bg-zinc-200 flex items-center">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="flex justify-between w-full">
              <button onClick={() => setStep(2)} disabled={status === 'executing'} className="px-4 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-50">Back</button>
              <button onClick={handleImport} disabled={status === 'executing'} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50">
                {status === 'executing' ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          )}
        </div>
      </AnimatedDialogContent>
    </AnimatedDialog>
  )
}
