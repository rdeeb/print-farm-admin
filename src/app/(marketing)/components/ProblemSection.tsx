const painPoints = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    headline: 'Running your farm on a spreadsheet?',
    body: 'Copy-pasting orders into Excel, manually tracking filament, losing track of quotes — you spend more time on admin than actually printing.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    headline: 'Quoting blind?',
    body: 'You give a customer a price based on gut feel. Sometimes you make money. Sometimes you don\'t. You never actually know which.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    headline: 'No idea which jobs are profitable?',
    body: 'After the filament, electricity, machine time, and your labor — are you actually making money on that order? Most farm operators genuinely don\'t know.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    headline: 'Clients falling through the cracks?',
    body: 'No order history. No status updates. Clients emailing you asking "is my order done?" — and you have to dig through your inbox to find the answer.',
  },
]

export function ProblemSection() {
  return (
    <section className="py-20 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Sound familiar?
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Most 3D print farms are flying blind. Generic tools weren&apos;t built for your business — and it shows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((point, idx) => (
            <div
              key={idx}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center flex-shrink-0">
                {point.icon}
              </div>
              <h3 className="text-white font-semibold text-lg leading-snug">
                {point.headline}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {point.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-lg">
            There&apos;s a better way.{' '}
            <span className="text-indigo-400 font-semibold">
              3D Farm Admin was built to fix exactly this.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
