'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

export function BackButton({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const router = useRouter()
  return (
    <button 
      onClick={() => router.back()} 
      className={className}
      style={style}
      type="button"
    >
      {children}
    </button>
  )
}
