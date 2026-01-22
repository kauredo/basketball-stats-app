import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, getUserLeagueRole } from "./lib/auth";

// Record a stat action
export const recordStat = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    statType: v.union(
      v.literal("shot2"),
      v.literal("shot3"),
      v.literal("freethrow"),
      v.literal("rebound"),
      v.literal("offensiveRebound"),
      v.literal("defensiveRebound"),
      v.literal("assist"),
      v.literal("steal"),
      v.literal("block"),
      v.literal("turnover"),
      v.literal("foul")
    ),
    made: v.optional(v.boolean()), // For shots
    value: v.optional(v.number()), // For custom increment
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Check permission
    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    // Find player stat
    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const isHomeTeam = player.teamId === game.homeTeamId;
    const updates: Partial<typeof playerStat> = {};
    let pointsScored = 0;
    const increment = args.value || 1;

    switch (args.statType) {
      case "shot2":
        updates.fieldGoalsAttempted = playerStat.fieldGoalsAttempted + 1;
        if (args.made) {
          updates.fieldGoalsMade = playerStat.fieldGoalsMade + 1;
          updates.points = playerStat.points + 2;
          pointsScored = 2;
        }
        break;

      case "shot3":
        updates.fieldGoalsAttempted = playerStat.fieldGoalsAttempted + 1;
        updates.threePointersAttempted = playerStat.threePointersAttempted + 1;
        if (args.made) {
          updates.fieldGoalsMade = playerStat.fieldGoalsMade + 1;
          updates.threePointersMade = playerStat.threePointersMade + 1;
          updates.points = playerStat.points + 3;
          pointsScored = 3;
        }
        break;

      case "freethrow":
        updates.freeThrowsAttempted = playerStat.freeThrowsAttempted + 1;
        if (args.made) {
          updates.freeThrowsMade = playerStat.freeThrowsMade + 1;
          updates.points = playerStat.points + 1;
          pointsScored = 1;
        }
        break;

      case "rebound":
        updates.rebounds = playerStat.rebounds + increment;
        break;

      case "offensiveRebound":
        updates.rebounds = playerStat.rebounds + increment;
        updates.offensiveRebounds = (playerStat.offensiveRebounds || 0) + increment;
        break;

      case "defensiveRebound":
        updates.rebounds = playerStat.rebounds + increment;
        updates.defensiveRebounds = (playerStat.defensiveRebounds || 0) + increment;
        break;

      case "assist":
        updates.assists = playerStat.assists + increment;
        break;

      case "steal":
        updates.steals = playerStat.steals + increment;
        break;

      case "block":
        updates.blocks = playerStat.blocks + increment;
        break;

      case "turnover":
        updates.turnovers = playerStat.turnovers + increment;
        break;

      case "foul":
        const newFoulCount = playerStat.fouls + increment;
        updates.fouls = newFoulCount;

        // Check foul limit and foul out player if exceeded
        const settings = (game.gameSettings as any) || {};
        const foulLimit = settings.foulLimit || 5; // Default 5 fouls

        if (newFoulCount >= foulLimit) {
          updates.fouledOut = true;
          updates.isOnCourt = false; // Auto sub out when fouled out
        }

        // Update team fouls for bonus tracking
        const teamStatForFoul = await ctx.db
          .query("teamStats")
          .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", player.teamId))
          .first();

        if (teamStatForFoul) {
          const currentQuarter = game.currentQuarter;
          const foulsByQuarter = teamStatForFoul.foulsByQuarter || {
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,
            ot: 0,
          };

          // Increment fouls for current quarter
          if (currentQuarter === 1) foulsByQuarter.q1++;
          else if (currentQuarter === 2) foulsByQuarter.q2++;
          else if (currentQuarter === 3) foulsByQuarter.q3++;
          else if (currentQuarter === 4) foulsByQuarter.q4++;
          else foulsByQuarter.ot++;

          await ctx.db.patch(teamStatForFoul._id, {
            teamFouls: teamStatForFoul.teamFouls + 1,
            foulsByQuarter,
          });
        } else {
          // Create team stats if they don't exist
          const currentQuarter = game.currentQuarter;
          const foulsByQuarter = { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 };
          if (currentQuarter === 1) foulsByQuarter.q1 = 1;
          else if (currentQuarter === 2) foulsByQuarter.q2 = 1;
          else if (currentQuarter === 3) foulsByQuarter.q3 = 1;
          else if (currentQuarter === 4) foulsByQuarter.q4 = 1;
          else foulsByQuarter.ot = 1;

          await ctx.db.insert("teamStats", {
            gameId: args.gameId,
            teamId: player.teamId,
            offensiveRebounds: 0,
            defensiveRebounds: 0,
            teamFouls: 1,
            foulsByQuarter,
          });
        }
        break;
    }

    // Update player stat
    await ctx.db.patch(playerStat._id, updates);

    // Check if player fouled out and return that info
    const updatedPlayerStat = await ctx.db.get(playerStat._id);
    const didFoulOut = updates.fouledOut === true;

    // Update game score if points were scored
    if (pointsScored > 0) {
      const newHomeScore = isHomeTeam ? game.homeScore + pointsScored : game.homeScore;
      const newAwayScore = isHomeTeam ? game.awayScore : game.awayScore + pointsScored;

      // Update game score
      await ctx.db.patch(args.gameId, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
      });

      // Update plus/minus for all on-court players
      // Scoring team players get +points, opposing team players get -points
      const allPlayerStats = await ctx.db
        .query("playerStats")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();

      for (const stat of allPlayerStats) {
        if (stat.isOnCourt) {
          const statPlayer = await ctx.db.get(stat.playerId);
          if (statPlayer) {
            const isStatPlayerHomeTeam = statPlayer.teamId === game.homeTeamId;
            const plusMinusDelta =
              isStatPlayerHomeTeam === isHomeTeam ? pointsScored : -pointsScored;
            await ctx.db.patch(stat._id, {
              plusMinus: stat.plusMinus + plusMinusDelta,
            });
          }
        }
      }

      // Update scoreByPeriod in gameSettings
      const gameSettings = (game.gameSettings as any) || {};
      const scoreByPeriod = gameSettings.scoreByPeriod || {};
      const currentQ = game.currentQuarter;
      const periodKey = currentQ <= 4 ? `q${currentQ}` : `ot${currentQ - 4}`;

      scoreByPeriod[periodKey] = {
        home: newHomeScore,
        away: newAwayScore,
      };

      await ctx.db.patch(args.gameId, {
        gameSettings: { ...gameSettings, scoreByPeriod },
      });
    }

    // Log game event for play-by-play
    // Format: "#Number Name - Action" for consistency
    const eventDescriptions: Record<string, string> = {
      shot2: args.made
        ? `#${player.number} ${player.name} - 2PT Made`
        : `#${player.number} ${player.name} - 2PT Missed`,
      shot3: args.made
        ? `#${player.number} ${player.name} - 3PT Made`
        : `#${player.number} ${player.name} - 3PT Missed`,
      freethrow: args.made
        ? `#${player.number} ${player.name} - FT Made`
        : `#${player.number} ${player.name} - FT Missed`,
      rebound: `#${player.number} ${player.name} - Rebound`,
      offensiveRebound: `#${player.number} ${player.name} - Offensive Rebound`,
      defensiveRebound: `#${player.number} ${player.name} - Defensive Rebound`,
      assist: `#${player.number} ${player.name} - Assist`,
      steal: `#${player.number} ${player.name} - Steal`,
      block: `#${player.number} ${player.name} - Block`,
      turnover: `#${player.number} ${player.name} - Turnover`,
      foul: `#${player.number} ${player.name} - Foul`,
    };

    const eventTypes: Record<string, string> = {
      shot2: "shot",
      shot3: "shot",
      freethrow: "freethrow",
      rebound: "rebound",
      offensiveRebound: "rebound",
      defensiveRebound: "rebound",
      assist: "assist",
      steal: "steal",
      block: "block",
      turnover: "turnover",
      foul: "foul",
    };

    // Calculate current score for the event (after this action)
    const currentHomeScore =
      pointsScored > 0 && isHomeTeam ? game.homeScore + pointsScored : game.homeScore;
    const currentAwayScore =
      pointsScored > 0 && !isHomeTeam ? game.awayScore + pointsScored : game.awayScore;

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: eventTypes[args.statType] || args.statType,
      playerId: args.playerId,
      teamId: player.teamId,
      quarter: game.currentQuarter,
      gameTime: game.timeRemainingSeconds,
      timestamp: Date.now(),
      details: {
        statType: args.statType,
        made: args.made,
        points: pointsScored,
        homeScore: currentHomeScore,
        awayScore: currentAwayScore,
        isHomeTeam,
      },
      description:
        eventDescriptions[args.statType] || `#${player.number} ${player.name} - ${args.statType}`,
    });

    // Get updated game for response
    const updatedGame = await ctx.db.get(args.gameId);
    const updatedStat = await ctx.db.get(playerStat._id);

    // Determine if this was a missed shot that should prompt for rebound
    const isMissedShot =
      (args.statType === "shot2" || args.statType === "shot3" || args.statType === "freethrow") &&
      args.made === false;

    // Get game settings for foul limit
    const gameSettings = (game.gameSettings as any) || {};
    const foulLimit = gameSettings.foulLimit || 5;

    return {
      stat: {
        id: updatedStat!._id,
        points: updatedStat!.points,
        rebounds: updatedStat!.rebounds,
        offensiveRebounds: updatedStat!.offensiveRebounds || 0,
        defensiveRebounds: updatedStat!.defensiveRebounds || 0,
        assists: updatedStat!.assists,
        steals: updatedStat!.steals,
        blocks: updatedStat!.blocks,
        turnovers: updatedStat!.turnovers,
        fouls: updatedStat!.fouls,
        fouledOut: updatedStat!.fouledOut || false,
        fieldGoalsMade: updatedStat!.fieldGoalsMade,
        fieldGoalsAttempted: updatedStat!.fieldGoalsAttempted,
        threePointersMade: updatedStat!.threePointersMade,
        threePointersAttempted: updatedStat!.threePointersAttempted,
        freeThrowsMade: updatedStat!.freeThrowsMade,
        freeThrowsAttempted: updatedStat!.freeThrowsAttempted,
      },
      gameScore: {
        homeScore: updatedGame!.homeScore,
        awayScore: updatedGame!.awayScore,
      },
      message: `${args.statType} recorded for ${player.name}`,
      // Include foul-out warning info
      foulWarning:
        args.statType === "foul" && updatedStat!.fouls === foulLimit - 1
          ? { playerId: args.playerId, fouls: updatedStat!.fouls, foulLimit }
          : null,
      didFoulOut,
      // Signal for rebound prompt on missed shots
      pendingRebound: isMissedShot
        ? {
            shotType: args.statType,
            shooterPlayerId: args.playerId,
            shooterTeamId: player.teamId,
            isHomeTeam,
          }
        : null,
    };
  },
});

