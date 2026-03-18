const testimonials = [
  {
    quote:
      "Before PrintFleet, I was losing money on rush orders and didn't know it. Now I quote with real numbers and my margins are up 30%.",
    name: 'Marcus T.',
    title: 'Owner',
    company: 'LayerUp Studios',
    initials: 'MT',
    color: 'bg-indigo-500',
  },
  {
    quote:
      "I was tracking 14 printers on a Google Sheet. It was chaos. This replaced my entire workflow. The client portal alone saves me an hour a day.",
    name: 'Sarah K.',
    title: 'Founder',
    company: 'Hexform Print Co.',
    initials: 'SK',
    color: 'bg-violet-500',
  },
  {
    quote:
      "The filament cost tracking is insane. I never realized how much waste was eating into my margins. That insight paid for the subscription in the first week.",
    name: 'Diego R.',
    title: 'Operations Lead',
    company: 'Rapid Parts Lab',
    initials: 'DR',
    color: 'bg-blue-500',
  },
]

const comparisonRows = [
  {
    feature: 'BOM-based job cost calculator',
    farmAdmin: true,
    notionSheets: false,
    genericPM: false,
  },
  {
    feature: 'Real-time filament spool tracking',
    farmAdmin: true,
    notionSheets: false,
    genericPM: false,
  },
  {
    feature: 'Print queue management',
    farmAdmin: true,
    notionSheets: false,
    genericPM: 'Partial',
  },
  {
    feature: 'Client portal with order status',
    farmAdmin: true,
    notionSheets: false,
    genericPM: 'Partial',
  },
  {
    feature: 'Margin analytics per job',
    farmAdmin: true,
    notionSheets: false,
    genericPM: false,
  },
  {
    feature: 'Multi-printer utilization tracking',
    farmAdmin: true,
    notionSheets: false,
    genericPM: false,
  },
  {
    feature: 'Built for 3D print farms',
    farmAdmin: true,
    notionSheets: false,
    genericPM: false,
  },
]

function CheckIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  }
  return <div className="text-center text-sm text-gray-500">{value}</div>
}

export function SocialProofSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Testimonials */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Print farms are already running leaner
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Here&apos;s what operators say after switching from spreadsheets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex flex-col gap-6"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <blockquote className="text-gray-700 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} text-white text-sm font-bold flex items-center justify-center`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.title}, {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Why not just use Notion or a spreadsheet?</h3>
          <p className="text-gray-500">Fair question. Here&apos;s the honest answer.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 w-1/2">Feature</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-700">
                  <div className="flex flex-col items-center gap-1">
                    <span>PrintFleet</span>
                    <span className="text-xs text-indigo-400 font-normal">purpose-built</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">
                  <div className="flex flex-col items-center gap-1">
                    <span>Notion + Sheets</span>
                    <span className="text-xs text-gray-400 font-normal">DIY stack</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">
                  <div className="flex flex-col items-center gap-1">
                    <span>Generic PM Tool</span>
                    <span className="text-xs text-gray-400 font-normal">e.g. Monday, Asana</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{row.feature}</td>
                  <td className="px-6 py-4">
                    <CheckIcon value={row.farmAdmin} />
                  </td>
                  <td className="px-6 py-4">
                    <CheckIcon value={row.notionSheets} />
                  </td>
                  <td className="px-6 py-4">
                    <CheckIcon value={row.genericPM} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
