import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | OurMenu OS',
  description: 'Terms and conditions for using OurMenu OS',
  alternates: {
    canonical: 'https://ourmenuos.online/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-emerald-500/30 selection:text-white pb-24 pt-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-zinc-500 mb-12">Last Updated: June 2026</p>
        
        <div className="space-y-12 text-lg font-light leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Software as a Service Definition</h2>
            <p className="mb-4">
              OurMenu (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides a hospitality management software platform (the &quot;Service&quot;) to restaurants, cafes, hotels, and other venues (the &quot;Merchant&quot;). We are strictly a software provider. We do not prepare, handle, or deliver food, nor do we manage the day-to-day operations of the Merchant&apos;s business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Merchant of Record & Liability</h2>
            <p className="mb-4">
              The Merchant is the &quot;Merchant of Record&quot; for all transactions processed through the Service. The Merchant is solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400">
              <li>The quality, safety, and accurate representation of all food and beverages sold.</li>
              <li>Fulfilling orders placed by customers through the Service.</li>
              <li>Compliance with all local health, safety, and business regulations.</li>
            </ul>
            <p className="mt-4">
              OurMenu assumes no liability for food poisoning, allergic reactions, unfulfilled orders, or any other issues arising directly from the Merchant&apos;s physical services or products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Payments, Platform Fees, and KYC</h2>
            <p className="mb-4">
              OurMenu facilitates payments via third-party processors (e.g., Paystack). We utilize <strong>Subaccounts</strong> to route transactions directly to the Merchant. By enabling live payments, the Merchant agrees to the following fee structure and compliance requirements:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-400 mb-4">
              <li><strong>Platform Fee:</strong> OurMenu charges a standard platform fee (e.g., 5%) per successful transaction processed through the Service, deducted automatically prior to payout.</li>
              <li><strong>Payment Gateway Fees:</strong> In addition to the platform fee, the Merchant is fully responsible for absorbing the standard transaction processing fees levied by the payment gateway (e.g., 1.5% + 100 NGN).</li>
              <li><strong>KYC Verification:</strong> To comply with financial regulations, Merchants must submit valid Know Your Customer (KYC) documentation (e.g., RC Number, NIN/BVN, Government IDs). We reserve the right to withhold payouts, suspend processing, or block public access to the Merchant&apos;s digital environment until KYC verification is approved by our compliance team.</li>
            </ul>
            <p>
              Because the Merchant is the Merchant of Record, <strong>all requests for refunds, including instances of customer overpayment or order cancellation, must be directed to and handled by the Merchant.</strong> OurMenu does not hold customer funds and cannot issue refunds on behalf of a Merchant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
            <p className="mb-4">
              Merchants agree not to use the Service for any unlawful purpose, including but not limited to the sale of illegal substances, money laundering, or fraudulent activities. OurMenu reserves the right to suspend or terminate access to the Service immediately upon suspicion of violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Contact Information</h2>
            <p>
              For questions regarding these Terms of Service, please contact us at <a href="mailto:legal@ourmenuos.online" className="text-emerald-400 hover:text-emerald-300">legal@ourmenuos.online</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
