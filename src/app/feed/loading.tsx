export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Skeleton */}
          <div className="hidden lg:block space-y-6">
            <div className="glass rounded-3xl p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-dark-700" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-dark-700 rounded" />
                  <div className="h-3 w-20 bg-dark-700 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="h-16 bg-dark-700 rounded-xl" />
                <div className="h-16 bg-dark-700 rounded-xl" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dark-700" />
                    <div className="h-4 flex-1 bg-dark-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed Skeleton */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-8">
              <div className="h-9 w-48 bg-dark-800 rounded-lg mb-2 animate-pulse" />
              <div className="h-4 w-64 bg-dark-800 rounded animate-pulse" />
            </div>

            {/* Feed Cards Skeleton */}
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-dark-900/50 rounded-3xl overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-dark-800" />
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-dark-700" />
                      <div className="h-4 w-24 bg-dark-700 rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-dark-700 rounded" />
                    <div className="h-4 w-full bg-dark-700 rounded" />
                    <div className="flex gap-2">
                      <div className="flex-1 h-12 bg-dark-700 rounded-xl" />
                      <div className="flex-1 h-12 bg-dark-700 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="hidden lg:block space-y-6">
            <div className="glass rounded-3xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-dark-700 rounded mb-4" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-dark-700 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-dark-700 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-dark-700 rounded" />
                <div className="h-4 bg-dark-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
