'use server'

import { Resend } from 'resend'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/upstash'

const enterpriseInquirySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Your name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  branchCount: z.number().min(2, 'At least 2 branches required for Fleet tier'),
  staffSize: z.string().min(1, 'Staff size is required'),
  hardwareNeeds: z.array(z.string()).optional(),
  estimatedMonthlyOrders: z.string().optional(),
  notes: z.string().optional()
})

export type EnterpriseInquiryInput = z.infer<typeof enterpriseInquirySchema>

export async function submitEnterpriseInquiryAction(input: EnterpriseInquiryInput) {
  try {
    const { success } = await checkRateLimit('enterprise_inquiry')
    if (!success) {
      return { success: false, error: 'Too many requests. Please try again shortly.' }
    }

    const parsed = enterpriseInquirySchema.safeParse(input)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input'
      return { success: false, error: firstError }
    }

    const {
      companyName,
      contactName,
      email,
      phone,
      branchCount,
      staffSize,
      hardwareNeeds = [],
      estimatedMonthlyOrders = 'N/A',
      notes = ''
    } = parsed.data

    const resendKey = process.env.RESEND_API_KEY
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@ourmenuos.online'

    if (resendKey) {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: 'OurMenu Enterprise <hello@ourmenuos.online>',
        to: supportEmail,
        replyTo: email,
        subject: `🏢 New Enterprise Fleet Lead: ${companyName} (${branchCount} Branches)`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px;">
            <h2 style="color: #09090b; margin-top: 0;">New Enterprise Fleet Inquiry</h2>
            <p style="color: #71717a; font-size: 14px;">A multi-branch business has requested custom Enterprise pricing.</p>
            
            <div style="background: #f4f4f5; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 6px 0;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 6px 0;"><strong>Contact Person:</strong> ${contactName}</p>
              <p style="margin: 6px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 6px 0;"><strong>Phone / WhatsApp:</strong> ${phone}</p>
              <p style="margin: 6px 0;"><strong>Branch Count:</strong> ${branchCount} physical locations</p>
              <p style="margin: 6px 0;"><strong>Staff Team Size:</strong> ${staffSize}</p>
              <p style="margin: 6px 0;"><strong>Hardware & POS Needs:</strong> ${hardwareNeeds.length > 0 ? hardwareNeeds.join(', ') : 'None specified'}</p>
              <p style="margin: 6px 0;"><strong>Estimated Monthly Volume:</strong> ${estimatedMonthlyOrders}</p>
              ${notes ? `<p style="margin: 6px 0;"><strong>Additional Requirements:</strong> ${notes}</p>` : ''}
            </div>

            <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 0;">
              Submitted from OurMenu OS Enterprise Gating Modal • ${new Date().toUTCString()}
            </p>
          </div>
        `
      })
    }

    return { 
      success: true, 
      message: 'Your enterprise inquiry has been submitted! Our solutions team will prepare your custom proposal and reach out via email/WhatsApp shortly.' 
    }
  } catch (err: unknown) {
    console.error('Failed to process enterprise inquiry:', err)
    return { success: false, error: 'Failed to submit inquiry. Please try again or email support@ourmenuos.online' }
  }
}
