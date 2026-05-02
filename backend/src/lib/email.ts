import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const BRAND_PRIMARY = '#0555f1';
const BRAND_FOREGROUND = '#13274d';
const BRAND_MUTED = '#5c6b87';
const BRAND_SOFT_BG = '#f7f8fa';
const BRAND_BORDER = '#e6e9f0';

const getBaseUrl = () => process.env.FRONTEND_URL || 'https://billgenics.com';

const getEmailHeader = () => `
  <tr>
    <td style="padding: 0; background-color: ${BRAND_PRIMARY}; border-radius: 20px 20px 0 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <a href="${getBaseUrl()}" style="text-decoration: none;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                <span style="display: inline-block; width: 38px; height: 38px; background-color: rgba(255,255,255,0.18); border-radius: 10px; text-align: center; line-height: 38px; font-size: 20px; margin-right: 10px; vertical-align: middle; font-weight: 700;">B</span>
                BillGenics
              </h1>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const getEmailFooter = () => `
  <tr>
    <td style="padding: 28px 40px; background-color: ${BRAND_SOFT_BG}; border-radius: 0 0 20px 20px; border-top: 1px solid ${BRAND_BORDER};">
      <p style="margin: 0 0 8px 0; color: ${BRAND_MUTED}; font-size: 13px; line-height: 1.6;">
        Questions? Reach the BillGenics team at <a href="mailto:support@billgenics.com" style="color: ${BRAND_PRIMARY}; text-decoration: none;">support@billgenics.com</a>
      </p>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} BillGenics — smart receipt scanning & bill splitting.
      </p>
    </td>
  </tr>
