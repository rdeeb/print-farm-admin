import Link from 'next/link'

export function FooterSection() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-950 text-gray-400 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">3D Farm Admin</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              The first order management system built for 3D print farms that shows you your actual cost per
              job — before you quote and after you ship.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Start Free Trial
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {currentYear} 3D Farm Admin. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built for print farm operators, by people who get it.
          </p>
        </div>
      </div>
    </footer>
  )
}
