"use client";

import React, { useState } from "react";
import { Heart, WifiOff, Loader2 } from "lucide-react";

export default function OfflinePage() {
  const [loading, setLoading] = useState(false);

  function handleRetry() {
    setLoading(true);
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 text-center bg-background">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <Heart className="h-6 w-6 text-white fill-white" />
        </div>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">NearCare</span>
      </div>

      <WifiOff className="h-16 w-16 text-gray-400 dark:text-gray-500" />

      <div className="space-y-3 max-w-sm">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          You are offline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
          Connect to the internet to continue using NearCare
        </p>
      </div>

      <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside text-left">
        <li>Your recent data is cached in your browser</li>
      </ul>

      <button
        onClick={handleRetry}
        disabled={loading}
        className="min-h-[44px] px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-70 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Retrying…
          </>
        ) : (
          "Retry"
        )}
      </button>
    </div>
  );
}
