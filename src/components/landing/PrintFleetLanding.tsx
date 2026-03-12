'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  BarChart3,
  Box,
  Check,
  ChevronRight,
  Cpu,
  LayoutDashboard,
  Lock,
  Menu,
  Printer,
  Shield,
  Sparkles,
  Zap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const SHOW_PRICING = false // Set to true to show pricing section again

const NAV_LINKS = [
  { label: 'Product', href: '#solution' },
  { label: 'Features', href: '#features' },
  { label: 'Waitlist', href: '#waitlist' },
  { label: 'Docs', href: '#' },
]

const WAITLIST_FIELDS = {
  email: '',
  printerCountAndMonitoring: '',
  biggestProblem: '',
  toolsTried: '',
  magicWandFix: '',
  worthPerMonth: '',
  doublePrintersBreak: '',
} as const

export function PrintFleetLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [waitlistShowQuestions, setWaitlistShowQuestions] = useState(false)
  const [waitlistForm, setWaitlistForm] = useState(WAITLIST_FIELDS)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  const handleWaitlistChange = (field: keyof typeof WAITLIST_FIELDS, value: string) => {
    setWaitlistForm((prev) => ({ ...prev, [field]: value }))
    setWaitlistError(null)
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWaitlistError(null)
    setWaitlistSubmitting(true)
    try {
      const res = await fetch('/api/wishlist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waitlistForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setWaitlistError(data?.error ?? 'Something went wrong. Please try again.')
        return
      }
      setWaitlistSuccess(true)
      setWaitlistForm(WAITLIST_FIELDS)
      setWaitlistShowQuestions(false)
    } finally {
      setWaitlistSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-pf-bg text-pf-white antialiased">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-pf-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[400px] bg-pf-cyan/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[300px] bg-pf-purple/5 rounded-full blur-[80px]" />
      </div>

      <header className="relative z-10 border-b border-pf-border/50 bg-pf-bg/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pf-blue to-pf-cyan flex items-center justify-center">
                <Printer className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-pf-white">PrintFleet</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-pf-muted-light hover:text-pf-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="/auth/signin"
                className="text-sm text-pf-muted-light hover:text-pf-white transition-colors"
              >
                Login
              </a>
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-lg bg-pf-blue px-4 py-2 text-sm font-medium text-white hover:bg-pf-blue/90 transition-all hover:shadow-lg hover:shadow-pf-blue-glow"
              >
                Join Waitlist
              </a>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-pf-muted-light hover:text-pf-white"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-pf-surface border-l border-pf-border p-6">
              <div className="flex justify-between items-center mb-8">
                <span className="font-semibold text-pf-white">PrintFleet</span>
                <button
                  type="button"
                  className="p-2 text-pf-muted-light hover:text-pf-white"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-pf-muted-light hover:text-pf-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="#waitlist"
                  className="mt-4 rounded-lg bg-pf-blue px-4 py-3 text-center font-medium text-white block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Join Waitlist
                </a>
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* 1. HERO */}
        <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm font-medium text-pf-cyan uppercase tracking-wider mb-6">
                The operating system for modern print farms
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-pf-white leading-[1.1] mb-6">
                Operate Your 3D Printer Fleet From One Dashboard
              </h1>
              <p className="text-lg sm:text-xl text-pf-muted-light max-w-2xl mx-auto mb-10 leading-relaxed">
                Monitor every printer, detect failures instantly, and scale your printing operation
                without babysitting machines.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center rounded-xl bg-pf-blue px-8 py-4 text-base font-semibold text-white shadow-lg shadow-pf-blue-glow hover:bg-pf-blue/90 hover:shadow-xl hover:shadow-pf-blue-glow transition-all"
                >
                  Join Waitlist
                  <ChevronRight className="w-5 h-5 ml-1" />
                </a>
                <a
                  href="#solution"
                  className="inline-flex items-center justify-center rounded-xl border border-pf-border bg-pf-surface px-8 py-4 text-base font-semibold text-pf-white hover:bg-pf-card hover:border-pf-muted transition-all"
                >
                  See how it works
                </a>
              </div>
            </div>

            {/* Hero dashboard mockup */}
            <div className="mt-16 lg:mt-24 max-w-6xl mx-auto">
              <div className="rounded-2xl border border-pf-border bg-pf-card shadow-2xl shadow-black/40 overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-pf-border bg-pf-surface/50">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-pf-error/80" />
                    <span className="w-3 h-3 rounded-full bg-pf-warning/80" />
                    <span className="w-3 h-3 rounded-full bg-pf-success/80" />
                  </div>
                  <span className="text-xs text-pf-muted ml-4">PrintFleet Dashboard — printfleet.app</span>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[320px]">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: 'X1C-01', status: 'printing', progress: 78 },
                        { name: 'X1C-02', status: 'idle', progress: 0 },
                        { name: 'P1S-01', status: 'printing', progress: 42 },
                        { name: 'Voron-01', status: 'error', progress: 15 },
                      ].map((p) => (
                        <div
                          key={p.name}
                          className="rounded-xl border border-pf-border bg-pf-surface p-4 hover:border-pf-border/80 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-pf-white">{p.name}</span>
                            <span
                              className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                p.status === 'printing' && 'bg-pf-cyan/20 text-pf-cyan',
                                p.status === 'idle' && 'bg-pf-muted/20 text-pf-muted-light',
                                p.status === 'error' && 'bg-pf-error/20 text-pf-error'
                              )}
                            >
                              {p.status}
                            </span>
                          </div>
                          {p.progress > 0 && (
                            <div className="h-1.5 rounded-full bg-pf-border overflow-hidden">
                              <div
                                className="h-full rounded-full bg-pf-cyan transition-all"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-pf-border bg-pf-surface p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-pf-cyan" />
                        <span className="text-sm font-medium text-pf-white">Fleet utilization</span>
                      </div>
                      <div className="h-24 flex items-end gap-2">
                        {[65, 40, 80, 20, 90, 55, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-pf-blue/60 to-pf-cyan/60 min-h-[20px]"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-pf-muted">
                        <span>Mon</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-3">
                    <div className="rounded-xl border border-pf-border bg-pf-surface p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-pf-warning" />
                        <span className="text-sm font-medium text-pf-white">Alerts</span>
                      </div>
                      <ul className="space-y-2 text-xs text-pf-muted-light">
                        <li>Voron-01 — nozzle temp low</li>
                        <li>P1S-01 — filament 20%</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-pf-border bg-pf-surface p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Box className="w-4 h-4 text-pf-cyan" />
                        <span className="text-sm font-medium text-pf-white">AMS / Material</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['PLA', 'PETG', 'ABS'].map((m) => (
                          <span
                            key={m}
                            className="text-xs px-2 py-1 rounded bg-pf-border text-pf-muted-light"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PROBLEM AMPLIFICATION */}
        <section id="problems" className="py-24 lg:py-32 border-t border-pf-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Managing multiple 3D printers shouldn&apos;t feel like chaos
              </h2>
              <p className="text-lg text-pf-muted-light">
                The hidden cost of running a print farm without the right tools.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                {
                  title: 'Missed failures waste time and material',
                  description:
                    'A print that failed hours ago keeps running in your head until you walk over and check. Lost filament, lost time, missed deadlines.',
                  icon: AlertTriangle,
                },
                {
                  title: 'Checking machines manually kills productivity',
                  description:
                    'Constantly walking the floor to see status, progress, and material levels. Your attention becomes the bottleneck.',
                  icon: Printer,
                },
                {
                  title: 'Different ecosystems create fragmented workflows',
                  description:
                    'Bambu here, Klipper there. Multiple apps, no single view. Context-switching instead of operating.',
                  icon: LayoutDashboard,
                },
                {
                  title: 'Scaling from a few printers to a real farm gets messy',
                  description:
                    'What worked for three printers breaks at ten. Ad-hoc solutions don\'t scale. You need a real operations layer.',
                  icon: Zap,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-pf-border bg-pf-card p-6 hover:border-pf-border hover:bg-pf-surface/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-pf-error/10 flex items-center justify-center mb-4 group-hover:bg-pf-error/20 transition-colors">
                    <item.icon className="w-5 h-5 text-pf-error/80" />
                  </div>
                  <h3 className="text-lg font-semibold text-pf-white mb-2">{item.title}</h3>
                  <p className="text-sm text-pf-muted-light leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. SOLUTION */}
        <section id="solution" className="py-24 lg:py-32 border-t border-pf-border/50 bg-pf-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                A Control Center for Your Entire Print Farm
              </h2>
              <p className="text-lg text-pf-muted-light leading-relaxed">
                PrintFleet brings your fleet into one secure operational layer, giving you
                real-time visibility, alerts, and insights across Bambu and Klipper-based printers.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl border border-pf-border bg-pf-card p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex-1 flex items-center justify-center gap-4 lg:gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-pf-blue/20 flex items-center justify-center mx-auto mb-2">
                        <Printer className="w-8 h-8 text-pf-blue" />
                      </div>
                      <p className="text-sm font-medium text-pf-white">Your Printers</p>
                      <p className="text-xs text-pf-muted mt-1">Bambu · Klipper</p>
                    </div>
                    <ChevronRight className="w-8 h-8 text-pf-muted hidden lg:block" />
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-pf-cyan/20 flex items-center justify-center mx-auto mb-2">
                        <Cpu className="w-8 h-8 text-pf-cyan" />
                      </div>
                      <p className="text-sm font-medium text-pf-white">Local Connector</p>
                      <p className="text-xs text-pf-muted mt-1">Secure · On-prem</p>
                    </div>
                    <ChevronRight className="w-8 h-8 text-pf-muted hidden lg:block" />
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-pf-purple/20 flex items-center justify-center mx-auto mb-2">
                        <LayoutDashboard className="w-8 h-8 text-pf-purple" />
                      </div>
                      <p className="text-sm font-medium text-pf-white">PrintFleet Cloud</p>
                      <p className="text-xs text-pf-muted mt-1">One dashboard</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-pf-border flex flex-wrap items-center justify-center gap-6 text-sm text-pf-muted-light">
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-pf-cyan" />
                    No direct printer exposure to the internet
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-pf-cyan" />
                    One connector can manage multiple printers per site
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. VALUE STACK */}
        <section id="features" className="py-24 lg:py-32 border-t border-pf-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Everything You Need to Run a Smarter Print Farm
              </h2>
              <p className="text-lg text-pf-muted-light">
                One unified system. No more fragmented tools or manual oversight.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                {
                  title: 'Real-Time Fleet Monitoring',
                  description: 'See status, progress, and health of every printer in one place. No more walking the floor.',
                  icon: LayoutDashboard,
                },
                {
                  title: 'Instant Failure Alerts',
                  description: 'Get notified the moment something goes wrong. Reduce wasted material and catch issues early.',
                  icon: AlertTriangle,
                },
                {
                  title: 'Multi-Brand Visibility',
                  description: 'Bambu and Klipper in the same dashboard. One workflow for your entire fleet.',
                  icon: Printer,
                },
                {
                  title: 'AMS / Material Tracking',
                  description: 'Track filament levels and material usage across printers. Plan ahead, avoid runouts.',
                  icon: Box,
                },
                {
                  title: 'Historical Analytics',
                  description: 'Utilization, uptime, and trends over time. Make data-driven decisions about capacity.',
                  icon: BarChart3,
                },
                {
                  title: 'Secure Local Connector',
                  description: 'Printers stay on your network. Our connector talks to the cloud—no port forwarding.',
                  icon: Lock,
                },
                {
                  title: 'Fleet Health Overview',
                  description: 'At-a-glance view of what\'s running, what\'s idle, and what needs attention.',
                  icon: Zap,
                },
                {
                  title: 'Team-Friendly Operations',
                  description: 'Shared visibility so your team can operate with clarity. Fewer surprises, better handoffs.',
                  icon: Sparkles,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-pf-border bg-pf-card p-6 hover:border-pf-cyan/30 hover:bg-pf-card/80 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-pf-cyan/10 flex items-center justify-center mb-4 group-hover:bg-pf-cyan/20 transition-colors">
                    <item.icon className="w-5 h-5 text-pf-cyan" />
                  </div>
                  <h3 className="text-base font-semibold text-pf-white mb-2">{item.title}</h3>
                  <p className="text-sm text-pf-muted-light leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="max-w-2xl mx-auto mt-12 text-center text-sm text-pf-muted-light leading-relaxed">
              The cost of missed failures, fragmented tools, and manual oversight adds up fast.
              PrintFleet replaces that operational drag with one unified system.
            </p>
          </div>
        </section>

        {/* 5. FAST TIME-TO-VALUE */}
        <section className="py-24 lg:py-32 border-t border-pf-border/50 bg-pf-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Up and Running in Minutes
              </h2>
              <p className="text-lg text-pf-muted-light">
                No lengthy onboarding. Get visibility fast.
              </p>
            </div>
            <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
              {[
                { step: 1, title: 'Install the connector', description: 'Run our lightweight connector on a machine on your local network. One install per site.' },
                { step: 2, title: 'Add your printers', description: 'Point the connector at your Bambu and Klipper printers. They stay on your network.' },
                { step: 3, title: 'Start monitoring your fleet', description: 'Open the PrintFleet dashboard. Real-time status, alerts, and insights from day one.' },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="w-12 h-12 rounded-xl bg-pf-blue/20 flex items-center justify-center mx-auto mb-4 text-pf-blue font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-pf-white mb-2">{item.title}</h3>
                  <p className="text-sm text-pf-muted-light">{item.description}</p>
                  {item.step < 3 && (
                    <div className="hidden sm:block absolute top-6 left-[60%] w-[80%] h-px bg-pf-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. LOW EFFORT */}
        <section className="py-24 lg:py-32 border-t border-pf-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                No Network Headaches. No Complicated Setup.
              </h2>
              <p className="text-lg text-pf-muted-light">
                We designed for real print farms. No IT drama required.
              </p>
            </div>
            <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
              {[
                'No port forwarding',
                'No exposing printers to the public internet',
                'Works with your existing setup',
                'One connector can manage multiple printers per site',
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-xl border border-pf-border bg-pf-card px-5 py-4"
                >
                  <Check className="w-5 h-5 text-pf-cyan shrink-0" />
                  <span className="text-pf-white font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. COMPATIBILITY */}
        <section className="py-24 lg:py-32 border-t border-pf-border/50 bg-pf-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Built for Modern 3D Printing Operations
              </h2>
              <p className="text-lg text-pf-muted-light">
                Designed for real-world mixed fleets and operational visibility.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
              {[
                { name: 'Bambu Lab', desc: 'X1, P1, A1 series' },
                { name: 'Klipper', desc: 'All Klipper-based printers' },
                { name: 'Moonraker', desc: 'Native API support' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col items-center rounded-2xl border border-pf-border bg-pf-card px-8 py-6 min-w-[180px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-pf-border flex items-center justify-center mb-3">
                    <Printer className="w-6 h-6 text-pf-muted-light" />
                  </div>
                  <span className="font-semibold text-pf-white">{item.name}</span>
                  <span className="text-xs text-pf-muted mt-1">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. DASHBOARD SHOWCASE */}
        <section className="py-24 lg:py-32 border-t border-pf-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                See Your Entire Fleet at a Glance
              </h2>
              <p className="text-lg text-pf-muted-light">
                One dashboard. All your printers. Real-time status and insights.
              </p>
            </div>
            <div className="max-w-6xl mx-auto rounded-2xl border border-pf-border bg-pf-card shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-pf-border bg-pf-surface/50">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-pf-error/80" />
                    <span className="w-3 h-3 rounded-full bg-pf-warning/80" />
                    <span className="w-3 h-3 rounded-full bg-pf-success/80" />
                  </div>
                  <span className="text-sm text-pf-muted-light">Fleet Overview · PrintFleet</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-pf-cyan/20 text-pf-cyan">Live</span>
                  <span className="text-xs text-pf-muted">Last sync: now</span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { name: 'X1C-01', status: 'Printing', progress: 78, time: '2h 14m left' },
                      { name: 'X1C-02', status: 'Idle', progress: 0, time: '—' },
                      { name: 'P1S-01', status: 'Printing', progress: 42, time: '4h 02m left' },
                      { name: 'Voron-01', status: 'Error', progress: 15, time: 'Nozzle temp' },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="rounded-xl border border-pf-border bg-pf-surface p-4 hover:border-pf-cyan/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-pf-white">{p.name}</span>
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              p.status === 'Printing' && 'bg-pf-cyan/20 text-pf-cyan',
                              p.status === 'Idle' && 'bg-pf-muted/20 text-pf-muted-light',
                              p.status === 'Error' && 'bg-pf-error/20 text-pf-error'
                            )}
                          >
                            {p.status}
                          </span>
                        </div>
                        {p.progress > 0 && (
                          <div className="h-2 rounded-full bg-pf-border overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-pf-blue to-pf-cyan transition-all"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                        )}
                        <p className="text-xs text-pf-muted">{p.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-pf-border bg-pf-surface p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-pf-white">Utilization (7 days)</span>
                      <span className="text-xs text-pf-cyan">68% avg</span>
                    </div>
                    <div className="h-28 flex items-end gap-1">
                      {[72, 45, 88, 52, 90, 65, 78].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-pf-blue/50 to-pf-cyan/50 min-h-[24px]"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-pf-muted">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-xl border border-pf-border bg-pf-surface p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-pf-warning" />
                      <span className="text-sm font-medium text-pf-white">Active Alerts</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      <li className="flex justify-between text-pf-muted-light">
                        <span>Voron-01</span>
                        <span className="text-pf-warning">Nozzle temp low</span>
                      </li>
                      <li className="flex justify-between text-pf-muted-light">
                        <span>P1S-01</span>
                        <span className="text-pf-cyan">Filament 20%</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-pf-border bg-pf-surface p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Box className="w-4 h-4 text-pf-cyan" />
                      <span className="text-sm font-medium text-pf-white">Material summary</span>
                    </div>
                    <div className="space-y-2 text-xs text-pf-muted-light">
                      <div className="flex justify-between">
                        <span>PLA</span>
                        <span>4 spools</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PETG</span>
                        <span>2 spools</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ABS</span>
                        <span>1 spool</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-pf-border bg-pf-surface p-4">
                    <div className="text-sm font-medium text-pf-white mb-2">Fleet health</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-pf-border overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-pf-success" />
                      </div>
                      <span className="text-xs text-pf-muted-light">75%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. WAITLIST CTA */}
        <section id="book-demo" className="py-24 lg:py-32 border-t border-pf-border/50 bg-pf-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Get Notified When We Launch
              </h2>
              <p className="text-lg text-pf-muted-light mb-8">
                Join the waitlist and lock in 25% off forever. We&apos;ll let you know as soon as PrintFleet is ready.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-xl bg-pf-blue px-8 py-4 text-base font-semibold text-white shadow-lg shadow-pf-blue-glow hover:bg-pf-blue/90 transition-all"
              >
                Join Waitlist
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
            </div>
          </div>
        </section>

        {/* 10. PRICING (hidden for now) */}
        {SHOW_PRICING && (
        <section id="pricing" className="py-24 lg:py-32 border-t border-pf-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-pf-muted-light">
                Scale as you grow. No surprise fees.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  name: 'Solo',
                  tagline: 'For small farms getting organized',
                  price: '$29',
                  period: '/mo',
                  features: ['Up to 5 printers', 'Real-time monitoring', 'Failure alerts', 'Email support'],
                  cta: 'Start Free Trial',
                  highlighted: false,
                },
                {
                  name: 'Shop',
                  tagline: 'For growing production teams',
                  price: '$79',
                  period: '/mo',
                  features: ['Up to 20 printers', 'Everything in Solo', 'Historical analytics', 'AMS / material tracking', 'Priority support'],
                  cta: 'Start Free Trial',
                  highlighted: true,
                },
                {
                  name: 'Farm',
                  tagline: 'For larger operations at scale',
                  price: '$149',
                  period: '/mo',
                  features: ['Unlimited printers', 'Everything in Shop', 'SSO & advanced security', 'Dedicated support', 'Custom integrations'],
                  cta: 'Start Free Trial',
                  highlighted: false,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    'rounded-2xl border p-6 flex flex-col',
                    tier.highlighted
                      ? 'border-pf-cyan/50 bg-pf-card shadow-lg shadow-pf-cyan-glow'
                      : 'border-pf-border bg-pf-card'
                  )}
                >
                  <h3 className="text-lg font-semibold text-pf-white">{tier.name}</h3>
                  <p className="text-sm text-pf-muted-light mt-1">{tier.tagline}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-pf-white">{tier.price}</span>
                    {tier.period && (
                      <span className="text-pf-muted-light">{tier.period}</span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-pf-muted-light">
                        <Check className="w-4 h-4 text-pf-cyan shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.cta === 'Contact Sales' ? '#book-demo' : '/auth/signin'}
                    className={cn(
                      'mt-6 inline-flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all',
                      tier.highlighted
                        ? 'bg-pf-cyan text-pf-bg hover:bg-pf-cyan/90'
                        : 'border border-pf-border text-pf-white hover:bg-pf-surface'
                    )}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* WAITLIST — 25% off */}
        <section id="waitlist" className="py-24 lg:py-32 border-t border-pf-border/50 bg-pf-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-pf-border bg-pf-card p-6 lg:p-8">
                <h2 className="text-xl font-semibold text-pf-white">
                  Join the waitlist — 25% off forever when we launch
                </h2>
                <p className="mt-1 text-sm text-pf-muted-light">
                  Enter your email to get notified. Optionally answer a few questions to help us build the right product.
                </p>

                {waitlistSuccess && (
                  <div className="mt-6 rounded-xl bg-pf-cyan/10 border border-pf-cyan/30 px-4 py-3 text-sm text-pf-cyan">
                    You&apos;re on the list. We&apos;ll be in touch when we launch — and your 25% off is locked in.
                  </div>
                )}

                {!waitlistSuccess && (
                  <form onSubmit={handleWaitlistSubmit} className="mt-6 space-y-6">
                    {waitlistError && (
                      <div className="rounded-xl bg-pf-error/10 border border-pf-error/30 px-4 py-3 text-sm text-pf-error">
                        {waitlistError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="waitlist-email" className="block text-sm font-medium text-pf-white mb-1">
                        Email
                      </label>
                      <input
                        id="waitlist-email"
                        type="email"
                        required
                        value={waitlistForm.email}
                        onChange={(e) => handleWaitlistChange('email', e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan"
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-4">
                      <input
                        type="checkbox"
                        checked={waitlistShowQuestions}
                        onChange={(e) => {
                          setWaitlistShowQuestions(e.target.checked)
                          setWaitlistError(null)
                        }}
                        className="mt-1 h-5 w-5 rounded border-pf-border bg-pf-surface text-pf-cyan focus:ring-pf-cyan"
                      />
                      <span className="text-sm text-pf-muted-light">
                        I&apos;d like to answer a few questions to help shape the product (optional)
                      </span>
                    </label>

                    {waitlistShowQuestions && (
                    <>
                    <div>
                      <label htmlFor="waitlist-q1" className="block text-sm font-medium text-pf-white mb-1">
                        1. How many printers are you running today, and how do you currently monitor them?
                      </label>
                      <textarea
                        id="waitlist-q1"
                        rows={3}
                        value={waitlistForm.printerCountAndMonitoring}
                        onChange={(e) => handleWaitlistChange('printerCountAndMonitoring', e.target.value)}
                        placeholder="e.g. I have 12 printers and check them manually / I use OctoPrint..."
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="waitlist-q2" className="block text-sm font-medium text-pf-white mb-1">
                        2. What is the most expensive or frustrating problem you experience when running multiple printers?
                      </label>
                      <textarea
                        id="waitlist-q2"
                        rows={3}
                        value={waitlistForm.biggestProblem}
                        onChange={(e) => handleWaitlistChange('biggestProblem', e.target.value)}
                        placeholder="e.g. Missed failures, wasted filament, manual checking..."
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="waitlist-q3" className="block text-sm font-medium text-pf-white mb-1">
                        3. Have you tried any tools to solve this? What did you like and dislike about them?
                      </label>
                      <textarea
                        id="waitlist-q3"
                        rows={3}
                        value={waitlistForm.toolsTried}
                        onChange={(e) => handleWaitlistChange('toolsTried', e.target.value)}
                        placeholder="e.g. SimplyPrint, OctoEverywhere, Obico, spreadsheets..."
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="waitlist-q4" className="block text-sm font-medium text-pf-white mb-1">
                        4. If you could wave a magic wand and fix one thing about managing your printers, what would it be?
                      </label>
                      <textarea
                        id="waitlist-q4"
                        rows={3}
                        value={waitlistForm.magicWandFix}
                        onChange={(e) => handleWaitlistChange('magicWandFix', e.target.value)}
                        placeholder="e.g. Automatic failure detection, centralized monitoring, job scheduling..."
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="waitlist-q5" className="block text-sm font-medium text-pf-white mb-1">
                        5. If a tool solved that problem for you, what would it be worth per month?
                      </label>
                      <textarea
                        id="waitlist-q5"
                        rows={2}
                        value={waitlistForm.worthPerMonth}
                        onChange={(e) => handleWaitlistChange('worthPerMonth', e.target.value)}
                        placeholder="e.g. $50/month, $200/month..."
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan resize-y"
                      />
                    </div>

                    <div>
                      <label htmlFor="waitlist-q6" className="block text-sm font-medium text-pf-white mb-1">
                        Bonus: What would break in your operation if you doubled the number of printers tomorrow?
                      </label>
                      <textarea
                        id="waitlist-q6"
                        rows={3}
                        value={waitlistForm.doublePrintersBreak}
                        onChange={(e) => handleWaitlistChange('doublePrintersBreak', e.target.value)}
                        placeholder="Optional but helpful..."
                        className="w-full rounded-lg border border-pf-border bg-pf-surface px-4 py-3 text-pf-white placeholder:text-pf-muted focus:border-pf-cyan focus:outline-none focus:ring-1 focus:ring-pf-cyan resize-y"
                      />
                    </div>
                    </>
                    )}

                    <button
                      type="submit"
                      disabled={waitlistSubmitting}
                      className="w-full rounded-xl bg-pf-cyan px-6 py-4 text-base font-semibold text-pf-bg hover:bg-pf-cyan/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {waitlistSubmitting ? 'Submitting…' : 'Join waitlist'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 11. FINAL CTA */}
        <section className="py-24 lg:py-32 border-t border-pf-border/50 bg-pf-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-pf-white mb-4">
                Get Notified When We Launch
              </h2>
              <p className="text-lg text-pf-muted-light mb-10">
                Join the waitlist for 25% off forever. We&apos;ll let you know as soon as PrintFleet is ready.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-xl bg-pf-blue px-8 py-4 text-base font-semibold text-white shadow-lg shadow-pf-blue-glow hover:bg-pf-blue/90 transition-all"
              >
                Join Waitlist
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
            </div>
          </div>
        </section>

        {/* 12. FOOTER */}
        <footer className="border-t border-pf-border py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pf-blue to-pf-cyan flex items-center justify-center">
                  <Printer className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-pf-white">PrintFleet</span>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-pf-muted-light">
                <a href="#solution" className="hover:text-pf-white transition-colors">
                  Product
                </a>
                <a href="#waitlist" className="hover:text-pf-white transition-colors">
                  Waitlist
                </a>
                <a href="#" className="hover:text-pf-white transition-colors">
                  Docs
                </a>
                <a href="/auth/signin" className="hover:text-pf-white transition-colors">
                  Login
                </a>
              </nav>
            </div>
            <div className="mt-8 pt-8 border-t border-pf-border text-center text-sm text-pf-muted">
              © {new Date().getFullYear()} PrintFleet. printfleet.app
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
