export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="flex gap-3">
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded shrink-0 mt-1" />
            <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
