'use client'

import { useState, useEffect, useRef } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'

export function DeliveryAddressAutocompleteWrapper({
  address,
  setAddress,
  setCoordinates
}: {
  address: string
  setAddress: (addr: string) => void
  setCoordinates: (lat: number, lng: number) => void
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  
  if (!apiKey) {
    return (
      <textarea 
        aria-label="Delivery Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="123 Main St, Apt 4B..."
        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-zinc-400 text-[15px] transition-all"
        rows={2}
      />
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <DeliveryAddressAutocomplete 
        address={address}
        setAddress={setAddress}
        setCoordinates={setCoordinates}
      />
    </APIProvider>
  )
}

function DeliveryAddressAutocomplete({
  address,
  setAddress,
  setCoordinates
}: {
  address: string
  setAddress: (addr: string) => void
  setCoordinates: (lat: number, lng: number) => void
}) {
  const [place, setPlace] = useState<any | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const places = useMapsLibrary('places')

  useEffect(() => {
    if (!places || !inputRef.current) return;
    
    const options = {
      fields: ['geometry', 'name', 'formatted_address']
    }

    const autocomplete = new places.Autocomplete(inputRef.current, options)
    
    autocomplete.addListener('place_changed', () => {
      const selectedPlace = autocomplete.getPlace()
      setPlace(selectedPlace)
      if (selectedPlace.formatted_address) {
        setAddress(selectedPlace.formatted_address)
      }
      if (selectedPlace.geometry?.location) {
        setCoordinates(selectedPlace.geometry.location.lat(), selectedPlace.geometry.location.lng())
      }
    })
  }, [places, setAddress, setCoordinates])

  return (
    <textarea 
      ref={inputRef}
      aria-label="Delivery Address"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Start typing your delivery address..."
      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-zinc-400 text-[15px] transition-all"
      rows={2}
    />
  )
}
