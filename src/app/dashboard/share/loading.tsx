export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-28 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
