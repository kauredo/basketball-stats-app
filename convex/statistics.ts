import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserFromToken, canAccessLeague } from "./lib/auth";
import { Doc, Id } from "./_generated/dataModel";

// Get player season statistics
export const getPlayerSeasonStats = query({
  args: {
    token: v.string(),
    playerId: v.id("players"),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const team = await ctx.db.get(player.teamId);

    // Get completed games in this league
    const games = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();

    const gameIds = new Set(games.map((g) => g._id));

    // Get player stats for completed games
    const allStats = await ctx.db
      .query("playerStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const stats = allStats.filter((s) => gameIds.has(s.gameId));

    if (stats.length === 0) {
      return { stats: emptyPlayerStats(player, team ?? undefined), recentGames: [] };
    }

    const aggregated = aggregateStats(stats);
    const gamesPlayed = stats.length;
    const averages = calculateAverages(aggregated, gamesPlayed);
    const percentages = calculatePercentages(aggregated);
    const advanced = calculateAdvancedStats(aggregated, averages, gamesPlayed);

    // Get recent games with individual game stats
    const gameMap = new Map(games.map((g) => [g._id, g]));
    const recentGameStats = stats
      .map((stat) => {
        const game = gameMap.get(stat.gameId);
        if (!game) return null;

        // Determine opponent
        const isHomeTeam = game.homeTeamId === player.teamId;
        const opponentId = isHomeTeam ? game.awayTeamId : game.homeTeamId;

        return {
          gameId: game._id,
          gameDate: game.endedAt || game.startedAt || game.scheduledAt,
          opponentId,
          points: stat.points,
          rebounds: stat.rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls: stat.fouls,
          fieldGoalsMade: stat.fieldGoalsMade,
          fieldGoalsAttempted: stat.fieldGoalsAttempted,
          fieldGoalPercentage:
            stat.fieldGoalsAttempted > 0
              ? (stat.fieldGoalsMade / stat.fieldGoalsAttempted) * 100
              : 0,
          threePointersMade: stat.threePointersMade,
          threePointersAttempted: stat.threePointersAttempted,
          freeThrowsMade: stat.freeThrowsMade,
          freeThrowsAttempted: stat.freeThrowsAttempted,
          minutesPlayed: stat.minutesPlayed || 0,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => (b.gameDate || 0) - (a.gameDate || 0))
      .slice(0, 10);

    // Fetch opponent names
    const opponentIds = Array.from(new Set(recentGameStats.map((g) => g.opponentId)));
    const opponents = await Promise.all(opponentIds.map((id) => ctx.db.get(id)));
    const opponentMap = new Map(
      opponents
        .filter((t): t is NonNullable<typeof t> => t !== null && "name" in t)
        .map((t) => [t._id, (t as { _id: typeof t._id; name: string }).name])
    );

    const recentGames = recentGameStats.map((g) => ({
      ...g,
      opponent: opponentMap.get(g.opponentId) || "Unknown",
    }));

    return {
      stats: {
        playerId: player._id,
        playerName: player.name,
        team: team?.name || "Unknown",
        position: player.position,
        gamesPlayed,
        ...aggregated,
        ...averages,
        ...percentages,
        ...advanced,
      },
      recentGames,
    };
  },
});

// Get all players statistics for a league (paginated)
export const getPlayersStats = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    sortBy: v.optional(v.string()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    page: v.optional(v.number()),
    perPage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get all teams in league
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const teamMap = new Map(teams.map((t) => [t._id, t]));

    // Get all players in league
    const allPlayers: Doc<"players">[] = [];
    for (const team of teams) {
      const teamPlayers = await ctx.db
        .query("players")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      allPlayers.push(...teamPlayers);
    }

    // Get completed games
    const games = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();

    const gameIds = new Set(games.map((g) => g._id));

    // Calculate stats for each player
    const playerStats = await Promise.all(
      allPlayers.map(async (player) => {
        const allStats = await ctx.db
          .query("playerStats")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        const stats = allStats.filter((s) => gameIds.has(s.gameId));
        const team = teamMap.get(player.teamId);

        if (stats.length === 0) {
          return emptyPlayerStats(player, team);
        }

        const aggregated = aggregateStats(stats);
        const gamesPlayed = stats.length;
        const averages = calculateAverages(aggregated, gamesPlayed);
        const percentages = calculatePercentages(aggregated);
        const advanced = calculateAdvancedStats(aggregated, averages, gamesPlayed);

        return {
          playerId: player._id,
          playerName: player.name,
          teamId: player.teamId,
          teamName: team?.name || "Unknown",
          position: player.position,
          gamesPlayed,
          ...aggregated,
          ...averages,
          ...percentages,
          ...advanced,
        };
      })
    );

    // Sort
    const sortBy = args.sortBy || "avgPoints";
    const order = args.order || "desc";

    playerStats.sort((a, b) => {
      const aVal = (a as any)[sortBy] || 0;
      const bVal = (b as any)[sortBy] || 0;
      return order === "desc" ? bVal - aVal : aVal - bVal;
    });

    // Paginate
    const page = args.page || 1;
    const perPage = args.perPage || 20;
    const start = (page - 1) * perPage;
    const paginated = playerStats.slice(start, start + perPage);

    return {
      players: paginated,
      pagination: {
        currentPage: page,
        perPage,
        totalPages: Math.ceil(playerStats.length / perPage),
        totalCount: playerStats.length,
      },
    };
  },
});

// Get team statistics for a league
export const getTeamsStats = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get all teams in league
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Get completed games
    const completedGames = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();

    const gameIds = new Set(completedGames.map((g) => g._id));

    // Calculate team stats
    const teamStats = await Promise.all(
      teams.map(async (team) => {
        // Get all players on team
        const players = await ctx.db
          .query("players")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        // Get all player stats from completed games
        let allPlayerStats: Doc<"playerStats">[] = [];
        for (const player of players) {
          const stats = await ctx.db
            .query("playerStats")
            .withIndex("by_player", (q) => q.eq("playerId", player._id))
            .collect();
          const filteredStats = stats.filter((s) => gameIds.has(s.gameId));
          allPlayerStats = [...allPlayerStats, ...filteredStats];
        }

        // Calculate wins/losses
        const homeGames = completedGames.filter((g) => g.homeTeamId === team._id);
        const awayGames = completedGames.filter((g) => g.awayTeamId === team._id);

        let wins = 0;
        let losses = 0;

        for (const game of homeGames) {
          if (game.homeScore > game.awayScore) wins++;
          else losses++;
        }

        for (const game of awayGames) {
          if (game.awayScore > game.homeScore) wins++;
          else losses++;
        }

        const gamesPlayed = wins + losses;
        const aggregated = aggregateStats(allPlayerStats);

        // Get team rebounds from teamStats (unattributed rebounds)
        const teamStatRecords = await ctx.db
          .query("teamStats")
          .filter((q) => q.eq(q.field("teamId"), team._id))
          .collect();
        const filteredTeamStats = teamStatRecords.filter((ts) => gameIds.has(ts.gameId));

        // Sum team rebounds (these are in addition to player rebounds)
        const teamOffensiveRebounds = filteredTeamStats.reduce(
          (sum, ts) => sum + (ts.offensiveRebounds || 0),
          0
        );
        const teamDefensiveRebounds = filteredTeamStats.reduce(
          (sum, ts) => sum + (ts.defensiveRebounds || 0),
          0
        );

        // Total rebounds = player rebounds + team rebounds
        const totalReboundsWithTeam =
          aggregated.totalRebounds + teamOffensiveRebounds + teamDefensiveRebounds;
        const totalOffensiveRebounds = aggregated.totalOffensiveRebounds + teamOffensiveRebounds;
        const totalDefensiveRebounds = aggregated.totalDefensiveRebounds + teamDefensiveRebounds;

        return {
          teamId: team._id,
          teamName: team.name,
          gamesPlayed,
          wins,
          losses,
          winPercentage: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 10 : 0,
          avgPoints:
            gamesPlayed > 0 ? Math.round((aggregated.totalPoints / gamesPlayed) * 10) / 10 : 0,
          avgRebounds:
            gamesPlayed > 0 ? Math.round((totalReboundsWithTeam / gamesPlayed) * 10) / 10 : 0,
          avgOffensiveRebounds:
            gamesPlayed > 0 ? Math.round((totalOffensiveRebounds / gamesPlayed) * 10) / 10 : 0,
          avgDefensiveRebounds:
            gamesPlayed > 0 ? Math.round((totalDefensiveRebounds / gamesPlayed) * 10) / 10 : 0,
          avgAssists:
            gamesPlayed > 0 ? Math.round((aggregated.totalAssists / gamesPlayed) * 10) / 10 : 0,
          fieldGoalPercentage:
            aggregated.totalFieldGoalsAttempted > 0
              ? Math.round(
                  (aggregated.totalFieldGoalsMade / aggregated.totalFieldGoalsAttempted) * 1000
                ) / 10
              : 0,
        };
      })
    );

    // Sort by wins
    teamStats.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winPercentage - a.winPercentage;
    });

    return { teams: teamStats };
  },
});

