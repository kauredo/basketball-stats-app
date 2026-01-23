import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../Logo";
import Icon from "../Icon";
import { useTheme } from "../../contexts/ThemeContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { mode, setMode } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo variant="auto" size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "text-primary-600"
                    : "text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle + Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Theme Toggle */}
            <div className="flex items-center space-x-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
              <button
                onClick={() => setMode("light")}
                className={`p-1.5 rounded-md transition-colors ${
                  mode === "light"
                    ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                }`}
                aria-label="Light mode"
                aria-pressed={mode === "light"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setMode("system")}
                className={`p-1.5 rounded-md transition-colors ${
                  mode === "system"
                    ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                }`}
                aria-label="System preference"
                aria-pressed={mode === "system"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setMode("dark")}
                className={`p-1.5 rounded-md transition-colors ${
                  mode === "dark"
                    ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                }`}
                aria-label="Dark mode"
                aria-pressed={mode === "dark"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </button>
            </div>

            <Link
              to="/login"
              className="text-sm font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <Icon name={mobileMenuOpen ? "x" : "menu"} size={24} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-surface-200 dark:border-surface-800">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-base font-medium ${
                    location.pathname === link.href
                      ? "text-primary-600"
                      : "text-surface-700 dark:text-surface-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-surface-200 dark:border-surface-700" />

              {/* Mobile Theme Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-surface-500 dark:text-surface-400">Theme:</span>
                <div
                  className="flex items-center space-x-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-1"
                  role="group"
                  aria-label="Theme selection"
                >
                  <button
                    onClick={() => setMode("light")}
                    className={`p-1.5 rounded-md transition-colors ${
                      mode === "light"
                        ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                        : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    }`}
                    aria-label="Light mode"
                    aria-pressed={mode === "light"}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMode("system")}
                    className={`p-1.5 rounded-md transition-colors ${
                      mode === "system"
                        ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                        : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    }`}
                    aria-label="System preference"
                    aria-pressed={mode === "system"}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMode("dark")}
                    className={`p-1.5 rounded-md transition-colors ${
                      mode === "dark"
                        ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm"
                        : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                    }`}
                    aria-label="Dark mode"
                    aria-pressed={mode === "dark"}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-2">
                <Link
                  to="/login"
                  className="text-base font-medium text-surface-700 dark:text-surface-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
