'use client'

import React, { useState, useRef, useEffect } from 'react'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  // Feel free to add more as needed
]

export function CurrencySelector({ defaultValue = 'NGN' }: { defaultValue?: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(defaultValue)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCurrency = CURRENCIES.find(c => c.code === selected) || CURRENCIES[0]

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden input to submit the form data natively */}
      <input type="hidden" name="currency_code" value={selected} />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-left"
      >
        <span>{selectedCurrency.code} - {selectedCurrency.name}</span>
        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl no-scrollbar">
          <div className="sticky top-0 bg-zinc-800 p-2 border-b border-zinc-700">
            <input
              type="text"
              placeholder="Search currency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="p-1">
            {filteredCurrencies.length === 0 ? (
              <div className="p-2 text-sm text-zinc-400 text-center">No currencies found.</div>
            ) : (
              filteredCurrencies.map(currency => (
                <div
                  key={currency.code}
                  onClick={() => {
                    setSelected(currency.code)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors flex justify-between items-center ${
                    selected === currency.code 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'text-zinc-200 hover:bg-zinc-700/50 hover:text-white'
                  }`}
                >
                  <span>{currency.code} - {currency.name}</span>
                  <span className="text-zinc-500">{currency.symbol}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