// Undo a stat (decrement)
export const undoStat = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    statType: v.union(
      v.literal("shot2"),
      v.literal("shot3"),
      v.literal("freethrow"),
      v.literal("rebound"),
      v.literal("offensiveRebound"),
      v.literal("defensiveRebound"),
      v.literal("assist"),
      v.literal("steal"),
      v.literal("block"),
      v.literal("turnover"),
      v.literal("foul")
    ),
    wasMade: v.optional(v.boolean()), // For shots - was it a made shot being undone?
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const isHomeTeam = player.teamId === game.homeTeamId;
    const updates: Partial<typeof playerStat> = {};
    let pointsRemoved = 0;

    switch (args.statType) {
      case "shot2":
        updates.fieldGoalsAttempted = Math.max(0, playerStat.fieldGoalsAttempted - 1);
        if (args.wasMade) {
          updates.fieldGoalsMade = Math.max(0, playerStat.fieldGoalsMade - 1);
          updates.points = Math.max(0, playerStat.points - 2);
          pointsRemoved = 2;
        }
        break;

      case "shot3":
        updates.fieldGoalsAttempted = Math.max(0, playerStat.fieldGoalsAttempted - 1);
        updates.threePointersAttempted = Math.max(0, playerStat.threePointersAttempted - 1);
        if (args.wasMade) {
          updates.fieldGoalsMade = Math.max(0, playerStat.fieldGoalsMade - 1);
          updates.threePointersMade = Math.max(0, playerStat.threePointersMade - 1);
          updates.points = Math.max(0, playerStat.points - 3);
          pointsRemoved = 3;
        }
        break;

      case "freethrow":
        updates.freeThrowsAttempted = Math.max(0, playerStat.freeThrowsAttempted - 1);
        if (args.wasMade) {
          updates.freeThrowsMade = Math.max(0, playerStat.freeThrowsMade - 1);
          updates.points = Math.max(0, playerStat.points - 1);
          pointsRemoved = 1;
        }
        break;

      case "rebound":
        updates.rebounds = Math.max(0, playerStat.rebounds - 1);
        break;

      case "offensiveRebound":
        updates.rebounds = Math.max(0, playerStat.rebounds - 1);
        updates.offensiveRebounds = Math.max(0, (playerStat.offensiveRebounds || 0) - 1);
        break;

      case "defensiveRebound":
        updates.rebounds = Math.max(0, playerStat.rebounds - 1);
        updates.defensiveRebounds = Math.max(0, (playerStat.defensiveRebounds || 0) - 1);
        break;

      case "assist":
        updates.assists = Math.max(0, playerStat.assists - 1);
        break;

      case "steal":
        updates.steals = Math.max(0, playerStat.steals - 1);
        break;

      case "block":
        updates.blocks = Math.max(0, playerStat.blocks - 1);
        break;

      case "turnover":
        updates.turnovers = Math.max(0, playerStat.turnovers - 1);
        break;

      case "foul":
        const newFoulCount = Math.max(0, playerStat.fouls - 1);
        updates.fouls = newFoulCount;
        // If player was fouled out, check if they should be un-fouled-out
        if (playerStat.fouledOut) {
          const settings = (game.gameSettings as any) || {};
          const foulLimit = settings.foulLimit || 5;
          if (newFoulCount < foulLimit) {
            updates.fouledOut = false;
          }
        }
        break;
    }

    await ctx.db.patch(playerStat._id, updates);

    // Update game score if points were removed
    if (pointsRemoved > 0) {
      const newHomeScore = isHomeTeam
        ? Math.max(0, game.homeScore - pointsRemoved)
        : game.homeScore;
      const newAwayScore = isHomeTeam
        ? game.awayScore
        : Math.max(0, game.awayScore - pointsRemoved);

      await ctx.db.patch(args.gameId, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
      });

      // Undo plus/minus for all on-court players
      // Scoring team players get -points (undo), opposing team players get +points (undo)
      const allPlayerStats = await ctx.db
        .query("playerStats")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();

      for (const stat of allPlayerStats) {
        if (stat.isOnCourt) {
          const statPlayer = await ctx.db.get(stat.playerId);
          if (statPlayer) {
            const isStatPlayerHomeTeam = statPlayer.teamId === game.homeTeamId;
            // Opposite of what we did when scoring
            const plusMinusDelta =
              isStatPlayerHomeTeam === isHomeTeam ? -pointsRemoved : pointsRemoved;
            await ctx.db.patch(stat._id, {
              plusMinus: stat.plusMinus + plusMinusDelta,
            });
          }
        }
      }

      // Update scoreByPeriod in gameSettings
      const gameSettings = (game.gameSettings as any) || {};
      const scoreByPeriod = gameSettings.scoreByPeriod || {};
      const currentQ = game.currentQuarter;
      const periodKey = currentQ <= 4 ? `q${currentQ}` : `ot${currentQ - 4}`;

      scoreByPeriod[periodKey] = {
        home: newHomeScore,
        away: newAwayScore,
      };

      await ctx.db.patch(args.gameId, {
        gameSettings: { ...gameSettings, scoreByPeriod },
      });
    }

    const updatedGame = await ctx.db.get(args.gameId);

    return {
      gameScore: {
        homeScore: updatedGame!.homeScore,
        awayScore: updatedGame!.awayScore,
      },
      message: `${args.statType} undone for ${player.name}`,
    };
  },
});

