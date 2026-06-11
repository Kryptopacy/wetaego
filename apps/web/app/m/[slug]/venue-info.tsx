'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VenueInfoProps {
  location: any
}

export function VenueInfoModal({ location }: VenueInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Use DB data if available, otherwise mock data for demo
  const isDemo = location.slug === 'demo-venue'
  
  const operatingHours = location.operating_hours || (isDemo ? 'Mon-Sun, 11:00 AM - 11:00 PM' : null)
  const wifiNetwork = location.wifi_network || (isDemo ? 'ArtisanGrill_Guest' : null)
  const wifiPassword = location.wifi_password || (isDemo ? 'artisangrill' : null)
  const instagramHandle = location.instagram_handle || (isDemo ? 'theartisangrill' : null)

  const hasAnyInfo = operatingHours || wifiNetwork || instagramHandle

  if (!hasAnyInfo) return null

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-sm font-medium transition-colors border border-white/10 mt-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Venue Info
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed left-4 right-4 bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:max-w-md z-50 bg-[#f5f7f5] dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[#17201b] dark:text-white">About {location.name}</h3>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {operatingHours && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#17201b] dark:text-zinc-300">Opening Hours</h4>
                        <p className="text-[#17201b]/70 dark:text-zinc-400 mt-1">{operatingHours}</p>
                      </div>
                    </div>
                  )}

                  {wifiNetwork && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#17201b] dark:text-zinc-300">Guest Wi-Fi</h4>
                        <div className="mt-1 space-y-1">
                          <p className="text-[#17201b]/70 dark:text-zinc-400">Network: <span className="font-medium text-[#17201b] dark:text-white">{wifiNetwork}</span></p>
                          {wifiPassword && (
                            <p className="text-[#17201b]/70 dark:text-zinc-400">Password: <span className="font-medium text-[#17201b] dark:text-white">{wifiPassword}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {instagramHandle && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#17201b] dark:text-zinc-300">Socials</h4>
                        <a 
                          href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#17201b]/70 dark:text-zinc-400 mt-1 hover:text-[#0f7b55] dark:hover:text-emerald-400 transition-colors inline-block"
                        >
                          @{instagramHandle.replace('@', '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
