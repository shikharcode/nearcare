"use client"

import React, { useState } from "react"
import { PhoneCall } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SosButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notified, setNotified] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/alerts/sos", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send alert")
      setNotified(data.notified as number)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // reset state on close
      setNotified(null)
      setError(null)
      setLoading(false)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Trigger — fixed floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send SOS emergency alert"
        className={cn(
          "fixed z-40 flex items-center justify-center gap-1.5 rounded-full",
          "bg-red-600 text-white font-black text-sm shadow-lg shadow-red-500/40",
          "w-14 h-14 md:w-16 md:h-16",
          // mobile: above bottom nav, left side so it doesn't cover form buttons on right
          "bottom-24 left-4 md:bottom-8 md:left-auto md:right-8",
          // pulse ring
          "ring-4 ring-red-400/60",
          "animate-[sos-pulse_2s_ease-in-out_infinite]",
          "hover:bg-red-700 active:scale-95 transition-transform",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400"
        )}
        style={{
          // inline keyframes fallback — tw-animate-css will also pick up the class
          animation: "sos-pulse 2s ease-in-out infinite",
        }}
      >
        <style>{`
          @keyframes sos-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7), 0 10px 30px rgba(239,68,68,0.4); }
            50%       { box-shadow: 0 0 0 14px rgba(239,68,68,0), 0 10px 30px rgba(239,68,68,0.4); }
          }
        `}</style>
        <PhoneCall className="h-5 w-5" />
        <span className="leading-none">SOS</span>
      </button>

      <DialogContent showCloseButton={!loading}>
        {notified !== null ? (
          /* Success state */
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <p className="text-base font-semibold text-green-700">
              Your family has been notified
            </p>
            <p className="text-sm text-muted-foreground">
              {notified === 0
                ? "No contacts with alerts enabled were found."
                : `${notified} contact${notified > 1 ? "s" : ""} received your emergency alert.`}
            </p>
            <DialogClose
              render={
                <Button className="mt-2 w-full" />
              }
            >
              Close
            </DialogClose>
          </div>
        ) : (
          /* Confirmation state */
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <PhoneCall className="h-5 w-5 text-red-600" />
                </div>
                <DialogTitle className="text-base">Send Emergency Alert?</DialogTitle>
              </div>
              <DialogDescription>
                This will immediately notify all your family contacts with your latest vitals.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" disabled={loading} />
                }
              >
                Cancel
              </DialogClose>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700 font-bold px-5"
              >
                {loading ? "Sending…" : "Send Alert NOW"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
