import React from 'react'

export const metadata = {
  title: 'Privacy Policy | OurMenu OS',
  description: 'How we collect and protect your data at OurMenu OS',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-violet-500/30 selection:text-white pb-24 pt-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-zinc-500 mb-12">Last Updated: June 2026</p>
        
        <div className="space-y-12 text-lg font-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction & Compliance</h2>
            <p className="mb-4">
              OurMenu ("we", "us", "our") is committed to protecting the privacy of the restaurants that use our platform (Merchants) and the guests who interact with our digital menus (End-Users).
            </p>
            <p className="mb-4">
              This Privacy Policy details our data processing practices and is designed to comply with both the <strong>Nigerian Data Protection Regulation (NDPR)</strong> and the international <strong>General Data Protection Regulation (GDPR)</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
            <p className="mb-4">
              <strong>From Merchants:</strong> We collect business details, contact information, menu data, and payment configuration necessary to provide the service.
            </p>
            <p className="mb-4">
              <strong>From End-Users:</strong> When placing an order, we may optionally collect an email address for sending electronic receipts (E-Slips), and a table identifier. We do not store full credit card numbers; all payments are processed securely via third-party payment gateways.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li>To facilitate order routing, digital menu viewing, and payments.</li>
              <li>To send transactional communications (e.g., email receipts).</li>
              <li>To provide aggregated, anonymized analytics to Merchants to help forecast demand.</li>
              <li>To improve our platform and AI systems. We explicitly ensure that personally identifiable information (PII) is <strong>never</strong> used to train public AI models.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Processors</h2>
            <p className="mb-4">
              We share limited, necessary data with secure third-party infrastructure providers to operate the Service. These include, but are not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li><strong>Paystack:</strong> For secure payment processing.</li>
              <li><strong>Termii:</strong> For sending real-time communication/notifications (e.g., WhatsApp KDS alerts to Merchants).</li>
              <li><strong>Resend:</strong> For delivering transactional email receipts to End-Users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Data Rights (NDPR & GDPR)</h2>
            <p className="mb-4">
              Under NDPR and GDPR, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data ("Right to be Forgotten").</li>
              <li>Withdraw consent for data processing at any time.</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact our Data Protection Officer at <a href="mailto:privacy@ourmenuos.online" className="text-violet-400 hover:text-violet-300">privacy@ourmenuos.online</a>. We will respond to all requests within 30 days.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
