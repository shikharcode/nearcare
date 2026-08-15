"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type RecordingState = "idle" | "recording" | "done"

// Web Speech API type declarations (not always present in all TS DOM lib versions)
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [interim, setInterim] = useState("")
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null
    if (!SpeechRecognitionAPI) {
      setSupported(false)
    }
  }, [])

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setInterim("")
    setState("idle")
  }, [])

  const startRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition: ISpeechRecognition = new SpeechRecognitionAPI()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setState("recording")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = ""
      let finalText = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }

      setInterim(interimText)

      if (finalText) {
        setInterim("")
        setState("done")
        onTranscript(finalText.trim())
        recognitionRef.current = null
        // Reset to idle after brief visual feedback
        setTimeout(() => setState("idle"), 1500)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        toast.error("Microphone permission denied")
      }
      stopRecognition()
    }

    recognition.onend = () => {
      if (recognitionRef.current) {
        // ended without a final result (e.g. user clicked stop)
        recognitionRef.current = null
        setInterim("")
        setState("idle")
      }
    }

    recognition.start()
  }, [onTranscript, stopRecognition])

  const handleClick = () => {
    if (disabled) return
    if (state === "recording") {
      stopRecognition()
    } else {
      startRecognition()
    }
  }

  if (!supported) {
    return (
      <div className="relative group">
        <button
          type="button"
          disabled
          className="h-12 w-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center opacity-50 cursor-not-allowed"
          aria-label="Voice input not supported"
        >
          <MicOff className="h-5 w-5 text-gray-400" />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
            Voice input not supported in this browser
          </div>
          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 mx-auto -mt-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={state === "recording" ? "Stop recording" : "Start voice input"}
        className={cn(
          "h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          disabled && "opacity-50 cursor-not-allowed",
          state === "idle" &&
            "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-500 dark:text-gray-400",
          state === "recording" &&
            "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 animate-pulse",
          state === "done" &&
            "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
        )}
      >
        {state === "recording" ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      {state === "recording" && (
        <span className="text-xs font-medium text-red-500 dark:text-red-400 animate-pulse">
          Listening...
        </span>
      )}

      {interim && state === "recording" && (
        <div className="absolute top-full mt-8 left-1/2 -translate-x-1/2 z-10 max-w-[240px] w-max">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl px-3 py-2 shadow-lg text-center leading-snug">
            {interim}
          </div>
          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}
