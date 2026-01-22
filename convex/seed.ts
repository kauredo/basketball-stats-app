import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Realistic basketball player names
const FIRST_NAMES = [
  "Marcus", "DeShawn", "Jamal", "Tyrone", "Kevin", "Chris", "Anthony", "Michael",
  "LeBron", "Kobe", "Dwyane", "Carmelo", "Russell", "Stephen", "James", "Paul",
  "Blake", "Kyrie", "Damian", "Kawhi", "Giannis", "Luka", "Jayson", "Ja",
  "Zion", "Trae", "Devin", "Brandon", "Tyler", "Malik", "Jalen", "Cade",
];

const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia",
  "Robinson", "Clark", "Lewis", "Walker", "Hall", "Young", "King", "Wright",
  "Hill", "Scott", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell",
];

// NBA-style team data
const TEAM_DATA = [
  { name: "Thunder", city: "Oklahoma City" },
  { name: "Lakers", city: "Los Angeles" },
  { name: "Warriors", city: "Golden State" },
  { name: "Celtics", city: "Boston" },
  { name: "Heat", city: "Miami" },
  { name: "Bulls", city: "Chicago" },
  { name: "Mavericks", city: "Dallas" },
  { name: "Suns", city: "Phoenix" },
  { name: "Nuggets", city: "Denver" },
  { name: "Bucks", city: "Milwaukee" },
];

const POSITIONS: ("PG" | "SG" | "SF" | "PF" | "C")[] = ["PG", "SG", "SF", "PF", "C"];

