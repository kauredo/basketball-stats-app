import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { basketballAPI, Game, Player, basketballWebSocket } from '@basketball-stats/shared';

const LiveGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);

  const {
    data: gameData,
    isLoading,
  } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameId ? basketballAPI.getGame(parseInt(gameId)) : Promise.reject('No game ID'),
    enabled: !!gameId,
  });

  useEffect(() => {
    if (gameData?.game) {
      setGame(gameData.game);
    }
  }, [gameData]);

  useEffect(() => {
    if (gameId) {
      // Connect to WebSocket for real-time updates
      basketballWebSocket.connect();
      basketballWebSocket.subscribeToGame(parseInt(gameId));
      
      basketballWebSocket.on('game_update', (data) => {
        if (data.game) {
          setGame(data.game);
        }
      });

      return () => {
        basketballWebSocket.unsubscribeFromGame();
      };
    }
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-white">Game not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">Live Game Coaching Interface</h1>
        <p className="text-gray-400">
          Desktop coaching interface for {game.away_team.name} @ {game.home_team.name}
        </p>
        <p className="text-orange-400 mt-2">
          This is a placeholder for the desktop coaching interface. 
          Full implementation would include real-time statistics, 
          advanced analytics, and coaching tools.
        </p>
      </div>
    </div>
  );
};

export default LiveGame;