// Toggle player on/off court (substitution)
export const substitute = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    isOnCourt: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    // Check if player is fouled out - can't sub back in
    if (args.isOnCourt && playerStat.fouledOut) {
      throw new Error("Cannot substitute fouled out player back into the game");
    }

    // Max 5 players on court validation
    if (args.isOnCourt) {
      const teamStats = await ctx.db
        .query("playerStats")
        .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", player.teamId))
        .collect();

      const playersOnCourt = teamStats.filter(
        (s) => s.isOnCourt && s._id !== playerStat._id
      ).length;

      if (playersOnCourt >= 5) {
        throw new Error("Cannot have more than 5 players on court. Sub out a player first.");
      }
    }

    await ctx.db.patch(playerStat._id, {
      isOnCourt: args.isOnCourt,
    });

    return {
      message: args.isOnCourt ? `${player.name} entered the game` : `${player.name} left the game`,
      isOnCourt: args.isOnCourt,
    };
  },
});

// Swap two players (atomic substitution)
export const swapSubstitute = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerOutId: v.id("players"),
    playerInId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    // Get player out stat
    const playerOutStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) =>
        q.eq("gameId", args.gameId).eq("playerId", args.playerOutId)
      )
      .first();

    if (!playerOutStat) throw new Error("Player to sub out not found");

    // Get player in stat
    const playerInStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) =>
        q.eq("gameId", args.gameId).eq("playerId", args.playerInId)
      )
      .first();

    if (!playerInStat) throw new Error("Player to sub in not found");

    const playerOut = await ctx.db.get(args.playerOutId);
    const playerIn = await ctx.db.get(args.playerInId);

    if (!playerOut || !playerIn) throw new Error("Player not found");

    // Validate same team
    if (playerOut.teamId !== playerIn.teamId) {
      throw new Error("Players must be on the same team");
    }

    // Check if player coming in is fouled out
    if (playerInStat.fouledOut) {
      throw new Error("Cannot substitute fouled out player back into the game");
    }

    // Validate player out is on court and player in is off court
    if (!playerOutStat.isOnCourt) {
      throw new Error("Player to sub out is not on court");
    }

    if (playerInStat.isOnCourt) {
      throw new Error("Player to sub in is already on court");
    }

    // Perform atomic swap
    await ctx.db.patch(playerOutStat._id, { isOnCourt: false });
    await ctx.db.patch(playerInStat._id, { isOnCourt: true });

    return {
      message: `${playerIn.name} substituted for ${playerOut.name}`,
      playerOut: { id: playerOut._id, name: playerOut.name },
      playerIn: { id: playerIn._id, name: playerIn.name },
    };
  },
});

