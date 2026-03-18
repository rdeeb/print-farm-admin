import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — PrintFleet',
  description: 'Terms and conditions governing use of the PrintFleet platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors mb-4 inline-block">
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: March 17, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using PrintFleet (&quot;Service&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service. These Terms apply to all users,
            visitors, and others who access or use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed">
            PrintFleet provides order management, cost tracking, print queue management, and analytics software
            designed for 3D print farm operators. The Service is provided on a subscription basis with plans as
            described on our pricing page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            To use the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your password</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscription &amp; Billing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            The Service is billed on a monthly or annual subscription basis, as selected at signup.
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>
              <strong>Free Trial:</strong> A 14-day free trial is available. No credit card is required to start.
            </li>
            <li>
              <strong>Billing Cycle:</strong> Subscriptions renew automatically at the end of each billing period.
            </li>
            <li>
              <strong>Cancellation:</strong> You may cancel at any time from your account settings. Upon cancellation,
              your subscription will not renew and you will retain full access to the Service through the last day
              covered by your current billing period. Access is not cut off early.
            </li>
            <li>
              <strong>Price Changes:</strong> We will provide at least 30 days&apos; notice before changing subscription
              prices.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. No Refund Policy</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            All fees paid for PrintFleet are <strong>non-refundable</strong>, except where required by applicable
            law. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Monthly or annual subscription fees already charged</li>
            <li>Partial months or partial years remaining after cancellation</li>
            <li>Fees charged during a period in which you did not actively use the Service</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            When you cancel, you will retain access to the Service through the last day covered by your current
            billing cycle — you are not charged again after that date and you will not receive a refund for the
            unused portion of the period.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            If you believe a charge was made in error, contact us at{' '}
            <a href="mailto:billing@printfleet.app" className="text-indigo-600 hover:underline">
              billing@printfleet.app
            </a>{' '}
            within 30 days of the charge and we will review your case.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Acceptable Use</h2>
          <p className="text-gray-600 leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Reproduce, duplicate, or resell any part of the Service without authorization</li>
            <li>Upload or transmit malicious code, spam, or harmful content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service and its original content, features, and functionality are owned by PrintFleet and are
            protected by intellectual property laws. You retain ownership of all data you input into the Service.
            You grant us a limited license to store and process that data to provide the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Your Data</h2>
          <p className="text-gray-600 leading-relaxed">
            You own your data. We will not sell or share your business data with third parties except as necessary
            to provide the Service (as described in our Privacy Policy). You may export your data at any time, and
            you may request deletion of your data upon account cancellation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Service Availability</h2>
          <p className="text-gray-600 leading-relaxed">
            We target 99.9% uptime but do not guarantee uninterrupted availability. Scheduled maintenance will be
            communicated in advance. We are not liable for downtime caused by factors outside our reasonable
            control.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            To the maximum extent permitted by law, PrintFleet shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from
            your use of or inability to use the Service. Our total liability for any claim shall not exceed the
            amount paid by you in the 12 months preceding the claim.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Disclaimer of Warranties</h2>
          <p className="text-gray-600 leading-relaxed">
            The Service is provided &quot;as is&quot; without warranties of any kind, express or implied, including
            merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the
            Service will meet your requirements or be error-free.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">12. Termination</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            <strong>By you:</strong> You may cancel your subscription at any time from your account settings. Your
            access will continue through the last day of your current billing period, after which your account will
            be downgraded and no further charges will be made.
          </p>
          <p className="text-gray-600 leading-relaxed">
            <strong>By us:</strong> We may suspend or terminate your account immediately, without prior notice or
            refund, if you materially breach these Terms, engage in fraudulent activity, or your use of the Service
            poses a risk to other users or the platform. In such cases, access ceases immediately upon termination.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">13. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to modify these Terms at any time. We will notify you of material changes via
            email or in-app notification with at least 14 days&apos; notice. Continued use after changes take effect
            constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">14. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall
            be resolved through binding arbitration or in the courts of competent jurisdiction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@printfleet.app" className="text-indigo-600 hover:underline">
              legal@printfleet.app
            </a>
            .
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-6 px-4 text-center">
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
          <Link href="/auth/signin" className="hover:text-gray-900 transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
