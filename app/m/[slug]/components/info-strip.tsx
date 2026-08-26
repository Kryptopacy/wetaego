'use client'

import React from 'react'
import { toast } from 'sonner'
import { Clock, Wifi, Phone, MapPin, MessageCircle } from 'lucide-react'

interface InfoStripProps {
  location: {
    operating_hours?: string | null
    wifi_network?: string | null
    wifi_password?: string | null
    instagram_handle?: string | null
    twitter_handle?: string | null
    x_handle?: string | null
    tiktok_handle?: string | null
    facebook_handle?: string | null
    whatsapp_number?: string | null
    phone_number?: string | null
    google_maps_url?: string | null
    is_demo?: boolean
  }
  className?: string
}

export function InfoStrip({ location, className = '' }: InfoStripProps) {
  const isDemo = location.is_demo
  const hours = location.operating_hours || (isDemo ? 'Mon-Sun, 11am-11pm' : null)
  const wifiName = location.wifi_network || (isDemo ? 'Guest_Wifi' : null)
  const wifiPass = location.wifi_password || (isDemo ? 'password' : null)
  const ig = location.instagram_handle || (isDemo ? 'demo_venue' : null)
  const tt = location.tiktok_handle || null
  const tw = location.x_handle || location.twitter_handle || null
  const fb = location.facebook_handle || null
  const wa = location.whatsapp_number || null
  const phone = location.phone_number || null
  const mapUrl = location.google_maps_url || null

  const hasInfo = hours || wifiName || ig || tt || tw || fb || wa || phone || mapUrl

  if (!hasInfo) return null

  const handleCopyWifi = () => {
    if (!wifiPass) return
    navigator.clipboard.writeText(wifiPass)
    toast.success(`Wi-Fi password "${wifiPass}" copied!`)
  }

  return (
    <div className={`w-full overflow-hidden mt-4 ${className}`}>
      {/* Horizontal Scrollable Micro-Action Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Operating Hours */}
        {hours && (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{hours}</span>
          </div>
        )}

        {/* Wi-Fi with Click to Copy Password */}
        {wifiName && (
          <button
            type="button"
            onClick={handleCopyWifi}
            title={wifiPass ? `Click to copy password: ${wifiPass}` : 'Free Wi-Fi'}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md cursor-pointer"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{wifiName}</span>
            {wifiPass && <span className="text-[10px] text-emerald-400/80 font-mono">({wifiPass})</span>}
          </button>
        )}

        {/* WhatsApp Direct Chat */}
        {wa && (
          <a
            href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-95 transition-all backdrop-blur-xl border border-emerald-500/30 text-xs font-semibold text-emerald-300 shadow-md"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Instagram Profile */}
        {ig && (
          <a
            href={`https://instagram.com/${ig.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md"
          >
            <svg className="w-3.5 h-3.5 text-pink-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <span>@{ig.replace('@', '')}</span>
          </a>
        )}

        {/* TikTok Profile */}
        {tt && (
          <a
            href={`https://tiktok.com/@${tt.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md"
          >
            <span className="text-xs">🎵</span>
            <span>@{tt.replace('@', '')}</span>
          </a>
        )}

        {/* X / Twitter */}
        {tw && (
          <a
            href={`https://x.com/${tw.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md"
          >
            <span className="font-bold text-xs text-white">𝕏</span>
            <span>@{tw.replace('@', '')}</span>
          </a>
        )}

        {/* Facebook */}
        {fb && (
          <a
            href={`https://facebook.com/${fb.replace('/', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md"
          >
            <span className="text-blue-400 font-black text-xs">f</span>
            <span>{fb.replace('/', '')}</span>
          </a>
        )}

        {/* Phone / Call */}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md"
          >
            <Phone className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span>Call</span>
          </a>
        )}

        {/* Google Maps Directions */}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-md"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Directions</span>
          </a>
        )}
      </div>
    </div>
  )
}
