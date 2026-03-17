import Link from 'next/link'

const registrationEnabled = process.env.NEXT_PUBLIC_REGISTRATION_ENABLED === 'true'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white py-20 sm:py-28 px-4">
      <div className="max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Built for 3D print farms — not generic businesses
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Stop guessing. Start knowing{' '}
          <span className="text-indigo-600">your real cost per job.</span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          3D Farm Admin is the first order management system built for 3D print farms that shows you your
          actual cost per job — before you quote and after you ship.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {registrationEnabled ? (
            <Link
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Start Free Trial — No credit card required
            </Link>
          ) : (
            <Link
              href="#early-access"
              className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Get Early Access
            </Link>
          )}
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-gray-700 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            See how it works
          </Link>
        </div>

        {/* Social proof nudge */}
        <p className="mt-4 text-sm text-gray-500">
          {registrationEnabled ? '14-day free trial. No credit card. Cancel anytime.' : 'Be the first to know when we launch.'}
        </p>

        {/* Product screenshot placeholder */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="relative bg-gray-100 rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200 overflow-hidden aspect-[16/10]">
            {/* Fake browser chrome */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gray-200 flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 h-5 bg-white rounded-md opacity-60" />
            </div>
            {/* Fake dashboard grid */}
            <div className="absolute inset-0 top-10 p-4 grid grid-cols-3 gap-3">
              <div className="col-span-3 grid grid-cols-4 gap-3">
                {['Revenue', 'Active Jobs', 'Printers', 'Margin'].map((label) => (
                  <div key={label} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className="h-6 bg-indigo-100 rounded w-16" />
                  </div>
                ))}
              </div>
              <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                <div className="text-xs text-gray-400 mb-2">Order Queue</div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <div className="h-3 bg-gray-100 rounded flex-1" />
                    <div className="h-3 bg-green-100 rounded w-12" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                <div className="text-xs text-gray-400 mb-2">Cost Breakdown</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                    <div className="h-2.5 bg-indigo-100 rounded w-10" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-2.5 bg-gray-100 rounded w-20" />
                    <div className="h-2.5 bg-indigo-100 rounded w-10" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-2.5 bg-gray-100 rounded w-14" />
                    <div className="h-2.5 bg-green-100 rounded w-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
