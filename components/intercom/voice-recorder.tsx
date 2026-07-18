'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  onCancel: () => void
}

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop())
      }
      
      audioChunks.current = []
      mediaRecorder.current.start()
      setIsRecording(true)
      
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      toast.error('Could not access microphone. Please check permissions.')
      onCancel()
    }
  }

  const isInitialized = useRef(false)

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      startRecording()
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop()
      setIsRecording(false)
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
      {!audioBlob ? (
        <>
          <div className="flex-1 flex items-center gap-2 px-2">
            {isRecording ? (
              <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
            <span className="text-sm font-mono text-rose-400">{formatTime(recordingTime)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </>
      ) : (
        <>
          <div className="flex-1 flex items-center gap-2 px-2">
            <span className="text-sm text-zinc-300">Voice Note ({formatTime(recordingTime)})</span>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRecordingComplete(audioBlob)}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}
