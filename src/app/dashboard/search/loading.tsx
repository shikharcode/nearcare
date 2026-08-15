export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Search input skeleton */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-11 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" />
      </div>

      {/* Result section 1 */}
      <div className="space-y-3">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="space-y-2">
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>

      {/* Result section 2 */}
      <div className="space-y-3">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="space-y-2">
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>

      {/* Result section 3 */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="space-y-2">
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
