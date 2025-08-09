import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@basketball-stats/shared';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Statistics from './pages/Statistics';
import LiveGame from './pages/LiveGame';
import GameAnalysis from './pages/GameAnalysis';
import AuthPage from './pages/AuthPage';
import LeagueSelectionPage from './pages/LeagueSelectionPage';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏀</div>
        <div className="text-2xl font-bold text-white mb-2">Basketball Stats</div>
        <div className="text-gray-400">Loading...</div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { selectedLeague } = useAuthStore();

  if (!selectedLeague) {
    return <LeagueSelectionPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/players" element={<Players />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/games/:gameId/live" element={<LiveGame />} />
        <Route path="/games/:gameId/analysis" element={<GameAnalysis />} />
        <Route path="/profile" element={<div className="text-white">Profile Page - Coming Soon</div>} />
        <Route path="/leagues" element={<LeagueSelectionPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  const { isAuthenticated, initialize } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [initialize]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-900">
          {isAuthenticated ? <AuthenticatedApp /> : <AuthPage />}
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
