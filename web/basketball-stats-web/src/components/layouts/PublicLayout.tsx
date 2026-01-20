import { ReactNode } from "react";
import Header from "../marketing/Header";
import Footer from "../marketing/Footer";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-grow" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}
