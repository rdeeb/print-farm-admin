import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Add your order',
    description:
      'Create an order with client info, files, and specifications. The BOM cost calculator immediately estimates your cost and suggested price — so you quote with confidence, not guesswork.',
    detail: 'Attach STL files, set quantity, pick your filament from your spool inventory, and get a quote in under 2 minutes.',
  },
  {
    number: '02',
    title: 'Assign to printers',
    description:
      'Drag jobs into your print queue and assign them to specific printers. Track print status in real time — in progress, completed, or failed — across your whole fleet.',
    detail: 'Works with Bambu Lab, Klipper, Prusa, Creality, and any printer you can add manually.',
  },
  {
    number: '03',
    title: 'See your profit',
    description:
      'When the job ships, see the real cost vs. what you charged. Identify your most profitable job types, best-performing printers, and where your margins are leaking.',
    detail: 'Analytics auto-update so every dashboard insight reflects your actual numbers — not projections.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-indigo-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-indigo-300 max-w-2xl mx-auto">
            No complicated setup. No consultants. Just add your printers and take your first order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-indigo-800 z-0" style={{ width: 'calc(100% - 2rem)', left: 'calc(100% - 1rem)' }} />
              )}

              <div className="relative z-10 bg-indigo-900/50 rounded-2xl border border-indigo-800 p-8">
                <div className="text-4xl font-black text-indigo-700 mb-4">{step.number}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-indigo-200 leading-relaxed mb-4">{step.description}</p>
                <p className="text-sm text-indigo-400 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center px-6 py-3 text-base font-semibold text-indigo-900 bg-white rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Start Free Trial — No credit card required
          </Link>
        </div>
      </div>
    </section>
  )
}
