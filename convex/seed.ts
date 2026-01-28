import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { hashPassword, generateToken, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "./lib/auth";

// Realistic basketball player names
const FIRST_NAMES = [
  "Marcus",
  "DeShawn",
  "Jamal",
  "Tyrone",
  "Kevin",
  "Chris",
  "Anthony",
  "Michael",
  "LeBron",
  "Kobe",
  "Dwyane",
  "Carmelo",
  "Russell",
  "Stephen",
  "James",
  "Paul",
  "Blake",
  "Kyrie",
  "Damian",
  "Kawhi",
  "Giannis",
  "Luka",
  "Jayson",
  "Ja",
  "Zion",
  "Trae",
  "Devin",
  "Brandon",
  "Tyler",
  "Malik",
  "Jalen",
  "Cade",
  "Victor",
  "Scottie",
  "Paolo",
  "Evan",
  "Tyrese",
  "Anthony",
  "Shai",
  "Donovan",
];

const LAST_NAMES = [
  "Johnson",
  "Williams",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Robinson",
  "Clark",
  "Lewis",
  "Walker",
  "Hall",
  "Young",
  "King",
  "Wright",
  "Hill",
  "Scott",
  "Green",
  "Adams",
  "Baker",
  "Nelson",
  "Carter",
  "Mitchell",
  "Wembanyama",
  "Barnes",
  "Banchero",
  "Mobley",
  "Haliburton",
  "Edwards",
  "Gilgeous-Alexander",
  "Murray",
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
  { name: "Nets", city: "Brooklyn" },
  { name: "Knicks", city: "New York" },
];

// Youth league team data
const YOUTH_TEAM_DATA = [
  { name: "Eagles", city: "Northside" },
  { name: "Tigers", city: "Southside" },
  { name: "Hawks", city: "Eastview" },
  { name: "Wolves", city: "Westbrook" },
  { name: "Lions", city: "Central" },
  { name: "Bears", city: "Lakewood" },
];

// Game venue names
const VENUES = [
  "Downtown Arena",
  "Community Center",
  "Lincoln High Gym",
  "Recreation Complex",
  "Sports Pavilion",
  "Championship Court",
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

function randomChoice<T>(arr: readonly T[]): T {
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

// Shot description generators
const SHOT_ACTIONS = {
  paint: [
    "layup",
    "driving layup",
    "reverse layup",
    "finger roll",
    "dunk",
    "floater",
    "hook shot",
    "put-back",
  ],
  midrange: [
    "jump shot",
    "fadeaway",
    "pull-up jumper",
    "turnaround jumper",
    "step-back",
    "bank shot",
  ],
  corner3: ["corner three", "corner 3-pointer"],
  wing3: ["three-pointer", "wing three", "step-back three"],
  top3: ["three-pointer", "deep three", "pull-up three"],
  ft: ["free throw"],
};

const MISS_MODIFIERS = [
  "misses",
  "no good",
  "rattles out",
  "rimmed out",
  "off the mark",
  "bounces off the rim",
];

const MAKE_MODIFIERS = [
  "makes",
  "drains",
  "knocks down",
  "hits",
  "sinks",
  "buries",
  "swishes",
  "splashes",
];

function generateShotDescription(
  playerName: string,
  zone: string,
  made: boolean,
  isThree: boolean,
  points?: number
): string {
  const shotType = SHOT_ACTIONS[zone as keyof typeof SHOT_ACTIONS] || SHOT_ACTIONS.midrange;
  const action = randomChoice(shotType);
  const verb = made ? randomChoice(MAKE_MODIFIERS) : randomChoice(MISS_MODIFIERS);

  if (made && points) {
    return `${playerName} ${verb} ${action} (${points} PTS)`;
  }
  return `${playerName} ${verb} ${action}`;
}

// Foul descriptions
const FOUL_TYPES = [
  "shooting foul",
  "personal foul",
  "loose ball foul",
  "offensive foul",
  "blocking foul",
  "reaching foul",
  "holding foul",
];

function generateFoulDescription(playerName: string, foulCount: number, teamFouls: number): string {
  const foulType = randomChoice(FOUL_TYPES);
  return `${foulType.charAt(0).toUpperCase() + foulType.slice(1)} on ${playerName} (P${foulCount}, T${teamFouls})`;
}

// Rebound descriptions
function generateReboundDescription(
  playerName: string,
  isOffensive: boolean,
  reboundCount: number
): string {
  const type = isOffensive ? "offensive" : "defensive";
  return `${playerName} grabs ${type} rebound (${reboundCount} REB)`;
}

// Assist descriptions
function generateAssistDescription(playerName: string, assistCount: number): string {
  const actions = ["dishes", "finds", "sets up", "assists"];
  return `${playerName} ${randomChoice(actions)} for the basket (${assistCount} AST)`;
}

// Turnover descriptions
const TURNOVER_TYPES = [
  "loses the ball",
  "turnover - bad pass",
  "turnover - out of bounds",
  "turnover - offensive foul",
  "turnover - traveling",
  "turnover - 3 second violation",
  "stripped of the ball",
  "turnover - backcourt violation",
];

function generateTurnoverDescription(playerName: string, toCount: number): string {
  return `${playerName} ${randomChoice(TURNOVER_TYPES)} (${toCount} TO)`;
}

// Block descriptions
function generateBlockDescription(
  blockerName: string,
  shooterName: string,
  blockCount: number
): string {
  const actions = ["blocks", "rejects", "swats away", "denies"];
  return `${blockerName} ${randomChoice(actions)} ${shooterName}'s shot (${blockCount} BLK)`;
}

// Steal descriptions
function generateStealDescription(
  stealerName: string,
  victimName: string,
  stealCount: number
): string {
  const actions = ["steals from", "picks the pocket of", "intercepts pass from", "takes it from"];
  return `${stealerName} ${randomChoice(actions)} ${victimName} (${stealCount} STL)`;
}

// Timeout descriptions
function generateTimeoutDescription(teamName: string, remaining: number): string {
  return `${teamName} timeout (${remaining} remaining)`;
}

// Quarter descriptions
function getQuarterLabel(quarter: number): string {
  if (quarter <= 4) {
    return ["1st", "2nd", "3rd", "4th"][quarter - 1] + " Quarter";
  }
  return `Overtime ${quarter - 4}`;
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

// Player stat tracker for event generation
interface PlayerRunningStats {
  playerId: Id<"players">;
  name: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgm: number;
  fga: number;
  threePm: number;
  threePa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
}

// Generate detailed game events with realistic play-by-play
async function generateDetailedGameEvents(
  ctx: any,
  gameId: Id<"games">,
  homeTeamId: Id<"teams">,
  awayTeamId: Id<"teams">,
  homeTeamName: string,
  awayTeamName: string,
  homePlayers: { id: Id<"players">; name: string }[],
  awayPlayers: { id: Id<"players">; name: string }[],
  gameStartTime: number,
  numQuarters: number,
  quarterMinutes: number,
  targetHomeScore: number,
  targetAwayScore: number
): Promise<{
  homeStats: Map<Id<"players">, PlayerRunningStats>;
  awayStats: Map<Id<"players">, PlayerRunningStats>;
  shots: Array<{
    playerId: Id<"players">;
    teamId: Id<"teams">;
    x: number;
    y: number;
    shotType: "2pt" | "3pt" | "ft";
    made: boolean;
    quarter: number;
    timeRemaining: number;
    shotZone: string;
  }>;
  teamStats: {
    home: { oreb: number; dreb: number; fouls: number; foulsByQuarter: Record<string, number> };
    away: { oreb: number; dreb: number; fouls: number; foulsByQuarter: Record<string, number> };
  };
}> {
  const homeStats = new Map<Id<"players">, PlayerRunningStats>();
  const awayStats = new Map<Id<"players">, PlayerRunningStats>();
  const shots: Array<any> = [];
  const teamStats = {
    home: { oreb: 0, dreb: 0, fouls: 0, foulsByQuarter: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 } },
    away: { oreb: 0, dreb: 0, fouls: 0, foulsByQuarter: { q1: 0, q2: 0, q3: 0, q4: 0, ot: 0 } },
  };

  // Initialize player stats
  for (const p of homePlayers) {
    homeStats.set(p.id, {
      playerId: p.id,
      name: p.name,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fgm: 0,
      fga: 0,
      threePm: 0,
      threePa: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
    });
  }
  for (const p of awayPlayers) {
    awayStats.set(p.id, {
      playerId: p.id,
      name: p.name,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fgm: 0,
      fga: 0,
      threePm: 0,
      threePa: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
    });
  }

  const quarterSeconds = quarterMinutes * 60;
  let homeScore = 0;
  let awayScore = 0;
  let eventTime = gameStartTime;

  // Points per quarter distribution (slightly more in 2nd and 4th quarters)
  const quarterWeights = [0.23, 0.26, 0.24, 0.27];

  for (let quarter = 1; quarter <= numQuarters; quarter++) {
    const quarterKey = (quarter <= 4 ? `q${quarter}` : "ot") as "q1" | "q2" | "q3" | "q4" | "ot";
    const weight = quarter <= 4 ? quarterWeights[quarter - 1] : 0.2;
    const quarterHomeTarget = Math.round(targetHomeScore * weight);
    const quarterAwayTarget = Math.round(targetAwayScore * weight);

    // Quarter start event
    await ctx.db.insert("gameEvents", {
      gameId,
      eventType: "quarter_start",
      quarter,
      gameTime: quarterSeconds,
      timestamp: eventTime,
      description: `Start of ${getQuarterLabel(quarter)}`,
    });

    // Generate possessions (roughly 90-100 possessions per game, ~22-25 per quarter)
    const possessionsPerQuarter = randomBetween(22, 26);
    let quarterHomeScore = 0;
    let quarterAwayScore = 0;
    let timeInQuarter = quarterSeconds;

    for (let poss = 0; poss < possessionsPerQuarter && timeInQuarter > 0; poss++) {
      const isHomePossession = Math.random() > 0.5;
      const players = isHomePossession ? homePlayers : awayPlayers;
      const oppPlayers = isHomePossession ? awayPlayers : homePlayers;
      const stats = isHomePossession ? homeStats : awayStats;
      const oppStats = isHomePossession ? awayStats : homeStats;
      const teamId = isHomePossession ? homeTeamId : awayTeamId;
      const oppTeamId = isHomePossession ? awayTeamId : homeTeamId;
      const teamName = isHomePossession ? homeTeamName : awayTeamName;
      const oppTeamName = isHomePossession ? awayTeamName : homeTeamName;
      const teamStatRef = isHomePossession ? teamStats.home : teamStats.away;
      const oppTeamStatRef = isHomePossession ? teamStats.away : teamStats.home;
      const targetScore = isHomePossession ? quarterHomeTarget : quarterAwayTarget;
      const currentScore = isHomePossession ? quarterHomeScore : quarterAwayScore;

      // Time between possessions (15-30 seconds average)
      timeInQuarter -= randomBetween(15, 30);
      if (timeInQuarter < 0) timeInQuarter = 0;
      eventTime += randomBetween(20000, 40000); // 20-40 seconds real time

      // Decide possession outcome
      const rand = Math.random();
      const needsPoints = currentScore < targetScore * 0.8;
      const scoringBias = needsPoints ? 0.1 : 0;

      // Select primary player (weight towards first 5 - starters)
      const playerIdx =
        Math.random() < 0.75 ? randomBetween(0, 4) : randomBetween(5, players.length - 1);
      const player = players[Math.min(playerIdx, players.length - 1)];
      const playerStats = stats.get(player.id)!;

      if (rand < 0.42 + scoringBias) {
        // Shot attempt
        const isThree = Math.random() < 0.35;
        const shotMadeProb = isThree ? 0.36 : 0.52;
        const made = Math.random() < shotMadeProb;

        const zone = isThree
          ? randomChoice(["corner3", "wing3", "top3"] as const)
          : randomChoice(["paint", "midrange"] as const);
        const { x, y } = generateShotLocation(zone);
        const points = made ? (isThree ? 3 : 2) : 0;

        playerStats.fga++;
        if (isThree) playerStats.threePa++;
        if (made) {
          playerStats.fgm++;
          if (isThree) playerStats.threePm++;
          playerStats.points += points;
          if (isHomePossession) {
            homeScore += points;
            quarterHomeScore += points;
          } else {
            awayScore += points;
            quarterAwayScore += points;
          }

          // Maybe add assist
          if (Math.random() < 0.6 && players.length > 1) {
            const assisterIdx = (playerIdx + randomBetween(1, 4)) % players.length;
            const assister = players[assisterIdx];
            const assisterStats = stats.get(assister.id)!;
            assisterStats.assists++;

            await ctx.db.insert("gameEvents", {
              gameId,
              eventType: "assist",
              playerId: assister.id,
              teamId,
              quarter,
              gameTime: timeInQuarter,
              timestamp: eventTime - 1000,
              description: generateAssistDescription(assister.name, assisterStats.assists),
              details: { assistedPlayerId: player.id },
            });
          }
        }

        shots.push({
          playerId: player.id,
          teamId,
          x,
          y,
          shotType: isThree ? "3pt" : "2pt",
          made,
          quarter,
          timeRemaining: timeInQuarter,
          shotZone: zone,
        });

        await ctx.db.insert("gameEvents", {
          gameId,
          eventType: "shot",
          playerId: player.id,
          teamId,
          quarter,
          gameTime: timeInQuarter,
          timestamp: eventTime,
          description: generateShotDescription(
            player.name,
            zone,
            made,
            isThree,
            made ? playerStats.points : undefined
          ),
          details: {
            made,
            shotType: isThree ? "3pt" : "2pt",
            zone,
            x,
            y,
            points: made ? points : 0,
          },
        });

        // Rebound on miss
        if (!made) {
          const isOffensiveReb = Math.random() < 0.25;
          const rebPlayers = isOffensiveReb ? players : oppPlayers;
          const rebStats = isOffensiveReb ? stats : oppStats;
          const rebTeamId = isOffensiveReb ? teamId : oppTeamId;
          const rebTeamStatRef = isOffensiveReb ? teamStatRef : oppTeamStatRef;
          const rebPlayerIdx = randomBetween(0, Math.min(4, rebPlayers.length - 1));
          const rebounder = rebPlayers[rebPlayerIdx];
          const rebounderStats = rebStats.get(rebounder.id)!;

          rebounderStats.rebounds++;
          if (isOffensiveReb) {
            rebounderStats.oreb++;
            rebTeamStatRef.oreb++;
          } else {
            rebounderStats.dreb++;
            rebTeamStatRef.dreb++;
          }

          await ctx.db.insert("gameEvents", {
            gameId,
            eventType: "rebound",
            playerId: rebounder.id,
            teamId: rebTeamId,
            quarter,
            gameTime: timeInQuarter - 1,
            timestamp: eventTime + 2000,
            description: generateReboundDescription(
              rebounder.name,
              isOffensiveReb,
              rebounderStats.rebounds
            ),
            details: { isOffensive: isOffensiveReb },
          });
        }
      } else if (rand < 0.55) {
        // Turnover
        playerStats.turnovers++;

        await ctx.db.insert("gameEvents", {
          gameId,
          eventType: "turnover",
          playerId: player.id,
          teamId,
          quarter,
          gameTime: timeInQuarter,
          timestamp: eventTime,
          description: generateTurnoverDescription(player.name, playerStats.turnovers),
        });

        // Maybe a steal
        if (Math.random() < 0.6) {
          const stealerIdx = randomBetween(0, Math.min(4, oppPlayers.length - 1));
          const stealer = oppPlayers[stealerIdx];
          const stealerStats = oppStats.get(stealer.id)!;
          stealerStats.steals++;

          await ctx.db.insert("gameEvents", {
            gameId,
            eventType: "steal",
            playerId: stealer.id,
            teamId: oppTeamId,
            quarter,
            gameTime: timeInQuarter,
            timestamp: eventTime + 500,
            description: generateStealDescription(stealer.name, player.name, stealerStats.steals),
          });
        }
      } else if (rand < 0.68) {
        // Foul
        const foulerIdx = randomBetween(0, Math.min(4, oppPlayers.length - 1));
        const fouler = oppPlayers[foulerIdx];
        const foulerStats = oppStats.get(fouler.id)!;
        foulerStats.fouls++;
        oppTeamStatRef.fouls++;
        oppTeamStatRef.foulsByQuarter[quarterKey]++;

        await ctx.db.insert("gameEvents", {
          gameId,
          eventType: "foul",
          playerId: fouler.id,
          teamId: oppTeamId,
          quarter,
          gameTime: timeInQuarter,
          timestamp: eventTime,
          description: generateFoulDescription(
            fouler.name,
            foulerStats.fouls,
            oppTeamStatRef.fouls
          ),
          details: {
            foulCount: foulerStats.fouls,
            teamFouls: oppTeamStatRef.foulsByQuarter[quarterKey],
          },
        });

        // Free throws if shooting foul (60% of fouls)
        if (Math.random() < 0.6) {
          const numFTs = Math.random() < 0.3 ? 3 : 2; // 30% are 3-point fouls
          for (let ft = 0; ft < numFTs; ft++) {
            playerStats.fta++;
            const ftMade = Math.random() < 0.78;
            if (ftMade) {
              playerStats.ftm++;
              playerStats.points++;
              if (isHomePossession) {
                homeScore++;
                quarterHomeScore++;
              } else {
                awayScore++;
                quarterAwayScore++;
              }
            }

            shots.push({
              playerId: player.id,
              teamId,
              x: 0,
              y: 15,
              shotType: "ft" as const,
              made: ftMade,
              quarter,
              timeRemaining: timeInQuarter,
              shotZone: "ft",
            });

            await ctx.db.insert("gameEvents", {
              gameId,
              eventType: "shot",
              playerId: player.id,
              teamId,
              quarter,
              gameTime: timeInQuarter,
              timestamp: eventTime + (ft + 1) * 5000,
              description: `${player.name} ${ftMade ? "makes" : "misses"} free throw ${ft + 1} of ${numFTs}${ftMade ? ` (${playerStats.points} PTS)` : ""}`,
              details: { made: ftMade, shotType: "ft", isFreeThrow: true },
            });
          }
        }
      } else if (rand < 0.72) {
        // Block
        const blockerIdx = randomBetween(0, Math.min(4, oppPlayers.length - 1));
        const blocker = oppPlayers[blockerIdx];
        const blockerStats = oppStats.get(blocker.id)!;
        blockerStats.blocks++;

        await ctx.db.insert("gameEvents", {
          gameId,
          eventType: "block",
          playerId: blocker.id,
          teamId: oppTeamId,
          quarter,
          gameTime: timeInQuarter,
          timestamp: eventTime,
          description: generateBlockDescription(blocker.name, player.name, blockerStats.blocks),
        });
      }
      // Remaining possessions are just clock-burning with no significant event
    }

    // Timeout events (1-2 per quarter per team)
    const numTimeouts = randomBetween(1, 2);
    for (let t = 0; t < numTimeouts; t++) {
      const isHomeTimeout = Math.random() > 0.5;
      const timeoutTime = randomBetween(60, quarterSeconds - 60);
      await ctx.db.insert("gameEvents", {
        gameId,
        eventType: "timeout",
        teamId: isHomeTimeout ? homeTeamId : awayTeamId,
        quarter,
        gameTime: timeoutTime,
        timestamp: eventTime + t * 30000,
        description: generateTimeoutDescription(
          isHomeTimeout ? homeTeamName : awayTeamName,
          randomBetween(3, 6)
        ),
        details: { isHomeTeam: isHomeTimeout },
      });
    }

    // Substitution events (2-4 per quarter per team)
    const numSubs = randomBetween(2, 4);
    for (let s = 0; s < numSubs; s++) {
      for (const isHome of [true, false]) {
        const teamPlayers = isHome ? homePlayers : awayPlayers;
        if (teamPlayers.length > 5) {
          const subOutIdx = randomBetween(0, 4);
          const subInIdx = randomBetween(5, teamPlayers.length - 1);
          const subOut = teamPlayers[subOutIdx];
          const subIn = teamPlayers[subInIdx];
          const subTime = randomBetween(30, quarterSeconds - 30);

          await ctx.db.insert("gameEvents", {
            gameId,
            eventType: "substitution",
            teamId: isHome ? homeTeamId : awayTeamId,
            quarter,
            gameTime: subTime,
            timestamp: eventTime + s * 60000 + (isHome ? 0 : 1000),
            description: `${subIn.name} checks in for ${subOut.name}`,
            details: {
              playerIn: subIn.id,
              playerOut: subOut.id,
              isHomeTeam: isHome,
            },
          });
        }
      }
    }

    // Quarter end event
    eventTime += quarterSeconds * 1000;
    await ctx.db.insert("gameEvents", {
      gameId,
      eventType: "quarter_end",
      quarter,
      gameTime: 0,
      timestamp: eventTime,
      description: `End of ${getQuarterLabel(quarter)} - Score: ${homeTeamName} ${homeScore}, ${awayTeamName} ${awayScore}`,
      details: { homeScore, awayScore },
    });
  }

  return { homeStats, awayStats, shots, teamStats };
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
  const ftPct = randomFloat(0.65, 0.9);

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
    detailedEvents: v.optional(v.boolean()), // Generate detailed play-by-play (slower but richer)
  },
  handler: async (ctx, args) => {
    const numTeams = args.numTeams ?? 6;
    const numGamesPerTeam = args.numGamesPerTeam ?? 6;
    const detailedEvents = args.detailedEvents ?? true;

    // Optionally clear existing data
    if (args.clearExisting) {
      const tables = [
        "lineupStints",
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
      passwordHash: await hashPassword("demo123"),
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      confirmedAt: Date.now(),
    });

    // Create second user for variety
    const userId2 = await ctx.db.insert("users", {
      email: "coach@example.com",
      passwordHash: await hashPassword("coach123"),
      firstName: "Coach",
      lastName: "Smith",
      role: "user",
      confirmedAt: Date.now(),
    });

    // Create a session for the demo user
    const sessionToken = generateToken(64);
    const refreshToken = generateToken(64);
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId,
      token: sessionToken,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
    });

    // Create main league
    const leagueId = await ctx.db.insert("leagues", {
      name: "City Basketball League",
      description:
        "Premier recreational basketball league for all skill levels. Season runs September through March with playoffs in April.",
      leagueType: "recreational",
      season: "2024-2025",
      status: "active",
      isPublic: true,
      createdById: userId,
      ownerId: userId,
      inviteCode: `city-basketball-league-${generateToken(6)}`,
      settings: {
        quarterMinutes: 12,
        foulLimit: 6,
        timeoutsPerTeam: 7,
        overtimeMinutes: 5,
        bonusMode: "nba",
        playersPerRoster: 15,
        trackAdvancedStats: true,
      },
    });

    // Create youth league
    const youthLeagueId = await ctx.db.insert("leagues", {
      name: "Junior Hoops Academy",
      description:
        "Youth development basketball league for ages 10-14. Focus on fundamentals, sportsmanship, and fun.",
      leagueType: "youth",
      season: "2024-2025",
      status: "active",
      isPublic: true,
      createdById: userId,
      ownerId: userId,
      inviteCode: `junior-hoops-${generateToken(6)}`,
      settings: {
        quarterMinutes: 8,
        foulLimit: 5,
        timeoutsPerTeam: 4,
        overtimeMinutes: 3,
        bonusMode: "college",
        playersPerRoster: 12,
        trackAdvancedStats: false,
      },
    });

    // Create league membership for both users in main league
    await ctx.db.insert("leagueMemberships", {
      userId,
      leagueId,
      role: "admin",
      status: "active",
      joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // Joined 90 days ago
    });

    await ctx.db.insert("leagueMemberships", {
      userId: userId2,
      leagueId,
      role: "coach",
      status: "active",
      joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // Joined 60 days ago
    });

    // Create league membership for demo user in youth league
    await ctx.db.insert("leagueMemberships", {
      userId,
      leagueId: youthLeagueId,
      role: "admin",
      status: "active",
      joinedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    });

    // Create teams for main league
    const teamIds: Id<"teams">[] = [];
    const teamNames: Map<Id<"teams">, string> = new Map();
    const teamsToCreate = TEAM_DATA.slice(0, numTeams);

    for (const teamData of teamsToCreate) {
      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        city: teamData.city,
        description: `The ${teamData.city} ${teamData.name} - a competitive team in the City Basketball League.`,
        leagueId,
        userId,
      });
      teamIds.push(teamId);
      teamNames.set(teamId, `${teamData.city} ${teamData.name}`);
    }

    // Create teams for youth league
    const youthTeamIds: Id<"teams">[] = [];
    for (const teamData of YOUTH_TEAM_DATA.slice(0, 4)) {
      const teamId = await ctx.db.insert("teams", {
        name: teamData.name,
        city: teamData.city,
        description: `Youth development team focused on fundamentals and teamwork.`,
        leagueId: youthLeagueId,
        userId,
      });
      youthTeamIds.push(teamId);
      teamNames.set(teamId, `${teamData.city} ${teamData.name}`);
    }

    // Create players for each team (main league)
    const playersByTeam: Map<Id<"teams">, Id<"players">[]> = new Map();
    const playerNamesMap: Map<Id<"players">, string> = new Map();

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
        const playerName = generatePlayerName();

        const playerId = await ctx.db.insert("players", {
          teamId,
          name: playerName,
          number,
          position,
          heightCm: height,
          weightKg: generateWeight(height),
          birthDate: generateBirthDate(),
          active: true,
        });

        playerIds.push(playerId);
        playerNamesMap.set(playerId, playerName);
      }

      playersByTeam.set(teamId, playerIds);
    }

    // Create players for youth league teams (smaller rosters, younger players)
    for (const teamId of youthTeamIds) {
      const playerIds: Id<"players">[] = [];
      const usedNumbers = new Set<number>();
      const numPlayers = randomBetween(8, 10);

      for (let i = 0; i < numPlayers; i++) {
        let number: number;
        do {
          number = randomBetween(1, 50);
        } while (usedNumbers.has(number));
        usedNumbers.add(number);

        const position = POSITIONS[i % 5];
        // Youth players: shorter heights
        const height = randomBetween(140, 175);
        const playerName = generatePlayerName();

        const playerId = await ctx.db.insert("players", {
          teamId,
          name: playerName,
          number,
          position,
          heightCm: height,
          weightKg: generateWeight(height),
          birthDate: `${randomBetween(2010, 2014)}-${randomBetween(1, 12).toString().padStart(2, "0")}-${randomBetween(1, 28).toString().padStart(2, "0")}`,
          active: true,
        });

        playerIds.push(playerId);
        playerNamesMap.set(playerId, playerName);
      }

      playersByTeam.set(teamId, playerIds);
    }

    // Create games between teams
    const gameIds: Id<"games">[] = [];
    const gamesCreated = new Set<string>();
    let gameIndex = 0;

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
          gameIndex++;

          // Mix of completed, scheduled (past), and scheduled (future) games
          // 60% completed, 15% scheduled (past - missed), 25% scheduled (future)
          const gameTypeRand = Math.random();
          const isCompleted = gameTypeRand < 0.6;
          const isFutureGame = gameTypeRand > 0.75;

          let scheduledAt: number;
          if (isFutureGame) {
            // Schedule 1-14 days in the future
            scheduledAt = Date.now() + randomBetween(1, 14) * 24 * 60 * 60 * 1000;
          } else {
            // 1-45 days in the past
            scheduledAt = Date.now() - randomBetween(1, 45) * 24 * 60 * 60 * 1000;
          }

          let homeScore = 0;
          let awayScore = 0;
          let status: "scheduled" | "completed" = "scheduled";
          let numQuarters = 4;
          let isOvertime = false;

          if (isCompleted) {
            status = "completed";

            // Vary game scenarios: 30% close games, 20% blowouts, 50% normal
            const scenarioRand = Math.random();
            if (scenarioRand < 0.15) {
              // Very close - overtime game!
              isOvertime = true;
              numQuarters = randomBetween(5, 6); // 1 or 2 OT periods
              const baseScore = randomBetween(95, 115);
              homeScore = baseScore + randomBetween(0, 5);
              awayScore = baseScore + randomBetween(0, 5);
              // Ensure scores are different
              if (homeScore === awayScore) homeScore += randomBetween(1, 3);
            } else if (scenarioRand < 0.3) {
              // Close game (within 5 points)
              const baseScore = randomBetween(90, 110);
              homeScore = baseScore + randomBetween(-2, 2);
              awayScore = baseScore + randomBetween(-5, 5);
              if (homeScore === awayScore) homeScore += Math.random() > 0.5 ? 1 : -1;
            } else if (scenarioRand < 0.45) {
              // Blowout (15+ point difference)
              homeScore = randomBetween(95, 125);
              awayScore = homeScore - randomBetween(15, 35);
              // Sometimes away team wins blowout
              if (Math.random() > 0.5) {
                [homeScore, awayScore] = [awayScore, homeScore];
              }
            } else {
              // Normal game (5-15 point spread)
              homeScore = randomBetween(85, 115);
              awayScore = homeScore + randomBetween(-15, 15);
              if (Math.abs(homeScore - awayScore) < 5) {
                awayScore += Math.random() > 0.5 ? 7 : -7;
              }
            }
            // Ensure positive scores
            homeScore = Math.max(homeScore, 70);
            awayScore = Math.max(awayScore, 70);
          }

          const gameId = await ctx.db.insert("games", {
            homeTeamId,
            awayTeamId,
            leagueId,
            scheduledAt,
            startedAt: isCompleted ? scheduledAt : undefined,
            endedAt: isCompleted
              ? scheduledAt + (2 + (numQuarters - 4) * 0.1) * 60 * 60 * 1000
              : undefined,
            status,
            currentQuarter: isCompleted ? numQuarters : 1,
            timeRemainingSeconds: isCompleted ? 0 : 720,
            homeScore,
            awayScore,
            gameSettings: {
              quarterMinutes: 12,
              foulLimit: 6,
              timeoutsPerTeam: 7,
              overtimeMinutes: 5,
              overtimePeriods: isOvertime ? numQuarters - 4 : 0,
              scoreByPeriod: isCompleted
                ? {
                    q1: { home: Math.round(homeScore * 0.23), away: Math.round(awayScore * 0.23) },
                    q2: { home: Math.round(homeScore * 0.26), away: Math.round(awayScore * 0.26) },
                    q3: { home: Math.round(homeScore * 0.24), away: Math.round(awayScore * 0.24) },
                    q4: { home: Math.round(homeScore * 0.22), away: Math.round(awayScore * 0.22) },
                    ...(isOvertime
                      ? {
                          ot1: {
                            home: Math.round(homeScore * 0.05),
                            away: Math.round(awayScore * 0.05),
                          },
                        }
                      : {}),
                  }
                : undefined,
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

            // Create game events - use detailed events or quick events based on flag
            if (detailedEvents) {
              // Get player names for the detailed generator
              const homePlayersWithNames = homePlayers.map((id) => ({
                id,
                name: playerNamesMap.get(id) || "Unknown",
              }));
              const awayPlayersWithNames = awayPlayers.map((id) => ({
                id,
                name: playerNamesMap.get(id) || "Unknown",
              }));

              await generateDetailedGameEvents(
                ctx,
                gameId,
                homeTeamId,
                awayTeamId,
                teamNames.get(homeTeamId) || "Home",
                teamNames.get(awayTeamId) || "Away",
                homePlayersWithNames,
                awayPlayersWithNames,
                scheduledAt,
                4, // quarters
                12, // quarter minutes
                actualHomeScore,
                actualAwayScore
              );
            } else {
              // Quick event generation (backward compatible)
              // But with better descriptions than before
              for (let quarter = 1; quarter <= 4; quarter++) {
                // Quarter start/end events
                await ctx.db.insert("gameEvents", {
                  gameId,
                  eventType: "quarter_start",
                  quarter,
                  gameTime: 720,
                  timestamp: scheduledAt + (quarter - 1) * 15 * 60 * 1000,
                  description: `Start of ${getQuarterLabel(quarter)}`,
                });

                // 15-20 events per quarter
                const eventsThisQuarter = randomBetween(15, 20);
                for (let e = 0; e < eventsThisQuarter; e++) {
                  const isHome = Math.random() > 0.5;
                  const tId = isHome ? homeTeamId : awayTeamId;
                  const players = isHome ? homePlayers : awayPlayers;
                  const playerId = randomChoice(players);
                  const playerName = playerNamesMap.get(playerId) || "Player";
                  const timeInQuarter = Math.round(
                    (720 / eventsThisQuarter) * (eventsThisQuarter - e)
                  );

                  // Weighted event types
                  const rand = Math.random();
                  let eventType: string;
                  let description: string;

                  if (rand < 0.35) {
                    // Shot
                    eventType = "shot";
                    const made = Math.random() > 0.45;
                    const isThree = Math.random() < 0.35;
                    const zone = isThree
                      ? "three-pointer"
                      : randomChoice(["layup", "jumper", "floater"]);
                    description = `${playerName} ${made ? "makes" : "misses"} ${zone}`;
                  } else if (rand < 0.5) {
                    eventType = "rebound";
                    const isOff = Math.random() < 0.3;
                    description = `${playerName} grabs ${isOff ? "offensive" : "defensive"} rebound`;
                  } else if (rand < 0.6) {
                    eventType = "assist";
                    description = `${playerName} assist on the basket`;
                  } else if (rand < 0.75) {
                    eventType = "foul";
                    description = `Personal foul on ${playerName}`;
                  } else if (rand < 0.85) {
                    eventType = "turnover";
                    description = `${playerName} turnover`;
                  } else if (rand < 0.9) {
                    eventType = "steal";
                    description = `${playerName} steal`;
                  } else if (rand < 0.95) {
                    eventType = "block";
                    description = `${playerName} blocks the shot`;
                  } else {
                    eventType = "timeout";
                    const tName = teamNames.get(tId) || "Team";
                    description = `${tName} timeout`;
                  }

                  await ctx.db.insert("gameEvents", {
                    gameId,
                    eventType,
                    playerId: eventType === "timeout" ? undefined : playerId,
                    teamId: tId,
                    quarter,
                    gameTime: timeInQuarter,
                    timestamp: scheduledAt + (quarter - 1) * 15 * 60 * 1000 + e * 30000,
                    description,
                  });
                }

                await ctx.db.insert("gameEvents", {
                  gameId,
                  eventType: "quarter_end",
                  quarter,
                  gameTime: 0,
                  timestamp: scheduledAt + quarter * 15 * 60 * 1000 - 1000,
                  description: `End of ${getQuarterLabel(quarter)}`,
                });
              }
            }

            // Create lineup stints for this game
            // Simulate 3-5 different lineups per team per game
            const numStintsPerTeam = randomBetween(3, 5);

            for (const isHomeTeam of [true, false]) {
              const teamId = isHomeTeam ? homeTeamId : awayTeamId;
              const teamPlayers = isHomeTeam ? homePlayers : awayPlayers;
              const teamScore = isHomeTeam ? actualHomeScore : actualAwayScore;
              const oppScore = isHomeTeam ? actualAwayScore : actualHomeScore;

              // Calculate total game minutes (48 for regulation)
              const totalMinutes = 48;
              let remainingMinutes = totalMinutes;
              let currentQuarter = 1;
              let currentGameTime = 720; // Start of quarter

              for (let stintIdx = 0; stintIdx < numStintsPerTeam; stintIdx++) {
                // Select 5 players for this stint
                // First stint uses starters (first 5), later stints mix in bench
                let stintPlayers: Id<"players">[];
                if (stintIdx === 0) {
                  stintPlayers = teamPlayers.slice(0, 5);
                } else {
                  // Mix starters and bench
                  const starters = teamPlayers.slice(0, 5);
                  const bench = teamPlayers.slice(5);
                  const numBenchIn = randomBetween(1, Math.min(3, bench.length));

                  // Remove some starters
                  const startersInLineup = starters.slice(0, 5 - numBenchIn);
                  const benchInLineup = bench.slice(0, numBenchIn);
                  stintPlayers = [...startersInLineup, ...benchInLineup];
                }

                // Ensure we have exactly 5 players
                if (stintPlayers.length !== 5) {
                  stintPlayers = teamPlayers.slice(0, 5);
                }

                // Sort players for consistent comparison
                stintPlayers.sort();

                // Calculate stint duration
                const isLastStint = stintIdx === numStintsPerTeam - 1;
                const stintMinutes = isLastStint
                  ? remainingMinutes
                  : Math.min(randomBetween(8, 15), remainingMinutes - 5);

                const stintSeconds = Math.round(stintMinutes * 60);

                // Calculate points for this stint (proportional to time)
                const stintFraction = stintMinutes / totalMinutes;
                const stintPointsScored = Math.round(
                  teamScore * stintFraction * randomFloat(0.8, 1.2)
                );
                const stintPointsAllowed = Math.round(
                  oppScore * stintFraction * randomFloat(0.8, 1.2)
                );
                const stintPlusMinus = stintPointsScored - stintPointsAllowed;

                // Calculate end time
                const endGameTime = Math.max(0, currentGameTime - (stintSeconds % 720));
                const quartersElapsed = Math.floor(stintSeconds / 720);
                const endQuarter = Math.min(4, currentQuarter + quartersElapsed);

                await ctx.db.insert("lineupStints", {
                  gameId,
                  teamId,
                  players: stintPlayers,
                  startQuarter: currentQuarter,
                  startGameTime: currentGameTime,
                  startTimestamp: scheduledAt + stintIdx * 10 * 60 * 1000,
                  endQuarter,
                  endGameTime,
                  endTimestamp: scheduledAt + (stintIdx + 1) * 10 * 60 * 1000,
                  secondsPlayed: stintSeconds,
                  pointsScored: stintPointsScored,
                  pointsAllowed: stintPointsAllowed,
                  plusMinus: stintPlusMinus,
                  isActive: false,
                });

                // Update for next stint
                remainingMinutes -= stintMinutes;
                currentQuarter = endQuarter;
                currentGameTime = endGameTime === 0 ? 720 : endGameTime;
              }
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

      // Create active lineup stints for the active game
      // Home team active lineup
      const homeStarters = homePlayers.slice(0, 5).sort();
      await ctx.db.insert("lineupStints", {
        gameId: activeGameId,
        teamId: teamIds[0],
        players: homeStarters,
        startQuarter: 2,
        startGameTime: 420,
        startTimestamp: Date.now() - 5 * 60 * 1000,
        secondsPlayed: 0,
        pointsScored: 0,
        pointsAllowed: 0,
        plusMinus: 0,
        isActive: true,
      });

      // Home team completed stint from Q1
      await ctx.db.insert("lineupStints", {
        gameId: activeGameId,
        teamId: teamIds[0],
        players: homeStarters,
        startQuarter: 1,
        startGameTime: 720,
        startTimestamp: Date.now() - 30 * 60 * 1000,
        endQuarter: 2,
        endGameTime: 420,
        endTimestamp: Date.now() - 5 * 60 * 1000,
        secondsPlayed: 720 + 300, // Q1 + part of Q2
        pointsScored: randomBetween(15, 25),
        pointsAllowed: randomBetween(15, 25),
        plusMinus: randomBetween(-5, 5),
        isActive: false,
      });

      // Away team active lineup
      const awayStarters = awayPlayers.slice(0, 5).sort();
      await ctx.db.insert("lineupStints", {
        gameId: activeGameId,
        teamId: teamIds[1],
        players: awayStarters,
        startQuarter: 2,
        startGameTime: 420,
        startTimestamp: Date.now() - 5 * 60 * 1000,
        secondsPlayed: 0,
        pointsScored: 0,
        pointsAllowed: 0,
        plusMinus: 0,
        isActive: true,
      });

      // Away team completed stint from Q1
      await ctx.db.insert("lineupStints", {
        gameId: activeGameId,
        teamId: teamIds[1],
        players: awayStarters,
        startQuarter: 1,
        startGameTime: 720,
        startTimestamp: Date.now() - 30 * 60 * 1000,
        endQuarter: 2,
        endGameTime: 420,
        endTimestamp: Date.now() - 5 * 60 * 1000,
        secondsPlayed: 720 + 300,
        pointsScored: randomBetween(15, 25),
        pointsAllowed: randomBetween(15, 25),
        plusMinus: randomBetween(-5, 5),
        isActive: false,
      });
    }

    // Create games for youth league (simpler - fewer per team, shorter games)
    let youthGamesCreated = 0;
    for (let i = 0; i < youthTeamIds.length; i++) {
      for (let j = i + 1; j < youthTeamIds.length; j++) {
        const homeTeamId = youthTeamIds[i];
        const awayTeamId = youthTeamIds[j];

        // 70% completed, 30% scheduled future
        const isCompleted = Math.random() < 0.7;
        const scheduledAt = isCompleted
          ? Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000
          : Date.now() + randomBetween(3, 21) * 24 * 60 * 60 * 1000;

        const homeScore = isCompleted ? randomBetween(25, 55) : 0;
        const awayScore = isCompleted ? randomBetween(25, 55) : 0;

        await ctx.db.insert("games", {
          homeTeamId,
          awayTeamId,
          leagueId: youthLeagueId,
          scheduledAt,
          startedAt: isCompleted ? scheduledAt : undefined,
          endedAt: isCompleted ? scheduledAt + 1.5 * 60 * 60 * 1000 : undefined,
          status: isCompleted ? "completed" : "scheduled",
          currentQuarter: isCompleted ? 4 : 1,
          timeRemainingSeconds: isCompleted ? 0 : 480,
          homeScore,
          awayScore,
          gameSettings: {
            quarterMinutes: 8,
            foulLimit: 5,
            timeoutsPerTeam: 4,
          },
          userId,
        });
        youthGamesCreated++;

        // Add basic player stats for completed youth games
        if (isCompleted) {
          const youthHomePlayers = playersByTeam.get(homeTeamId) || [];
          const youthAwayPlayers = playersByTeam.get(awayTeamId) || [];

          for (const players of [
            { list: youthHomePlayers, teamId: homeTeamId },
            { list: youthAwayPlayers, teamId: awayTeamId },
          ]) {
            for (let p = 0; p < Math.min(8, players.list.length); p++) {
              const isStarter = p < 5;
              await ctx.db.insert("playerStats", {
                playerId: players.list[p],
                gameId: (await ctx.db.query("games").order("desc").first())?._id!,
                teamId: players.teamId,
                points: randomBetween(0, 15),
                fieldGoalsMade: randomBetween(0, 5),
                fieldGoalsAttempted: randomBetween(2, 10),
                threePointersMade: randomBetween(0, 2),
                threePointersAttempted: randomBetween(0, 4),
                freeThrowsMade: randomBetween(0, 3),
                freeThrowsAttempted: randomBetween(0, 4),
                rebounds: randomBetween(0, 6),
                assists: randomBetween(0, 3),
                steals: randomBetween(0, 2),
                blocks: randomBetween(0, 1),
                turnovers: randomBetween(0, 3),
                fouls: randomBetween(0, 4),
                minutesPlayed: isStarter ? randomBetween(12, 20) : randomBetween(4, 12),
                plusMinus: randomBetween(-10, 10),
                isOnCourt: false,
              });
            }
          }
        }
      }
    }

    // Create sample notifications for demo user
    const notificationTypes: Array<{
      type: "game_reminder" | "game_start" | "game_end" | "team_update" | "league_announcement";
      title: string;
      body: string;
      read: boolean;
      daysAgo: number;
    }> = [
      {
        type: "game_end",
        title: "Game Completed",
        body: `${teamNames.get(teamIds[0])} vs ${teamNames.get(teamIds[1])} final score available`,
        read: true,
        daysAgo: 2,
      },
      {
        type: "game_reminder",
        title: "Upcoming Game Tomorrow",
        body: `${teamNames.get(teamIds[2])} vs ${teamNames.get(teamIds[3])} scheduled for 7:00 PM`,
        read: false,
        daysAgo: 0,
      },
      {
        type: "league_announcement",
        title: "Schedule Update",
        body: "The league schedule has been updated. Check the Games page for the latest times.",
        read: false,
        daysAgo: 1,
      },
      {
        type: "team_update",
        title: "Roster Change",
        body: `${teamNames.get(teamIds[0])} has updated their roster`,
        read: true,
        daysAgo: 5,
      },
      {
        type: "game_start",
        title: "Game Starting Now",
        body: `${teamNames.get(teamIds[1])} vs ${teamNames.get(teamIds[2])} is starting!`,
        read: true,
        daysAgo: 3,
      },
      {
        type: "league_announcement",
        title: "Playoffs Approaching",
        body: "Only 3 weeks until the playoffs begin! Current standings are tight.",
        read: false,
        daysAgo: 0,
      },
    ];

    for (const notif of notificationTypes) {
      await ctx.db.insert("notifications", {
        userId,
        leagueId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        read: notif.read,
        createdAt: Date.now() - notif.daysAgo * 24 * 60 * 60 * 1000,
      });
    }

    // Create notification preferences for demo user
    await ctx.db.insert("notificationPreferences", {
      userId,
      leagueId,
      gameReminders: true,
      gameStart: true,
      gameEnd: true,
      scoreUpdates: false,
      teamUpdates: true,
      leagueAnnouncements: true,
      reminderMinutesBefore: 60,
    });

    return {
      message: "Database seeded successfully with rich data",
      stats: {
        users: 2,
        leagues: 2,
        teams: teamIds.length + youthTeamIds.length,
        players: teamIds.length * 11 + youthTeamIds.length * 9,
        games: gameIds.length + 1 + youthGamesCreated, // +1 for active game
        notifications: notificationTypes.length,
        lineupStints: "~" + (gameIds.length * 2 * 4 + 4),
        detailedEvents: detailedEvents,
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
      passwordHash: await hashPassword("demo123"),
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      confirmedAt: Date.now(),
    });

    // Create session
    const sessionToken = generateToken(64);
    const refreshToken = generateToken(64);
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId,
      token: sessionToken,
      expiresAt: now + ACCESS_TOKEN_EXPIRY,
      refreshToken,
      refreshExpiresAt: now + REFRESH_TOKEN_EXPIRY,
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
      inviteCode: `test-league-${generateToken(6)}`,
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

// Convenience: Clear and reseed with rich data in one call
export const seedRich = mutation({
  args: {
    detailedEvents: v.optional(v.boolean()), // Default: false for speed
  },
  handler: async (ctx, args) => {
    // Clear first
    const tables = [
      "lineupStints",
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

    // Now use the main seeder - but we need to inline it since we can't call mutations from mutations
    // Instead, return instructions
    return {
      message: `Cleared ${totalDeleted} records. Now run seedDatabase with clearExisting: false`,
      clearedRecords: totalDeleted,
      hint: 'For full rich seed, run: npx convex run seed:seedDatabase \'{"clearExisting": true, "numTeams": 6, "detailedEvents": false}\'',
    };
  },
});

// Clear all data
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "lineupStints",
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
