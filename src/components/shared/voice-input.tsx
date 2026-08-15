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
    recognition.lang = "en-IN" // Indian English — better for Indian accents
    recognition.continuous = true  // keep listening until user clicks stop
    recognition.interimResults = true
    recognitionRef.current = recognition

    let accumulatedFinal = "" // accumulate across multiple result events

    recognition.onstart = () => {
      setState("recording")
      setInterim("Listening... speak now")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          accumulatedFinal += transcript + " "
        } else {
          interimText += transcript
        }
      }

      setInterim(interimText || accumulatedFinal.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[VoiceInput] error:", event.error, event.message)
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        toast.error("Microphone blocked — click the 🔒 icon in your browser address bar and allow microphone")
      } else if (event.error === "no-speech") {
        toast.error("No speech detected — speak louder or check your mic")
      } else if (event.error === "network") {
        toast.error("Voice needs internet — check your connection")
      } else if (event.error === "service-not-allowed") {
        toast.error("Voice input blocked — use Chrome or Edge browser (not Safari/Firefox)")
      } else {
        toast.error("Voice error: " + event.error + " — try Chrome browser")
      }
      stopRecognition()
    }

    recognition.onend = () => {
      // Fire callback with whatever was accumulated
      if (accumulatedFinal.trim()) {
        setInterim("")
        setState("done")
        onTranscript(accumulatedFinal.trim())
        recognitionRef.current = null
        setTimeout(() => setState("idle"), 1500)
      } else {
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
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg text-center">
            Voice not supported<br/>Use Chrome or Edge
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
        <span className="text-xs font-medium text-red-500 dark:text-red-400 animate-pulse whitespace-nowrap">
          Tap to stop
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
