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
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:560px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="padding:32px 36px 20px 36px;border-bottom:1px solid #1e1e24;">
                      <h2 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${escapeHTML(subject)}</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 36px;">
                      <p style="margin:0;font-size:15px;line-height:1.6;color:#d4d4d8;white-space:pre-line;">${escapeHTML(message)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#52525b;">This is an automated operational notification from WETAEGO.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online';

  try {
    const { error } = await resend.emails.send({
      from: 'WETAEGO <welcome@ourmenuos.online>',
      to: [toEmail],
      subject: 'Welcome to WETAEGO! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:560px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="padding:36px 36px 20px 36px;text-align:center;border-bottom:1px solid #1e1e24;">
                      <div style="display:inline-block;padding:10px;border-radius:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);margin-bottom:16px;">
                        <span style="font-size:24px;">🚀</span>
                      </div>
                      <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Welcome aboard${name ? `, ${escapeHTML(name)}` : ''}!</h1>
                      <p style="margin:6px 0 0 0;font-size:13px;color:#71717a;">Your Digital Storefront & Operating System is Ready</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e4e4e7;">
                        We're thrilled to have you join WETAEGO. You now have complete autonomy over your QR menus, booking schedules, live order dispatch, and payment collections without middleman commissions.
                      </p>
                      
                      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin:24px 0;">
                        <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.05em;">3-Step Quick Launch:</p>
                        <ol style="margin:0;padding-left:20px;font-size:14px;color:#d4d4d8;line-height:1.8;">
                          <li><strong>Create your first page</strong> (Restaurant Menu, Salon Booking, or Retail Catalog).</li>
                          <li><strong>Set your payout details</strong> under Profile or Location settings.</li>
                          <li><strong>Print your branded QR codes</strong> directly from your dashboard.</li>
                        </ol>
                      </div>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${siteUrl}/dashboard" style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px 0 rgba(16,185,129,0.39);">
                              Launch Your First Storefront →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
                        Need assistance? Simply reply to this email or chat with our Tego AI Copilot inside your dashboard.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} WETAEGO. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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

export async function sendPasswordResetEmail(toEmail: string, resetLink: string, name?: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production environment');
    }
    console.warn(`RESEND_API_KEY missing. Mocking Password Reset email to ${toEmail}: ${resetLink}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'WETAEGO Security <security@ourmenuos.online>',
      to: [toEmail],
      subject: 'Reset Your WETAEGO Password 🔐',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:560px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="padding:36px 36px 20px 36px;text-align:center;border-bottom:1px solid #1e1e24;">
                      <div style="display:inline-block;padding:10px;border-radius:12px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);margin-bottom:16px;">
                        <span style="font-size:24px;">🔐</span>
                      </div>
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Password Reset Request</h1>
                      <p style="margin:6px 0 0 0;font-size:13px;color:#71717a;">WETAEGO Security & Identity</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e4e4e7;">
                        Hi ${name ? escapeHTML(name) : 'there'},
                      </p>
                      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                        We received a request to reset the password associated with your account (<strong style="color:#ffffff;">${escapeHTML(toEmail)}</strong>). Click the secure button below to choose a new password:
                      </p>
                      
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px 0 rgba(37,99,235,0.39);">
                              Reset Password →
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px;margin:24px 0 0 0;">
                        <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">
                          Security Notice:
                        </p>
                        <ul style="margin:0;padding-left:18px;font-size:13px;color:#a1a1aa;line-height:1.5;">
                          <li>This link is single-use and expires in <strong>1 hour</strong>.</li>
                          <li>If you did not make this request, your account remains secure and you can ignore this email.</li>
                        </ul>
                      </div>

                      <p style="margin:24px 0 0 0;font-size:12px;color:#71717a;line-height:1.5;word-break:break-all;">
                        Button not working? Copy and paste this URL directly into your browser:<br/>
                        <a href="${resetLink}" style="color:#3b82f6;text-decoration:underline;">${resetLink}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#52525b;">
                        © ${new Date().getFullYear()} WETAEGO. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email via Resend:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    return false;
  }
}

export async function sendSubscriptionActivated(toEmail: string, planName: string, name?: string) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online';

  try {
    const { error } = await resend.emails.send({
      from: 'WETAEGO Billing <billing@ourmenuos.online>',
      to: [toEmail],
      subject: 'Your Subscription is Active! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:560px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="padding:36px 36px 20px 36px;text-align:center;border-bottom:1px solid #1e1e24;">
                      <div style="display:inline-block;padding:10px;border-radius:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);margin-bottom:16px;">
                        <span style="font-size:24px;">⚡</span>
                      </div>
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Subscription Activated</h1>
                      <p style="margin:6px 0 0 0;font-size:13px;color:#71717a;">WETAEGO Pro Platform</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e4e4e7;">
                        Hi ${name ? escapeHTML(name) : 'there'},
                      </p>
                      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                        Your <strong>${escapeHTML(planName)}</strong> tier has been activated successfully! All pro features, AI tools, and higher throughput limits are now unlocked on your workspace.
                      </p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${siteUrl}/dashboard" style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                              Go to Dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} WETAEGO. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
      from: 'WETAEGO Billing <billing@ourmenuos.online>',
      to: [toEmail],
      subject: 'Payment Receipt - WETAEGO 🧾',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:560px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="padding:36px 36px 20px 36px;text-align:center;border-bottom:1px solid #1e1e24;">
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Payment Receipt</h1>
                      <p style="margin:6px 0 0 0;font-size:13px;color:#71717a;">Transaction Ref: ${escapeHTML(reference)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 36px;">
                      <table style="width:100%;border-collapse:collapse;margin:10px 0 20px 0;">
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;">Plan / Service</td>
                          <td style="padding:12px 0;border-bottom:1px solid #27272a;text-align:right;font-weight:600;color:#ffffff;font-size:14px;">${escapeHTML(planName)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;">Total Paid</td>
                          <td style="padding:12px 0;border-bottom:1px solid #27272a;text-align:right;font-weight:700;color:#10b981;font-size:16px;">${escapeHTML(amount)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;">Status</td>
                          <td style="padding:12px 0;border-bottom:1px solid #27272a;text-align:right;color:#10b981;font-weight:600;font-size:14px;">Paid & Confirmed</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} WETAEGO. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online';

  try {
    const { error } = await resend.emails.send({
      from: 'WETAEGO <support@ourmenuos.online>',
      to: [toEmail],
      subject: `Your free trial expires in ${daysLeft} days ⏳`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:560px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="padding:36px 36px 20px 36px;text-align:center;border-bottom:1px solid #1e1e24;">
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Trial Ending Soon</h1>
                      <p style="margin:6px 0 0 0;font-size:13px;color:#f59e0b;">${daysLeft} days remaining</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e4e4e7;">
                        Hi ${name ? escapeHTML(name) : 'there'},
                      </p>
                      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                        We hope you're enjoying WETAEGO. Your trial period is ending in exactly <strong>${daysLeft} days</strong>. Choose a plan to ensure continuous live orders and customer checkout.
                      </p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${siteUrl}/dashboard/billing" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                              Select a Plan →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} WETAEGO. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to send trial reminder email:', err);
    return false;
  }
}

export async function sendMarketingBroadcastEmail({
  toEmail,
  businessName,
  logoUrl,
  subject,
  message,
  locationSlug,
}: {
  toEmail: string;
  businessName: string;
  logoUrl?: string | null;
  subject: string;
  message: string;
  locationSlug?: string | null;
}) {
  if (!(await isEmailEnabled())) return true;
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production environment');
    }
    console.warn(`RESEND_API_KEY missing. Mocking Marketing Broadcast to ${toEmail}: ${subject}`);
    return true;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online';
  const storeUrl = locationSlug ? `${siteUrl}/m/${locationSlug}` : siteUrl;

  try {
    const { error } = await resend.emails.send({
      from: `${businessName.replace(/["<>\r\n]/g, '')} via OurMenu <marketing@ourmenuos.online>`,
      to: [toEmail],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHTML(subject)}</title>
        </head>
        <body style="margin:0;padding:0;background-color:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#d4d4d8;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050505;padding:40px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width:580px;background-color:#121214;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                  <!-- Merchant Header -->
                  <tr>
                    <td style="padding:32px 36px 24px 36px;border-bottom:1px solid #1e1e24;text-align:center;">
                      ${logoUrl ? `<img src="${escapeHTML(logoUrl)}" alt="${escapeHTML(businessName)}" style="max-height:48px;max-width:180px;margin-bottom:12px;object-fit:contain;" />` : ''}
                      <h2 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">${escapeHTML(businessName)}</h2>
                    </td>
                  </tr>
                  <!-- Content Body -->
                  <tr>
                    <td style="padding:32px 36px;">
                      <div style="font-size:15px;line-height:1.7;color:#e4e4e7;white-space:pre-wrap;">${escapeHTML(message)}</div>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:32px 0 16px 0;">
                        <tr>
                          <td align="center">
                            <a href="${storeUrl}" style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px 0 rgba(16,185,129,0.39);">
                              Visit Storefront →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Compliance & Consent Footer -->
                  <tr>
                    <td style="padding:24px 36px;background-color:#0c0c0e;border-top:1px solid #1e1e24;text-align:center;">
                      <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;line-height:1.5;">
                        You received this email because you opted into updates and special offers when placing an order or registering at <strong style="color:#a1a1aa;">${escapeHTML(businessName)}</strong>.
                      </p>
                      <p style="margin:0;font-size:11px;color:#52525b;">
                        Powered by WETAEGO • Privacy Protected under NDPR & GDPR
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send marketing broadcast email via Resend:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send marketing broadcast email:', err);
    return false;
  }
}
