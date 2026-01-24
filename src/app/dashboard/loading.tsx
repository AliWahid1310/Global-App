export default function Loading() {
  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12 relative">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header skeleton */}
        <div className="mb-12">
          <div className="h-5 w-24 bg-dark-700 rounded animate-pulse mb-4" />
          <div className="h-10 w-64 bg-dark-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-dark-800 rounded animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-dark-700 animate-pulse" />
                <div>
                  <div className="h-8 w-8 bg-dark-700 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-dark-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
