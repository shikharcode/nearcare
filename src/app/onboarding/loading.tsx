export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-8 animate-pulse">
      {/* Step indicator skeleton */}
      <div className="flex items-center gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
            {i < 3 && <div className="h-1 w-10 bg-gray-200 dark:bg-gray-800 rounded" />}
          </div>
        ))}
      </div>

      {/* Card / form skeleton */}
      <div className="w-full max-w-md space-y-6 bg-gray-100 dark:bg-gray-900 rounded-2xl p-8">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-md" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
        </div>

        {/* Button */}
        <div className="h-11 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    </div>
  )
}
