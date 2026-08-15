"use client"

import React from "react"
import Link from "next/link"
import { Heart } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950">
          <Heart className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please try again or return to the dashboard.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="w-full rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={reset}
            className="min-h-[44px] px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="min-h-[44px] px-6 py-2 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
