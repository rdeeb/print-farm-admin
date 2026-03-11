'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <div className="text-6xl mb-6">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M8.111 8.111A6 6 0 0115.89 15.89M12 18.75A6.75 6.75 0 015.25 12c0-1.19.31-2.31.856-3.278M12 5.25a6.75 6.75 0 016.75 6.75c0 1.19-.31 2.31-.856 3.278"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
