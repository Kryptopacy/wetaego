'use client'

import { useState, useEffect, useRef } from 'react'
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps'

export function LocationAutocomplete({ 
  initialAddress, 
  initialLat, 
  initialLng,
  initialGeofenceRadius,
  mapsApiKey
}: { 
  initialAddress: string, 
  initialLat: number | null, 
  initialLng: number | null,
  initialGeofenceRadius: number,
  mapsApiKey: string
}) {
  return (
    <APIProvider apiKey={mapsApiKey}>
      <AutocompleteFields 
        initialAddress={initialAddress} 
        initialLat={initialLat} 
        initialLng={initialLng}
        initialGeofenceRadius={initialGeofenceRadius}
      />
    </APIProvider>
  )
}

function AutocompleteFields({ initialAddress, initialLat, initialLng, initialGeofenceRadius }: {
  initialAddress: string,
  initialLat: number | null,
  initialLng: number | null,
  initialGeofenceRadius: number
}) {
  const [place, setPlace] = useState<any | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const places = useMapsLibrary('places')
  const [address, setAddress] = useState(initialAddress || '')
  const [lat, setLat] = useState(initialLat || '')
  const [lng, setLng] = useState(initialLng || '')
  const [radius, setRadius] = useState(initialGeofenceRadius || 100)

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
        setLat(selectedPlace.geometry.location.lat())
        setLng(selectedPlace.geometry.location.lng())
      }
    })
  }, [places])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Physical Address</label>
        <input
          ref={inputRef}
          type="text"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Start typing to search..."
          autoComplete="off"
        />
        <input type="hidden" name="latitude" value={lat} />
        <input type="hidden" name="longitude" value={lng} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Geofence Radius (meters)</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="geofenceRadiusMeters"
            min="50"
            max="1000"
            step="10"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-zinc-400 text-sm w-20">{radius}m</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">How close staff must be to clock in. Increase this if your venue is very large or if staff have GPS drifting issues.</p>
      </div>
    </div>
  )
}