`;

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" style="border-collapse: collapse;">
      <tr>
        <td style="border-radius: 9999px; background-color: ${BRAND_PRIMARY};">
          <a href="${href}" style="display: inline-block; padding: 14px 44px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 9999px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function linkFallback(href: string): string {
  return `
    <p style="margin: 0 0 12px 0; color: ${BRAND_MUTED}; font-size: 13px; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0; padding: 12px; background-color: ${BRAND_SOFT_BG}; border-radius: 8px; word-break: break-all; border: 1px solid ${BRAND_BORDER};">
      <a href="${href}" style="color: ${BRAND_PRIMARY}; text-decoration: none; font-size: 13px;">
        ${href}
      </a>
    </p>
  `;
}

function wrap(title: string, bodyRows: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_SOFT_BG};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(5, 85, 241, 0.08);">
          ${getEmailHeader()}
          ${bodyRows}
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'BillGenics'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export function generateVerificationEmail(
  name: string,
  verificationLink: string,
  expiresInHours: number = 24
): string {
  const body = `
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 16px 0; color: ${BRAND_FOREGROUND}; font-size: 24px; font-weight: 700;">
          Welcome to BillGenics, ${name}!
        </h2>
        <p style="margin: 0 0 24px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          You're one click away from scanning receipts, tracking bills, and splitting expenses with friends. Verify your email to activate your account.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 40px 40px 40px;">
        ${ctaButton(verificationLink, 'Verify Email Address')}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${linkFallback(verificationLink)}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px 40px;">
        <div style="padding: 14px 16px; background-color: ${BRAND_SOFT_BG}; border-left: 3px solid ${BRAND_PRIMARY}; border-radius: 8px;">
          <p style="margin: 0; color: ${BRAND_FOREGROUND}; font-size: 13px; line-height: 1.6;">
            This verification link expires in ${expiresInHours} hours. If you didn't create a BillGenics account, you can safely ignore this email.
          </p>
        </div>
      </td>
    </tr>
  `;
  return wrap('Verify Your BillGenics Email', body);
}

export function generatePasswordResetEmail(name: string, resetLink: string, expiresInMinutes: number = 60): string {
  const body = `
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 16px 0; color: ${BRAND_FOREGROUND}; font-size: 24px; font-weight: 700;">
          Reset your BillGenics password
        </h2>
        <p style="margin: 0 0 24px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          Hi ${name}, we received a request to reset your BillGenics password. Click below to pick a new one.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 40px 40px 40px;">
        ${ctaButton(resetLink, 'Reset Password')}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${linkFallback(resetLink)}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px 40px;">
        <div style="padding: 14px 16px; background-color: #fff5f5; border-left: 3px solid #dc2626; border-radius: 8px;">
          <p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.6;">
            This link expires in ${expiresInMinutes} minutes. If you didn't request a password reset, ignore this email — your account stays secure.
          </p>
        </div>
      </td>
    </tr>
  `;
  return wrap('Reset Your BillGenics Password', body);
}

export function generateEventInviteEmail(
  recipientName: string,
  invitedByName: string,
  eventName: string,
  acceptLink: string
): string {
  const body = `
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 16px 0; color: ${BRAND_FOREGROUND}; font-size: 24px; font-weight: 700;">
          You're invited to split bills with friends
        </h2>
        <p style="margin: 0 0 20px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          Hi ${recipientName}, <strong style="color: ${BRAND_FOREGROUND};">${invitedByName}</strong> added you to the BillGenics group "<strong style="color: ${BRAND_FOREGROUND};">${eventName}</strong>".
        </p>
        <p style="margin: 0 0 24px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          Jump in to add shared expenses, track who paid what, and settle up in a tap.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 40px 40px 40px;">
        ${ctaButton(acceptLink, 'Open Group')}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px 40px;">
        ${linkFallback(acceptLink)}
      </td>
    </tr>
  `;
  return wrap(`Invitation to "${eventName}" on BillGenics`, body);
}

export function generateEventInviteNewUserEmail(
  email: string,
  invitedByName: string,
  eventName: string,
  completeAccountLink: string
): string {
  const body = `
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 16px 0; color: ${BRAND_FOREGROUND}; font-size: 24px; font-weight: 700;">
          Welcome to BillGenics
        </h2>
        <p style="margin: 0 0 20px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          <strong style="color: ${BRAND_FOREGROUND};">${invitedByName}</strong> invited you to the BillGenics group "<strong style="color: ${BRAND_FOREGROUND};">${eventName}</strong>" — a shared space to track and split bills with the people you spend with.
        </p>
        <p style="margin: 0 0 24px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          Finish setting up your free BillGenics account to view the group, scan receipts, and settle up easily.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 40px 40px 40px;">
        ${ctaButton(completeAccountLink, 'Finish Account Setup')}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 24px 40px;">
        ${linkFallback(completeAccountLink)}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px 40px;">
        <div style="padding: 14px 16px; background-color: ${BRAND_SOFT_BG}; border-left: 3px solid ${BRAND_PRIMARY}; border-radius: 8px;">
          <p style="margin: 0; color: ${BRAND_FOREGROUND}; font-size: 13px; line-height: 1.6;">
            This invitation expires in 7 days. Your BillGenics account will be linked to <strong>${email}</strong>.
          </p>
        </div>
      </td>
    </tr>
  `;
  return wrap(`Join "${eventName}" on BillGenics`, body);
}

export function generateSettlementNotificationEmail(
  recipientName: string,
  settledByName: string,
  amount: number,
  eventName: string,
  eventLink: string
): string {
  const body = `
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 16px 0; color: ${BRAND_FOREGROUND}; font-size: 24px; font-weight: 700;">
          You've been paid back on BillGenics
        </h2>
        <p style="margin: 0 0 24px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          Hi ${recipientName}, <strong style="color: ${BRAND_FOREGROUND};">${settledByName}</strong> marked a settlement of <strong style="color: ${BRAND_PRIMARY};">$${amount.toFixed(2)}</strong> in the group "<strong style="color: ${BRAND_FOREGROUND};">${eventName}</strong>".
        </p>
        <p style="margin: 0 0 24px 0; color: ${BRAND_MUTED}; font-size: 15px; line-height: 1.6;">
          Open the group to review the updated balances.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0 40px 40px 40px;">
        ${ctaButton(eventLink, 'View Group')}
      </td>
    </tr>
  `;
  return wrap(`Settlement recorded in "${eventName}"`, body);
}