// Record team rebound
export const recordTeamRebound = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    teamId: v.id("teams"),
    reboundType: v.union(v.literal("offensive"), v.literal("defensive")),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    // Get or create team stats
    let teamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", args.teamId))
      .first();

    if (!teamStats) {
      // Create team stats if they don't exist
      const teamStatsId = await ctx.db.insert("teamStats", {
        gameId: args.gameId,
        teamId: args.teamId,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
        teamFouls: 0,
      });
      teamStats = await ctx.db.get(teamStatsId);
    }

    if (!teamStats) throw new Error("Failed to create team stats");

    // Update the appropriate rebound count
    const updates =
      args.reboundType === "offensive"
        ? { offensiveRebounds: teamStats.offensiveRebounds + 1 }
        : { defensiveRebounds: teamStats.defensiveRebounds + 1 };

    await ctx.db.patch(teamStats._id, updates);

    const team = await ctx.db.get(args.teamId);

    return {
      message: `Team ${args.reboundType} rebound recorded for ${team?.name || "team"}`,
      teamStats: {
        offensiveRebounds:
          args.reboundType === "offensive"
            ? teamStats.offensiveRebounds + 1
            : teamStats.offensiveRebounds,
        defensiveRebounds:
          args.reboundType === "defensive"
            ? teamStats.defensiveRebounds + 1
            : teamStats.defensiveRebounds,
      },
    };
  },
});

