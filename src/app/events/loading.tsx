export default function Loading() {
  return (
    <div className="bg-dark-950 min-h-screen relative pt-24">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />

      {/* Header skeleton */}
      <div className="relative z-10 glass-light border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-dark-700 animate-pulse" />
            <div>
              <div className="h-8 w-32 bg-dark-700 rounded animate-pulse mb-2" />
              <div className="h-5 w-64 bg-dark-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Upcoming Events skeleton */}
        <section className="mb-12">
          <div className="h-8 w-48 bg-dark-700 rounded animate-pulse mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-light rounded-xl overflow-hidden">
                <div className="h-36 bg-dark-700 animate-pulse" />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 bg-dark-700 rounded-xl animate-pulse" />
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-dark-700 rounded animate-pulse mb-2" />
                      <div className="h-4 w-24 bg-dark-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-dark-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
