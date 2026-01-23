import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import {
  getContactSubjectLine,
  getContactSupportEmail,
  getContactConfirmationEmail,
  getPasswordResetEmail,
  getConfirmationEmail,
} from "./emailTemplates";

// AhaSend API configuration
const AHASEND_API_URL = "https://api.ahasend.com/v2";

interface AhaSendEmailOptions {
  from: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  html_content: string;
  reply_to?: { email: string; name?: string };
}

async function sendEmail(options: AhaSendEmailOptions): Promise<void> {
  const apiKey = process.env.AHASEND_API_KEY;
  const accountId = process.env.AHASEND_ACCOUNT_ID;

  if (!apiKey || !accountId) {
    throw new Error("AHASEND_API_KEY and AHASEND_ACCOUNT_ID environment variables are required");
  }

  const response = await fetch(`${AHASEND_API_URL}/accounts/${accountId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      from: options.from,
      recipients: options.to.map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
      })),
      subject: options.subject,
      html_content: options.html_content,
      ...(options.reply_to && { reply_to: options.reply_to }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AhaSend API error:", errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

// Send contact form email
export const sendContactEmail = action({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (_, args) => {
    const data = {
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
    };

    try {
      // Send to support team
      await sendEmail({
        from: { name: "Basketball Stats", email: "noreply@basketballstatsapp.com" },
        to: [{ email: "support@basketballstatsapp.com", name: "Support Team" }],
        reply_to: { email: args.email, name: args.name },
        subject: getContactSubjectLine(data),
        html_content: getContactSupportEmail(data),
      });

      // Send confirmation to user
      await sendEmail({
        from: { name: "Basketball Stats", email: "noreply@basketballstatsapp.com" },
        to: [{ email: args.email, name: args.name }],
        subject: "We received your message - Basketball Stats",
        html_content: getContactConfirmationEmail(data),
      });

      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email. Please try again later.");
    }
  },
});

// Send password reset email
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    resetToken: v.string(),
  },
  handler: async (_, args) => {
    try {
      await sendEmail({
        from: { name: "Basketball Stats", email: "noreply@basketballstatsapp.com" },
        to: [{ email: args.email }],
        subject: "Reset your password - Basketball Stats",
        html_content: getPasswordResetEmail({
          firstName: args.firstName,
          resetToken: args.resetToken,
        }),
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  },
});

// Send email confirmation
export const sendConfirmationEmail = action({
  args: {
    email: v.string(),
    firstName: v.string(),
    confirmationToken: v.string(),
  },
  handler: async (_, args) => {
    try {
      await sendEmail({
        from: { name: "Basketball Stats", email: "noreply@basketballstatsapp.com" },
        to: [{ email: args.email }],
        subject: "Confirm your email - Basketball Stats",
        html_content: getConfirmationEmail({
          firstName: args.firstName,
          confirmationToken: args.confirmationToken,
        }),
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      throw new Error("Failed to send confirmation email");
    }
  },
});

// ============================================
// Internal Actions (for use with scheduler)
// ============================================

// Internal: Send password reset email (called from scheduler)
export const internalSendPasswordResetEmail = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    resetToken: v.string(),
  },
  handler: async (_, args) => {
    try {
      await sendEmail({
        from: { name: "Basketball Stats", email: "noreply@basketballstatsapp.com" },
        to: [{ email: args.email }],
        subject: "Reset your password - Basketball Stats",
        html_content: getPasswordResetEmail({
          firstName: args.firstName,
          resetToken: args.resetToken,
        }),
      });
      console.log(`Password reset email sent to ${args.email}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // Don't throw - we don't want to fail the mutation if email fails
      return { success: false, error: String(error) };
    }
  },
});

// Internal: Send email confirmation (called from scheduler)
export const internalSendConfirmationEmail = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    confirmationToken: v.string(),
  },
  handler: async (_, args) => {
    try {
      await sendEmail({
        from: { name: "Basketball Stats", email: "noreply@basketballstatsapp.com" },
        to: [{ email: args.email }],
        subject: "Confirm your email - Basketball Stats",
        html_content: getConfirmationEmail({
          firstName: args.firstName,
          confirmationToken: args.confirmationToken,
        }),
      });
      console.log(`Confirmation email sent to ${args.email}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      // Don't throw - we don't want to fail the mutation if email fails
      return { success: false, error: String(error) };
    }
  },
});
