export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-pulse">
      {/* Header card skeleton */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
      </div>

      {/* Table 1 skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          {/* Table rows */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Table 2 skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          {/* Table rows */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded ml-auto" />
              <div className="h-4 w-14 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
