// Email templates - shared between email sending (email.ts) and preview (EmailPreviewPage.tsx)

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PasswordResetEmailData {
  firstName: string;
  resetToken: string;
}

export interface ConfirmationEmailData {
  firstName: string;
  confirmationToken: string;
}

const subjectMap: Record<string, string> = {
  general: "General Inquiry",
  support: "Technical Support",
  feedback: "Feedback",
  partnership: "Partnership Opportunity",
};

// Design tokens - matching app's warm neutral palette
const colors = {
  // Primary
  orange500: "#F97316",
  orange600: "#ea580c",
  orange50: "#fff8f3",
  // Warm neutrals (not cold grays)
  surface950: "#1a1816",
  surface800: "#3d3835",
  surface600: "#7a746c",
  surface500: "#a69f96",
  surface400: "#d4cdc5",
  surface300: "#e8e4df",
  surface200: "#f3f0ed",
  surface100: "#f9f7f5",
  surface50: "#fdfcfb",
  // Court green for accent
  courtGreen: "#1a472a",
};

// Logo URL - hosted on the live site for email compatibility
const logoUrl = "https://www.basketballstatsapp.com/assets/logo.png";

// Reusable email header
function emailHeader(): string {
  return `
    <div style="padding: 32px 24px 24px; text-align: center; border-bottom: 1px solid ${colors.surface200};">
      <img src="${logoUrl}" alt="Basketball Stats" height="64" style="display: inline-block;" />
    </div>
  `;
}

// Reusable email footer
function emailFooter(): string {
  return `
    <div style="padding: 24px; background: ${colors.surface100}; border-top: 1px solid ${colors.surface200};">
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="https://basketballstatsapp.com" style="color: ${colors.orange500}; text-decoration: none; font-weight: 600; font-size: 14px;">Visit Website</a>
        <span style="color: ${colors.surface400}; margin: 0 12px;">·</span>
        <a href="https://basketballstatsapp.com/faq" style="color: ${colors.orange500}; text-decoration: none; font-weight: 600; font-size: 14px;">FAQ</a>
        <span style="color: ${colors.surface400}; margin: 0 12px;">·</span>
        <a href="https://basketballstatsapp.com/contact" style="color: ${colors.orange500}; text-decoration: none; font-weight: 600; font-size: 14px;">Contact</a>
      </div>
      <p style="margin: 0; text-align: center; font-size: 12px; color: ${colors.surface500}; line-height: 1.6;">
        Basketball Stats - Track &amp; Analyze Your Games<br />
        © ${new Date().getFullYear()} Basketball Stats. All rights reserved.
      </p>
    </div>
  `;
}

// Base email wrapper with consistent styling
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Basketball Stats</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.surface100}; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${colors.surface50}; border-radius: 12px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.06);">
    ${emailHeader()}
    <div style="padding: 32px 24px;">
      ${content}
    </div>
    ${emailFooter()}
  </div>
