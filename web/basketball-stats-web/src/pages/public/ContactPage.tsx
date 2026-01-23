import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import SEOHead from "../../components/seo/SEOHead";
import Icon from "../../components/Icon";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const sendContactEmail = useAction(api.email.sendContactEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      await sendContactEmail({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to send message. Please try again."
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleReset = () => {
    setStatus("idle");
    setErrorMessage("");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Get in touch with the Basketball Stats team. We're here to help with questions, feedback, or support requests."
        keywords="contact basketball stats, support, help, feedback, customer service"
        canonicalUrl="https://basketballstatsapp.com/contact"
      />

      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Have a question or feedback? We'd love to hear from you.
            </p>
          </div>

          {status === "success" ? (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                Message Sent!
              </h2>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                Thank you for reaching out. We've sent a confirmation to your email and will get
                back to you as soon as possible.
              </p>
              <button
                onClick={handleReset}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8">
              {status === "error" && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      disabled={status === "submitting"}
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      disabled={status === "submitting"}
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    disabled={status === "submitting"}
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership Opportunity</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    disabled={status === "submitting"}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Icon name="arrow-right" size={20} className="ml-2" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Alternative contact info */}
          <div className="mt-12 text-center">
            <p className="text-surface-600 dark:text-surface-400">
              You can also reach us directly at{" "}
              <a
                href="mailto:support@basketballstatsapp.com"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                support@basketballstatsapp.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
