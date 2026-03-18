import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — PrintFleet',
  description: 'How PrintFleet collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors mb-4 inline-block">
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: March 10, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            PrintFleet (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting your
            personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our service at printfleet.app (the &quot;Service&quot;).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We collect the following types of information:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>
              <strong>Account information:</strong> Name, email address, and password when you create an account.
            </li>
            <li>
              <strong>Business data:</strong> Orders, jobs, printer configurations, filament inventory, client
              information, and cost data you enter into the Service.
            </li>
            <li>
              <strong>Billing information:</strong> Payment details processed securely through Stripe. We do not
              store full card numbers.
            </li>
            <li>
              <strong>Usage data:</strong> Log data, IP addresses, browser type, pages visited, and feature usage
              patterns to improve the Service.
            </li>
            <li>
              <strong>Cookies:</strong> Session cookies for authentication and preference cookies for your
              settings.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>To provide, operate, and maintain the Service</li>
            <li>To process transactions and send related information</li>
            <li>To send transactional emails (account confirmations, invoices, alerts)</li>
            <li>To respond to support requests and provide customer service</li>
            <li>To monitor and analyze usage trends to improve the Service</li>
            <li>To detect and prevent fraud and abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Isolation &amp; Multi-Tenancy</h2>
          <p className="text-gray-600 leading-relaxed">
            Each account operates in a fully isolated tenant. Your business data — orders, clients, cost records,
            and printer configurations — is never shared with or accessible by other accounts. Tenant isolation is
            enforced at the database and application level.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Sharing &amp; Third Parties</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We do not sell your personal information. We share data with third parties only as necessary to operate
            the Service:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>
              <strong>Stripe</strong> — payment processing
            </li>
            <li>
              <strong>Cloud infrastructure providers</strong> — hosting and database services
            </li>
            <li>
              <strong>Analytics tools</strong> — aggregate, anonymized usage analytics
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your data for as long as your account is active. If you cancel your subscription, we retain
            your data for 90 days to allow for reactivation. After 90 days, account data is permanently deleted.
            You may request earlier deletion by contacting us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed mb-3">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@printfleet.app" className="text-indigo-600 hover:underline">
              privacy@printfleet.app
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement industry-standard security measures including encryption in transit (TLS 1.2+), encryption
            at rest, hashed passwords (bcrypt), and regular security audits. No system is 100% secure — if you
            discover a vulnerability, please report it to{' '}
            <a href="mailto:security@printfleet.app" className="text-indigo-600 hover:underline">
              security@printfleet.app
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We&apos;ll notify you via email or an in-app notice
            when material changes are made. Continued use of the Service after changes constitutes acceptance of the
            updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions about this Privacy Policy, contact us at{' '}
            <a href="mailto:privacy@printfleet.app" className="text-indigo-600 hover:underline">
              privacy@printfleet.app
            </a>
            .
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-6 px-4 text-center">
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
          <Link href="/auth/signin" className="hover:text-gray-900 transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
