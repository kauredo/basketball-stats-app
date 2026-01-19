import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Icon from "./components/Icon";

import Layout from "./components/Layout";
import PublicLayout from "./components/layouts/PublicLayout";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import FAQPage from "./pages/public/FAQPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import TermsPage from "./pages/public/TermsPage";

// Auth pages
import AuthPage from "./pages/AuthPage";

// App pages
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Statistics from "./pages/Statistics";
import LiveGame from "./pages/LiveGameNew";
import GameAnalysis from "./pages/GameAnalysis";
import LeagueSelectionPage from "./pages/LeagueSelectionPage";
import Profile from "./pages/Profile";
import Standings from "./pages/Standings";
import PlayerComparison from "./pages/PlayerComparison";
import ShotCharts from "./pages/ShotCharts";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        <Icon name="basketball" size={64} className="mx-auto mb-4 text-orange-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Basketball Stats</h1>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { selectedLeague } = useAuth();
  const location = useLocation();

  if (!selectedLeague) {
    return <LeagueSelectionPage />;
  }

  // LiveGame renders full-screen without the Layout for immersive stat recording
  const isLiveGameRoute = location.pathname.includes("/live");

  if (isLiveGameRoute) {
    return (
      <NotificationProvider>
        <Routes>
          <Route path="/games/:gameId/live" element={<LiveGame />} />
        </Routes>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/games" element={<Games />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/compare" element={<PlayerComparison />} />
          <Route path="/shot-charts" element={<ShotCharts />} />
          <Route path="/games/:gameId/analysis" element={<GameAnalysis />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leagues" element={<LeagueSelectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </NotificationProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing pages */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
        }
      />
      <Route
        path="/faq"
        element={
          <PublicLayout>
            <FAQPage />
          </PublicLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        }
      />
      <Route
        path="/privacy"
        element={
          <PublicLayout>
            <PrivacyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <PublicLayout>
            <TermsPage />
          </PublicLayout>
        }
      />

      {/* Auth pages - redirect to /app if already logged in */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="signup" />
          </PublicOnlyRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
