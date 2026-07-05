'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSpeechProps {
  onTranscriptComplete?: (transcript: string) => void
  onSpeechEnd?: () => void
}

export function useSpeech({ onTranscriptComplete, onSpeechEnd }: UseSpeechProps = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  })
  
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  const callbacksRef = useRef({ onTranscriptComplete, onSpeechEnd })

  useEffect(() => {
    callbacksRef.current = { onTranscriptComplete, onSpeechEnd }
  }, [onTranscriptComplete, onSpeechEnd])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize SpeechRecognition
    const SpeechRecognition = (window as unknown as { SpeechRecognition: any }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        let isFinal = false

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            isFinal = true
            currentTranscript += event.results[i][0].transcript
          } else {
            currentTranscript += event.results[i][0].transcript
          }
        }

        // Just use the latest result
        setTranscript(currentTranscript)

        if (isFinal && callbacksRef.current.onTranscriptComplete) {
          callbacksRef.current.onTranscriptComplete(currentTranscript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
        setIsSupported(false) // Using the setter
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    // Initialize SpeechSynthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.onvoiceschanged = loadVoices
      loadVoices()
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Recognition already started')
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return

    // Cancel any ongoing speech
    synthesisRef.current.cancel()
    setIsSpeaking(true)

    // Clean up markdown for TTS
    const cleanText = text.replace(/[*_#`]/g, '')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Try to find a good voice
    if (voicesRef.current.length > 0) {
      const preferredVoice = voicesRef.current.find(
        v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha'))
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    }

    utterance.rate = 1.05
    utterance.pitch = 1.0

    utterance.onend = () => {
      setIsSpeaking(false)
      if (callbacksRef.current.onSpeechEnd) callbacksRef.current.onSpeechEnd()
    }
    
    utterance.onerror = () => {
      setIsSpeaking(false)
      if (callbacksRef.current.onSpeechEnd) callbacksRef.current.onSpeechEnd()
    }

    synthesisRef.current.speak(utterance)
  }, [])

  const cancelSpeech = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    isSupported,
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    cancelSpeech
  }
}
