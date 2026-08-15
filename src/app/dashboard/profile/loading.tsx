export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  )
}