// Get league leaders by category
export const getLeagueLeaders = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
    category: v.union(
      v.literal("points"),
      v.literal("rebounds"),
      v.literal("assists"),
      v.literal("steals"),
      v.literal("blocks"),
      v.literal("fieldGoalPercentage"),
      v.literal("threePointPercentage"),
      v.literal("freeThrowPercentage")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    // Get all teams and players
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const teamMap = new Map(teams.map((t) => [t._id, t]));

    const allPlayers: Doc<"players">[] = [];
    for (const team of teams) {
      const teamPlayers = await ctx.db
        .query("players")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      allPlayers.push(...teamPlayers);
    }

    // Get completed games
    const games = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();

    const gameIds = new Set(games.map((g) => g._id));

    // Calculate relevant stat for each player
    const playerLeaderStats = await Promise.all(
      allPlayers.map(async (player) => {
        const allStats = await ctx.db
          .query("playerStats")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        const stats = allStats.filter((s) => gameIds.has(s.gameId));
        const team = teamMap.get(player.teamId);
        const gamesPlayed = stats.length;

        if (gamesPlayed === 0) return null;

        const aggregated = aggregateStats(stats);
        let value: number;

        switch (args.category) {
          case "points":
            value = aggregated.totalPoints / gamesPlayed;
            break;
          case "rebounds":
            value = aggregated.totalRebounds / gamesPlayed;
            break;
          case "assists":
            value = aggregated.totalAssists / gamesPlayed;
            break;
          case "steals":
            value = aggregated.totalSteals / gamesPlayed;
            break;
          case "blocks":
            value = aggregated.totalBlocks / gamesPlayed;
            break;
          case "fieldGoalPercentage":
            if (aggregated.totalFieldGoalsAttempted < 10) return null;
            value = (aggregated.totalFieldGoalsMade / aggregated.totalFieldGoalsAttempted) * 100;
            break;
          case "threePointPercentage":
            if (aggregated.totalThreePointersAttempted < 5) return null;
            value =
              (aggregated.totalThreePointersMade / aggregated.totalThreePointersAttempted) * 100;
            break;
          case "freeThrowPercentage":
            if (aggregated.totalFreeThrowsAttempted < 5) return null;
            value = (aggregated.totalFreeThrowsMade / aggregated.totalFreeThrowsAttempted) * 100;
            break;
          default:
            value = 0;
        }

        return {
          playerId: player._id,
          playerName: player.name,
          team: team?.name || "Unknown",
          gamesPlayed,
          value: Math.round(value * 10) / 10,
        };
      })
    );

    // Filter out nulls and sort
    const validStats = playerLeaderStats.filter((s) => s !== null);
    validStats.sort((a, b) => b!.value - a!.value);

    const limit = args.limit || 10;

    return {
      category: args.category,
      leaders: validStats.slice(0, limit),
    };
  },
});