// Get live stats for a game
export const getLiveStats = query({
  args: {
    token: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Get all player stats for this game
    const stats = await ctx.db
      .query("playerStats")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const formattedStats = await Promise.all(
      stats.map(async (stat) => {
        const player = await ctx.db.get(stat.playerId);
        const team = player ? await ctx.db.get(player.teamId) : null;

        return {
          id: stat._id,
          playerId: stat.playerId,
          teamId: stat.teamId,
          points: stat.points,
          rebounds: stat.rebounds,
          offensiveRebounds: stat.offensiveRebounds || 0,
          defensiveRebounds: stat.defensiveRebounds || 0,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls: stat.fouls,
          fouledOut: stat.fouledOut || false,
          fieldGoalsMade: stat.fieldGoalsMade,
          fieldGoalsAttempted: stat.fieldGoalsAttempted,
          threePointersMade: stat.threePointersMade,
          threePointersAttempted: stat.threePointersAttempted,
          freeThrowsMade: stat.freeThrowsMade,
          freeThrowsAttempted: stat.freeThrowsAttempted,
          minutesPlayed: stat.minutesPlayed,
          plusMinus: stat.plusMinus,
          isOnCourt: stat.isOnCourt,
          player: player
            ? {
                id: player._id,
                name: player.name,
                number: player.number,
                position: player.position,
              }
            : null,
          isHomeTeam: stat.teamId === game.homeTeamId,
        };
      })
    );

    // Get team stats
    const homeTeamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", game.homeTeamId))
      .first();

    const awayTeamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", game.awayTeamId))
      .first();

    // Get game settings
    const gameSettings = (game.gameSettings as any) || {};
    const foulLimit = gameSettings.foulLimit || 5;
    const bonusMode = gameSettings.bonusMode || "college";
    const timeoutsPerTeam = gameSettings.timeoutsPerTeam || 4;

    // Calculate bonus status for each team based on opponent's fouls this quarter
    const currentQuarter = game.currentQuarter;

    const getTeamFoulsThisQuarter = (foulsByQuarter: any) => {
      if (!foulsByQuarter) return 0;
      if (currentQuarter === 1) return foulsByQuarter.q1 || 0;
      if (currentQuarter === 2) return foulsByQuarter.q2 || 0;
      if (currentQuarter === 3) return foulsByQuarter.q3 || 0;
      if (currentQuarter === 4) return foulsByQuarter.q4 || 0;
      return foulsByQuarter.ot || 0;
    };

    const homeFoulsThisQuarter = getTeamFoulsThisQuarter(homeTeamStats?.foulsByQuarter);
    const awayFoulsThisQuarter = getTeamFoulsThisQuarter(awayTeamStats?.foulsByQuarter);

    // Home team is in bonus when AWAY team has enough fouls (and vice versa)
    const calculateBonus = (opponentFouls: number) => {
      if (bonusMode === "nba") {
        return {
          inBonus: opponentFouls >= 5,
          inDoubleBonus: opponentFouls >= 5,
        };
      } else {
        return {
          inBonus: opponentFouls >= 7,
          inDoubleBonus: opponentFouls >= 10,
        };
      }
    };

    const homeBonus = calculateBonus(awayFoulsThisQuarter);
    const awayBonus = calculateBonus(homeFoulsThisQuarter);

    return {
      game: {
        id: game._id,
        status: game.status,
        currentQuarter: game.currentQuarter,
        timeRemainingSeconds: game.timeRemainingSeconds,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        foulLimit,
        bonusMode,
        timeoutsPerTeam,
      },
      stats: formattedStats,
      teamStats: {
        home: {
          offensiveRebounds: homeTeamStats?.offensiveRebounds || 0,
          defensiveRebounds: homeTeamStats?.defensiveRebounds || 0,
          teamFouls: homeTeamStats?.teamFouls || 0,
          foulsThisQuarter: homeFoulsThisQuarter,
          foulsByQuarter: homeTeamStats?.foulsByQuarter || { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
          timeoutsRemaining: homeTeamStats?.timeoutsRemaining ?? timeoutsPerTeam,
          inBonus: homeBonus.inBonus,
          inDoubleBonus: homeBonus.inDoubleBonus,
        },
        away: {
          offensiveRebounds: awayTeamStats?.offensiveRebounds || 0,
          defensiveRebounds: awayTeamStats?.defensiveRebounds || 0,
          teamFouls: awayTeamStats?.teamFouls || 0,
          foulsThisQuarter: awayFoulsThisQuarter,
          foulsByQuarter: awayTeamStats?.foulsByQuarter || { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 },
          timeoutsRemaining: awayTeamStats?.timeoutsRemaining ?? timeoutsPerTeam,
          inBonus: awayBonus.inBonus,
          inDoubleBonus: awayBonus.inDoubleBonus,
        },
      },
    };
  },
});

// Update player minutes
export const updateMinutes = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    await ctx.db.patch(playerStat._id, {
      minutesPlayed: args.minutes,
    });

    return { message: "Minutes updated" };
  },
});

