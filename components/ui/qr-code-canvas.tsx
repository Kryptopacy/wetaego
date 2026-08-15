'use client'

import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeCanvasProps {
  id?: string
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  level?: 'L' | 'M' | 'Q' | 'H'
  includeMargin?: boolean
  className?: string
  imageSettings?: {
    src: string
    height: number
    width: number
    excavate?: boolean
  }
}

export function QRCodeCanvas({
  id,
  value,
  size = 192,
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'H',
  includeMargin = false,
  className = '',
  imageSettings
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    QRCode.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin: includeMargin ? 2 : 0,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: level,
      },
      (error) => {
        if (error) {
          console.error('Error generating QR code:', error)
          return
        }

        if (imageSettings?.src) {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const imgW = imageSettings.width || 44
            const imgH = imageSettings.height || 44
            const x = (size - imgW) / 2
            const y = (size - imgH) / 2

            if (imageSettings.excavate) {
              const padding = 4
              ctx.fillStyle = bgColor
              ctx.fillRect(x - padding, y - padding, imgW + padding * 2, imgH + padding * 2)
            }

            ctx.drawImage(img, x, y, imgW, imgH)
          }
          img.src = imageSettings.src
        }
      }
    )
  }, [value, size, bgColor, fgColor, level, includeMargin, imageSettings])

  return (
    <canvas
      ref={canvasRef}
      id={id}
      width={size}
      height={size}
      className={className}
    />
  )
}