// Get statistics dashboard
export const getDashboard = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const league = await ctx.db.get(args.leagueId);

    // Get all teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const teamMap = new Map(teams.map((t) => [t._id, t]));

    // Get all players
    const allPlayers: Doc<"players">[] = [];
    for (const team of teams) {
      const teamPlayers = await ctx.db
        .query("players")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      allPlayers.push(...teamPlayers);
    }

    // Get completed games
    const completedGames = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();

    const gameIds = new Set(completedGames.map((g) => g._id));

    // Calculate leaders
    const playerStatsForLeaders = await Promise.all(
      allPlayers.map(async (player) => {
        const allStats = await ctx.db
          .query("playerStats")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .collect();

        const stats = allStats.filter((s) => gameIds.has(s.gameId));
        const team = teamMap.get(player.teamId);
        const gamesPlayed = stats.length;

        if (gamesPlayed === 0) return null;

        const aggregated = aggregateStats(stats);

        return {
          playerId: player._id,
          playerName: player.name,
          team: team?.name || "Unknown",
          gamesPlayed,
          avgPoints: Math.round((aggregated.totalPoints / gamesPlayed) * 10) / 10,
          avgRebounds: Math.round((aggregated.totalRebounds / gamesPlayed) * 10) / 10,
          avgAssists: Math.round((aggregated.totalAssists / gamesPlayed) * 10) / 10,
          fieldGoalPercentage:
            aggregated.totalFieldGoalsAttempted > 0
              ? Math.round(
                  (aggregated.totalFieldGoalsMade / aggregated.totalFieldGoalsAttempted) * 1000
                ) / 10
              : 0,
        };
      })
    );

    const validPlayerStats = playerStatsForLeaders.filter((s) => s !== null);

    // Top 5 in each category - include team info
    const scoringLeaders = [...validPlayerStats]
      .sort((a, b) => b!.avgPoints - a!.avgPoints)
      .slice(0, 5)
      .map((p) => ({ name: p!.playerName, value: p!.avgPoints, team: p!.team }));

    const reboundingLeaders = [...validPlayerStats]
      .sort((a, b) => b!.avgRebounds - a!.avgRebounds)
      .slice(0, 5)
      .map((p) => ({ name: p!.playerName, value: p!.avgRebounds, team: p!.team }));

    const assistsLeaders = [...validPlayerStats]
      .sort((a, b) => b!.avgAssists - a!.avgAssists)
      .slice(0, 5)
      .map((p) => ({ name: p!.playerName, value: p!.avgAssists, team: p!.team }));

    const shootingLeaders = [...validPlayerStats]
      .filter((p) => p!.gamesPlayed >= 3)
      .sort((a, b) => b!.fieldGoalPercentage - a!.fieldGoalPercentage)
      .slice(0, 5)
      .map((p) => ({ name: p!.playerName, value: p!.fieldGoalPercentage, team: p!.team }));

    // Calculate standings
    const standings = await Promise.all(
      teams.map(async (team) => {
        const homeGames = completedGames.filter((g) => g.homeTeamId === team._id);
        const awayGames = completedGames.filter((g) => g.awayTeamId === team._id);

        let wins = 0;
        let losses = 0;
        let totalPoints = 0;

        for (const game of homeGames) {
          totalPoints += game.homeScore;
          if (game.homeScore > game.awayScore) wins++;
          else losses++;
        }

        for (const game of awayGames) {
          totalPoints += game.awayScore;
          if (game.awayScore > game.homeScore) wins++;
          else losses++;
        }

        const gamesPlayed = wins + losses;
        const winPercentage = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 10 : 0;
        const avgPoints = gamesPlayed > 0 ? Math.round((totalPoints / gamesPlayed) * 10) / 10 : 0;

        return {
          teamId: team._id,
          teamName: team.name,
          logoUrl: team.logoUrl,
          gamesPlayed,
          wins,
          losses,
          winPercentage,
          avgPoints,
        };
      })
    );

    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winPercentage - a.winPercentage;
    });

    // Recent games
    const recentGames = completedGames
      .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
      .slice(0, 5)
      .map((game) => {
        const homeTeam = teamMap.get(game.homeTeamId);
        const awayTeam = teamMap.get(game.awayTeamId);
        return {
          id: game._id,
          date: game.endedAt,
          homeTeam: homeTeam?.name || "Unknown",
          awayTeam: awayTeam?.name || "Unknown",
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          totalPoints: game.homeScore + game.awayScore,
        };
      });

    return {
      leaders: {
        scoring: scoringLeaders,
        rebounding: reboundingLeaders,
        assists: assistsLeaders,
        shooting: shootingLeaders,
      },
      standings,
      recentGames,
      leagueInfo: {
        id: league?._id,
        name: league?.name,
        season: league?.season,
        totalGames: completedGames.length,
        totalTeams: teams.length,
        totalPlayers: allPlayers.length,
      },
    };
  },
});