// Helper function to calculate bonus status
function calculateBonusStatus(
  teamFoulsInQuarter: number,
  bonusMode: "college" | "nba"
): { inBonus: boolean; inDoubleBonus: boolean } {
  if (bonusMode === "nba") {
    // NBA: 5+ team fouls in quarter = bonus (2 FTs)
    return {
      inBonus: teamFoulsInQuarter >= 5,
      inDoubleBonus: teamFoulsInQuarter >= 5, // NBA doesn't have separate double bonus
    };
  } else {
    // College: 7+ fouls = bonus (1-and-1), 10+ = double bonus (2 FTs)
    return {
      inBonus: teamFoulsInQuarter >= 7,
      inDoubleBonus: teamFoulsInQuarter >= 10,
    };
  }
}

// Helper function to calculate free throws awarded
function calculateFreeThrowsAwarded(
  foulType: string,
  shotType: string | undefined,
  wasAndOne: boolean,
  inBonus: boolean,
  inDoubleBonus: boolean,
  bonusMode: "college" | "nba"
): number {
  // Technical and flagrant fouls always award free throws
  if (foulType === "technical") return 2;
  if (foulType === "flagrant1") return 2;
  if (foulType === "flagrant2") return 2;

  // Offensive fouls never award free throws
  if (foulType === "offensive") return 0;

  // Shooting fouls
  if (foulType === "shooting") {
    if (wasAndOne) return 1; // And-1: already made the shot, get 1 FT
    if (shotType === "3pt") return 3;
    return 2;
  }

  // Personal fouls - depends on bonus situation
  if (foulType === "personal") {
    if (!inBonus) return 0;
    if (bonusMode === "nba" || inDoubleBonus) return 2;
    return 1; // College bonus (1-and-1) - we'll handle the "and-1" logic in frontend
  }

  return 0;
}

