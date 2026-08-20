import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const getTransporter = () => {
  if (env.EMAIL_HOST?.includes('gmail') || !env.EMAIL_HOST) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT || 587,
    secure: env.EMAIL_SECURE || false,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (toEmail, userName, resetToken) => {
  const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  // Log in terminal console for quick verification
  console.log(`\n========================================`);
  console.log(`📧 SENDING PASSWORD RESET EMAIL`);
  console.log(`👤 To: ${userName} <${toEmail}>`);
  console.log(`🔗 Link: ${resetLink}`);
  console.log(`========================================\n`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Reset Your Password</title>
    </head>
    <body style="margin:0;padding:0;background-color:#4A2C17;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#4A2C17;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.3);">
              <tr>
                <td style="background:#6F4E37;padding:36px 40px;text-align:center;">
                  <p style="margin:0 0 8px 0;font-size:28px;">&#9749;</p>
                  <h1 style="margin:0;color:#FAF3E0;font-size:26px;font-weight:800;">Cafe POS</h1>
                  <p style="margin:6px 0 0;color:#FAF3E0;opacity:0.7;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Point of Sale</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 40px 20px;">
                  <h2 style="margin:0 0 12px;color:#4A2C17;font-size:22px;font-weight:700;">Password Reset Request</h2>
                  <p style="margin:0 0 20px;color:#6B4C3B;font-size:15px;line-height:1.6;">
                    Hi <strong>${userName || 'there'}</strong>, we received a request to reset your Cafe POS account password.
                  </p>
                  <p style="margin:0 0 28px;color:#6B4C3B;font-size:15px;line-height:1.6;">
                    Click the button below. This link expires in <strong>1 hour</strong>.
                  </p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom:32px;">
                        <a href="${resetLink}" style="display:inline-block;background:#6F4E37;color:#FAF3E0;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:8px;">
                          Reset My Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px;color:#A89481;font-size:13px;">Or copy this link:</p>
                  <p style="margin:0 0 28px;word-break:break-all;">
                    <a href="${resetLink}" style="color:#6F4E37;font-size:13px;">${resetLink}</a>
                  </p>
                  <p style="margin:0;color:#A89481;font-size:13px;">If you did not request this, ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#FAF3E0;padding:20px 40px;text-align:center;border-top:1px solid #E8D5C4;">
                  <p style="margin:0;color:#A89481;font-size:12px;">&copy; ${new Date().getFullYear()} Cafe POS. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"Cafe POS" <${env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Reset Your Cafe POS Password',
      html,
    });
    console.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send email to ${toEmail}:`, err.message);
    throw err;
  }
};
