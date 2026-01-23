import { useState } from "react";
import SEOHead from "../../components/seo/SEOHead";
import {
  getContactSubjectLine,
  getContactSupportEmail,
  getContactConfirmationEmail,
  getPasswordResetEmail,
  getConfirmationEmail,
  type ContactEmailData,
  type PasswordResetEmailData,
  type ConfirmationEmailData,
} from "../../../../../convex/emailTemplates";

// Sample data for previews
const sampleContactData: ContactEmailData = {
  name: "John Smith",
  email: "john.smith@example.com",
  subject: "support",
  message:
    "Hi there,\n\nI'm having trouble accessing my team's statistics after the latest update. The page loads but the data doesn't appear.\n\nCan you help me troubleshoot this issue?\n\nThanks,\nJohn",
};

const samplePasswordResetData: PasswordResetEmailData = {
  firstName: "John",
  resetToken: "abc123def456",
};

const sampleConfirmationData: ConfirmationEmailData = {
  firstName: "John",
  confirmationToken: "xyz789ghi012",
};

type EmailTemplate =
  | "contactSupport"
  | "contactConfirmation"
  | "passwordReset"
  | "emailConfirmation";

const templates: { id: EmailTemplate; name: string; subject: string }[] = [
  {
    id: "contactSupport",
    name: "Contact Form (Support)",
    subject: getContactSubjectLine(sampleContactData),
  },
  {
    id: "contactConfirmation",
    name: "Contact Confirmation",
    subject: "We received your message - Basketball Stats",
  },
  {
    id: "passwordReset",
    name: "Password Reset",
    subject: "Reset your password - Basketball Stats",
  },
  {
    id: "emailConfirmation",
    name: "Email Confirmation",
    subject: "Confirm your email - Basketball Stats",
  },
];

function getEmailHtml(template: EmailTemplate): string {
  switch (template) {
    case "contactSupport":
      return getContactSupportEmail(sampleContactData);
    case "contactConfirmation":
      return getContactConfirmationEmail(sampleContactData);
    case "passwordReset":
      return getPasswordResetEmail(samplePasswordResetData);
    case "emailConfirmation":
      return getConfirmationEmail(sampleConfirmationData);
  }
}

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState<EmailTemplate>("contactSupport");
  const [width, setWidth] = useState<"desktop" | "mobile">("desktop");
  const [view, setView] = useState<"preview" | "source">("preview");

  // Only allow in development
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100 dark:bg-surface-900">
        <p className="text-surface-600 dark:text-surface-400">
          Email previews are only available in development mode.
        </p>
      </div>
    );
  }

  const html = getEmailHtml(selected);
  const currentTemplate = templates.find((t) => t.id === selected)!;

  return (
    <>
      <SEOHead title="Email Preview" robots="noindex, nofollow" />

      <div className="min-h-screen bg-surface-100 dark:bg-surface-900 p-6">
        {/* Controls */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center gap-4">
          {/* Template selector */}
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as EmailTemplate)}
            className="px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-white text-sm"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Width toggle */}
          <div className="flex bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setWidth("desktop")}
              className={`px-3 py-2 text-sm ${
                width === "desktop"
                  ? "bg-primary-500 text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setWidth("mobile")}
              className={`px-3 py-2 text-sm ${
                width === "mobile"
                  ? "bg-primary-500 text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              Mobile
            </button>
          </div>

          {/* View toggle */}
          <div className="flex bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("preview")}
              className={`px-3 py-2 text-sm ${
                view === "preview"
                  ? "bg-primary-500 text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setView("source")}
              className={`px-3 py-2 text-sm ${
                view === "source"
                  ? "bg-primary-500 text-white"
                  : "text-surface-600 dark:text-surface-400"
              }`}
            >
              Source
            </button>
          </div>

          {/* Copy button */}
          <button
            onClick={() => navigator.clipboard.writeText(html)}
            className="px-3 py-2 text-sm bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
          >
            Copy HTML
          </button>
        </div>

        {/* Preview area */}
        <div className="flex justify-center">
          <div
            className={`transition-all duration-200 ${
              width === "mobile" ? "w-[375px]" : "w-full max-w-4xl"
            }`}
          >
            {view === "preview" ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Email header mock */}
                <div className="bg-surface-100 px-4 py-3 border-b border-surface-200">
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="text-xs text-surface-500 space-y-0.5">
                    <div>
                      <span className="font-medium">From:</span> Basketball Stats
                      &lt;noreply@basketballstatsapp.com&gt;
                    </div>
                    <div>
                      <span className="font-medium">Subject:</span> {currentTemplate.subject}
                    </div>
                  </div>
                </div>

                {/* Email content */}
                <iframe
                  srcDoc={html}
                  title="Email preview"
                  className="w-full border-0"
                  style={{ height: "700px" }}
                />
              </div>
            ) : (
              <pre className="bg-surface-900 text-surface-300 p-4 rounded-xl overflow-x-auto text-sm">
                <code>{html}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
