export default function Loading() {
  return (
    <div className="bg-dark-950 min-h-screen relative pt-24">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />

      {/* Header skeleton */}
      <div className="relative z-10 glass-light border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-10 w-48 bg-dark-700 rounded animate-pulse mb-2" />
              <div className="h-5 w-72 bg-dark-800 rounded animate-pulse" />
            </div>
            <div className="h-10 w-48 bg-dark-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filter skeleton */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-dark-700 rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-light rounded-3xl overflow-hidden">
              <div className="h-36 bg-dark-700 animate-pulse" />
              <div className="p-6 pt-12">
                <div className="h-6 w-40 bg-dark-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-dark-800 rounded animate-pulse mb-4" />
                <div className="h-4 w-24 bg-dark-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
