'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GoogleGenAI } from '@google/genai'

export interface LiveTranscriptItem {
  id: string
  role: 'user' | 'model'
  text: string
  timestamp: number
}

export function useGeminiLive() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([])

  // Audio Contexts & Streams
  const inputAudioContextRef = useRef<AudioContext | null>(null)
  const outputAudioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null)
  const sessionRef = useRef<any>(null)

  // Camera stream & Frame capture
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Audio playback queue & timeline management
  const nextPlayTimeRef = useRef<number>(0)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])

  // Convert Float32Array to 16-bit linear PCM Base64
  const floatTo16BitPCMBase64 = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2)
    const view = new DataView(buffer)
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true) // little-endian
    }
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  // Play incoming 24kHz 16-bit PCM chunk from model
  const playAudioChunk = useCallback((base64Data: string) => {
    try {
      if (!outputAudioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 })
      }
      const ctx = outputAudioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const binary = atob(base64Data)
      const len = binary.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const dataView = new DataView(bytes.buffer)
      const sampleCount = bytes.length / 2
      const floatData = new Float32Array(sampleCount)
      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true)
        floatData[i] = int16 / 32768
      }

      const audioBuffer = ctx.createBuffer(1, sampleCount, 24000)
      audioBuffer.getChannelData(0).set(floatData)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)

      const now = ctx.currentTime
      const startTime = Math.max(now, nextPlayTimeRef.current)
      source.start(startTime)
      nextPlayTimeRef.current = startTime + audioBuffer.duration
      scheduledSourcesRef.current.push(source)
      setIsSpeaking(true)

      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source)
        if (scheduledSourcesRef.current.length === 0) {
          setIsSpeaking(false)
        }
      }
    } catch (e) {
      console.error('Error playing audio chunk:', e)
    }
  }, [])

  // Barge-in interruption: cut off output immediately
  const handleInterruption = useCallback(() => {
    scheduledSourcesRef.current.forEach(source => {
      try {
        source.stop()
        source.disconnect()
      } catch (e) {
        // ignore
      }
    })
    scheduledSourcesRef.current = []
    if (outputAudioContextRef.current) {
      nextPlayTimeRef.current = outputAudioContextRef.current.currentTime
    }
    setIsSpeaking(false)
  }, [])

  // Stop camera feed
  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [])

  // Start camera and begin streaming frames to Gemini Live (1 frame per second)
  const startCamera = useCallback(async (facing: 'user' | 'environment' = cameraFacingMode) => {
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      cameraStreamRef.current = stream
      setCameraFacingMode(facing)
      setIsCameraActive(true)

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream
        videoElementRef.current.play().catch(() => {})
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
        canvasRef.current.width = 640
        canvasRef.current.height = 480
      }

      // Stream 1 frame every 1000ms
      frameIntervalRef.current = setInterval(() => {
        if (!sessionRef.current || !videoElementRef.current || !canvasRef.current) return
        const video = videoElementRef.current
        const canvas = canvasRef.current
        if (video.readyState < 2) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
        const base64Jpeg = dataUrl.split(',')[1]

        if (base64Jpeg) {
          try {
            sessionRef.current.sendRealtimeInput({
              video: {
                data: base64Jpeg,
                mimeType: 'image/jpeg'
              }
            })
          } catch (err) {
            // ignore transient frame send errors
          }
        }
      }, 1000)
    } catch (err: unknown) {
      console.error('Camera access failed:', err)
      setError('Unable to access camera.')
      setIsCameraActive(false)
    }
  }, [cameraFacingMode, stopCamera])

  const switchCamera = useCallback(() => {
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user'
    startCamera(nextFacing)
  }, [cameraFacingMode, startCamera])

  // Disconnect & cleanup
  const stopLiveSession = useCallback(() => {
    stopCamera()

    // Stop recording
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect()
      processorNodeRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop())
      micStreamRef.current = null
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(() => {})
      inputAudioContextRef.current = null
    }

    // Stop playback
    handleInterruption()
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {})
      outputAudioContextRef.current = null
    }

    // Close session
    if (sessionRef.current) {
      try {
        sessionRef.current.close()
      } catch (e) {
        // ignore
      }
      sessionRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setIsSpeaking(false)
  }, [handleInterruption, stopCamera])

  // Start live session
  const startLiveSession = useCallback(async (organizationId: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      // 1. Fetch ephemeral auth token from backend
      const res = await fetch('/api/ai/live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Failed to authenticate live session')
      }

      const { token } = await res.json()
      if (!token) throw new Error('No ephemeral token received')

      // 2. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      micStreamRef.current = stream

      // 3. Connect to Gemini Live API via @google/genai
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' }
      })

      const session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: ['AUDIO' as any],
          systemInstruction: {
            parts: [{
              text: `You are Tego, the autonomous Admin Voice and Vision AI Co-Pilot for OurMenu OS. 
                     You can hear the merchant speaking and see anything they show you via their camera (menus, physical dishes, inventory items, handwritten receipts, stock on shelves).
                     You possess deep platform knowledge: 9 design templates, multi-branch fleet management, sub-department pages (supermarket aisles, bakery, deli), 1-click catalog duplication, team RBAC, thermal ESC/POS printing, and POS operations.
                     Guide merchants step-by-step through setting up branches, adding items, or checking sales.
                     Speak concisely in a natural, warm, and professional tone. Keep spoken replies short and direct.`
            }]
          },
          inputAudioTranscription: {} as any,
          outputAudioTranscription: {} as any,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true)
            setIsConnecting(false)
          },
          onmessage: (msg: any) => {
            const content = msg.serverContent
            if (!content) return

            // Handle Barge-in interruption
            if (content.interrupted) {
              handleInterruption()
            }

            // Audio playback
            if (content.modelTurn?.parts) {
              for (const part of content.modelTurn.parts) {
                if (part.inlineData?.data) {
                  playAudioChunk(part.inlineData.data)
                }
              }
            }

            // Live user transcription
            if (content.inputTranscription?.text) {
              const text = content.inputTranscription.text
              setTranscripts(prev => {
                const last = prev[prev.length - 1]
                if (last && last.role === 'user') {
                  return [...prev.slice(0, -1), { ...last, text: `${last.text} ${text}`.trim() }]
                }
                return [...prev, { id: Math.random().toString(), role: 'user', text, timestamp: Date.now() }]
              })
            }

            // Live Tego output transcription
            if (content.outputTranscription?.text) {
              const text = content.outputTranscription.text
              setTranscripts(prev => {
                const last = prev[prev.length - 1]
                if (last && last.role === 'model') {
                  return [...prev.slice(0, -1), { ...last, text: `${last.text} ${text}`.trim() }]
                }
                return [...prev, { id: Math.random().toString(), role: 'model', text, timestamp: Date.now() }]
              })
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live error:', err)
            setError('Live audio connection encountered an issue.')
            stopLiveSession()
          },
          onclose: () => {
            setIsConnected(false)
            setIsConnecting(false)
          }
        }
      })

      sessionRef.current = session

      // 4. Setup Input Audio Pipeline (Mic -> 16kHz PCM -> Gemini Live)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const inputCtx = new AudioCtx({ sampleRate: 16000 })
      inputAudioContextRef.current = inputCtx

      const sourceNode = inputCtx.createMediaStreamSource(stream)
      const processor = inputCtx.createScriptProcessor(2048, 1, 1)
      processorNodeRef.current = processor

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return
        const inputData = e.inputBuffer.getChannelData(0)
        const base64PCM = floatTo16BitPCMBase64(inputData)
        try {
          sessionRef.current.sendRealtimeInput({
            audio: {
              data: base64PCM,
              mimeType: 'audio/pcm;rate=16000'
            }
          })
        } catch (err) {
          // ignore transient stream errors
        }
      }

      sourceNode.connect(processor)
      processor.connect(inputCtx.destination)
    } catch (err: unknown) {
      console.error('Failed to start Gemini Live session:', err)
      setError((err as Error)?.message || 'Failed to start Live session')
      stopLiveSession()
    }
  }, [handleInterruption, playAudioChunk, stopLiveSession])

  useEffect(() => {
    return () => {
      stopLiveSession()
    }
  }, [stopLiveSession])

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    isCameraActive,
    cameraFacingMode,
    videoElementRef,
    error,
    transcripts,
    startLiveSession,
    stopLiveSession,
    startCamera,
    stopCamera,
    switchCamera,
  }
}
