'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

import Link from 'next/link'

export function BackButton({ children, className, style, href }: { children: ReactNode; className?: string; style?: React.CSSProperties; href?: string }) {
  const router = useRouter()
  
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    )
  }

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
