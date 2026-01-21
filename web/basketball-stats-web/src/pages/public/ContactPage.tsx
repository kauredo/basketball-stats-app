import { useState } from "react";
import SEOHead from "../../components/seo/SEOHead";
import Icon from "../../components/Icon";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to a backend
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Get in touch with the Basketball Stats team. We're here to help with questions, feedback, or support requests."
      />

      <section className="bg-white dark:bg-surface-900 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Have a question or feedback? We&apos;d love to hear from you.
            </p>
          </div>

          {isSubmitted ? (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                Message Sent!
              </h2>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: "", email: "", subject: "", message: "" });
                }}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8">
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
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="billing">Billing Question</option>
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
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Send Message
                  <Icon name="arrow-right" size={20} className="ml-2" />
                </button>
              </form>
            </div>
          )}

          {/* Alternative contact info */}
          <div className="mt-12 text-center">
            <p className="text-surface-600 dark:text-surface-400">
              You can also reach us directly at{" "}
              <a
                href="mailto:support@basketballstats.app"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                support@basketballstats.app
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