// Helper functions
function emptyPlayerStats(player: Doc<"players">, team: Doc<"teams"> | undefined) {
  return {
    playerId: player._id,
    playerName: player.name,
    teamId: player.teamId,
    teamName: team?.name || "Unknown",
    position: player.position,
    gamesPlayed: 0,
    totalPoints: 0,
    totalFieldGoalsMade: 0,
    totalFieldGoalsAttempted: 0,
    totalThreePointersMade: 0,
    totalThreePointersAttempted: 0,
    totalFreeThrowsMade: 0,
    totalFreeThrowsAttempted: 0,
    totalRebounds: 0,
    totalAssists: 0,
    totalSteals: 0,
    totalBlocks: 0,
    totalTurnovers: 0,
    totalFouls: 0,
    totalMinutes: 0,
    avgPoints: 0,
    avgRebounds: 0,
    avgAssists: 0,
    avgSteals: 0,
    avgBlocks: 0,
    avgTurnovers: 0,
    avgFouls: 0,
    avgMinutes: 0,
    fieldGoalPercentage: 0,
    threePointPercentage: 0,
    freeThrowPercentage: 0,
    effectiveFieldGoalPercentage: 0,
    trueShootingPercentage: 0,
    playerEfficiencyRating: 0,
    usageRate: 0,
    assistToTurnoverRatio: 0,
  };
}