</body>
</html>
  `.trim();
}

// Primary button style
function primaryButton(text: string, href: string): string {
  return `
    <a href="${href}" style="display: inline-block; background: ${colors.orange500}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background 0.2s;">
      ${text}
    </a>
  `;
}

// Info box style
function infoBox(content: string): string {
  return `
    <div style="background: ${colors.surface100}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.orange500};">
      ${content}
    </div>
  `;
}

export function getContactSubjectLine(data: ContactEmailData): string {
  return `[Basketball Stats] ${subjectMap[data.subject] || data.subject}: ${data.name}`;
}

export function getContactSupportEmail(data: ContactEmailData): string {
  const content = `
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${colors.surface950};">
      New Contact Form Submission
    </h1>
    <p style="margin: 0 0 24px; color: ${colors.surface600}; font-size: 15px;">
      A user has submitted the contact form on the website.
    </p>

    ${infoBox(`
      <p style="margin: 0 0 12px; font-size: 14px;">
        <strong style="color: ${colors.surface800};">From:</strong>
        <span style="color: ${colors.surface600}; margin-left: 8px;">${data.name}</span>
      </p>
      <p style="margin: 0 0 12px; font-size: 14px;">
        <strong style="color: ${colors.surface800};">Email:</strong>
        <a href="mailto:${data.email}" style="color: ${colors.orange500}; text-decoration: none; margin-left: 8px;">${data.email}</a>
      </p>
      <p style="margin: 0; font-size: 14px;">
        <strong style="color: ${colors.surface800};">Category:</strong>
        <span style="color: ${colors.surface600}; margin-left: 8px;">${subjectMap[data.subject] || data.subject}</span>
      </p>
    `)}

    <h2 style="margin: 28px 0 12px; font-size: 16px; font-weight: 600; color: ${colors.surface800};">
      Message
    </h2>
    <div style="background: white; padding: 20px; border: 1px solid ${colors.surface200}; border-radius: 8px;">
      <p style="margin: 0; color: ${colors.surface600}; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${data.message}</p>
    </div>

    <div style="text-align: center; margin-top: 28px;">
      ${primaryButton("Reply to User", `mailto:${data.email}`)}
    </div>
  `;

  return emailWrapper(content);
}

export function getContactConfirmationEmail(data: ContactEmailData): string {
  const content = `
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${colors.surface950};">
      Thanks for reaching out!
    </h1>
    <p style="margin: 0 0 24px; color: ${colors.surface600}; font-size: 15px;">
      We've received your message and appreciate you taking the time to contact us.
    </p>

    <p style="margin: 0 0 16px; color: ${colors.surface800}; font-size: 15px; line-height: 1.6;">
      Hi ${data.name},
    </p>
    <p style="margin: 0 0 24px; color: ${colors.surface600}; font-size: 15px; line-height: 1.6;">
      We'll review your message and get back to you within 24-48 hours. In the meantime, here's a copy of what you sent:
    </p>

    ${infoBox(`
      <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.surface500}; font-weight: 600;">
        Your Message
      </p>
      <p style="margin: 0; color: ${colors.surface600}; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${data.message}</p>
    `)}

    <p style="margin: 24px 0 0; color: ${colors.surface600}; font-size: 14px; line-height: 1.6;">
      While you wait, you might find answers to common questions in our
      <a href="https://basketballstatsapp.com/faq" style="color: ${colors.orange500}; text-decoration: none; font-weight: 600;">FAQ section</a>.
    </p>

    <p style="margin: 28px 0 0; color: ${colors.surface800}; font-size: 15px; line-height: 1.6;">
      Best regards,<br />
      <strong>The Basketball Stats Team</strong>
    </p>
  `;

  return emailWrapper(content);
}

export function getPasswordResetEmail(data: PasswordResetEmailData): string {
  const resetUrl = `https://basketballstatsapp.com/reset-password?token=${data.resetToken}`;

  const content = `
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${colors.surface950};">
      Reset Your Password
    </h1>
    <p style="margin: 0 0 24px; color: ${colors.surface600}; font-size: 15px;">
      We received a request to reset your password.
    </p>

    <p style="margin: 0 0 24px; color: ${colors.surface800}; font-size: 15px; line-height: 1.6;">
      Hi ${data.firstName},
    </p>
    <p style="margin: 0 0 28px; color: ${colors.surface600}; font-size: 15px; line-height: 1.6;">
      Click the button below to create a new password. This link will expire in <strong style="color: ${colors.surface800};">1 hour</strong> for security reasons.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${primaryButton("Reset Password", resetUrl)}
    </div>

    ${infoBox(`
      <p style="margin: 0; font-size: 13px; color: ${colors.surface600}; line-height: 1.6;">
        <strong style="color: ${colors.surface800};">Didn't request this?</strong><br />
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `)}

    <p style="margin: 24px 0 0; font-size: 12px; color: ${colors.surface500}; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${resetUrl}" style="color: ${colors.orange500}; text-decoration: none; word-break: break-all;">${resetUrl}</a>
    </p>
  `;

  return emailWrapper(content);
}

export function getConfirmationEmail(data: ConfirmationEmailData): string {
  const confirmUrl = `https://basketballstatsapp.com/confirm-email?token=${data.confirmationToken}`;

  const content = `
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${colors.surface950};">
      Welcome to Basketball Stats!
    </h1>
    <p style="margin: 0 0 24px; color: ${colors.surface600}; font-size: 15px;">
      You're one step away from tracking your games like a pro.
    </p>

    <p style="margin: 0 0 24px; color: ${colors.surface800}; font-size: 15px; line-height: 1.6;">
      Hi ${data.firstName},
    </p>
    <p style="margin: 0 0 28px; color: ${colors.surface600}; font-size: 15px; line-height: 1.6;">
      Thanks for signing up! Please confirm your email address to get started.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${primaryButton("Confirm Email", confirmUrl)}
    </div>

    <div style="background: ${colors.surface100}; padding: 20px; border-radius: 8px; margin: 28px 0;">
      <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: ${colors.surface800};">
        Once confirmed, you'll be able to:
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.surface600};">
            <span style="color: ${colors.orange500}; margin-right: 8px;">&#10003;</span>
            Track live game statistics in real-time
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.surface600};">
            <span style="color: ${colors.orange500}; margin-right: 8px;">&#10003;</span>
            Manage your teams and player rosters
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.surface600};">
            <span style="color: ${colors.orange500}; margin-right: 8px;">&#10003;</span>
            Analyze performance with interactive shot charts
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.surface600};">
            <span style="color: ${colors.orange500}; margin-right: 8px;">&#10003;</span>
            Compare players across your league
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0; font-size: 12px; color: ${colors.surface500}; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${confirmUrl}" style="color: ${colors.orange500}; text-decoration: none; word-break: break-all;">${confirmUrl}</a>
    </p>
  `;

  return emailWrapper(content);
}
