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

const getBaseUrl = () => process.env.FRONTEND_URL || 'https://billgenics.com';

const getEmailHeader = () => `
  <tr>
    <td style="padding: 0; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <img src="${getBaseUrl()}/images/billgenics.png" alt="BillGenics" style="height: 180px; width: auto;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const getEmailFooter = () => `
  <tr>
    <td style="padding: 32px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
        Need help? Contact us at <a href="mailto:support@billgenics.com" style="color: #6366f1; text-decoration: none;">support@billgenics.com</a>
      </p>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} BillGenics. All rights reserved.
      </p>
    </td>
  </tr>
`;

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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${getEmailHeader()}
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: bold;">
                Welcome to BillGenics, ${name}!
              </h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                Thank you for signing up! To get started, please verify your email address by clicking the button below.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 9999px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f1f5f9; border-radius: 8px; word-break: break-all;">
                <a href="${verificationLink}" style="color: #6366f1; text-decoration: none; font-size: 14px;">
                  ${verificationLink}
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  This verification link will expire in ${expiresInHours} hours. If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generatePasswordResetEmail(name: string, resetLink: string, expiresInMinutes: number = 60): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${getEmailHeader()}
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: bold;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 9999px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f1f5f9; border-radius: 8px; word-break: break-all;">
                <a href="${resetLink}" style="color: #6366f1; text-decoration: none; font-size: 14px;">
                  ${resetLink}
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="padding: 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  This link will expire in ${expiresInMinutes} minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateEventInviteEmail(
  recipientName: string,
  invitedByName: string,
  eventName: string,
  acceptLink: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited to an Event</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${getEmailHeader()}
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: bold;">
                You've Been Invited!
              </h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName}, <strong>${invitedByName}</strong> has invited you to join the expense group "<strong>${eventName}</strong>" on BillGenics.
              </p>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                Join the group to track shared expenses and split bills easily.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                    <a href="${acceptLink}" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 9999px;">
                      View Event
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f1f5f9; border-radius: 8px; word-break: break-all;">
                <a href="${acceptLink}" style="color: #6366f1; text-decoration: none; font-size: 14px;">
                  ${acceptLink}
                </a>
              </p>
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateEventInviteNewUserEmail(
  email: string,
  invitedByName: string,
  eventName: string,
  completeAccountLink: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited to BillGenics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${getEmailHeader()}
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: bold;">
                You've Been Invited!
              </h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                <strong>${invitedByName}</strong> has invited you to join the expense group "<strong>${eventName}</strong>" on BillGenics.
              </p>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                Complete your account setup to start tracking and splitting expenses with your group.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                    <a href="${completeAccountLink}" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 9999px;">
                      Complete Account Setup
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px; background-color: #f1f5f9; border-radius: 8px; word-break: break-all;">
                <a href="${completeAccountLink}" style="color: #6366f1; text-decoration: none; font-size: 14px;">
                  ${completeAccountLink}
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  This invitation link will expire in 7 days. Your account will be linked to ${email}.
                </p>
              </div>
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateSettlementNotificationEmail(
  recipientName: string,
  settledByName: string,
  amount: number,
  eventName: string,
  eventLink: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settlement Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${getEmailHeader()}
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: bold;">
                Settlement Recorded
              </h2>
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName}, <strong>${settledByName}</strong> has marked a settlement of <strong>$${amount.toFixed(2)}</strong> in the event "<strong>${eventName}</strong>".
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 9999px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                    <a href="${eventLink}" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 9999px;">
                      View Event
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