function aggregateStats(stats: Doc<"playerStats">[]) {
  return stats.reduce(
    (acc, s) => ({
      totalPoints: acc.totalPoints + s.points,
      totalFieldGoalsMade: acc.totalFieldGoalsMade + s.fieldGoalsMade,
      totalFieldGoalsAttempted: acc.totalFieldGoalsAttempted + s.fieldGoalsAttempted,
      totalThreePointersMade: acc.totalThreePointersMade + s.threePointersMade,
      totalThreePointersAttempted: acc.totalThreePointersAttempted + s.threePointersAttempted,
      totalFreeThrowsMade: acc.totalFreeThrowsMade + s.freeThrowsMade,
      totalFreeThrowsAttempted: acc.totalFreeThrowsAttempted + s.freeThrowsAttempted,
      totalRebounds: acc.totalRebounds + s.rebounds,
      totalOffensiveRebounds: acc.totalOffensiveRebounds + (s.offensiveRebounds || 0),
      totalDefensiveRebounds: acc.totalDefensiveRebounds + (s.defensiveRebounds || 0),
      totalAssists: acc.totalAssists + s.assists,
      totalSteals: acc.totalSteals + s.steals,
      totalBlocks: acc.totalBlocks + s.blocks,
      totalTurnovers: acc.totalTurnovers + s.turnovers,
      totalFouls: acc.totalFouls + s.fouls,
      totalMinutes: acc.totalMinutes + s.minutesPlayed,
    }),
    {
      totalPoints: 0,
      totalFieldGoalsMade: 0,
      totalFieldGoalsAttempted: 0,
      totalThreePointersMade: 0,
      totalThreePointersAttempted: 0,
      totalFreeThrowsMade: 0,
      totalFreeThrowsAttempted: 0,
      totalRebounds: 0,
      totalOffensiveRebounds: 0,
      totalDefensiveRebounds: 0,
      totalAssists: 0,
      totalSteals: 0,
      totalBlocks: 0,
      totalTurnovers: 0,
      totalFouls: 0,
      totalMinutes: 0,
    }
  );
}

