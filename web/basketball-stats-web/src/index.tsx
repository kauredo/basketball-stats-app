import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App";
import AuthErrorBoundary from "./components/AuthErrorBoundary";
import reportWebVitals from "./reportWebVitals";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Global handler for unhandled promise rejections (catches Convex query errors)
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason;
  if (error instanceof Error) {
    const isUnauthorized =
      error.message?.includes("Unauthorized") ||
      error.message?.includes("Invalid token") ||
      error.message?.includes("Token expired");

    if (isUnauthorized) {
      console.warn("Unauthorized error detected, clearing credentials and redirecting to login...");
      localStorage.removeItem("basketball_convex_token");
      localStorage.removeItem("basketball_selected_league");
      window.location.href = "/login";
      event.preventDefault();
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ConvexProvider client={convex}>
        <AuthErrorBoundary>
          <App />
        </AuthErrorBoundary>
      </ConvexProvider>
    </HelmetProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
