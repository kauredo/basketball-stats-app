/**
 * Tests for useLiveGameState hook
 * Complex state management hook for live basketball game tracking
 * Uses Convex for data persistence and useFeedback for audio/haptic feedback
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";

// Mock Convex hooks
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

// Mock useFeedback
const mockFeedback = {
  confirm: vi.fn(),
  made: vi.fn(),
  missed: vi.fn(),
  foul: vi.fn(),
  foulOut: vi.fn(),
  timeout: vi.fn(),
  overtime: vi.fn(),
  error: vi.fn(),
};

vi.mock("./useFeedback", () => ({
  useFeedback: () => mockFeedback,
}));

// Import after mocks
import { useLiveGameState } from "./useLiveGameState";

// Test fixtures
const createMockGame = (overrides = {}) => ({
  _id: "game123" as const,
  status: "active" as const,
  currentQuarter: 1,
  timeRemainingSeconds: 720,
  homeScore: 10,
  awayScore: 8,
  homeTeam: { _id: "team1", name: "Home Team" },
  awayTeam: { _id: "team2", name: "Away Team" },
  gameSettings: {
    quarterMinutes: 12,
    foulLimit: 5,
    timeoutsPerTeam: 4,
  },
  ...overrides,
});

const createMockPlayerStat = (overrides = {}) => ({
  id: "stat1",
  playerId: "player1",
  teamId: "team1",
  player: { number: 23, name: "Test Player", position: "SG" },
  points: 10,
  rebounds: 5,
  offensiveRebounds: 1,
  defensiveRebounds: 4,
  assists: 3,
  steals: 1,
  blocks: 0,
  turnovers: 2,
  fouls: 2,
  fouledOut: false,
  isOnCourt: true,
  isHomeTeam: true,
  ...overrides,
});

describe("useLiveGameState", () => {
  // Mock mutation functions
  let mockStartGame: Mock;
  let mockPauseGame: Mock;
  let mockResumeGame: Mock;
  let mockEndGame: Mock;
  let mockRecordStat: Mock;
  let mockUndoStat: Mock;
  let mockSwapSubstitute: Mock;
  let mockSetQuarter: Mock;
  let mockUpdateGameSettings: Mock;
  let mockRecordFoulWithContext: Mock;
  let mockRecordFreeThrow: Mock;
  let mockRecordTimeout: Mock;
  let mockStartOvertime: Mock;
  let mockRecordTeamRebound: Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Initialize mock mutations
    mockStartGame = vi.fn().mockResolvedValue(undefined);
    mockPauseGame = vi.fn().mockResolvedValue(undefined);
    mockResumeGame = vi.fn().mockResolvedValue(undefined);
    mockEndGame = vi.fn().mockResolvedValue(undefined);
    mockRecordStat = vi.fn().mockResolvedValue(undefined);
    mockUndoStat = vi.fn().mockResolvedValue(undefined);
    mockSwapSubstitute = vi.fn().mockResolvedValue(undefined);
    mockSetQuarter = vi.fn().mockResolvedValue(undefined);
    mockUpdateGameSettings = vi.fn().mockResolvedValue(undefined);
    mockRecordFoulWithContext = vi.fn().mockResolvedValue({
      playerFouledOut: false,
      freeThrowsAwarded: 0,
      inBonus: false,
      inDoubleBonus: false,
    });
    mockRecordFreeThrow = vi.fn().mockResolvedValue({
      sequenceContinues: false,
    });
    mockRecordTimeout = vi.fn().mockResolvedValue(undefined);
    mockStartOvertime = vi.fn().mockResolvedValue(undefined);
    mockRecordTeamRebound = vi.fn().mockResolvedValue(undefined);

    // Setup useMutation to return the appropriate mock based on call order
    mockUseMutation.mockImplementation(() => {
      const callCount = mockUseMutation.mock.calls.length;
      const mutations = [
        mockStartGame,
        mockPauseGame,
        mockResumeGame,
        mockEndGame,
        mockRecordStat,
        mockUndoStat,
        mockSwapSubstitute,
        mockRecordTeamRebound,
        mockSetQuarter,
        mockUpdateGameSettings,
        mockRecordFoulWithContext,
        mockRecordFreeThrow,
        mockRecordTimeout,
        mockStartOvertime,
      ];
      return mutations[callCount - 1] || vi.fn();
    });

    // Default query responses
    mockUseQuery.mockImplementation((api, args) => {
      if (args === "skip") return undefined;

      // Return based on which query is being called
      const callCount = mockUseQuery.mock.calls.length;
      if (callCount === 1) {
        // games.get
        return { game: createMockGame() };
      } else if (callCount === 2) {
        // stats.getLiveStats
        return {
          stats: [
            createMockPlayerStat(),
            createMockPlayerStat({
              id: "stat2",
              playerId: "player2",
              player: { number: 10, name: "Player Two" },
              isHomeTeam: false,
            }),
          ],
          teamStats: {
            home: { teamFouls: 3, foulsThisQuarter: 2, timeoutsRemaining: 4, inBonus: false },
            away: { teamFouls: 2, foulsThisQuarter: 1, timeoutsRemaining: 4, inBonus: false },
          },
          game: { foulLimit: 5 },
        };
      } else if (callCount === 3) {
        // games.getGameEvents
        return { events: [] };
      }
      return undefined;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("hook initialization", () => {
    it("returns expected state and handlers", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      // Check state properties exist
      expect(result.current).toHaveProperty("activeTab");
      expect(result.current).toHaveProperty("pendingShot");
      expect(result.current).toHaveProperty("recentShots");
      expect(result.current).toHaveProperty("actionHistory");

      // Check handlers exist
      expect(result.current).toHaveProperty("handleGameControl");
      expect(result.current).toHaveProperty("handleRecordStat");
      expect(result.current).toHaveProperty("handleUndo");
      expect(result.current).toHaveProperty("handleSwapSubstitute");

      // Check data properties exist
      expect(result.current).toHaveProperty("game");
      expect(result.current).toHaveProperty("stats");
      expect(result.current).toHaveProperty("homeStats");
      expect(result.current).toHaveProperty("awayStats");
    });

    it("skips queries when token is null", () => {
      renderHook(() => useLiveGameState({ gameId: "game123", token: null }));

      // Should call useQuery with "skip"
      expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), "skip");
    });

    it("skips queries when gameId is undefined", () => {
      renderHook(() => useLiveGameState({ gameId: undefined, token: "token123" }));

      expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), "skip");
    });

    it("defaults activeTab to court", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.activeTab).toBe("court");
    });
  });

  describe("game status helpers", () => {
    it("correctly identifies active game", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame({ status: "active" }) };
        if (callCount === 2)
          return { stats: [], teamStats: { home: {}, away: {} }, game: { foulLimit: 5 } };
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.isActive).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.isScheduled).toBe(false);
    });

    it("correctly identifies paused game", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame({ status: "paused" }) };
        if (callCount === 2)
          return { stats: [], teamStats: { home: {}, away: {} }, game: { foulLimit: 5 } };
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.isActive).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it("correctly identifies scheduled game", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame({ status: "scheduled" }) };
        if (callCount === 2)
          return { stats: [], teamStats: { home: {}, away: {} }, game: { foulLimit: 5 } };
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.isScheduled).toBe(true);
      expect(result.current.canRecordStats).toBe(false);
    });

    it("allows recording stats when game is active or paused", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame({ status: "active" }) };
        if (callCount === 2)
          return { stats: [], teamStats: { home: {}, away: {} }, game: { foulLimit: 5 } };
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.canRecordStats).toBe(true);
    });
  });

  describe("tab management", () => {
    it("allows changing active tab", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      act(() => {
        result.current.setActiveTab("stats");
      });

      expect(result.current.activeTab).toBe("stats");
    });

    it("can switch between all tab types", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      act(() => {
        result.current.setActiveTab("court");
      });
      expect(result.current.activeTab).toBe("court");

      act(() => {
        result.current.setActiveTab("stats");
      });
      expect(result.current.activeTab).toBe("stats");

      act(() => {
        result.current.setActiveTab("substitutions");
      });
      expect(result.current.activeTab).toBe("substitutions");
    });
  });

  describe("pending shot state", () => {
    it("can set and clear pending shot", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      const pendingShot = { x: 10, y: 15, is3pt: false, zoneName: "Paint" };

      act(() => {
        result.current.setPendingShot(pendingShot);
      });

      expect(result.current.pendingShot).toEqual(pendingShot);

      act(() => {
        result.current.setPendingShot(null);
      });

      expect(result.current.pendingShot).toBeNull();
    });
  });

  describe("modal states", () => {
    it("can manage quarter selector visibility", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.showQuarterSelector).toBe(false);

      act(() => {
        result.current.setShowQuarterSelector(true);
      });

      expect(result.current.showQuarterSelector).toBe(true);
    });

    it("can manage end period confirmation", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.showEndPeriodConfirm).toBe(false);

      act(() => {
        result.current.setShowEndPeriodConfirm(true);
      });

      expect(result.current.showEndPeriodConfirm).toBe(true);
    });

    it("can manage pending quick stat", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      act(() => {
        result.current.setPendingQuickStat("rebound");
      });

      expect(result.current.pendingQuickStat).toBe("rebound");

      act(() => {
        result.current.setPendingQuickStat(null);
      });

      expect(result.current.pendingQuickStat).toBeNull();
    });
  });

  describe("substitution swap state", () => {
    it("can start and cancel substitution swap", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.swappingPlayer).toBeNull();

      act(() => {
        result.current.setSwappingPlayer("player1" as never);
      });

      expect(result.current.swappingPlayer).toBe("player1");

      act(() => {
        result.current.setSwappingPlayer(null);
      });

      expect(result.current.swappingPlayer).toBeNull();
    });
  });

  describe("starter selection", () => {
    it("can toggle home starters", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame({ status: "scheduled" }) };
        if (callCount === 2) {
          return {
            stats: [
              createMockPlayerStat({ playerId: "player1" }),
              createMockPlayerStat({ playerId: "player2" }),
            ],
            teamStats: { home: {}, away: {} },
            game: { foulLimit: 5 },
          };
        }
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      // Toggle starter on
      act(() => {
        result.current.toggleStarter("player1" as never, true);
      });

      expect(result.current.homeStarters).toContain("player1");

      // Toggle starter off
      act(() => {
        result.current.toggleStarter("player1" as never, true);
      });

      expect(result.current.homeStarters).not.toContain("player1");
    });
  });

  describe("game settings", () => {
    it("extracts game settings from query data", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.gameSettings).toBeDefined();
      expect(result.current.foulLimit).toBe(5);
    });

    it("can update quarter minutes setting", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      act(() => {
        result.current.setQuarterMinutes(10);
      });

      expect(result.current.quarterMinutes).toBe(10);
    });

    it("can update foul limit setting", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      act(() => {
        result.current.setFoulLimitSetting(6);
      });

      expect(result.current.foulLimitSetting).toBe(6);
    });
  });

  describe("stats summary expansion", () => {
    it("can toggle home stats summary", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.showHomeStatsSummary).toBe(false);

      act(() => {
        result.current.setShowHomeStatsSummary(true);
      });

      expect(result.current.showHomeStatsSummary).toBe(true);
    });

    it("can toggle away stats summary", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.showAwayStatsSummary).toBe(false);

      act(() => {
        result.current.setShowAwayStatsSummary(true);
      });

      expect(result.current.showAwayStatsSummary).toBe(true);
    });
  });

  describe("handler availability", () => {
    it("provides all required handlers", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(typeof result.current.handleGameControl).toBe("function");
      expect(typeof result.current.handleRecordStat).toBe("function");
      expect(typeof result.current.handleUndo).toBe("function");
      expect(typeof result.current.handleQuarterChange).toBe("function");
      expect(typeof result.current.handleEndPeriod).toBe("function");
      expect(typeof result.current.handleSwapSubstitute).toBe("function");
      expect(typeof result.current.handlePlayerRebound).toBe("function");
      expect(typeof result.current.handleTeamRebound).toBe("function");
      expect(typeof result.current.handleAssist).toBe("function");
      expect(typeof result.current.handleQuickStatFromModal).toBe("function");
      expect(typeof result.current.handleRecordFoulWithContext).toBe("function");
      expect(typeof result.current.handleFreeThrowResult).toBe("function");
      expect(typeof result.current.handleTimeout).toBe("function");
      expect(typeof result.current.handleStartOvertime).toBe("function");
      expect(typeof result.current.handleEndAsTie).toBe("function");
      expect(typeof result.current.toggleStarter).toBe("function");
    });
  });

  describe("derived data", () => {
    it("separates home and away stats correctly", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame() };
        if (callCount === 2) {
          return {
            stats: [
              createMockPlayerStat({ playerId: "player1", isHomeTeam: true }),
              createMockPlayerStat({ playerId: "player2", isHomeTeam: true }),
              createMockPlayerStat({ playerId: "player3", isHomeTeam: false }),
            ],
            teamStats: { home: {}, away: {} },
            game: { foulLimit: 5 },
          };
        }
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.homeStats.length).toBe(2);
      expect(result.current.awayStats.length).toBe(1);
    });

    it("filters on-court players correctly", () => {
      mockUseQuery.mockImplementation((api, args) => {
        if (args === "skip") return undefined;
        const callCount = mockUseQuery.mock.calls.length;
        if (callCount === 1) return { game: createMockGame() };
        if (callCount === 2) {
          return {
            stats: [
              createMockPlayerStat({ playerId: "player1", isOnCourt: true }),
              createMockPlayerStat({ playerId: "player2", isOnCourt: false }),
              createMockPlayerStat({ playerId: "player3", isOnCourt: true }),
            ],
            teamStats: { home: {}, away: {} },
            game: { foulLimit: 5 },
          };
        }
        return { events: [] };
      });

      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.allOnCourtPlayers.length).toBe(2);
    });
  });

  describe("overtime prompt", () => {
    it("can show and hide overtime prompt", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.showOvertimePrompt).toBe(false);

      act(() => {
        result.current.setShowOvertimePrompt(true);
      });

      expect(result.current.showOvertimePrompt).toBe(true);
    });
  });

  describe("free throw sequence state", () => {
    it("can manage free throw sequence", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      const sequence = {
        playerId: "player1" as never,
        playerName: "Test Player",
        playerNumber: 23,
        totalAttempts: 2,
        currentAttempt: 1,
        isOneAndOne: false,
        results: [],
      };

      act(() => {
        result.current.setFreeThrowSequence(sequence);
      });

      expect(result.current.freeThrowSequence).toEqual(sequence);

      act(() => {
        result.current.setFreeThrowSequence(null);
      });

      expect(result.current.freeThrowSequence).toBeNull();
    });
  });

  describe("action history", () => {
    it("starts with empty action history", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.actionHistory).toEqual([]);
    });

    it("can toggle action history visibility", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.showActionHistory).toBe(false);

      act(() => {
        result.current.setShowActionHistory(true);
      });

      expect(result.current.showActionHistory).toBe(true);
    });
  });

  describe("pending rebound/assist", () => {
    it("can manage pending rebound state", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      const pendingRebound = {
        shooterPlayerId: "player1" as never,
        shooterTeamId: "team1" as never,
        shotType: "shot2",
        isHomeTeam: true,
      };

      act(() => {
        result.current.setPendingRebound(pendingRebound);
      });

      expect(result.current.pendingRebound).toEqual(pendingRebound);
    });

    it("can manage pending assist state", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      const pendingAssist = {
        scorerPlayerId: "player1" as never,
        scorerName: "Test Player",
        scorerNumber: 23,
        scorerTeamId: "team1" as never,
        shotType: "shot2",
        points: 2,
        isHomeTeam: true,
      };

      act(() => {
        result.current.setPendingAssist(pendingAssist);
      });

      expect(result.current.pendingAssist).toEqual(pendingAssist);
    });
  });

  describe("recent shots tracking", () => {
    it("starts with empty recent shots", () => {
      const { result } = renderHook(() =>
        useLiveGameState({ gameId: "game123", token: "token123" })
      );

      expect(result.current.recentShots).toEqual([]);
    });
  });
});