function calculateAverages(totals: ReturnType<typeof aggregateStats>, gamesPlayed: number) {
  if (gamesPlayed === 0) {
    return {
      avgPoints: 0,
      avgRebounds: 0,
      avgOffensiveRebounds: 0,
      avgDefensiveRebounds: 0,
      avgAssists: 0,
      avgSteals: 0,
      avgBlocks: 0,
      avgTurnovers: 0,
      avgFouls: 0,
      avgMinutes: 0,
    };
  }

  return {
    avgPoints: Math.round((totals.totalPoints / gamesPlayed) * 10) / 10,
    avgRebounds: Math.round((totals.totalRebounds / gamesPlayed) * 10) / 10,
    avgOffensiveRebounds: Math.round((totals.totalOffensiveRebounds / gamesPlayed) * 10) / 10,
    avgDefensiveRebounds: Math.round((totals.totalDefensiveRebounds / gamesPlayed) * 10) / 10,
    avgAssists: Math.round((totals.totalAssists / gamesPlayed) * 10) / 10,
    avgSteals: Math.round((totals.totalSteals / gamesPlayed) * 10) / 10,
    avgBlocks: Math.round((totals.totalBlocks / gamesPlayed) * 10) / 10,
    avgTurnovers: Math.round((totals.totalTurnovers / gamesPlayed) * 10) / 10,
    avgFouls: Math.round((totals.totalFouls / gamesPlayed) * 10) / 10,
    avgMinutes: Math.round((totals.totalMinutes / gamesPlayed) * 10) / 10,
  };
}

function calculatePercentages(totals: ReturnType<typeof aggregateStats>) {
  const fgPct =
    totals.totalFieldGoalsAttempted > 0
      ? (totals.totalFieldGoalsMade / totals.totalFieldGoalsAttempted) * 100
      : 0;

  const threePct =
    totals.totalThreePointersAttempted > 0
      ? (totals.totalThreePointersMade / totals.totalThreePointersAttempted) * 100
      : 0;

  const ftPct =
    totals.totalFreeThrowsAttempted > 0
      ? (totals.totalFreeThrowsMade / totals.totalFreeThrowsAttempted) * 100
      : 0;

  // Effective Field Goal Percentage
  const efgPct =
    totals.totalFieldGoalsAttempted > 0
      ? ((totals.totalFieldGoalsMade + 0.5 * totals.totalThreePointersMade) /
          totals.totalFieldGoalsAttempted) *
        100
      : 0;

  // True Shooting Percentage
  const tsa = totals.totalFieldGoalsAttempted + 0.44 * totals.totalFreeThrowsAttempted;
  const tsPct = tsa > 0 ? (totals.totalPoints / (2 * tsa)) * 100 : 0;

  return {
    fieldGoalPercentage: Math.round(fgPct * 10) / 10,
    threePointPercentage: Math.round(threePct * 10) / 10,
    freeThrowPercentage: Math.round(ftPct * 10) / 10,
    effectiveFieldGoalPercentage: Math.round(efgPct * 10) / 10,
    trueShootingPercentage: Math.round(tsPct * 10) / 10,
  };
}

function calculateAdvancedStats(
  totals: ReturnType<typeof aggregateStats>,
  averages: ReturnType<typeof calculateAverages>,
  gamesPlayed: number
) {
  if (gamesPlayed === 0) {
    return {
      playerEfficiencyRating: 0,
      usageRate: 0,
      assistToTurnoverRatio: 0,
    };
  }

  // Simplified PER calculation
  const avgFgMade = totals.totalFieldGoalsMade / gamesPlayed;
  const avgFgAttempted = totals.totalFieldGoalsAttempted / gamesPlayed;
  const avgThreeMade = totals.totalThreePointersMade / gamesPlayed;
  const avgFtMade = totals.totalFreeThrowsMade / gamesPlayed;
  const avgFtAttempted = totals.totalFreeThrowsAttempted / gamesPlayed;

  const per =
    (avgFgMade +
      0.5 * avgThreeMade +
      avgFtMade +
      averages.avgRebounds +
      averages.avgAssists +
      averages.avgSteals +
      averages.avgBlocks -
      (avgFgAttempted - avgFgMade) -
      (avgFtAttempted - avgFtMade) -
      averages.avgTurnovers) *
    15;

  // Usage Rate
  const playerPossessions =
    totals.totalFieldGoalsAttempted +
    0.44 * totals.totalFreeThrowsAttempted +
    totals.totalTurnovers;
  const estimatedTeamPossessions = gamesPlayed * 100;
  const usageRate =
    estimatedTeamPossessions > 0 ? (playerPossessions / estimatedTeamPossessions) * 100 : 0;

  // Assist to Turnover Ratio
  const astTo =
    totals.totalTurnovers > 0 ? totals.totalAssists / totals.totalTurnovers : totals.totalAssists;

  return {
    playerEfficiencyRating: Math.round(Math.max(per, 0) * 10) / 10,
    usageRate: Math.round(usageRate * 10) / 10,
    assistToTurnoverRatio: Math.round(astTo * 100) / 100,
  };
}

