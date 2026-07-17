'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { trackAdEvent } from '@/app/actions/ad-tracking'
import { ExternalLink } from 'lucide-react'

// Avoid 'ad' or 'sponsored' in DOM props to reduce ad-blocker false positives 
export function PartnerShowcaseCard({ partner }: { partner: { id: string, title: string, category: string, image_url: string, target_link: string } }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false)

  useEffect(() => {
    if (hasTrackedImpression) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Log impression natively without blocking UI
            trackAdEvent(partner.id, 'impression')
            setHasTrackedImpression(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 } // Track impression when 50% of the ad is visible
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [hasTrackedImpression, partner.id])

  const handleClick = () => {
    trackAdEvent(partner.id, 'click')
  }

  return (
    <a 
      ref={cardRef}
      href={partner.target_link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-all hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-[0.98] w-full"
    >
      <div className="relative w-full aspect-2/1 sm:aspect-video bg-zinc-800">
        {partner.image_url ? (
          <Image 
            src={partner.image_url} 
            alt={partner.title} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-105" 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-bold">
            Partner Content
          </div>
        )}
        
        {/* Native badge overlay */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[9px] font-black text-white uppercase tracking-wider shadow-xl z-10">
          {partner.category || 'Featured Partner'}
        </div>

        {/* Hover overlay for click-to-action */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="bg-emerald-500 text-white rounded-full p-3 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <ExternalLink className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900 z-10">
        <h3 className="text-white font-bold text-sm sm:text-base leading-tight mb-1 group-hover:text-emerald-400 transition-colors line-clamp-2">
          {partner.title}
        </h3>
        <p className="text-zinc-500 text-xs flex items-center gap-1">
          Visit Partner <ExternalLink className="w-3 h-3" />
        </p>
      </div>
    </a>
  )
}
