import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import ShotChart from "../components/ShotChart";
import { ChartBarIcon, UserIcon, UsersIcon, FireIcon } from "@heroicons/react/24/outline";

interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  teamId: Id<"teams">;
  number: number;
}

interface TeamOption {
  id: Id<"teams">;
  name: string;
}

const ShotCharts: React.FC = () => {
  const { token, selectedLeague } = useAuth();
  const [viewMode, setViewMode] = useState<"player" | "team">("player");
  const [selectedPlayerId, setSelectedPlayerId] = useState<Id<"players"> | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch teams and players
  const teamsData = useQuery(
    api.teams.list,
    token && selectedLeague ? { token, leagueId: selectedLeague.id } : "skip"
  );

  // Build options from teams data
  const playerOptions: PlayerOption[] = [];
  const teamOptions: TeamOption[] = [];

  if (teamsData?.teams) {
    for (const team of teamsData.teams) {
      teamOptions.push({ id: team.id as Id<"teams">, name: team.name });
      if (team.players) {
        for (const player of team.players) {
          playerOptions.push({
            id: player.id as Id<"players">,
            name: player.name,
            team: team.name,
            teamId: team.id as Id<"teams">,
            number: player.number,
          });
        }
      }
    }
  }

  // Fetch player shot chart data
  const playerShotData = useQuery(
    api.shots.getPlayerShotChart,
    token && selectedLeague && selectedPlayerId
      ? { token, leagueId: selectedLeague.id, playerId: selectedPlayerId }
      : "skip"
  );

  // Fetch team shot chart data
  const teamShotData = useQuery(
    api.shots.getTeamShotChart,
    token && selectedLeague && selectedTeamId
      ? { token, leagueId: selectedLeague.id, teamId: selectedTeamId }
      : "skip"
  );

  const currentData = viewMode === "player" ? playerShotData : teamShotData;
  const shots = currentData?.shots || [];

  const StatBox: React.FC<{ label: string; value: string | number; subValue?: string }> = ({
    label,
    value,
    subValue,
  }) => (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shot Charts</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize shooting patterns and hot zones
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("player")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === "player"
                  ? "bg-orange-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Player</span>
            </button>
            <button
              onClick={() => setViewMode("team")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === "team"
                  ? "bg-orange-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Team</span>
            </button>
          </div>

          {/* Player/Team Select */}
          {viewMode === "player" ? (
            <select
              value={selectedPlayerId || ""}
              onChange={(e) => setSelectedPlayerId((e.target.value as Id<"players">) || null)}
              className="flex-1 max-w-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a player</option>
              {playerOptions.map((player) => (
                <option key={player.id} value={player.id}>
                  #{player.number} {player.name} ({player.team})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedTeamId || ""}
              onChange={(e) => setSelectedTeamId((e.target.value as Id<"teams">) || null)}
              className="flex-1 max-w-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a team</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showHeatmap
                ? "bg-red-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <FireIcon className="w-4 h-4" />
            <span>Heat Map</span>
          </button>
        </div>
      </div>

      {/* Shot Chart and Stats */}
      {(viewMode === "player" && selectedPlayerId) || (viewMode === "team" && selectedTeamId) ? (
        currentData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shot Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <ShotChart
                shots={shots}
                showHeatmap={showHeatmap}
                title={
                  viewMode === "player"
                    ? `${playerShotData?.player?.name} - Shot Chart`
                    : `${teamShotData?.team?.name} - Team Shot Chart`
                }
                width={600}
                height={564}
              />
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Overall Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-orange-500" />
                  Shooting Stats
                </h3>

                {viewMode === "player" && playerShotData?.stats ? (
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Total Shots"
                      value={playerShotData.stats.totalShots}
                      subValue={`${playerShotData.stats.madeShots} made`}
                    />
                    <StatBox label="Overall" value={`${playerShotData.stats.overallPercentage}%`} />
                    <StatBox
                      label="2PT FG"
                      value={`${playerShotData.stats.twoPoint.percentage}%`}
                      subValue={`${playerShotData.stats.twoPoint.made}/${playerShotData.stats.twoPoint.attempted}`}
                    />
                    <StatBox
                      label="3PT FG"
                      value={`${playerShotData.stats.threePoint.percentage}%`}
                      subValue={`${playerShotData.stats.threePoint.made}/${playerShotData.stats.threePoint.attempted}`}
                    />
                    <StatBox
                      label="Free Throw"
                      value={`${playerShotData.stats.freeThrow.percentage}%`}
                      subValue={`${playerShotData.stats.freeThrow.made}/${playerShotData.stats.freeThrow.attempted}`}
                    />
                  </div>
                ) : teamShotData ? (
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Total Shots"
                      value={teamShotData.totalShots}
                      subValue={`${teamShotData.madeShots} made`}
                    />
                    <StatBox
                      label="Overall"
                      value={`${
                        teamShotData.totalShots > 0
                          ? Math.round((teamShotData.madeShots / teamShotData.totalShots) * 1000) /
                            10
                          : 0
                      }%`}
                    />
                  </div>
                ) : null}
              </div>

              {/* Zone Stats */}
              {currentData?.zoneStats && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Zone Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(currentData.zoneStats).map(([zone, stats]) => {
                      if (stats.attempted === 0) return null;
                      const zoneName =
                        {
                          paint: "Paint",
                          midrange: "Mid-Range",
                          corner3: "Corner 3",
                          wing3: "Wing 3",
                          top3: "Top of Key 3",
                          ft: "Free Throws",
                        }[zone] || zone;

                      return (
                        <div key={zone} className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{zoneName}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">
                              {stats.made}/{stats.attempted}
                            </span>
                            <span
                              className={`font-bold ${
                                stats.percentage >= 50
                                  ? "text-green-400"
                                  : stats.percentage >= 40
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {stats.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No shots message */}
              {shots.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No shot data available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Shot data is recorded during live games
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a {viewMode}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a {viewMode} from the dropdown above to view their shot chart and shooting
            statistics.
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          About Shot Charts
        </h4>
        <p className="text-sm text-gray-500">
          Shot charts visualize where shots are taken on the court. Green circles indicate made
          shots, red/yellow X marks indicate misses. Enable the heat map to see shooting efficiency
          by zone - green zones are hot (high percentage), red zones are cold (low percentage).
        </p>
      </div>
    </div>
  );
};

export default ShotCharts;