// Compare two players
export const comparePlayersStats = query({
  args: {
    token: v.string(),
    player1Id: v.id("players"),
    player2Id: v.id("players"),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const player1 = await ctx.db.get(args.player1Id);
    const player2 = await ctx.db.get(args.player2Id);

    if (!player1 || !player2) throw new Error("Player not found");

    const team1 = await ctx.db.get(player1.teamId);
    const team2 = await ctx.db.get(player2.teamId);

    // Get completed games in this league
    const games = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();
    const gameIds = new Set(games.map((g) => g._id));

    // Get stats for both players
    const getPlayerStats = async (playerId: typeof args.player1Id) => {
      const allStats = await ctx.db
        .query("playerStats")
        .withIndex("by_player", (q) => q.eq("playerId", playerId))
        .collect();
      return allStats.filter((s) => gameIds.has(s.gameId));
    };

    const stats1 = await getPlayerStats(args.player1Id);
    const stats2 = await getPlayerStats(args.player2Id);

    const calculatePlayerComparison = (
      player: typeof player1,
      team: typeof team1,
      stats: typeof stats1
    ) => {
      const gamesPlayed = stats.length;
      if (gamesPlayed === 0) {
        return {
          playerId: player!._id,
          playerName: player!.name,
          teamName: team?.name || "Unknown",
          position: player!.position,
          number: player!.number,
          gamesPlayed: 0,
          avgPoints: 0,
          avgRebounds: 0,
          avgAssists: 0,
          avgSteals: 0,
          avgBlocks: 0,
          avgTurnovers: 0,
          avgMinutes: 0,
          fieldGoalPercentage: 0,
          threePointPercentage: 0,
          freeThrowPercentage: 0,
          totalPoints: 0,
          totalRebounds: 0,
          totalAssists: 0,
        };
      }

      const totals = aggregateStats(stats);
      const avgPoints = totals.totalPoints / gamesPlayed;
      const avgRebounds = totals.totalRebounds / gamesPlayed;
      const avgAssists = totals.totalAssists / gamesPlayed;
      const avgSteals = totals.totalSteals / gamesPlayed;
      const avgBlocks = totals.totalBlocks / gamesPlayed;
      const avgTurnovers = totals.totalTurnovers / gamesPlayed;
      const avgMinutes = totals.totalMinutes / gamesPlayed;

      const fgPct =
        totals.totalFieldGoalsAttempted > 0
          ? (totals.totalFieldGoalsMade / totals.totalFieldGoalsAttempted) * 100
          : 0;
      const threePct =
        totals.totalThreePointersAttempted > 0
          ? (totals.totalThreePointersMade / totals.totalThreePointersAttempted) * 100
          : 0;
      const ftPct =
        totals.totalFreeThrowsAttempted > 0
          ? (totals.totalFreeThrowsMade / totals.totalFreeThrowsAttempted) * 100
          : 0;

      return {
        playerId: player!._id,
        playerName: player!.name,
        teamName: team?.name || "Unknown",
        position: player!.position,
        number: player!.number,
        gamesPlayed,
        avgPoints: Math.round(avgPoints * 10) / 10,
        avgRebounds: Math.round(avgRebounds * 10) / 10,
        avgAssists: Math.round(avgAssists * 10) / 10,
        avgSteals: Math.round(avgSteals * 10) / 10,
        avgBlocks: Math.round(avgBlocks * 10) / 10,
        avgTurnovers: Math.round(avgTurnovers * 10) / 10,
        avgMinutes: Math.round(avgMinutes * 10) / 10,
        fieldGoalPercentage: Math.round(fgPct * 10) / 10,
        threePointPercentage: Math.round(threePct * 10) / 10,
        freeThrowPercentage: Math.round(ftPct * 10) / 10,
        totalPoints: totals.totalPoints,
        totalRebounds: totals.totalRebounds,
        totalAssists: totals.totalAssists,
      };
    };

    return {
      player1: calculatePlayerComparison(player1, team1, stats1),
      player2: calculatePlayerComparison(player2, team2, stats2),
    };
  },
});

