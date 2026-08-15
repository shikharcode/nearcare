"use client";

import React from "react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <span className="text-2xl font-bold text-blue-600">NearCare</span>
      </div>

      <div className="space-y-3 max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          You are offline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Your last health data is available below once you have visited those pages.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