// Record a foul with full context (for enhanced foul tracking)
export const recordFoulWithContext = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    foulType: v.union(
      v.literal("personal"),
      v.literal("shooting"),
      v.literal("offensive"),
      v.literal("technical"),
      v.literal("flagrant1"),
      v.literal("flagrant2")
    ),
    wasAndOne: v.optional(v.boolean()), // Shot made while fouled
    shotType: v.optional(v.union(v.literal("2pt"), v.literal("3pt"))), // For shooting fouls
    fouledPlayerId: v.optional(v.id("players")), // The player who was fouled (for shooting fouls)
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const gameSettings = (game.gameSettings as any) || {};
    const foulLimit = gameSettings.foulLimit || 5;
    const bonusMode = gameSettings.bonusMode || "college";

    // Update player's personal foul count
    const newFoulCount = playerStat.fouls + 1;
    const playerFouledOut = newFoulCount >= foulLimit;

    const playerUpdates: any = {
      fouls: newFoulCount,
    };

    if (playerFouledOut) {
      playerUpdates.fouledOut = true;
      playerUpdates.isOnCourt = false;
    }

    await ctx.db.patch(playerStat._id, playerUpdates);

    // Get or create team stats and update team fouls
    let teamStats = await ctx.db
      .query("teamStats")
      .withIndex("by_game_team", (q) => q.eq("gameId", args.gameId).eq("teamId", player.teamId))
      .first();

    const currentQuarter = game.currentQuarter;
    let foulsByQuarter = teamStats?.foulsByQuarter || { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 };

    // Increment fouls for current quarter (only for non-offensive fouls)
    if (args.foulType !== "offensive") {
      if (currentQuarter === 1) foulsByQuarter.q1++;
      else if (currentQuarter === 2) foulsByQuarter.q2++;
      else if (currentQuarter === 3) foulsByQuarter.q3++;
      else if (currentQuarter === 4) foulsByQuarter.q4++;
      else foulsByQuarter.ot++;
    }

    if (teamStats) {
      await ctx.db.patch(teamStats._id, {
        teamFouls: teamStats.teamFouls + 1,
        foulsByQuarter,
      });
    } else {
      await ctx.db.insert("teamStats", {
        gameId: args.gameId,
        teamId: player.teamId,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
        teamFouls: 1,
        foulsByQuarter,
      });
    }

    // Calculate current quarter team fouls for bonus
    let teamFoulsThisQuarter = 0;
    if (currentQuarter === 1) teamFoulsThisQuarter = foulsByQuarter.q1;
    else if (currentQuarter === 2) teamFoulsThisQuarter = foulsByQuarter.q2;
    else if (currentQuarter === 3) teamFoulsThisQuarter = foulsByQuarter.q3;
    else if (currentQuarter === 4) teamFoulsThisQuarter = foulsByQuarter.q4;
    else teamFoulsThisQuarter = foulsByQuarter.ot;

    const { inBonus, inDoubleBonus } = calculateBonusStatus(teamFoulsThisQuarter, bonusMode);

    // Calculate free throws awarded
    const freeThrowsAwarded = calculateFreeThrowsAwarded(
      args.foulType,
      args.shotType,
      args.wasAndOne || false,
      inBonus,
      inDoubleBonus,
      bonusMode
    );

    // Log the event
    const foulTypeLabel = {
      personal: "Personal Foul",
      shooting: "Shooting Foul",
      offensive: "Offensive Foul",
      technical: "Technical Foul",
      flagrant1: "Flagrant 1",
      flagrant2: "Flagrant 2",
    }[args.foulType];

    const isHomeTeam = player.teamId === game.homeTeamId;

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "foul",
      playerId: args.playerId,
      teamId: player.teamId,
      quarter: currentQuarter,
      gameTime: game.timeRemainingSeconds,
      timestamp: Date.now(),
      details: {
        foulType: args.foulType,
        wasAndOne: args.wasAndOne,
        shotType: args.shotType,
        fouledPlayerId: args.fouledPlayerId,
        freeThrowsAwarded,
        playerFoulCount: newFoulCount,
        playerFouledOut,
        isHomeTeam,
      },
      description: `#${player.number} ${player.name} - ${foulTypeLabel}${playerFouledOut ? " (FOULED OUT)" : ""}`,
    });

    return {
      freeThrowsAwarded,
      inBonus,
      inDoubleBonus,
      playerFouledOut,
      playerFoulCount: newFoulCount,
      teamFoulsThisQuarter,
      bonusMode,
      // For shooting fouls, return the player who should shoot FTs
      freeThrowShooterId: args.foulType === "shooting" ? args.fouledPlayerId : undefined,
    };
  },
});

