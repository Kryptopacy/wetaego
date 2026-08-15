'use client'

import React from 'react'
import Image from 'next/image'
import { InfoStrip } from './info-strip'
import { ShareButton } from '@/app/components/share-button'
import { LucideIcon } from 'lucide-react'
import { getDefaultCoverForPreset } from '@/lib/templates/presets'

interface StorefrontHeroProps {
  title: string
  subtitle?: string | null
  badge?: {
    icon?: LucideIcon | string
    text: string
  }
  coverImageUrl?: string | null
  businessTypePreset?: string | null
  templateType?: string | null
  logoUrl?: string | null
  themeColor?: string | null
  tableIdentifier?: string | null
  promotionalBanner?: string | null
  discountPercentage?: number | null
  location: {
    name: string
    portal_display_name?: string | null
    theme_color?: string | null
    operating_hours?: string | null
    wifi_network?: string | null
    wifi_password?: string | null
    instagram_handle?: string | null
    twitter_handle?: string | null
    facebook_handle?: string | null
    whatsapp_number?: string | null
    phone_number?: string | null
    google_maps_url?: string | null
    address?: string | null
  }
  maxContentWidth?: string
  className?: string
}

function hexToRgba(hex: string, alpha: number) {
  let r = 16, g = 185, b = 129
  if (hex?.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  }
  return `rgba(${r},${g},${b},${alpha})`
}

function formatTitle(str: string) {
  if (!str) return ''
  // Capitalize start of words while preserving apostrophes like 's
  return str.replace(/(?:^|\s|\/|-)([a-z])/g, (_, char) => char.toUpperCase())
}

/**
 * Ultra-premium Storefront Hero used across all customer-facing templates and portals.
 * Renders rich ambient depth, glass badge indicators, and atmospheric lighting even with zero custom uploads.
 */
export function StorefrontHero({
  title,
  subtitle,
  badge,
  coverImageUrl,
  businessTypePreset,
  templateType,
  logoUrl,
  themeColor = '#10b981',
  tableIdentifier,
  promotionalBanner,
  discountPercentage,
  location,
  maxContentWidth = 'max-w-4xl',
  className = ''
}: StorefrontHeroProps) {
  const primaryColor = themeColor || '#10b981'
  const displayTitle = formatTitle(title)
  const venueName = location.portal_display_name || location.name || title || 'OM'
  const initials = venueName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'OM'
  const effectiveCover = coverImageUrl || getDefaultCoverForPreset(businessTypePreset, templateType)

  return (
    <header className={`relative w-full min-h-[36vh] md:max-h-105 flex flex-col justify-end overflow-hidden select-none ${className}`}>
      {/* ── Background Layer ── */}
      {effectiveCover ? (
        <div className="absolute inset-0">
          <Image
            src={effectiveCover}
            alt={title}
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwYTBhMGEiLz48L3N2Zz4="
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-zinc-950"
          style={{
            background: `
              radial-gradient(ellipse 80% 80% at 50% -20%, ${hexToRgba(primaryColor, 0.35)} 0%, transparent 70%),
              radial-gradient(circle at 100% 100%, ${hexToRgba(primaryColor, 0.15)} 0%, transparent 50%),
              linear-gradient(180deg, #09090b 0%, #050505 100%)
            `
          }}
        >
          {/* Subtle atmospheric micro-grid */}
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[24px_24px]" />
          
          {/* Ambient top rim-glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 blur-3xl opacity-40 pointer-events-none rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      )}

      {/* ── Vignette Overlays for Maximum Text Legibility ── */}
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none" />

      {/* ── Share / Action Button ── */}
      <div className="absolute top-5 right-5 z-20">
        <ShareButton
          title={`${title} | ${location.name}`}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 text-white/90 hover:text-white hover:bg-black/70 hover:scale-105 transition-all shadow-xl"
        />
      </div>

      {/* ── Content Container ── */}
      <div className={`relative z-10 w-full p-6 sm:p-8 pt-[calc(env(safe-area-inset-top,24px)+48px)] ${maxContentWidth} mx-auto flex flex-col justify-end mt-auto`}>
        {/* Logo / Monogram */}
        <div className="mb-4">
          {logoUrl ? (
            <div className="relative h-14 w-32 shrink-0 drop-shadow-2xl overflow-hidden rounded-xl bg-black/20 backdrop-blur-md p-1 border border-white/10">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 128px, 128px"
              />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-xl border border-white/15 backdrop-blur-md relative overflow-hidden group"
              style={{
                backgroundColor: hexToRgba(primaryColor, 0.2),
                boxShadow: `0 0 24px -4px ${hexToRgba(primaryColor, 0.4)}`
              }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10 tracking-wider">{initials}</span>
            </div>
          )}
        </div>

        {/* Eyebrow / Badge */}
        {badge && (
          <div className="mb-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-white backdrop-blur-md shadow-sm">
              {badge.text}
            </span>
          </div>
        )}

        {/* Main Title & Table Badge */}
        <div className="flex items-center flex-wrap gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {displayTitle}
          </h1>
          {tableIdentifier && (
            <span
              className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-lg border border-white/20 backdrop-blur-xl"
              style={{ backgroundColor: hexToRgba(primaryColor, 0.4) }}
            >
              Table {tableIdentifier}
            </span>
          )}
        </div>

        {/* Subtitle / Description */}
        {subtitle && (
          <p className="text-white/80 text-sm md:text-base font-normal drop-shadow-sm max-w-xl leading-relaxed mb-4">
            {subtitle}
          </p>
        )}

        {/* Promotional Campaign Banner */}
        {promotionalBanner && (
          <div
            className="mb-4 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg border backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.4)} 0%, rgba(0,0,0,0.7) 100%)`,
              borderColor: hexToRgba(primaryColor, 0.5)
            }}
          >
            <span className="p-1 rounded-md bg-white/20 text-white text-xs">🎉</span>
            <span className="truncate">{promotionalBanner}</span>
            {discountPercentage !== undefined && discountPercentage !== null && discountPercentage > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-white text-black font-black text-[10px] tracking-wider uppercase">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        )}

        {/* Persistent Venue Info (Wi-Fi, Hours, Phone, Address) */}
        <InfoStrip location={location} />
      </div>
    </header>
  )
}
