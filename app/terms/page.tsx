import React from 'react'

export const metadata = {
  title: 'Terms of Service | OurMenu OS',
  description: 'Terms and conditions for using OurMenu OS',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-violet-500/30 selection:text-white pb-24 pt-32 px-6">
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
            <h2 className="text-2xl font-bold text-white mb-4">3. Payments, Overpayments, and Refunds</h2>
            <p className="mb-4">
              OurMenu facilitates payments via third-party processors (e.g., Paystack). Because the Merchant is the Merchant of Record, <strong>all requests for refunds, including instances of customer overpayment or order cancellation, must be directed to and handled by the Merchant.</strong>
            </p>
            <p>
              OurMenu does not hold customer funds and cannot issue refunds on behalf of a Merchant. If a customer pays more than the required total amount via manual bank transfer or other means, the Merchant is solely responsible for reconciling the difference with the customer.
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
              For questions regarding these Terms of Service, please contact us at <a href="mailto:legal@ourmenuos.online" className="text-violet-400 hover:text-violet-300">legal@ourmenuos.online</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
