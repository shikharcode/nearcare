export default function Loading() {
  return (
    <div className="flex flex-col h-full p-6 space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>

      {/* Chat messages skeleton */}
      <div className="flex-1 space-y-4 py-4">
        {/* Left bubble */}
        <div className="flex items-end gap-2 max-w-xs">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
          <div className="space-y-1">
            <div className="h-10 w-56 bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-none" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>

        {/* Right bubble */}
        <div className="flex items-end gap-2 max-w-xs ml-auto flex-row-reverse">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
          <div className="space-y-1 items-end flex flex-col">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-br-none" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>

        {/* Left bubble */}
        <div className="flex items-end gap-2 max-w-xs">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
          <div className="space-y-1">
            <div className="h-16 w-60 bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-none" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>

      {/* Input skeleton at bottom */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-11 w-11 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" />
      </div>
    </div>
  )
}