// Record free throw result
export const recordFreeThrow = mutation({
  args: {
    token: v.string(),
    gameId: v.id("games"),
    playerId: v.id("players"),
    made: v.boolean(),
    attemptNumber: v.number(), // 1, 2, or 3
    totalAttempts: v.number(), // Total FTs in this sequence
    isOneAndOne: v.optional(v.boolean()), // College 1-and-1 situation
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const role = await getUserLeagueRole(ctx, user._id, game.leagueId);
    if (!role || !["owner", "admin", "coach", "scorekeeper"].includes(role)) {
      throw new Error("Access denied");
    }

    const playerStat = await ctx.db
      .query("playerStats")
      .withIndex("by_game_player", (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId))
      .first();

    if (!playerStat) throw new Error("Player stat not found");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const isHomeTeam = player.teamId === game.homeTeamId;

    // Update player stats
    const updates: any = {
      freeThrowsAttempted: playerStat.freeThrowsAttempted + 1,
    };

    if (args.made) {
      updates.freeThrowsMade = playerStat.freeThrowsMade + 1;
      updates.points = playerStat.points + 1;
    }

    await ctx.db.patch(playerStat._id, updates);

    // Update game score if made
    if (args.made) {
      const newHomeScore = isHomeTeam ? game.homeScore + 1 : game.homeScore;
      const newAwayScore = isHomeTeam ? game.awayScore : game.awayScore + 1;

      await ctx.db.patch(args.gameId, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
      });

      // Update plus/minus for all on-court players
      const allPlayerStats = await ctx.db
        .query("playerStats")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect();

      for (const stat of allPlayerStats) {
        if (stat.isOnCourt) {
          const statPlayer = await ctx.db.get(stat.playerId);
          if (statPlayer) {
            const isStatPlayerHomeTeam = statPlayer.teamId === game.homeTeamId;
            const plusMinusDelta = isStatPlayerHomeTeam === isHomeTeam ? 1 : -1;
            await ctx.db.patch(stat._id, {
              plusMinus: stat.plusMinus + plusMinusDelta,
            });
          }
        }
      }

      // Update scoreByPeriod in gameSettings
      const gameSettings = (game.gameSettings as any) || {};
      const scoreByPeriod = gameSettings.scoreByPeriod || {};
      const currentQ = game.currentQuarter;
      const periodKey = currentQ <= 4 ? `q${currentQ}` : `ot${currentQ - 4}`;

      scoreByPeriod[periodKey] = {
        home: newHomeScore,
        away: newAwayScore,
      };

      await ctx.db.patch(args.gameId, {
        gameSettings: { ...gameSettings, scoreByPeriod },
      });
    }

    // Calculate current score for the event (after this action)
    const currentHomeScore = args.made && isHomeTeam ? game.homeScore + 1 : game.homeScore;
    const currentAwayScore = args.made && !isHomeTeam ? game.awayScore + 1 : game.awayScore;

    // Log the event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      eventType: "freethrow",
      playerId: args.playerId,
      teamId: player.teamId,
      quarter: game.currentQuarter,
      gameTime: game.timeRemainingSeconds,
      timestamp: Date.now(),
      details: {
        made: args.made,
        attemptNumber: args.attemptNumber,
        totalAttempts: args.totalAttempts,
        isOneAndOne: args.isOneAndOne,
        points: args.made ? 1 : 0,
        homeScore: currentHomeScore,
        awayScore: currentAwayScore,
        isHomeTeam,
      },
      description: `#${player.number} ${player.name} - FT ${args.made ? "Made" : "Missed"} (${args.attemptNumber}/${args.totalAttempts})`,
    });

    // Determine if sequence continues
    // For 1-and-1: if first FT missed, sequence ends
    const sequenceEnds =
      args.isOneAndOne && args.attemptNumber === 1 && !args.made
        ? true
        : args.attemptNumber >= args.totalAttempts;

    const updatedGame = await ctx.db.get(args.gameId);

    return {
      made: args.made,
      attemptNumber: args.attemptNumber,
      sequenceContinues: !sequenceEnds,
      nextAttemptNumber: sequenceEnds ? null : args.attemptNumber + 1,
      gameScore: {
        homeScore: updatedGame!.homeScore,
        awayScore: updatedGame!.awayScore,
      },
    };
  },
});
