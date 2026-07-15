import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHTML(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

import { getInfrastructureFlags } from '@/lib/utils/settings';

async function isEmailEnabled() {
  const infraFlags = await getInfrastructureFlags() as Record<string, boolean>;
  return infraFlags.transactional_emails_enabled !== false;
}

export async function sendEmailNotification(toEmail: string, subject: string, message: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production environment');
    }
    console.warn(`RESEND_API_KEY missing. Mocking email to ${toEmail}: ${subject}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'OurMenu Notifications <notifications@ourmenuos.online>',
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">${escapeHTML(subject)}</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5; white-space: pre-line;">${escapeHTML(message)}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">This is an automated notification from OurMenu OS.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to send email notification:', err);
    return false;
  }
}

export async function sendWelcomeEmail(toEmail: string, name?: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production environment');
    }
    console.warn(`RESEND_API_KEY missing. Mocking Welcome email to ${toEmail}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'OurMenu Welcome <welcome@ourmenuos.online>',
      to: [toEmail],
      subject: 'Welcome to OurMenu OS! 🚀',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
          <h1 style="color: #111; margin-top: 0;">Welcome aboard${name ? `, ${escapeHTML(name)}` : ''}! 🎉</h1>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            We're thrilled to have you join OurMenu OS. Our mission is to give you absolute control over your digital storefront, bookings, and customer interactions without the technical headache.
          </p>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            <strong>Next Steps:</strong>
            <ul style="color: #444; font-size: 16px; line-height: 1.6;">
              <li>Customize your business profile and location</li>
              <li>Add your first few menu items or booking services</li>
              <li>Setup your QR codes or ecosystem links</li>
            </ul>
          </p>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            If you run into any snags or have questions, simply reply to this email. We're here to help you scale!
          </p>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px;">© OurMenu OS. All rights reserved.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return false;
  }
}

export async function sendSubscriptionActivated(toEmail: string, planName: string, name?: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) return true;
  try {
    const { error } = await resend.emails.send({
      from: 'OurMenu Billing <billing@ourmenuos.online>',
      to: [toEmail],
      subject: 'Your Subscription is Active! 🎉',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #111; margin-top: 0;">Subscription Activated!</h1>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Hi ${name ? escapeHTML(name) : 'there'},<br/><br/>
            Great news! Your <strong>${escapeHTML(planName)}</strong> subscription is now active. You have full access to all premium features.
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
        </div>
      `,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to send subscription activated email:', err);
    return false;
  }
}

export async function sendInvoice(toEmail: string, amount: string, reference: string, planName: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) return true;
  try {
    const { error } = await resend.emails.send({
      from: 'OurMenu Billing <billing@ourmenuos.online>',
      to: [toEmail],
      subject: 'Payment Receipt - OurMenu OS',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #111; margin-top: 0;">Payment Receipt</h1>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Thank you for your payment. Here are the details of your recent transaction:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Plan</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${escapeHTML(planName)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Amount</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${escapeHTML(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Reference</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${escapeHTML(reference)}</td>
            </tr>
          </table>
          <p style="color: #888; font-size: 12px;">If you have any questions about this receipt, please contact support.</p>
        </div>
      `,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to send invoice email:', err);
    return false;
  }
}

export async function sendTrialExpirationReminder(toEmail: string, daysLeft: number, name?: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) return true;
  try {
    const { error } = await resend.emails.send({
      from: 'OurMenu OS <support@ourmenuos.online>',
      to: [toEmail],
      subject: `Your free trial expires in ${daysLeft} days`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #111; margin-top: 0;">Action Required</h1>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Hi ${name ? escapeHTML(name) : 'there'},<br/><br/>
            We hope you're enjoying OurMenu OS! Your free trial is ending in exactly <strong>${daysLeft} days</strong>.
          </p>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            To keep your digital storefront and dashboard active without interruption, please add a payment method and select a plan.
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 10px;">Select a Plan</a>
        </div>
      `,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to send trial reminder email:', err);
    return false;
  }
}
