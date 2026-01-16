import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../../../convex/_generated/dataModel";

const GameAnalysis: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();

  const gameData = useQuery(
    api.games.get,
    token && gameId ? { token, gameId: gameId as Id<"games"> } : "skip"
  );

  if (gameData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!gameData?.game) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-white">Game not found</h3>
      </div>
    );
  }

  const game = gameData.game;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">Game Analysis</h1>
        <p className="text-gray-400">
          Post-game analysis for {game.awayTeam?.name} @ {game.homeTeam?.name}
        </p>
        <p className="text-orange-400 mt-2">
          This is a placeholder for the game analysis page. Full implementation would include
          detailed statistics, performance metrics, and analytical insights.
        </p>
      </div>
    </div>
  );
};

export default GameAnalysis;
