const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'BOM-Based Cost Model',
    tagline: 'Know your real cost per gram, per hour, per job',
    description:
      'Build a bill of materials for every print: filament consumed (from spool data), machine time, electricity rate, and your hourly rate. Get a precise cost before you quote — and compare it to actuals after delivery.',
    highlights: [
      'Cost per gram from live spool data',
      'Machine time & electricity tracking',
      'Pre-quote vs. post-job cost comparison',
    ],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Order & Client Management',
    tagline: 'Track every order from quote to delivery',
    description:
      'Create orders, attach files, assign due dates, and keep clients in the loop with a clean client portal. No more "is my order done?" emails. Every touchpoint — tracked.',
    highlights: [
      'End-to-end order lifecycle tracking',
      'Client portal with status updates',
      'File attachments & version history',
    ],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Print Queue & Analytics',
    tagline: 'See which printers earn and which ones burn',
    description:
      'Real-time queue management across all your printers — Bambu, Klipper, Prusa, whatever you run. Analytics dashboard shows revenue per printer, utilization rate, and margin by job type.',
    highlights: [
      'Multi-printer queue management',
      'Revenue & utilization per printer',
      'Filament consumption analytics',
    ],
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything your print farm needs. Nothing it doesn&apos;t.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Purpose-built features for 3D print farm operators — not adapted from generic project management software.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-gray-200 p-8 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm font-medium text-indigo-600 mb-4">{feature.tagline}</p>
              <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
