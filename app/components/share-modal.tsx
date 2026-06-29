'use client'



import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Copy, CheckCircle2, 

  MessageCircle
} from 'lucide-react'

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

// Simple SVG Icons for socials that don't have lucide icons (Snapchat, WhatsApp)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.122 0C8.36 0 6.64 2.652 6.64 5.378c0 1.25.101 2.92.511 4.195-1.077.587-2.613.673-3.616.711-.795.03-1.353.483-1.514 1.137-.156.634.12 1.356 1.011 1.748 1.127.496 2.502.553 3.525.43.19.789.474 1.545.923 2.193-.535 1.166-1.511 2.21-2.909 3.036-.59.349-1.013.911-1.05 1.62-.03.57.218 1.118.73 1.458.552.367 1.432.55 2.593.55 1.83 0 3.73-.591 5.213-1.464l.064-.038c.553 1.168 1.936 2.062 3.864 2.062 1.927 0 3.311-.894 3.864-2.062l.064.038c1.483.873 3.383 1.464 5.213 1.464 1.161 0 2.041-.183 2.593-.55.512-.34.76-.888.73-1.458-.037-.709-.46-1.271-1.05-1.62-1.398-.826-2.374-1.87-2.909-3.036.449-.648.733-1.404.923-2.193 1.023.123 2.398.066 3.525-.43.891-.392 1.167-1.114 1.011-1.748-.161-.654-.719-1.107-1.514-1.137-1.003-.038-2.539-.124-3.616-.711.41-1.275.511-2.945.511-4.195C21.64 2.652 19.89 0 16.115 0h-3.993z"/>
  </svg>
)

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
  description?: string
}

export function ShareModal({ isOpen, onClose, url, title, description }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description || title)

  const shareLinks = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'bg-[#25D366] text-white',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: TwitterIcon,
      color: 'bg-black text-white border border-zinc-800',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'bg-[#1877F2] text-white',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: SnapchatIcon,
      color: 'bg-[#FFFC00] text-black',
      href: `https://snapchat.com/scan?attachmentUrl=${encodedUrl}`,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: LinkedinIcon,
      color: 'bg-[#0A66C2] text-white',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
    },
    {
      id: 'sms',
      name: 'Message',
      icon: MessageCircle,
      color: 'bg-emerald-500 text-white',
      href: `sms:?&body=${encodedTitle}%20${encodedUrl}`,
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Share this page</h3>
  { }
  
              <p className="text-sm text-zinc-400">Share "{title}" with your friends or community.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {shareLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${link.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300">{link.name}</span>
                  </a>
                )
              })}
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={url}
                  className="flex-1 bg-transparent border-none text-sm text-zinc-300 px-2 outline-none w-full"
                />
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
