/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO: Developer bypassed types/rules. Requires refactoring for true perfection.
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification(toEmail: string, subject: string, message: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production environment');
    }
    console.warn(`RESEND_API_KEY missing. Mocking email to ${toEmail}: ${subject}`);
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'OurMenu Notifications <notifications@ourmenuos.online>',
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5; white-space: pre-line;">${message}</p>
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
          <h1 style="color: #111; margin-top: 0;">Welcome aboard${name ? `, ${name}` : ''}! 🎉</h1>
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
