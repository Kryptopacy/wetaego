'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

export default function SharingHubPage({
  params
}: {
  params: Promise<{ order_id: string }>
}) {
  const { order_id } = use(params)
  const searchParams = useSearchParams()
  const splitCount = parseInt(searchParams.get('split') || '1')
  const slug = searchParams.get('slug')
  
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin)
  }, [])

  const shareLink = origin ? `${origin}/pay/${order_id}?split=${splitCount}` : ''
  const qrUrl = shareLink ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}&color=000000` : ''

  const copyLink = async () => {
    try {
      if (!shareLink) return
      await navigator.clipboard.writeText(shareLink)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (!shareLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Split the Bill',
          text: `Pay your share of the bill (${splitCount} ways)`,
          url: shareLink
        })
      } catch {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-3xl rounded-full" />

        <div className="relative z-10 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-black text-white">Share the Bill</h1>
            <p className="text-zinc-400 text-sm mt-1">Let your friends scan this code to pay their share.</p>
          </div>

          <div className="bg-white p-3 rounded-2xl mx-auto w-fit shadow-xl">
            {qrUrl ? (
              <Image src={qrUrl} alt="Payment QR Code" width={192} height={192} className="w-48 h-48" crossOrigin="anonymous" />
            ) : (
              <div className="w-48 h-48 bg-zinc-100 animate-pulse rounded-xl" />
            )}
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Split Type</p>
            <p className="text-white font-medium text-lg">{splitCount} Ways</p>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              onClick={handleShare}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share Link via App
            </button>
            <button 
              onClick={copyLink}
              className="w-full bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Copy Link
            </button>
            <button 
              onClick={() => window.location.href = `/pay/${order_id}?split=${splitCount}`}
              className="w-full bg-zinc-900 text-zinc-400 font-bold py-4 rounded-xl hover:text-white transition-colors border border-zinc-800"
            >
              Go to Payment Page
            </button>
            {slug && (
              <button 
                onClick={() => window.location.href = `/m/${slug}`}
                className="w-full bg-transparent text-zinc-500 font-medium py-3 rounded-xl hover:text-zinc-300 transition-colors mt-2"
              >
                Return to Menu
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
