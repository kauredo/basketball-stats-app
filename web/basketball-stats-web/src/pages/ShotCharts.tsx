import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { InteractiveCourt } from "../components/livegame/court/InteractiveCourt";
import { PlayerSelectorModal } from "../components/PlayerSelectorModal";
import type { ShotLocation } from "../types/livegame";
import { ChartBarIcon, UserIcon, UsersIcon, FireIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface PlayerOption {
  id: Id<"players">;
  name: string;
  team: string;
  teamId: Id<"teams">;
  number: number;
  position?: string;
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
  const [showPlayerModal, setShowPlayerModal] = useState(false);

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
            position: player.position,
          });
        }
      }
    }
  }

  // Get selected player info for display
  const selectedPlayerInfo = playerOptions.find((p) => p.id === selectedPlayerId);

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

  // Transform shots to ShotLocation format for InteractiveCourt
  const transformedShots: ShotLocation[] = useMemo(() => {
    const shots = currentData?.shots || [];
    return shots.map((shot) => ({
      x: shot.x,
      y: shot.y,
      made: shot.made,
      is3pt: shot.shotType === "3pt",
    }));
  }, [currentData?.shots]);

  const StatBox: React.FC<{ label: string; value: string | number; subValue?: string }> = ({
    label,
    value,
    subValue,
  }) => (
    <div className="bg-surface-100 dark:bg-surface-700 rounded-xl p-4">
      <div className="text-sm text-surface-600 dark:text-surface-400">{label}</div>
      <div
        className="text-stat-md font-bold text-surface-900 dark:text-white tabular-nums"
        data-stat
      >
        {value}
      </div>
      {subValue && <div className="text-xs text-surface-500">{subValue}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-sm text-surface-900 dark:text-white mb-2">Shot Charts</h1>
        <p className="text-surface-600 dark:text-surface-400">
          Visualize shooting patterns and hot zones
        </p>
      </div>

      {/* Controls */}
      <div className="surface-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode("player")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "player"
                  ? "bg-primary-500 text-white shadow-soft"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Player</span>
            </button>
            <button
              onClick={() => setViewMode("team")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "team"
                  ? "bg-primary-500 text-white shadow-soft"
                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>Team</span>
            </button>
          </div>

          {/* Player/Team Select */}
          {viewMode === "player" ? (
            <button
              onClick={() => setShowPlayerModal(true)}
              className="flex-1 max-w-xs px-3 py-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-left flex items-center justify-between hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              {selectedPlayerInfo ? (
                <span className="text-surface-900 dark:text-white truncate">
                  #{selectedPlayerInfo.number} {selectedPlayerInfo.name}
                  <span className="text-surface-500 ml-1">({selectedPlayerInfo.team})</span>
                </span>
              ) : (
                <span className="text-surface-400">Select a player</span>
              )}
              <ChevronDownIcon className="w-4 h-4 text-surface-400 flex-shrink-0 ml-2" />
            </button>
          ) : (
            <select
              value={selectedTeamId || ""}
              onChange={(e) => setSelectedTeamId((e.target.value as Id<"teams">) || null)}
              className="flex-1 max-w-xs px-3 py-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              showHeatmap
                ? "bg-red-600 text-white"
                : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white"
            }`}
          >
            <FireIcon className="w-4 h-4" />
            <span>Heat Map</span>
          </button>
        </div>
      </div>

      {/* Player Selection Modal */}
      <PlayerSelectorModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSelect={setSelectedPlayerId}
        players={playerOptions}
        selectedId={selectedPlayerId}
        title="Select Player"
      />

      {/* Shot Chart and Stats */}
      {(viewMode === "player" && selectedPlayerId) || (viewMode === "team" && selectedTeamId) ? (
        currentData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shot Chart */}
            <div className="lg:col-span-2 surface-card p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                {viewMode === "player"
                  ? `${playerShotData?.player?.name} — Shot Chart`
                  : `${teamShotData?.team?.name} — Team Shot Chart`}
              </h3>
              <div className="aspect-[300/282] max-w-[600px] mx-auto">
                <InteractiveCourt
                  allShots={transformedShots}
                  showHeatMap={showHeatmap}
                  displayMode="all"
                  disabled
                  compact
                />
              </div>
              {/* Legend */}
              <div className="flex justify-center flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-surface-600 dark:text-surface-400">Made 2PT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <span className="text-surface-600 dark:text-surface-400">Made 3PT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-surface-600 dark:text-surface-400">Missed</span>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Overall Stats */}
              <div className="surface-card p-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-primary-500" />
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
                <div className="surface-card p-6">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
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
                          <span className="text-surface-600 dark:text-surface-400">{zoneName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-surface-500 tabular-nums">
                              {stats.made}/{stats.attempted}
                            </span>
                            <span
                              className={`font-bold tabular-nums ${
                                stats.percentage >= 50
                                  ? "text-green-500"
                                  : stats.percentage >= 40
                                    ? "text-yellow-500"
                                    : "text-red-500"
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
              {transformedShots.length === 0 && (
                <div className="surface-card p-6 text-center">
                  <p className="text-surface-600 dark:text-surface-400">No shot data available</p>
                  <p className="text-sm text-surface-500 mt-2">
                    Shot data is recorded during live games
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        )
      ) : (
        <div className="surface-card p-12 text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-surface-400 mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
            Select a {viewMode}
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            Choose a {viewMode} from the dropdown above to view their shot chart and shooting
            statistics.
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="surface-card p-4">
        <h4 className="section-header mb-2">About Shot Charts</h4>
        <p className="text-sm text-surface-500">
          Shot charts visualize where shots are taken on the court. Green circles indicate made
          shots, red/yellow X marks indicate misses. Enable the heat map to see shooting efficiency
          by zone — green zones are hot (high percentage), red zones are cold (low percentage).
        </p>
      </div>
    </div>
  );
};

export default ShotCharts;
