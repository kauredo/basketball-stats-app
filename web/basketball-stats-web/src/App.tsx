import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Icon from "./components/Icon";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Statistics from "./pages/Statistics";
import LiveGame from "./pages/LiveGame";
import GameAnalysis from "./pages/GameAnalysis";
import AuthPage from "./pages/AuthPage";
import LeagueSelectionPage from "./pages/LeagueSelectionPage";
import Profile from "./pages/Profile";
import Standings from "./pages/Standings";
import PlayerComparison from "./pages/PlayerComparison";
import ShotCharts from "./pages/ShotCharts";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        <Icon name="basketball" size={64} className="mx-auto mb-4 text-orange-600" />
        <h1 className="text-2xl font-bold text-white mb-2">Basketball Stats</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { selectedLeague } = useAuth();

  if (!selectedLeague) {
    return <LeagueSelectionPage />;
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
          <Route path="/games/:gameId/live" element={<LiveGame />} />
          <Route path="/games/:gameId/analysis" element={<GameAnalysis />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leagues" element={<LeagueSelectionPage />} />
        </Routes>
      </Layout>
    </NotificationProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <div>{isAuthenticated ? <AuthenticatedApp /> : <AuthPage />}</div>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
