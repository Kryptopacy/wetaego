import Image from "next/image"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface GemstoneSpinnerProps {
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

export function GemstoneSpinner({ className, size = "md" }: GemstoneSpinnerProps) {
  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  }

  return (
    <div className={cn("relative rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden flex items-center justify-center animate-pulse", sizeClasses[size], className)}>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
        <Image 
          src="/hero_emerald_gemstone.png" 
          alt="Loading..." 
          fill 
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover opacity-90 scale-125" 
          priority
        />
      </div>
      <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
      <Sparkles className={cn("relative z-10 text-white/90 drop-shadow-lg", iconSizes[size])} />
      
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full border border-t-white/50 border-r-white/20 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
    </div>
  )
}