// Shot zones with realistic court coordinates
const SHOT_ZONES = {
  paint: { xRange: [-8, 8], yRange: [0, 14], type: "2pt" as const },
  midrange: { xRange: [-20, 20], yRange: [5, 20], type: "2pt" as const },
  corner3: { xRange: [-22, -22], yRange: [0, 5], type: "3pt" as const }, // Will randomize left/right
  wing3: { xRange: [-23, 23], yRange: [8, 18], type: "3pt" as const },
  top3: { xRange: [-15, 15], yRange: [23, 28], type: "3pt" as const },
  ft: { xRange: [-1, 1], yRange: [15, 15], type: "ft" as const },
};

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePlayerName(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

function generateBirthDate(): string {
  // Players aged 19-35
  const year = randomBetween(1989, 2005);
  const month = randomBetween(1, 12).toString().padStart(2, "0");
  const day = randomBetween(1, 28).toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateHeight(position: string): number {
  // Height in cm based on position
  const baseHeights: Record<string, [number, number]> = {
    PG: [175, 193],
    SG: [188, 201],
    SF: [196, 208],
    PF: [201, 213],
    C: [206, 221],
  };
  const [min, max] = baseHeights[position] || [185, 205];
  return randomBetween(min, max);
}

function generateWeight(height: number): number {
  // Weight in kg, correlated with height
  const baseWeight = (height - 100) * 0.9;
  return Math.round(baseWeight + randomBetween(-5, 15));
}

function hashPassword(password: string): string {
  // Simple hash for demo purposes - in production use proper bcrypt
  return `hashed_${password}_${Date.now()}`;
}

// Generate realistic shot location
function generateShotLocation(zone: keyof typeof SHOT_ZONES): { x: number; y: number } {
  const config = SHOT_ZONES[zone];
  let x: number, y: number;

  if (zone === "corner3") {
    // Corner 3s are at fixed x positions
    x = Math.random() > 0.5 ? 22 : -22;
    y = randomFloat(0, 5);
  } else {
    x = randomFloat(config.xRange[0], config.xRange[1]);
    y = randomFloat(config.yRange[0], config.yRange[1]);
  }

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// Generate game stats for a player (realistic distributions)
function generatePlayerGameStats(isStarter: boolean) {
  const minutesPlayed = isStarter ? randomBetween(24, 38) : randomBetween(8, 22);
  const minutesFactor = minutesPlayed / 36; // Per-36 scaling

  // Shot attempts scale with minutes
  const fgAttempted = Math.round(randomBetween(5, 18) * minutesFactor);
  const threeAttempted = Math.round(randomBetween(1, 10) * minutesFactor);
  const ftAttempted = Math.round(randomBetween(0, 8) * minutesFactor);

  // Shooting percentages (realistic ranges)
  const fgPct = randomFloat(0.35, 0.55);
  const threePct = randomFloat(0.28, 0.42);
  const ftPct = randomFloat(0.65, 0.90);

  const fgMade = Math.round(fgAttempted * fgPct);
  const threeMade = Math.round(threeAttempted * threePct);
  const ftMade = Math.round(ftAttempted * ftPct);

  // Two pointers (excluding threes from FG)
  const twoAttempted = fgAttempted - threeAttempted;
  const twoMade = fgMade - threeMade;

  const points = twoMade * 2 + threeMade * 3 + ftMade;

  return {
    minutesPlayed,
    points,
    fieldGoalsMade: fgMade,
    fieldGoalsAttempted: fgAttempted,
    threePointersMade: Math.max(0, threeMade),
    threePointersAttempted: Math.max(0, threeAttempted),
    freeThrowsMade: ftMade,
    freeThrowsAttempted: ftAttempted,
    rebounds: Math.round(randomBetween(1, 12) * minutesFactor),
    offensiveRebounds: Math.round(randomBetween(0, 4) * minutesFactor),
    defensiveRebounds: Math.round(randomBetween(1, 8) * minutesFactor),
    assists: Math.round(randomBetween(0, 10) * minutesFactor),
    steals: Math.round(randomBetween(0, 3) * minutesFactor),
    blocks: Math.round(randomBetween(0, 3) * minutesFactor),
    turnovers: Math.round(randomBetween(0, 5) * minutesFactor),
    fouls: randomBetween(0, 5),
    plusMinus: randomBetween(-15, 15),
  };
}

// Main seed mutation
export const seedDatabase = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
    numTeams: v.optional(v.number()),
    numGamesPerTeam: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numTeams = args.numTeams ?? 4;
    const numGamesPerTeam = args.numGamesPerTeam ?? 5;

    // Optionally clear existing data
    if (args.clearExisting) {
      const tables = [
        "shots",
        "gameEvents",
        "playerStats",
        "teamStats",
        "games",
        "players",
        "teams",
        "leagueMemberships",
        "leagues",
        "sessions",
        "users",
      ];

      for (const table of tables) {
        const records = await ctx.db.query(table as any).collect();
        for (const record of records) {
          await ctx.db.delete(record._id);
        }
      }
    }

    // Create demo user
    const userId = await ctx.db.insert("users", {
      email: "demo@example.com",
      passwordHash: hashPassword("demo123"),
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      confirmedAt: Date.now(),
    });

    // Create second user for variety
    const userId2 = await ctx.db.insert("users", {
      email: "coach@example.com",
      passwordHash: hashPassword("coach123"),
      firstName: "Coach",
      lastName: "Smith",
      role: "user",
      confirmedAt: Date.now(),
    });

    // Create a session for the demo user
    const sessionToken = `demo_token_${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId,
      token: sessionToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      refreshToken: `refresh_${Date.now()}`,
      refreshExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
    });

    // Create league
    const leagueId = await ctx.db.insert("leagues", {
      name: "City Basketball League",
      description: "Premier recreational basketball league for all skill levels",
      leagueType: "recreational",
      season: "2024-2025",
      status: "active",
      isPublic: true,
      createdById: userId,
      ownerId: userId,
    });

    // Create league membership for both users
    await ctx.db.insert("leagueMemberships", {
      userId,
      leagueId,
      role: "admin",
      status: "active",
      joinedAt: Date.now(),
    });

    await ctx.db.insert("leagueMemberships", {
      userId: userId2,
      leagueId,
      role: "coach",
      status: "active",
      joinedAt: Date.now(),
    });

    // Create teams
    const teamIds: Id<"teams">[] = [];
    const teamsToCreate = TEAM_DATA.slice(0, numTeams);

    for (const teamData of teamsToCreate) {
      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        city: teamData.city,
        leagueId,
        userId,
      });
      teamIds.push(teamId);
    }

    // Create players for each team
    const playersByTeam: Map<Id<"teams">, Id<"players">[]> = new Map();

    for (const teamId of teamIds) {
      const playerIds: Id<"players">[] = [];
      const usedNumbers = new Set<number>();

      // Create 10-12 players per team
      const numPlayers = randomBetween(10, 12);

      for (let i = 0; i < numPlayers; i++) {
        // Generate unique jersey number
        let number: number;
        do {
          number = randomBetween(0, 99);
        } while (usedNumbers.has(number));
        usedNumbers.add(number);

        const position = POSITIONS[i % 5]; // Ensure balanced positions
        const height = generateHeight(position);

        const playerId = await ctx.db.insert("players", {
          teamId,
          name: generatePlayerName(),
          number,
          position,
          heightCm: height,
          weightKg: generateWeight(height),
          birthDate: generateBirthDate(),
          active: true,
        });

        playerIds.push(playerId);
      }

      playersByTeam.set(teamId, playerIds);
    }

    // Create games between teams
    const gameIds: Id<"games">[] = [];
    const gamesCreated = new Set<string>();

    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        // Create multiple games between each pair
        const gamesToCreate = Math.min(numGamesPerTeam, 2);

        for (let g = 0; g < gamesToCreate; g++) {
          const homeTeamId = g % 2 === 0 ? teamIds[i] : teamIds[j];
          const awayTeamId = g % 2 === 0 ? teamIds[j] : teamIds[i];

          const gameKey = `${homeTeamId}-${awayTeamId}-${g}`;
          if (gamesCreated.has(gameKey)) continue;
          gamesCreated.add(gameKey);

          // Mix of completed and scheduled games
          const isCompleted = Math.random() > 0.2;
          const scheduledAt = Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000;

          let homeScore = 0;
          let awayScore = 0;
          let status: "scheduled" | "completed" = "scheduled";

          if (isCompleted) {
            homeScore = randomBetween(75, 120);
            awayScore = randomBetween(75, 120);
            status = "completed";
          }

          const gameId = await ctx.db.insert("games", {
            homeTeamId,
            awayTeamId,
            leagueId,
            scheduledAt,
            startedAt: isCompleted ? scheduledAt : undefined,
            endedAt: isCompleted ? scheduledAt + 2 * 60 * 60 * 1000 : undefined,
            status,
            currentQuarter: isCompleted ? 4 : 1,
            timeRemainingSeconds: isCompleted ? 0 : 720,
            homeScore,
            awayScore,
            gameSettings: {
              quarterMinutes: 12,
              foulLimit: 6,
              timeoutsPerTeam: 7,
            },
            userId,
          });

          gameIds.push(gameId);

          // Create stats for completed games
          if (isCompleted) {
            const homePlayers = playersByTeam.get(homeTeamId) || [];
            const awayPlayers = playersByTeam.get(awayTeamId) || [];

            // Track actual scores from player stats
            let actualHomeScore = 0;
            let actualAwayScore = 0;

            // Create player stats for home team
            for (let p = 0; p < Math.min(10, homePlayers.length); p++) {
              const playerId = homePlayers[p];
              const isStarter = p < 5;
              const stats = generatePlayerGameStats(isStarter);

              actualHomeScore += stats.points;

              await ctx.db.insert("playerStats", {
                playerId,
                gameId,
                teamId: homeTeamId,
                ...stats,
                fouledOut: stats.fouls >= 6,
                isOnCourt: false,
              });

              // Create shots for this player
              const numShots = stats.fieldGoalsAttempted;
              for (let s = 0; s < numShots; s++) {
                const isMade = s < stats.fieldGoalsMade;
                const isThree = s < stats.threePointersAttempted;

                const zone = isThree
                  ? randomChoice(["corner3", "wing3", "top3"] as const)
                  : randomChoice(["paint", "midrange"] as const);

                const { x, y } = generateShotLocation(zone);

                await ctx.db.insert("shots", {
                  playerId,
                  gameId,
                  teamId: homeTeamId,
                  x,
                  y,
                  shotType: isThree ? "3pt" : "2pt",
                  made: isMade,
                  quarter: randomBetween(1, 4),
                  timeRemaining: randomBetween(0, 720),
                  shotZone: zone,
                });
              }
            }

            // Create player stats for away team
            for (let p = 0; p < Math.min(10, awayPlayers.length); p++) {
              const playerId = awayPlayers[p];
              const isStarter = p < 5;
              const stats = generatePlayerGameStats(isStarter);

              actualAwayScore += stats.points;

              await ctx.db.insert("playerStats", {
                playerId,
                gameId,
                teamId: awayTeamId,
                ...stats,
                fouledOut: stats.fouls >= 6,
                isOnCourt: false,
              });

              // Create shots for this player
              const numShots = stats.fieldGoalsAttempted;
              for (let s = 0; s < numShots; s++) {
                const isMade = s < stats.fieldGoalsMade;
                const isThree = s < stats.threePointersAttempted;

                const zone = isThree
                  ? randomChoice(["corner3", "wing3", "top3"] as const)
                  : randomChoice(["paint", "midrange"] as const);

                const { x, y } = generateShotLocation(zone);

                await ctx.db.insert("shots", {
                  playerId,
                  gameId,
                  teamId: awayTeamId,
                  x,
                  y,
                  shotType: isThree ? "3pt" : "2pt",
                  made: isMade,
                  quarter: randomBetween(1, 4),
                  timeRemaining: randomBetween(0, 720),
                  shotZone: zone,
                });
              }
            }

            // Update game with actual scores from stats
            await ctx.db.patch(gameId, {
              homeScore: actualHomeScore,
              awayScore: actualAwayScore,
            });

            // Create team stats
            await ctx.db.insert("teamStats", {
              gameId,
              teamId: homeTeamId,
              offensiveRebounds: randomBetween(8, 15),
              defensiveRebounds: randomBetween(25, 38),
              teamFouls: randomBetween(15, 25),
              foulsByQuarter: {
                q1: randomBetween(3, 7),
                q2: randomBetween(3, 7),
                q3: randomBetween(3, 7),
                q4: randomBetween(3, 7),
                ot: 0,
              },
            });

            await ctx.db.insert("teamStats", {
              gameId,
              teamId: awayTeamId,
              offensiveRebounds: randomBetween(8, 15),
              defensiveRebounds: randomBetween(25, 38),
              teamFouls: randomBetween(15, 25),
              foulsByQuarter: {
                q1: randomBetween(3, 7),
                q2: randomBetween(3, 7),
                q3: randomBetween(3, 7),
                q4: randomBetween(3, 7),
                ot: 0,
              },
            });

            // Create some game events
            const eventTypes = ["shot", "rebound", "assist", "foul", "turnover"];
            for (let e = 0; e < 20; e++) {
              const eventType = randomChoice(eventTypes);
              const isHome = Math.random() > 0.5;
              const teamId = isHome ? homeTeamId : awayTeamId;
              const players = isHome ? homePlayers : awayPlayers;
              const playerId = randomChoice(players);

              await ctx.db.insert("gameEvents", {
                gameId,
                eventType,
                playerId,
                teamId,
                quarter: randomBetween(1, 4),
                gameTime: randomBetween(0, 720),
                timestamp: scheduledAt + randomBetween(0, 7200000),
                description: `${eventType} by player`,
              });
            }
          }
        }
      }
    }

    // Create one active game for live demo
    if (teamIds.length >= 2) {
      const activeGameId = await ctx.db.insert("games", {
        homeTeamId: teamIds[0],
        awayTeamId: teamIds[1],
        leagueId,
        scheduledAt: Date.now(),
        startedAt: Date.now() - 30 * 60 * 1000, // Started 30 mins ago
        status: "active",
        currentQuarter: 2,
        timeRemainingSeconds: 420,
        homeScore: randomBetween(25, 45),
        awayScore: randomBetween(25, 45),
        gameSettings: {
          quarterMinutes: 12,
          foulLimit: 6,
          timeoutsPerTeam: 7,
          homeTimeouts: 5,
          awayTimeouts: 6,
        },
        userId,
      });

      // Add player stats for active game (players on court)
      const homePlayers = playersByTeam.get(teamIds[0]) || [];
      const awayPlayers = playersByTeam.get(teamIds[1]) || [];

      for (let p = 0; p < Math.min(10, homePlayers.length); p++) {
        const playerId = homePlayers[p];
        const isStarter = p < 5;

        await ctx.db.insert("playerStats", {
          playerId,
          gameId: activeGameId,
          teamId: teamIds[0],
          points: randomBetween(0, 15),
          fieldGoalsMade: randomBetween(0, 5),
          fieldGoalsAttempted: randomBetween(2, 10),
          threePointersMade: randomBetween(0, 3),
          threePointersAttempted: randomBetween(0, 6),
          freeThrowsMade: randomBetween(0, 4),
          freeThrowsAttempted: randomBetween(0, 5),
          rebounds: randomBetween(0, 6),
          assists: randomBetween(0, 4),
          steals: randomBetween(0, 2),
          blocks: randomBetween(0, 2),
          turnovers: randomBetween(0, 3),
          fouls: randomBetween(0, 3),
          minutesPlayed: isStarter ? randomBetween(10, 18) : randomBetween(0, 8),
          plusMinus: randomBetween(-10, 10),
          isOnCourt: isStarter,
        });
      }

      for (let p = 0; p < Math.min(10, awayPlayers.length); p++) {
        const playerId = awayPlayers[p];
        const isStarter = p < 5;

        await ctx.db.insert("playerStats", {
          playerId,
          gameId: activeGameId,
          teamId: teamIds[1],
          points: randomBetween(0, 15),
          fieldGoalsMade: randomBetween(0, 5),
          fieldGoalsAttempted: randomBetween(2, 10),
          threePointersMade: randomBetween(0, 3),
          threePointersAttempted: randomBetween(0, 6),
          freeThrowsMade: randomBetween(0, 4),
          freeThrowsAttempted: randomBetween(0, 5),
          rebounds: randomBetween(0, 6),
          assists: randomBetween(0, 4),
          steals: randomBetween(0, 2),
          blocks: randomBetween(0, 2),
          turnovers: randomBetween(0, 3),
          fouls: randomBetween(0, 3),
          minutesPlayed: isStarter ? randomBetween(10, 18) : randomBetween(0, 8),
          plusMinus: randomBetween(-10, 10),
          isOnCourt: isStarter,
        });
      }
    }

    return {
      message: "Database seeded successfully",
      stats: {
        users: 2,
        leagues: 1,
        teams: teamIds.length,
        players: teamIds.length * 11, // Average
        games: gameIds.length + 1, // +1 for active game
      },
      credentials: {
        demo: { email: "demo@example.com", password: "demo123" },
        coach: { email: "coach@example.com", password: "coach123" },
      },
      sessionToken,
    };
  },
});

// Quick seed for minimal data (faster)
export const seedMinimal = mutation({
  args: {},
  handler: async (ctx) => {
    // Create demo user
    const userId = await ctx.db.insert("users", {
      email: "demo@example.com",
      passwordHash: hashPassword("demo123"),
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      confirmedAt: Date.now(),
    });

    // Create session
    const sessionToken = `demo_token_${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId,
      token: sessionToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      refreshToken: `refresh_${Date.now()}`,
      refreshExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
    });

    // Create league
    const leagueId = await ctx.db.insert("leagues", {
      name: "Test League",
      leagueType: "recreational",
      season: "2024-2025",
      status: "active",
      isPublic: true,
      createdById: userId,
      ownerId: userId,
    });

    await ctx.db.insert("leagueMemberships", {
      userId,
      leagueId,
      role: "admin",
      status: "active",
      joinedAt: Date.now(),
    });

    // Create 2 teams with 5 players each
    const team1Id = await ctx.db.insert("teams", {
      name: "Red Team",
      city: "North City",
      leagueId,
      userId,
    });

    const team2Id = await ctx.db.insert("teams", {
      name: "Blue Team",
      city: "South City",
      leagueId,
      userId,
    });

    // Create players
    for (let i = 0; i < 5; i++) {
      await ctx.db.insert("players", {
        teamId: team1Id,
        name: `Red Player ${i + 1}`,
        number: (i + 1) * 10,
        position: POSITIONS[i],
        active: true,
      });

      await ctx.db.insert("players", {
        teamId: team2Id,
        name: `Blue Player ${i + 1}`,
        number: (i + 1) * 10,
        position: POSITIONS[i],
        active: true,
      });
    }

    return {
      message: "Minimal seed complete",
      credentials: { email: "demo@example.com", password: "demo123" },
      sessionToken,
    };
  },
});

// Clear all data
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "notifications",
      "notificationPreferences",
      "pushSubscriptions",
      "shots",
      "gameEvents",
      "playerStats",
      "teamStats",
      "games",
      "players",
      "teams",
      "leagueMemberships",
      "leagues",
      "sessions",
      "users",
    ];

    let totalDeleted = 0;

    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
        totalDeleted++;
      }
    }

    return { message: `Cleared ${totalDeleted} records from database` };
  },
});
