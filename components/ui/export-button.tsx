'use client'

import React, { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename: string
  label?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

export function ExportButton({ data, filename, label = 'Export CSV', className = '', variant = 'outline' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.length === 0) return

    setIsExporting(true)
    
    try {
      // Get all headers dynamically
      const headers = Array.from(
        new Set(data.flatMap(item => Object.keys(item)))
      )

      // Convert to CSV
      const csvRows = []
      
      // Add headers
      csvRows.push(headers.join(','))
      
      // Add rows
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header]
          // Escape quotes and wrap in quotes to handle commas inside data
          if (val === null || val === undefined) return '""'
          const stringVal = String(val)
          return `"${stringVal.replace(/"/g, '""')}"`
        })
        csvRows.push(values.join(','))
      }

      const csvString = csvRows.join('\n')
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      
      // Trigger download
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export CSV', error)
    } finally {
      // slight delay for visual feedback
      setTimeout(() => setIsExporting(false), 500)
    }
  }

  // Basic styles mapping based on the rest of the project's styling pattern
  const baseStyles = "inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors rounded-lg focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
  
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      title={data.length === 0 ? "No data to export" : "Export to CSV"}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {label}
    </button>
  )
}