// Get comprehensive league standings
export const getStandings = query({
  args: {
    token: v.string(),
    leagueId: v.id("leagues"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await canAccessLeague(ctx, user._id, args.leagueId);
    if (!hasAccess) throw new Error("Access denied");

    const league = await ctx.db.get(args.leagueId);

    // Get all teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_league", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    // Get completed games
    const completedGames = await ctx.db
      .query("games")
      .withIndex("by_league_status", (q) =>
        q.eq("leagueId", args.leagueId).eq("status", "completed")
      )
      .collect();

    // Calculate standings for each team
    const standings = teams.map((team) => {
      const homeGames = completedGames.filter((g) => g.homeTeamId === team._id);
      const awayGames = completedGames.filter((g) => g.awayTeamId === team._id);
      const allTeamGames = [...homeGames, ...awayGames].sort(
        (a, b) => (b.endedAt || 0) - (a.endedAt || 0)
      );

      let wins = 0;
      let losses = 0;
      let homeWins = 0;
      let homeLosses = 0;
      let awayWins = 0;
      let awayLosses = 0;
      let pointsFor = 0;
      let pointsAgainst = 0;

      for (const game of homeGames) {
        pointsFor += game.homeScore;
        pointsAgainst += game.awayScore;
        if (game.homeScore > game.awayScore) {
          wins++;
          homeWins++;
        } else {
          losses++;
          homeLosses++;
        }
      }

      for (const game of awayGames) {
        pointsFor += game.awayScore;
        pointsAgainst += game.homeScore;
        if (game.awayScore > game.homeScore) {
          wins++;
          awayWins++;
        } else {
          losses++;
          awayLosses++;
        }
      }

      // Calculate last 5 games streak
      const last5 = allTeamGames.slice(0, 5).map((game) => {
        const isHome = game.homeTeamId === team._id;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const oppScore = isHome ? game.awayScore : game.homeScore;
        return teamScore > oppScore ? "W" : "L";
      });

      // Calculate current streak
      let streak = 0;
      let streakType: "W" | "L" | null = null;
      for (const result of last5) {
        if (streakType === null) {
          streakType = result as "W" | "L";
          streak = 1;
        } else if (result === streakType) {
          streak++;
        } else {
          break;
        }
      }

      const gamesPlayed = wins + losses;
      const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0;
      const pointDiff = pointsFor - pointsAgainst;
      const avgPointsFor = gamesPlayed > 0 ? pointsFor / gamesPlayed : 0;
      const avgPointsAgainst = gamesPlayed > 0 ? pointsAgainst / gamesPlayed : 0;

      return {
        teamId: team._id,
        teamName: team.name,
        city: team.city,
        gamesPlayed,
        wins,
        losses,
        winPercentage: Math.round(winPercentage * 1000) / 10,
        homeRecord: `${homeWins}-${homeLosses}`,
        awayRecord: `${awayWins}-${awayLosses}`,
        pointsFor,
        pointsAgainst,
        pointDiff,
        avgPointsFor: Math.round(avgPointsFor * 10) / 10,
        avgPointsAgainst: Math.round(avgPointsAgainst * 10) / 10,
        last5,
        streak: streakType ? `${streakType}${streak}` : "-",
        streakCount: streak,
        streakType,
      };
    });

    // Sort by wins, then win percentage, then point differential
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.pointDiff - a.pointDiff;
    });

    // Add ranking
    const rankedStandings = standings.map((team, index) => ({
      ...team,
      rank: index + 1,
      gamesBack:
        index === 0 ? 0 : (standings[0].wins - team.wins + (team.losses - standings[0].losses)) / 2,
    }));

    return {
      standings: rankedStandings,
      league: {
        id: league?._id,
        name: league?.name,
        season: league?.season,
        status: league?.status,
      },
      totalGames: completedGames.length,
    };
  },
});
